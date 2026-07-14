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

// 인증 게이트 (session 다음, static 앞에 위치해야 함)
const STATIC_EXTS = /\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|map)$/i;
app.use(function authGate(req, res, next) {
  const p = req.path;

  // 루트: 로그인 여부에 따라 분기
  if (p === '/') {
    return (req.session && req.session.user)
      ? res.redirect('/pages/bell.html')
      : res.redirect('/pages/login.html');
  }

  // 로그인 페이지: 이미 로그인한 경우 첫 화면으로
  if (p === '/pages/login.html') {
    if (req.session && req.session.user) return res.redirect('/pages/bell.html');
    return next();
  }

  // 항상 허용: 인증 API
  if ((req.method === 'POST' && (p === '/api/login' || p === '/api/logout')) ||
      (req.method === 'GET'  && (p === '/api/me'   || p === '/api/health'))) {
    return next();
  }

  // 항상 허용: 정적 자원 (common/**, 또는 정적 확장자)
  if (p.startsWith('/common/') || STATIC_EXTS.test(p)) return next();

  // 나머지: 로그인 필요
  if (!(req.session && req.session.user)) {
    return p.startsWith('/api/')
      ? res.status(401).json({ ok: false, error: '로그인이 필요합니다.' })
      : res.redirect('/pages/login.html');
  }

  // 역할 검사: 본사(mem_type=1)가 아니면 전용 페이지·API 차단
  const isAdmin = Number(req.session.user.mem_type) === 1;
  if (!isAdmin) {
    const ADMIN_PAGES = ['/pages/member.html', '/pages/sendlog.html'];
    if (ADMIN_PAGES.includes(p)) {
      return res.redirect('/pages/layout.html');
    }
    if (p.startsWith('/api/members')) {
      return res.status(403).json({ ok: false, error: '권한이 없습니다.' });
    }
  }

  return next();
});

app.use(express.static(path.join(__dirname)));

app.use('/', require('./src/routes/auth'));
app.use('/', require('./src/routes/bells'));
app.use('/', require('./src/routes/mqtt'));
app.use('/', require('./src/routes/members'));
app.use('/', require('./src/routes/dbconsole'));
app.use('/', require('./src/routes/stats'));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('[HTTP] listening on port', port);
});

startIngest();
