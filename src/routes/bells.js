'use strict';

const { Router } = require('express');
const pool = require('../db');

const router = Router();

function regionFilter(user, alias) {
  if (!user) return { clause: '', params: [] };
  if (user.mem_type === 1) return { clause: '', params: [] };
  const conds = [];
  const params = [];
  function add(c1, c2) {
    if (c1 && c2 && Number(c1) > 0 && Number(c2) > 0) {
      conds.push(`(${alias}.c1 = ? AND ${alias}.c2 = ?)`);
      params.push(c1, c2);
    }
  }
  add(user.c1,   user.c2);
  add(user.c1_2, user.c2_2);
  add(user.c1_3, user.c2_3);
  if (conds.length === 0) return { clause: 'AND 1=0', params: [] };
  return { clause: 'AND (' + conds.join(' OR ') + ')', params };
}

router.get('/api/bells', async (req, res) => {
  try {
    const { clause, params } = regionFilter(req.session.user, 'b');
    const [rows] = await pool.execute(
      `SELECT
         b.phone_no, b.bell_name, b.region, b.address, b.lat, b.lng, b.machine_no,
         bl.last_seq, bl.voltage, bl.bellstatus, bl.fw_version, bl.last_seen,
         CASE
           WHEN bl.last_seen IS NULL OR bl.last_seen < (NOW() - INTERVAL 150 MINUTE)
           THEN '통신장애'
           ELSE '정상'
         END AS comm_state
       FROM bells b
       LEFT JOIN bell_latest bl ON b.phone_no = bl.phone_no
       WHERE 1=1 ${clause}
       ORDER BY b.phone_no ASC`,
      params
    );
    res.json({ ok: true, rows });
  } catch (e) {
    console.error('[API] GET /api/bells error:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/api/bells/:phone/logs', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, op, seq, voltage, bellstatus, machinenum, bellnumber, fw_version, raw_msg, received_at
       FROM bell_logs
       WHERE phone_no = ?
       ORDER BY received_at DESC
       LIMIT 100`,
      [req.params.phone]
    );
    res.json({ ok: true, rows });
  } catch (e) {
    console.error('[API] GET /api/bells/:phone/logs error:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/api/stats/summary', async (req, res) => {
  try {
    const rf = regionFilter(req.session.user, 'b');
    const isAdmin = !req.session.user || req.session.user.mem_type === 1;

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM bells b WHERE 1=1 ${rf.clause}`,
      rf.params
    );
    const [[{ normal, fault }]] = await pool.execute(
      `SELECT
         SUM(CASE WHEN bl.last_seen IS NOT NULL AND bl.last_seen >= (NOW() - INTERVAL 150 MINUTE) THEN 1 ELSE 0 END) AS normal,
         SUM(CASE WHEN bl.last_seen IS NULL OR bl.last_seen < (NOW() - INTERVAL 150 MINUTE) THEN 1 ELSE 0 END) AS fault
       FROM bells b
       LEFT JOIN bell_latest bl ON b.phone_no = bl.phone_no
       WHERE 1=1 ${rf.clause}`,
      rf.params
    );
    const [[{ logs_24h }]] = await pool.execute(
      `SELECT COUNT(*) AS logs_24h FROM bell_logs WHERE received_at > NOW() - INTERVAL 1 DAY`
    );
    let alarm_active, alarm_today;
    if (isAdmin) {
      [[{ alarm_active }]] = await pool.execute(
        `SELECT COUNT(*) AS alarm_active FROM bell_events WHERE status = '경보발생' AND resolved_at IS NULL`
      );
      [[{ alarm_today }]] = await pool.execute(
        `SELECT COUNT(*) AS alarm_today FROM bell_events WHERE occurred_at >= CURDATE()`
      );
    } else {
      [[{ alarm_active }]] = await pool.execute(
        `SELECT COUNT(*) AS alarm_active
         FROM bell_events e JOIN bells b ON e.phone_no = b.phone_no
         WHERE e.status = '경보발생' AND e.resolved_at IS NULL ${rf.clause}`,
        rf.params
      );
      [[{ alarm_today }]] = await pool.execute(
        `SELECT COUNT(*) AS alarm_today
         FROM bell_events e JOIN bells b ON e.phone_no = b.phone_no
         WHERE e.occurred_at >= CURDATE() ${rf.clause}`,
        rf.params
      );
    }
    res.json({ ok: true, total, normal, fault, logs_24h, alarm_active, alarm_today });
  } catch (e) {
    console.error('[API] GET /api/stats/summary error:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/api/events', async (req, res) => {
  try {
    const { clause, params } = regionFilter(req.session.user, 'b');
    const [rows] = await pool.execute(
      `SELECT e.id, e.phone_no, e.machine_no, e.bell_name, e.region, e.address,
              e.bell_number, e.status, e.occurred_at, e.resolved_at,
              b.lat, b.lng
       FROM bell_events e
       LEFT JOIN bells b ON e.phone_no = b.phone_no
       WHERE 1=1 ${clause}
       ORDER BY e.occurred_at DESC
       LIMIT 200`,
      params
    );
    res.json({ ok: true, rows });
  } catch (e) {
    console.error('[API] GET /api/events error:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/api/bells/:phone/last-packet', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT phone_no, received_at, raw_msg, bellnumber, bellstatus
       FROM bell_logs WHERE phone_no = ? ORDER BY received_at DESC LIMIT 1`,
      [req.params.phone]
    );
    if (rows.length === 0) return res.json({ ok: true, data: null });

    const row = rows[0];
    const raw = row.raw_msg;

    if (!raw || raw.length !== 40) return res.json({ ok: true, data: null });

    const buf = Buffer.from(raw, 'hex');
    const lng        = buf.readUInt8(0);
    const phonenumber= buf.readUInt32LE(1);
    const bellnumber = buf.readUInt8(5);
    const seqnum     = buf.readUInt8(6);
    const voltage    = buf.readUInt8(7);
    const bellstatus = buf.readUInt32LE(8);
    const machinenum = buf.readUInt32LE(12);
    const rsv1       = buf.readUInt8(16);
    const rsv2       = buf.readUInt8(17);
    const fw_version = buf.readUInt8(18);
    const chksum     = buf.readUInt8(19);

    let xor = 0;
    for (let i = 0; i < 19; i++) xor ^= buf.readUInt8(i);
    const checksum_ok = xor === chksum;

    res.json({
      ok: true,
      data: {
        phone_no:    row.phone_no,
        received_at: row.received_at,
        raw_msg:     raw,
        lng, phonenumber, bellnumber, seqnum, voltage,
        bellstatus, machinenum, rsv1, rsv2, fw_version, chksum,
        checksum_ok,
        is_alarm: bellnumber !== 0,
      },
    });
  } catch (e) {
    console.error('[API] GET /api/bells/:phone/last-packet error:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
