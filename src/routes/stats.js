'use strict';

const { Router } = require('express');
const pool = require('../db');

const router = Router();

router.get('/api/stats/regions', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT DISTINCT region FROM bells WHERE region IS NOT NULL AND region <> '' ORDER BY region`
    );
    res.json({ ok: true, regions: rows.map(r => r.region) });
  } catch (e) {
    console.error('[API] GET /api/stats/regions error:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/api/stats/table', async (req, res) => {
  try {
    const page     = Math.max(1, parseInt(req.query.page) || 1);
    const region   = (req.query.region || '').trim();
    const sdate    = (req.query.sdate  || '').trim();
    const edate    = (req.query.edate  || '').trim();
    const PAGE_SIZE = 10;

    const joinParams = [];
    let joinExtra = '';
    if (sdate) { joinExtra += ' AND DATE(e.occurred_at) >= ?'; joinParams.push(sdate); }
    if (edate) { joinExtra += ' AND DATE(e.occurred_at) <= ?'; joinParams.push(edate); }

    const whereParams = [];
    let whereExtra = '';
    if (region) { whereExtra = ' AND b.region = ?'; whereParams.push(region); }

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM bells b WHERE 1=1${whereExtra}`,
      whereParams
    );

    const offset = (page - 1) * PAGE_SIZE;
    const [rows] = await pool.execute(
      `SELECT b.phone_no, b.bell_name, b.region, b.address, b.machine_no,
              COALESCE(b.bell_type, '비상벨') AS bell_type,
              b.lat, b.lng,
              COUNT(e.id) AS total_cnt,
              SUM(CASE WHEN e.status = '경보발생' THEN 1 ELSE 0 END) AS unhandled_cnt
       FROM bells b
       LEFT JOIN bell_events e ON e.phone_no = b.phone_no${joinExtra}
       WHERE 1=1${whereExtra}
       GROUP BY b.phone_no, b.bell_name, b.region, b.address, b.machine_no,
                b.bell_type, b.lat, b.lng, b.created_at
       ORDER BY b.created_at DESC
       LIMIT ?, ?`,
      [...joinParams, ...whereParams, offset, PAGE_SIZE]
    );

    res.json({ ok: true, total, page, rows });
  } catch (e) {
    console.error('[API] GET /api/stats/table error:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
