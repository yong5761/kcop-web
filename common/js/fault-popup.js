(function () {
  'use strict';

  var STORAGE_KEY = 'kcop_fault_alerted';
  var POLL_MS = 30000;
  var MAX_POPUPS = 5;
  var POPUP_HEIGHT_EST = 160;
  var STACK_GAP = 10;
  var BOTTOM_MARGIN = 20;

  var baselineDone = false;
  var stackCount = 0;

  // Refs to persistent UI elements
  var faultBtn = null;
  var faultPanel = null;
  var panelOpen = false;

  // Last known fault rows (kept for panel re-render on toggle)
  var lastFaultRows = [];

  // ── CSS injection ─────────────────────────────────────────────────────────
  var styleEl = document.createElement('style');
  styleEl.textContent = [
    /* ---- auto toast (left side) ---- */
    '.kcop-fault-popup {',
    '  position: fixed;',
    '  left: 20px;',
    '  width: 320px;',
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
    '  from { opacity: 0; transform: translateX(-40px); }',
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
    '}',
    /* ---- status button (bottom-right) ---- */
    '#kcop-fault-btn {',
    '  position: fixed;',
    '  right: 20px;',
    '  bottom: 20px;',
    '  z-index: 10001;',
    '  border: none;',
    '  border-radius: 20px;',
    '  padding: 8px 16px;',
    '  color: #fff;',
    '  font-size: 14px;',
    '  font-weight: 700;',
    '  cursor: pointer;',
    '  box-shadow: 0 3px 10px rgba(0,0,0,0.3);',
    '  transition: background 0.2s;',
    '  font-family: inherit;',
    '}',
    /* ---- list panel ---- */
    '#kcop-fault-panel {',
    '  display: none;',
    '  position: fixed;',
    '  right: 20px;',
    '  bottom: 70px;',
    '  width: 360px;',
    '  max-height: 60vh;',
    '  z-index: 10002;',
    '  background: #fff;',
    '  border: 2px solid #1a6bb5;',
    '  border-radius: 4px;',
    '  box-shadow: 0 4px 16px rgba(0,0,0,0.35);',
    '  overflow: hidden;',
    '  display: none;',
    '  flex-direction: column;',
    '  font-family: inherit;',
    '}',
    '#kcop-fault-panel .kfpanel-header {',
    '  background: #1a6bb5;',
    '  color: #fff;',
    '  font-size: 15px;',
    '  font-weight: 700;',
    '  padding: 9px 38px 9px 12px;',
    '  position: relative;',
    '  flex-shrink: 0;',
    '}',
    '#kcop-fault-panel .kfpanel-close {',
    '  position: absolute;',
    '  top: 7px;',
    '  right: 10px;',
    '  background: none;',
    '  border: none;',
    '  color: #fff;',
    '  font-size: 18px;',
    '  line-height: 1;',
    '  cursor: pointer;',
    '  padding: 0 2px;',
    '}',
    '#kcop-fault-panel .kfpanel-body {',
    '  overflow-y: auto;',
    '  flex: 1;',
    '}',
    '#kcop-fault-panel .kfpanel-row {',
    '  padding: 8px 12px;',
    '  border-bottom: 1px solid #eee;',
    '  font-size: 13px;',
    '  line-height: 1.7;',
    '  color: #222;',
    '}',
    '#kcop-fault-panel .kfpanel-row:last-child {',
    '  border-bottom: none;',
    '}',
    '#kcop-fault-panel .kfpanel-name {',
    '  font-weight: 700;',
    '  color: #1a6bb5;',
    '}',
    '#kcop-fault-panel .kfpanel-meta {',
    '  font-size: 12px;',
    '  color: #555;',
    '}',
    '#kcop-fault-panel .kfpanel-empty {',
    '  padding: 20px 12px;',
    '  text-align: center;',
    '  color: #777;',
    '  font-size: 13px;',
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

  // ── Utility ───────────────────────────────────────────────────────────────
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

  // ── Status button ─────────────────────────────────────────────────────────
  function createStatusButton() {
    faultBtn = document.createElement('button');
    faultBtn.id = 'kcop-fault-btn';
    faultBtn.textContent = '통신장애 없음';
    faultBtn.style.background = '#888';
    faultBtn.addEventListener('click', togglePanel);
    document.body.appendChild(faultBtn);
  }

  function updateButtonState(count) {
    if (!faultBtn) return;
    if (count > 0) {
      faultBtn.textContent = '⚠ 통신장애 ' + count + '대';
      faultBtn.style.background = '#1a6bb5';
    } else {
      faultBtn.textContent = '통신장애 없음';
      faultBtn.style.background = '#888';
    }
  }

  // ── List panel ────────────────────────────────────────────────────────────
  function createPanel() {
    faultPanel = document.createElement('div');
    faultPanel.id = 'kcop-fault-panel';

    var header = document.createElement('div');
    header.className = 'kfpanel-header';
    header.innerHTML = '<span id="kcop-fault-panel-title">통신장애 현황 (0대)</span>' +
      '<button class="kfpanel-close" title="닫기">&#x2715;</button>';
    header.querySelector('.kfpanel-close').addEventListener('click', closePanel);

    var body = document.createElement('div');
    body.className = 'kfpanel-body';
    body.id = 'kcop-fault-panel-body';

    faultPanel.appendChild(header);
    faultPanel.appendChild(body);
    document.body.appendChild(faultPanel);
  }

  function renderPanelRows(rows) {
    var titleEl = document.getElementById('kcop-fault-panel-title');
    if (titleEl) titleEl.textContent = '통신장애 현황 (' + rows.length + '대)';

    var body = document.getElementById('kcop-fault-panel-body');
    if (!body) return;

    if (rows.length === 0) {
      body.innerHTML = '<div class="kfpanel-empty">현재 통신장애 장비가 없습니다.</div>';
      return;
    }

    var html = '';
    rows.forEach(function (r) {
      var nameLine = (r.region ? r.region + ' ' : '') +
        '<span class="kfpanel-name">' + (r.bell_name || r.phone_no || '-') + '</span>';
      var metaLine = (r.phone_no || '') +
        (r.last_seen ? ' / ' + formatLastSeen(r.last_seen) : '');
      html += '<div class="kfpanel-row">' +
        '<div>' + nameLine + '</div>' +
        '<div class="kfpanel-meta">' + metaLine + '</div>' +
        '</div>';
    });
    body.innerHTML = html;
  }

  function openPanel() {
    panelOpen = true;
    faultPanel.style.display = 'flex';
    renderPanelRows(lastFaultRows);
  }

  function closePanel() {
    panelOpen = false;
    faultPanel.style.display = 'none';
  }

  function togglePanel() {
    if (panelOpen) {
      closePanel();
    } else {
      openPanel();
    }
  }

  // ── Unified status update (called every poll) ─────────────────────────────
  function updateStatus(rows) {
    lastFaultRows = rows;
    updateButtonState(rows.length);
    if (panelOpen) renderPanelRows(rows);
  }

  // ── Auto toast (left side) ────────────────────────────────────────────────
  function bottomOffset(index) {
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

        var faultRows = data.rows.filter(function (r) {
          return r.comm_state === '통신장애';
        });
        var currentPhones = faultRows.map(function (r) { return String(r.phone_no); });

        // Always update button and panel regardless of baseline state
        updateStatus(faultRows);

        var alerted = loadAlerted();

        if (!baselineDone) {
          baselineDone = true;
          saveAlerted(currentPhones);
          return;
        }

        var alertedSet = {};
        alerted.forEach(function (p) { alertedSet[p] = true; });

        var newlyFaulted = faultRows.filter(function (r) {
          return !alertedSet[String(r.phone_no)];
        });

        saveAlerted(currentPhones);

        if (newlyFaulted.length === 0) return;

        var toShow = newlyFaulted.slice(0, MAX_POPUPS);
        var extra  = newlyFaulted.length - toShow.length;

        toShow.forEach(function (row) { showFaultPopup(row); });
        if (extra > 0) showSummaryPopup(extra);
      })
      .catch(function () {});
  }

  // ── Start ─────────────────────────────────────────────────────────────────
  createStatusButton();
  createPanel();
  poll();
  setInterval(poll, POLL_MS);
})();
