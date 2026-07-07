'use strict';

const mqtt = require('mqtt');
const pool = require('../db');
const { parseBellData, topicToPhone } = require('./parseBellData');

function startIngest() {
  const client = mqtt.connect(process.env.MQTT_URL);

  client.on('connect', () => {
    console.log('[MQTT] connected:', process.env.MQTT_URL);
    client.subscribe('hk-multii/+/log', (err) => {
      if (err) {
        console.error('[MQTT] subscribe error:', err.message);
      } else {
        console.log('[MQTT] subscribed to hk-multii/+/log');
      }
    });
  });

  client.on('message', async (topic, message) => {
    let payload;
    try {
      payload = JSON.parse(message.toString());
    } catch (e) {
      console.warn('[MQTT] JSON parse failed topic=%s err=%s', topic, e.message);
      return;
    }

    const r = parseBellData(payload.msg);
    if (!r.valid) {
      console.warn('[MQTT] invalid payload topic=%s error=%s', topic, r.error || 'checksum mismatch');
      return;
    }

    const topicPhone = Number(topicToPhone(topic));
    const parsedPhone = Number(r.phonenumber);
    if (topicPhone !== parsedPhone) {
      console.warn('[MQTT] phone mismatch topic=%s topic_phone=%s parsed_phone=%s', topic, topicPhone, parsedPhone);
    }

    const now = new Date();
    const rawMsg = String(payload.msg).toUpperCase();
    const curBell = r.bellnumber || 0;

    try {
      await pool.execute(
        `INSERT INTO bells (phone_no) VALUES (?) ON DUPLICATE KEY UPDATE phone_no = phone_no`,
        [r.phonenumber]
      );
    } catch (e) {
      console.error('[DB] bells upsert error:', e.message);
    }

    let prevBell = 0;
    try {
      const [rows] = await pool.execute(
        `SELECT last_bellnumber FROM bell_latest WHERE phone_no = ?`,
        [r.phonenumber]
      );
      if (rows.length > 0 && rows[0].last_bellnumber != null) {
        prevBell = rows[0].last_bellnumber;
      }
    } catch (e) {
      console.error('[DB] bell_latest select error:', e.message);
    }

    try {
      await pool.execute(
        `INSERT INTO bell_logs (phone_no, op, seq, voltage, bellstatus, machinenum, bellnumber, fw_version, raw_msg, received_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.phonenumber, payload.op ?? null, r.seqnum, r.voltage, r.bellstatus, r.machinenum, r.bellnumber, r.fw_version, rawMsg, now]
      );
    } catch (e) {
      console.error('[DB] bell_logs insert error:', e.message);
    }

    if (prevBell === 0 && curBell !== 0) {
      let machine_no = null, bell_name = null, region = null, address = null;
      try {
        const [rows] = await pool.execute(
          `SELECT machine_no, bell_name, region, address FROM bells WHERE phone_no = ?`,
          [r.phonenumber]
        );
        if (rows.length > 0) {
          ({ machine_no, bell_name, region, address } = rows[0]);
        }
      } catch (e) {
        console.error('[DB] bells select error:', e.message);
      }
      try {
        await pool.execute(
          `INSERT INTO bell_events (phone_no, machine_no, bell_name, region, address, bell_number, status, occurred_at, raw_msg)
           VALUES (?, ?, ?, ?, ?, ?, '경보발생', ?, ?)`,
          [r.phonenumber, machine_no, bell_name, region, address, curBell, now, rawMsg]
        );
        console.log('[경보발생] phone=%s bell_number=%s', r.phonenumber, curBell);
      } catch (e) {
        console.error('[DB] bell_events insert error:', e.message);
      }
    } else if (prevBell !== 0 && curBell === 0) {
      try {
        const [rows] = await pool.execute(
          `SELECT id FROM bell_events WHERE phone_no = ? AND status = '경보발생' AND resolved_at IS NULL ORDER BY occurred_at DESC LIMIT 1`,
          [r.phonenumber]
        );
        if (rows.length > 0) {
          await pool.execute(
            `UPDATE bell_events SET status = '정상복구', resolved_at = ? WHERE id = ?`,
            [now, rows[0].id]
          );
          console.log('[정상복구] phone=%s event_id=%s', r.phonenumber, rows[0].id);
        }
      } catch (e) {
        console.error('[DB] bell_events update error:', e.message);
      }
    }

    try {
      await pool.execute(
        `INSERT INTO bell_latest (phone_no, last_seq, voltage, bellstatus, fw_version, last_seen, comm_state, last_bellnumber)
         VALUES (?, ?, ?, ?, ?, ?, '정상', ?)
         ON DUPLICATE KEY UPDATE
           last_seq = VALUES(last_seq),
           voltage = VALUES(voltage),
           bellstatus = VALUES(bellstatus),
           fw_version = VALUES(fw_version),
           last_seen = VALUES(last_seen),
           comm_state = '정상',
           last_bellnumber = VALUES(last_bellnumber)`,
        [r.phonenumber, r.seqnum, r.voltage, r.bellstatus, r.fw_version, now, curBell]
      );
    } catch (e) {
      console.error('[DB] bell_latest upsert error:', e.message);
    }
  });

  client.on('error', (err) => {
    console.error('[MQTT] error:', err.message);
  });
}

module.exports = startIngest;
