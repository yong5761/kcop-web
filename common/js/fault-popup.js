(function () {
  'use strict';

  var STORAGE_KEY = 'kcop_fault_alerted';
  var POLL_MS = 30000;
  var MAX_POPUPS = 5;
  var POPUP_WIDTH = 320;
  var POPUP_HEIGHT_EST = 160; // approximate; used for vertical stacking offset
  var STACK_GAP = 10;
  var BOTTOM_MARGIN = 20;

  var baselineDone = false;
  var stackCount = 0; // tracks currently visible popups for vertical offset

  // ── CSS injection (runs once) ─────────────────────────────────────────────
  var styleEl = document.createElement('style');
  styleEl.textContent = [
    '.kcop-fault-popup {',
    '  position: fixed;',
    '  right: 20px;',
    '  width: ' + POPUP_WIDTH + 'px;',
    '  background: #fff;',
    '  border: 2px solid #1a6bb5;',
    '  border-radius: 4px;',
    '  box-shadow: 0 4px 16px rgba(0,0,0,0.35);',
    '  z-index: 10000;',
    '  font-family: inherit;',
    '  overflow: hidden;',
    '  animation: kcop-fault-slidein 0.25s ease;',
    '}',
    '@keyframes kcop-fault-slidein {',
    '  from { opacity: 0; transform: translateX(40px); }',
    '  to   { opacity: 1; transform: translateX(0); }',
    '}',
    '.kcop-fault-popup .kfp-header {',
    '  background: #1a6bb5;',
    '  color: #fff;',
    '  font-size: 15px;',
    '  font-weight: 700;',
    '  padding: 8px 36px 8px 12px;',
    '  line-height: 22px;',
    '  position: relative;',
    '}',
    '.kcop-fault-popup .kfp-close {',
    '  position: absolute;',
    '  top: 6px;',
    '  right: 10px;',
    '  background: none;',
    '  border: none;',
    '  color: #fff;',
    '  font-size: 18px;',
    '  line-height: 1;',
    '  cursor: pointer;',
    '  padding: 0 2px;',
    '}',
    '.kcop-fault-popup .kfp-body {',
    '  padding: 10px 12px 12px;',
    '  font-size: 13px;',
    '  line-height: 1.8;',
    '  color: #222;',
    '}',
    '.kcop-fault-popup .kfp-bell-name {',
    '  font-weight: 700;',
    '  color: #1a6bb5;',
    '  font-size: 14px;',
    '}'
  ].join('\n');
  document.head.appendChild(styleEl);

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

  // ── Popup creation ────────────────────────────────────────────────────────
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

  function bottomOffset(index) {
    // index: 0-based position in stack from bottom
    return BOTTOM_MARGIN + index * (POPUP_HEIGHT_EST + STACK_GAP);
  }

  function restack() {
    var popups = document.querySelectorAll('.kcop-fault-popup');
    var i;
    for (i = 0; i < popups.length; i++) {
      popups[i].style.bottom = bottomOffset(i) + 'px';
    }
    stackCount = popups.length;
  }

  function createPopup(titleText, bodyHtml) {
    var el = document.createElement('div');
    el.className = 'kcop-fault-popup';
    el.style.bottom = bottomOffset(stackCount) + 'px';
    el.innerHTML =
      '<div class="kfp-header">' +
        titleText +
        '<button class="kfp-close" title="닫기">&#x2715;</button>' +
      '</div>' +
      '<div class="kfp-body">' + bodyHtml + '</div>';

    el.querySelector('.kfp-close').addEventListener('click', function () {
      if (el.parentNode) el.parentNode.removeChild(el);
      restack();
    });

    document.body.appendChild(el);
    stackCount = document.querySelectorAll('.kcop-fault-popup').length;
  }

  function showFaultPopup(row) {
    var title = '&#9888; 장애발생';
    var body =
      (row.region   ? '<b>지역:</b> '       + row.region   + '<br>' : '') +
      '<b>비상벨:</b> <span class="kfp-bell-name">' + (row.bell_name || '-') + '</span><br>' +
      (row.address  ? '<b>주소:</b> '       + row.address  + '<br>' : '') +
      '<b>전화번호:</b> '  + (row.phone_no  || '-') + '<br>' +
      '<b>최종통신:</b> '  + formatLastSeen(row.last_seen);
    createPopup(title, body);
  }

  function showSummaryPopup(extraCount) {
    createPopup(
      '&#9888; 장애발생',
      '<b>외 ' + extraCount + '건 통신장애</b>가 추가로 발생하였습니다.'
    );
  }

  // ── Core poll logic ───────────────────────────────────────────────────────
  function poll() {
    fetch('/api/bells')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.ok || !Array.isArray(data.rows)) return;

        // Rows currently in 통신장애 state
        var faultRows = data.rows.filter(function (r) {
          return r.comm_state === '통신장애';
        });
        var currentPhones = faultRows.map(function (r) { return String(r.phone_no); });

        var alerted = loadAlerted();

        if (!baselineDone) {
          // First poll: establish baseline silently
          baselineDone = true;
          saveAlerted(currentPhones);
          return;
        }

        // Determine newly faulted phones (in currentPhones but not in alerted)
        var alertedSet = {};
        alerted.forEach(function (p) { alertedSet[p] = true; });

        var newlyFaulted = faultRows.filter(function (r) {
          return !alertedSet[String(r.phone_no)];
        });

        // Update stored set: keep only currently faulted phones
        // (resolved ones are dropped so they can re-trigger if fault recurs)
        saveAlerted(currentPhones);

        if (newlyFaulted.length === 0) return;

        // Show up to MAX_POPUPS individual popups
        var toShow = newlyFaulted.slice(0, MAX_POPUPS);
        var extra  = newlyFaulted.length - toShow.length;

        toShow.forEach(function (row) { showFaultPopup(row); });
        if (extra > 0) showSummaryPopup(extra);
      })
      .catch(function () {
        // Network error — silently ignore; will retry next interval
      });
  }

  // ── Start ─────────────────────────────────────────────────────────────────
  poll();
  setInterval(poll, POLL_MS);
})();
