'use strict';

require('dotenv').config();

const express = require('express');
const path = require('path');
const startIngest = require('./src/mqtt/ingest');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.use('/', require('./src/routes/bells'));
app.use('/', require('./src/routes/mqtt'));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('[HTTP] listening on port', port);
});

startIngest();
