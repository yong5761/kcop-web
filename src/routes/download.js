'use strict';

const { Router } = require('express');
const path = require('path');
const fs = require('fs');

const router = Router();

const SMSTRIGGER_PATH = '/data/downloads/SMSTrigger.exe';

router.get('/api/download/smstrigger/info', (req, res) => {
  fs.stat(SMSTRIGGER_PATH, (err, stat) => {
    if (err) {
      return res.status(404).json({ ok: false, error: '파일 없음' });
    }
    res.json({
      ok: true,
      size: stat.size,
      mtime: stat.mtime.toISOString()
    });
  });
});

router.get('/api/download/smstrigger', (req, res) => {
  fs.stat(SMSTRIGGER_PATH, (err, stat) => {
    if (err) {
      return res.status(404).json({ ok: false, error: '파일 없음' });
    }
    res.setHeader('Content-Disposition', 'attachment; filename="SMSTrigger.exe"');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    fs.createReadStream(SMSTRIGGER_PATH).pipe(res);
  });
});

module.exports = router;
