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

    try {
      await pool.execute(
        `INSERT INTO bells (phone_no) VALUES (?) ON DUPLICATE KEY UPDATE phone_no = phone_no`,
        [r.phonenumber]
      );
    } catch (e) {
      console.error('[DB] bells upsert error:', e.message);
    }

    try {
      await pool.execute(
        `INSERT INTO bell_logs (phone_no, op, seq, voltage, bellstatus, machinenum, bellnumber, fw_version, raw_msg, received_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.phonenumber, payload.op ?? null, r.seqnum, r.voltage, r.bellstatus, r.machinenum, r.bellnumber, r.fw_version, String(payload.msg).toUpperCase(), now]
      );
    } catch (e) {
      console.error('[DB] bell_logs insert error:', e.message);
    }

    try {
      await pool.execute(
        `INSERT INTO bell_latest (phone_no, last_seq, voltage, bellstatus, fw_version, last_seen, comm_state)
         VALUES (?, ?, ?, ?, ?, ?, '정상')
         ON DUPLICATE KEY UPDATE
           last_seq = VALUES(last_seq),
           voltage = VALUES(voltage),
           bellstatus = VALUES(bellstatus),
           fw_version = VALUES(fw_version),
           last_seen = VALUES(last_seen),
           comm_state = '정상'`,
        [r.phonenumber, r.seqnum, r.voltage, r.bellstatus, r.fw_version, now]
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
