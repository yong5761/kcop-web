'use strict';

const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const pool = require('../db');

const router = express.Router();

function sha256(s) {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

// POST /api/login
router.post('/api/login', async (req, res) => {
  const { mem_id, mem_pwd } = req.body || {};
  if (!mem_id || !mem_pwd) {
    return res.status(400).json({ ok: false, error: '아이디와 비밀번호를 입력하세요.' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT idx, mem_id, mem_name, mem_type, mem_pwd, mem_pwd_hash, gateway_no, c1, c2, c1_2, c2_2, c1_3, c2_3 FROM MEMBER WHERE mem_id = ?',
      [mem_id]
    );

    if (!rows.length) {
      console.log('[login] 실패 - 존재하지 않는 아이디:', mem_id);
      return res.status(401).json({ ok: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    const row = rows[0];
    const hash = (row.mem_pwd_hash || '').trim();
    const legacy = (row.mem_pwd || '').trim();
    let ok = false;
    let wasSha256 = false;

    if (hash.length === 60 && hash.startsWith('$2')) {
      // bcrypt 해시
      ok = await bcrypt.compare(mem_pwd, hash);
    } else if (hash.length === 64) {
      // SHA-256 hex
      ok = sha256(mem_pwd) === hash;
      if (ok) wasSha256 = true;
    } else if (legacy.length === 64) {
      // mem_pwd 컬럼에 SHA-256이 있는 경우
      ok = sha256(mem_pwd) === legacy;
      if (ok) wasSha256 = true;
    } else if (legacy && legacy === mem_pwd) {
      // 평문 비밀번호 (마이그레이션 대상)
      ok = true;
      wasSha256 = true;
    }

    if (!ok) {
      console.log('[login] 실패 - 비밀번호 불일치, mem_id:', mem_id);
      return res.status(401).json({ ok: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    // 점진 마이그레이션: SHA-256/평문 → bcrypt
    if (wasSha256) {
      try {
        const newHash = await bcrypt.hash(mem_pwd, 10);
        await pool.execute(
          'UPDATE MEMBER SET mem_pwd_hash = ? WHERE idx = ?',
          [newHash, row.idx]
        );
        console.log('[login] bcrypt 마이그레이션 완료, mem_id:', mem_id);
      } catch (e) {
        console.error('[login] bcrypt 마이그레이션 실패:', e.message);
      }
    }

    req.session.user = {
      idx: row.idx,
      mem_id: row.mem_id,
      mem_name: row.mem_name,
      mem_type: row.mem_type,
      gateway_no: row.gateway_no || null,
      c1: row.c1, c2: row.c2,
      c1_2: row.c1_2, c2_2: row.c2_2,
      c1_3: row.c1_3, c2_3: row.c2_3
    };

    console.log('[login] 성공, mem_id:', mem_id, 'mem_type:', row.mem_type);
    return res.json({
      ok: true,
      user: {
        mem_id: row.mem_id,
        mem_name: row.mem_name,
        mem_type: row.mem_type
      }
    });
  } catch (e) {
    console.error('[login] 오류:', e.message);
    return res.status(500).json({ ok: false, error: '서버 오류가 발생했습니다.' });
  }
});

// POST /api/logout
router.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('[logout] 세션 삭제 오류:', err.message);
      return res.status(500).json({ ok: false, error: '로그아웃 중 오류가 발생했습니다.' });
    }
    res.clearCookie('connect.sid');
    return res.json({ ok: true });
  });
});

// GET /api/me — 세션 기반 + gateway_no/mem_name DB 최신값으로 덮어쓰기
router.get('/api/me', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ ok: false, error: '로그인이 필요합니다.' });
  }
  const fresh = { ...req.session.user };
  try {
    const [rows] = await pool.execute(
      'SELECT gateway_no, mem_name FROM MEMBER WHERE idx = ?',
      [req.session.user.idx]
    );
    if (rows.length) {
      fresh.gateway_no = rows[0].gateway_no || null;
      fresh.mem_name   = rows[0].mem_name;
    }
  } catch (e) {
    console.error('[/api/me] DB 조회 실패, 세션값 반환:', e.message);
  }
  return res.json({ ok: true, user: fresh });
});

module.exports = router;
