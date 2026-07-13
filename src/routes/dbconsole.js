'use strict';

const { Router } = require('express');
const pool = require('../db');

const router = Router();

router.post('/api/db/query', async (req, res) => {
  const sql = ((req.body && req.body.sql) || '').trim();
  if (!sql) return res.json({ ok: false, error: 'SQL을 입력하세요' });

  let conn;
  try {
    conn = await pool.getConnection();

    // 1단계: 문법 확인 (prepare — 실행 없이 파싱만)
    try {
      const stmt = await conn.prepare(sql);
      await stmt.close();
    } catch (synErr) {
      conn.release();
      return res.json({ ok: false, phase: 'syntax', error: synErr.message });
    }

    // 2단계: 실제 실행
    const [result, fields] = await conn.query(sql);
    conn.release();

    if (Array.isArray(result)) {
      const columns = fields
        ? fields.map(f => f.name)
        : (result[0] ? Object.keys(result[0]) : []);
      return res.json({ ok: true, type: 'rows', columns, rows: result, rowCount: result.length });
    } else {
      return res.json({
        ok: true, type: 'result',
        affectedRows: result.affectedRows,
        insertId: result.insertId,
        changedRows: result.changedRows,
        info: result.info
      });
    }
  } catch (execErr) {
    if (conn) conn.release();
    return res.json({ ok: false, phase: 'execute', error: execErr.message });
  }
});

module.exports = router;
