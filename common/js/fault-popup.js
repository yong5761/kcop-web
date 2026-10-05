(function () {
  'use strict';

  var STORAGE_KEY = 'kcop_fault_alerted';
  var POLL_MS     = 30000;
  var MAX_CARDS   = 15;

  var baselineDone = false;
  var openCards    = []; // DOM elements of currently visible cards

  // ── CSS injection (runs once) ─────────────────────────────────────────────
  var styleEl = document.createElement('style');
  styleEl.textContent =
    '#kcop-fault-overlay{display:none;position:fixed;inset:0;z-index:10000;pointer-events:none}\n' +
    '#kcop-fault-overlay.show{display:block}\n' +
    '#kcop-fault-overlay .kfo-edge{position:absolute;inset:0;box-shadow:inset 0 0 0 6px rgba(26,107,181,.9);animation:kcopFaultPulse 1s ease-in-out infinite}\n' +
    '@keyframes kcopFaultPulse{0%,100%{box-shadow:inset 0 0 0 6px rgba(26,107,181,.25)}50%{box-shadow:inset 0 0 0 10px rgba(26,107,181,.95)}}\n' +
    '.kcop-fault-card{position:fixed;top:50%;left:50%;z-index:10001;background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.35);width:min(380px,92vw);overflow:hidden}\n' +
    '.kcop-fault-card .kfc-head{background:#1a6bb5;color:#fff;padding:16px 18px;text-align:center}\n' +
    '.kcop-fault-card .kfc-ico{font-size:30px;line-height:1}\n' +
    '.kcop-fault-card .kfc-title{font-size:1.1rem;font-weight:800;margin-top:4px}\n' +
    '.kcop-fault-card .kfc-body{padding:14px 18px;font-size:.88rem;line-height:1.9;color:#222}\n' +
    '.kcop-fault-card .kfc-body b{color:#1a6bb5}\n' +
    '.kcop-fault-card .kfc-foot{padding:10px 14px;border-top:1px solid #f1f5f9;text-align:center}\n' +
    '.kcop-fault-card .kfc-close{background:#e5e7eb;border:none;border-radius:8px;padding:8px 18px;font-size:.84rem;color:#374151;cursor:pointer}';
  document.head.appendChild(styleEl);

  // ── Overlay DOM (runs once) ───────────────────────────────────────────────
  var overlayEl = document.createElement('div');
  overlayEl.id = 'kcop-fault-overlay';
  overlayEl.innerHTML = '<div class="kfo-edge"></div>';
  document.body.appendChild(overlayEl);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function esc(val) {
    var d = document.createElement('div');
    d.textContent = String(val == null ? '' : val);
    return d.innerHTML;
  }

  function formatLastSeen(val) {
    if (!val) return '알 수 없음';
    try {
      var d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      var pad = function (n) { return n < 10 ? '0' + n : String(n); };
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
             ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    } catch (e) {
      return String(val);
    }
  }

  // ── localStorage helpers ──────────────────────────────────────────────────
  function loadAlerted() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveAlerted(arr) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {}
  }

  // ── Card stack ────────────────────────────────────────────────────────────
  function restack() {
    for (var i = 0; i < openCards.length; i++) {
      openCards[i].style.transform =
        'translate(calc(-50% + ' + (i * 24) + 'px), calc(-50% + ' + (i * 24) + 'px))';
      openCards[i].style.zIndex = 10001 + i;
    }
  }

  function makeCloseHandler(cardEl) {
    return function () {
      if (cardEl.parentNode) cardEl.parentNode.removeChild(cardEl);
      var idx = openCards.indexOf(cardEl);
      if (idx !== -1) openCards.splice(idx, 1);
      restack();
      if (openCards.length === 0) overlayEl.classList.remove('show');
    };
  }

  function buildCard(headHtml, bodyHtml) {
    var el = document.createElement('div');
    el.className = 'kcop-fault-card';
    el.innerHTML =
      '<div class="kfc-head">' +
        '<div class="kfc-ico">⚠</div>' +
        '<div class="kfc-title">' + headHtml + '</div>' +
      '</div>' +
      '<div class="kfc-body">' + bodyHtml + '</div>' +
      '<div class="kfc-foot"><button class="kfc-close">닫기</button></div>';
    el.querySelector('.kfc-close').addEventListener('click', makeCloseHandler(el));
    return el;
  }

  function addCard(row) {
    var bellName = (row.region || row.bell_name) ? esc(row.bell_name || '') : esc(String(row.phone_no || '-'));
    var body =
      (row.region  ? '<b>지역:</b> '    + esc(row.region)  + '<br>' : '') +
      '<b>비상벨:</b> ' + bellName + '<br>' +
      (row.address ? '<b>주소:</b> '    + esc(row.address) + '<br>' : '') +
      '<b>전화번호:</b> ' + esc(String(row.phone_no || '-')) + '<br>' +
      '<b>최종통신:</b> ' + esc(formatLastSeen(row.last_seen));
    var card = buildCard('장애발생', body);
    document.body.appendChild(card);
    openCards.push(card);
    restack();
    overlayEl.classList.add('show');
  }

  function addSummaryCard(n) {
    var body = '<b>외 ' + n + '건 통신장애</b>가 추가로 발생했습니다.';
    var card = buildCard('장애발생', body);
    document.body.appendChild(card);
    openCards.push(card);
    restack();
    overlayEl.classList.add('show');
  }

  // ── Core poll logic ───────────────────────────────────────────────────────
  function poll() {
    fetch('/api/bells')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.ok || !Array.isArray(data.rows)) return;

        var faultRows = data.rows.filter(function (r) {
          return r.comm_state === '통신장애';
        });
        var currentPhones = faultRows.map(function (r) { return String(r.phone_no); });

        var alerted = loadAlerted();

        if (!baselineDone) {
          // First poll: establish baseline silently — no cards
          baselineDone = true;
          saveAlerted(currentPhones);
          return;
        }

        var alertedSet = {};
        alerted.forEach(function (p) { alertedSet[p] = true; });

        var newlyFaulted = faultRows.filter(function (r) {
          return !alertedSet[String(r.phone_no)];
        });

        // Keep only currently faulted phones; resolved ones drop out so
        // they can re-trigger cards if the fault recurs.
        saveAlerted(currentPhones);

        if (newlyFaulted.length === 0) return;

        var room     = Math.max(0, MAX_CARDS - openCards.length);
        var toShow   = newlyFaulted.slice(0, room);
        var overflow = newlyFaulted.length - toShow.length;

        toShow.forEach(addCard);
        if (overflow > 0) addSummaryCard(overflow);
      })
      .catch(function () {
        // Network error — silently ignore; will retry next interval
      });
  }

  // ── Start ─────────────────────────────────────────────────────────────────
  poll();
  setInterval(poll, POLL_MS);
})();
