'use strict';

const { Router } = require('express');
const pool = require('../db');

const router = Router();

const isEnabled = () => process.env.ENABLE_DB_CONSOLE === 'true';

router.get('/api/db/status', (req, res) => {
  res.json({ ok: true, enabled: isEnabled() });
});

router.post('/api/db/query', async (req, res) => {
  if (!isEnabled()) return res.status(404).json({ ok: false });

  const sql = ((req.body && req.body.sql) || '').trim();
  if (!sql) return res.json({ ok: false, error: 'SQL을 입력하세요' });

  let conn;
  try {
    conn = await pool.getConnection();

    try {
      const stmt = await conn.prepare(sql);
      await stmt.close();
    } catch (synErr) {
      conn.release();
      return res.json({ ok: false, phase: 'syntax', error: synErr.message });
    }

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
