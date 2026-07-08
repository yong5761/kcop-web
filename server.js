'use strict';

require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const startIngest = require('./src/mqtt/ingest');

const app = express();

// data/ 디렉토리 (세션 스토어용)
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

app.use(express.json());

app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: dataDir }),
  secret: process.env.SESSION_SECRET || 'kcop-dev-secret-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000, // 8시간
    secure: false,               // HTTPS 전환 시 true로 변경
    sameSite: 'lax'
  }
}));

app.use(express.static(path.join(__dirname)));

app.use('/', require('./src/routes/auth'));
app.use('/', require('./src/routes/bells'));
app.use('/', require('./src/routes/mqtt'));
app.use('/', require('./src/routes/members'));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('[HTTP] listening on port', port);
});

startIngest();
