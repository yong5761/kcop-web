(function () {
  'use strict';

  var STORAGE_KEY = 'kcop_fault_alerted';
  var POLL_MS = 30000;

  var baselineDone = false;
  var shownRows = []; // rows currently displayed in the modal

  // ── CSS injection (runs once) ─────────────────────────────────────────────
  var styleEl = document.createElement('style');
  styleEl.textContent =
    '#kcop-fault-overlay{display:none;position:fixed;inset:0;z-index:10000;pointer-events:none}\n' +
    '#kcop-fault-overlay.show{display:block}\n' +
    '#kcop-fault-overlay .kfo-edge{position:absolute;inset:0;box-shadow:inset 0 0 0 6px rgba(26,107,181,.9);animation:kcopFaultPulse 1s ease-in-out infinite}\n' +
    '@keyframes kcopFaultPulse{0%,100%{box-shadow:inset 0 0 0 6px rgba(26,107,181,.25)}50%{box-shadow:inset 0 0 0 10px rgba(26,107,181,.95)}}\n' +
    '#kcop-fault-modal{display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10001;background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.35);width:min(420px,92vw);overflow:hidden}\n' +
    '#kcop-fault-modal.show{display:block}\n' +
    '#kcop-fault-modal .kfm-head{background:#1a6bb5;color:#fff;padding:18px 20px;text-align:center}\n' +
    '#kcop-fault-modal .kfm-ico{font-size:34px;line-height:1}\n' +
    '#kcop-fault-modal .kfm-title{font-size:1.15rem;font-weight:800;margin-top:6px}\n' +
    '#kcop-fault-modal .kfm-sub{font-size:.8rem;opacity:.9;margin-top:2px}\n' +
    '#kcop-fault-modal .kfm-list{max-height:300px;overflow-y:auto;padding:8px}\n' +
    '#kcop-fault-modal .kfm-item{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid #dbeafe;background:#eff6ff;border-radius:10px;margin:6px 4px}\n' +
    '#kcop-fault-modal .kfm-dot{width:10px;height:10px;border-radius:50%;background:#1a6bb5;flex-shrink:0;animation:kcopFaultDot 1s infinite}\n' +
    '@keyframes kcopFaultDot{0%,100%{opacity:.4}50%{opacity:1}}\n' +
    '#kcop-fault-modal .kfm-info{flex:1;min-width:0}\n' +
    '#kcop-fault-modal .kfm-dev{font-weight:700;font-size:.9rem;color:#111827}\n' +
    '#kcop-fault-modal .kfm-meta{font-size:.8rem;color:#6b7280;margin-top:2px}\n' +
    '#kcop-fault-modal .kfm-foot{padding:10px 14px;border-top:1px solid #f1f5f9;text-align:center}\n' +
    '#kcop-fault-modal .kfm-dismiss{background:#e5e7eb;border:none;border-radius:8px;padding:8px 18px;font-size:.84rem;color:#374151;cursor:pointer}';
  document.head.appendChild(styleEl);

  // ── DOM injection (runs once) ─────────────────────────────────────────────
  var overlayEl = document.createElement('div');
  overlayEl.id = 'kcop-fault-overlay';
  overlayEl.innerHTML = '<div class="kfo-edge"></div>';
  document.body.appendChild(overlayEl);

  var modalEl = document.createElement('div');
  modalEl.id = 'kcop-fault-modal';
  modalEl.innerHTML =
    '<div class="kfm-head">' +
      '<div class="kfm-ico">⚠</div>' +
      '<div class="kfm-title">장애발생</div>' +
      '<div class="kfm-sub" id="kcop-fault-sub">통신장애 발생</div>' +
    '</div>' +
    '<div class="kfm-list" id="kcop-fault-list"></div>' +
    '<div class="kfm-foot"><button class="kfm-dismiss" id="kcop-fault-dismiss">닫기</button></div>';
  document.body.appendChild(modalEl);

  document.getElementById('kcop-fault-dismiss').addEventListener('click', dismissModal);

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

  // ── Modal ─────────────────────────────────────────────────────────────────
  function renderList() {
    var listEl = document.getElementById('kcop-fault-list');
    var subEl  = document.getElementById('kcop-fault-sub');
    if (!listEl || !subEl) return;

    subEl.textContent = '통신장애 ' + shownRows.length + '대';

    var html = '';
    shownRows.forEach(function (r) {
      var devText = (r.region || r.bell_name)
        ? (r.region ? esc(r.region) + ' ' : '') + esc(r.bell_name || '')
        : esc(String(r.phone_no || '-'));
      var metaText = esc(String(r.phone_no || '')) +
                     ' · 최종통신 ' +
                     esc(formatLastSeen(r.last_seen));
      html +=
        '<div class="kfm-item">' +
          '<div class="kfm-dot"></div>' +
          '<div class="kfm-info">' +
            '<div class="kfm-dev">' + devText + '</div>' +
            '<div class="kfm-meta">' + metaText + '</div>' +
          '</div>' +
        '</div>';
    });
    listEl.innerHTML = html;
  }

  function showModal(newRows) {
    var existSet = {};
    shownRows.forEach(function (r) { existSet[String(r.phone_no)] = true; });
    newRows.forEach(function (r) {
      if (!existSet[String(r.phone_no)]) shownRows.push(r);
    });
    renderList();
    overlayEl.classList.add('show');
    modalEl.classList.add('show');
  }

  function dismissModal() {
    overlayEl.classList.remove('show');
    modalEl.classList.remove('show');
    shownRows = [];
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
          // First poll: establish baseline silently — no modal
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
        // they can re-trigger the modal if the fault recurs.
        saveAlerted(currentPhones);

        if (newlyFaulted.length === 0) return;

        showModal(newlyFaulted);
      })
      .catch(function () {
        // Network error — silently ignore; will retry next interval
      });
  }

  // ── Start ─────────────────────────────────────────────────────────────────
  poll();
  setInterval(poll, POLL_MS);
})();
