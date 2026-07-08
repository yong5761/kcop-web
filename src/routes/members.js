'use strict';

const { Router } = require('express');
const pool = require('../db');

const router = Router();

// ── MEMBER CRUD ──────────────────────────────────────────────────────────────

router.get('/api/members', async (req, res) => {
  const type = parseInt(req.query.type) || 1;
  try {
    const [rows] = await pool.execute(
      `SELECT idx, mem_id, mem_name, mem_tel, mem_tel2, mem_tel3,
              c1, c2, c3, etc_value, is_sms, mem_type, regidate, loginDate, loginCnt
       FROM MEMBER WHERE mem_type = ? ORDER BY idx DESC`,
      [type]
    );
    res.json({ ok: true, rows });
  } catch (e) {
    console.error('[API] GET /api/members error:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/api/members', async (req, res) => {
  const { mem_id, mem_name, mem_pwd, mem_tel, mem_tel2, mem_tel3,
          mem_type, c1, c2, c3, etc_value, is_sms } = req.body;
  try {
    const [result] = await pool.execute(
      `INSERT INTO MEMBER
         (mem_id, mem_name, mem_pwd, mem_tel, mem_tel2, mem_tel3,
          mem_type, c1, c2, c3, etc_value, is_sms, regidate)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW())`,
      [mem_id, mem_name, mem_pwd || '', mem_tel || '', mem_tel2 || '', mem_tel3 || '',
       mem_type || 1, c1 || 0, c2 || 0, c3 || 0, etc_value || '', is_sms || 'N']
    );
    res.json({ ok: true, insertId: result.insertId });
  } catch (e) {
    console.error('[API] POST /api/members error:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.put('/api/members/:idx', async (req, res) => {
  const { mem_name, mem_pwd, mem_tel, mem_tel2, mem_tel3,
          c1, c2, c3, etc_value, is_sms } = req.body;
  try {
    if (mem_pwd) {
      await pool.execute(
        `UPDATE MEMBER SET mem_name=?, mem_pwd=?, mem_tel=?, mem_tel2=?, mem_tel3=?,
                           c1=?, c2=?, c3=?, etc_value=?, is_sms=? WHERE idx=?`,
        [mem_name, mem_pwd, mem_tel || '', mem_tel2 || '', mem_tel3 || '',
         c1 || 0, c2 || 0, c3 || 0, etc_value || '', is_sms || 'N', req.params.idx]
      );
    } else {
      await pool.execute(
        `UPDATE MEMBER SET mem_name=?, mem_tel=?, mem_tel2=?, mem_tel3=?,
                           c1=?, c2=?, c3=?, etc_value=?, is_sms=? WHERE idx=?`,
        [mem_name, mem_tel || '', mem_tel2 || '', mem_tel3 || '',
         c1 || 0, c2 || 0, c3 || 0, etc_value || '', is_sms || 'N', req.params.idx]
      );
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('[API] PUT /api/members error:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.delete('/api/members/:idx', async (req, res) => {
  try {
    await pool.execute('DELETE FROM MEMBER WHERE idx=?', [req.params.idx]);
    res.json({ ok: true });
  } catch (e) {
    console.error('[API] DELETE /api/members error:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ── BIG_CART (지역 카테고리) ─────────────────────────────────────────────────

router.get('/api/members/big-cart', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT big_num, big_name, big_sort FROM BIG_CART ORDER BY big_sort'
    );
    res.json({ ok: true, rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/api/members/big-cart', async (req, res) => {
  const { big_name } = req.body;
  try {
    const [[{ maxSort }]] = await pool.execute(
      'SELECT COALESCE(MAX(big_sort), 0) AS maxSort FROM BIG_CART'
    );
    const [result] = await pool.execute(
      'INSERT INTO BIG_CART (big_name, big_sort, bm_id) VALUES (?,?,1)',
      [big_name, (maxSort || 0) + 1]
    );
    res.json({ ok: true, insertId: result.insertId });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.put('/api/members/big-cart/:num', async (req, res) => {
  const { big_name } = req.body;
  try {
    await pool.execute('UPDATE BIG_CART SET big_name=? WHERE big_num=?', [big_name, req.params.num]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.delete('/api/members/big-cart/:num', async (req, res) => {
  try {
    await pool.execute('DELETE FROM BIG_CART WHERE big_num=?', [req.params.num]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ── JUNG_CART (구/군 카테고리) ───────────────────────────────────────────────

router.get('/api/members/jung-cart', async (req, res) => {
  try {
    let sql = `SELECT j.jung_num, j.jung_name, j.jung_big_cate, j.jung_sort, b.big_name
               FROM JUNG_CART j
               LEFT JOIN BIG_CART b ON j.jung_big_cate = b.big_num`;
    const params = [];
    if (req.query.big) {
      sql += ' WHERE j.jung_big_cate=?';
      params.push(req.query.big);
    }
    sql += ' ORDER BY j.jung_big_cate, j.jung_sort';
    const [rows] = await pool.execute(sql, params);
    res.json({ ok: true, rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/api/members/jung-cart', async (req, res) => {
  const { jung_name, jung_big_cate } = req.body;
  try {
    const [[{ maxSort }]] = await pool.execute(
      'SELECT COALESCE(MAX(jung_sort), 0) AS maxSort FROM JUNG_CART WHERE jung_big_cate=?',
      [jung_big_cate]
    );
    const [result] = await pool.execute(
      'INSERT INTO JUNG_CART (jung_name, jung_big_cate, jung_sort, bm_id) VALUES (?,?,?,1)',
      [jung_name, jung_big_cate, (maxSort || 0) + 1]
    );
    res.json({ ok: true, insertId: result.insertId });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.put('/api/members/jung-cart/:num', async (req, res) => {
  const { jung_name, jung_big_cate } = req.body;
  try {
    await pool.execute(
      'UPDATE JUNG_CART SET jung_name=?, jung_big_cate=? WHERE jung_num=?',
      [jung_name, jung_big_cate, req.params.num]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.delete('/api/members/jung-cart/:num', async (req, res) => {
  try {
    await pool.execute('DELETE FROM JUNG_CART WHERE jung_num=?', [req.params.num]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
