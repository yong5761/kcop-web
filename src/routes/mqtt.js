'use strict';

const { Router } = require('express');
const mqtt = require('mqtt');
const ingest = require('../mqtt/ingest');

const router = Router();

const publishClient = mqtt.connect(process.env.MQTT_URL || 'mqtt://localhost:1883');

publishClient.on('connect', () => {
  console.log('[MQTT publish client] connected');
});

publishClient.on('error', (err) => {
  console.error('[MQTT publish client] error:', err.message);
});

router.post('/api/mqtt/publish', (req, res) => {
  const { topic, payload } = req.body;
  if (!topic || payload == null) {
    return res.status(400).json({ ok: false, error: 'topic과 payload 필요' });
  }
  console.log('[MQTT publish]', topic, payload);
  publishClient.publish(topic, String(payload), { qos: 0 }, (err) => {
    if (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
    res.json({ ok: true, topic, payload, published_at: new Date().toISOString() });
  });
});

router.get('/api/mqtt/connection-status', (req, res) => {
  const devNo = String(req.query.devNo || '').trim();
  if (!devNo) {
    return res.status(400).json({ ok: false, error: 'devNo 파라미터 필요' });
  }
  const at = ingest.getConnAt(devNo);
  if (at && (Date.now() - at) <= 30000) {
    return res.json({ ok: true, connected: true, at: new Date(at).toISOString() });
  }
  return res.json({ ok: true, connected: false });
});

router.get('/api/mqtt/general-status', (req, res) => {
  const devNo = String(req.query.devNo || '').trim();
  if (!devNo) return res.status(400).json({ ok: false, error: 'devNo 파라미터 필요' });
  const data = ingest.getGeneral(devNo);
  if (data && (Date.now() - data.at) <= 30000) {
    return res.json({ ok: true, received: true, payload: data.payload, fw_version: data.fw_version, at: new Date(data.at).toISOString() });
  }
  return res.json({ ok: true, received: false });
});

router.get('/api/mqtt/easysound-status', (req, res) => {
  const devNo = String(req.query.devNo || '').trim();
  if (!devNo) return res.status(400).json({ ok: false, error: 'devNo 파라미터 필요' });
  const data = ingest.getEasysound(devNo);
  if (data && (Date.now() - data.at) <= 30000) {
    return res.json({
      ok: true, received: true,
      trigvol: data.trigvol, micvol: data.micvol,
      trigsens: data.trigsens, accuracy: data.accuracy,
      at: new Date(data.at).toISOString()
    });
  }
  return res.json({ ok: true, received: false });
});

router.get('/api/mqtt/save-status', (req, res) => {
  const devNo = String(req.query.devNo || '').trim();
  if (!devNo) return res.status(400).json({ ok: false, error: 'devNo 파라미터 필요' });
  const data = ingest.getSave(devNo);
  if (data && (Date.now() - data.at) <= 30000) {
    return res.json({ ok: true, received: true, at: new Date(data.at).toISOString() });
  }
  return res.json({ ok: true, received: false });
});

module.exports = router;
