'use strict';

(function () {
  var sdkLoaded = false;
  var sdkLoading = false;
  var pendingCallbacks = [];

  function loadSdk(cb) {
    if (sdkLoaded) { cb(); return; }
    pendingCallbacks.push(cb);
    if (sdkLoading) return;
    sdkLoading = true;
    var s = document.createElement('script');
    s.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=0e7e227bdde36f53ba4995bfedb0dd76&autoload=false';
    s.onload = function () {
      try {
        kakao.maps.load(function () {
          sdkLoaded = true;
          var fns = pendingCallbacks.slice();
          pendingCallbacks = [];
          fns.forEach(function (f) { try { f(); } catch (e) { console.error('[KakaoMap]', e); } });
        });
      } catch (e) {
        console.error('[KakaoMap] kakao.maps.load error:', e);
      }
    };
    s.onerror = function () {
      console.error('[KakaoMap] SDK script load failed');
    };
    document.head.appendChild(s);
  }

  function closeModal() {
    var ov = document.getElementById('bell-map-overlay');
    var mo = document.getElementById('bell-map-modal');
    if (ov) document.body.removeChild(ov);
    if (mo) document.body.removeChild(mo);
  }

  window.showBellMap = function (lat, lng, name, address) {
    var la = parseFloat(lat);
    var lo = parseFloat(lng);
    if (!la || !lo) { alert('위치 정보가 없습니다'); return; }

    var ov = document.createElement('div');
    ov.id = 'bell-map-overlay';
    ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9998;';
    ov.onclick = closeModal;

    var modal = document.createElement('div');
    modal.id = 'bell-map-modal';
    modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:620px;height:500px;background:#fff;z-index:9999;border-radius:4px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.4);';
    modal.onclick = function (e) { e.stopPropagation(); };

    var header = document.createElement('div');
    header.style.cssText = 'background:#2244aa;color:#fff;padding:10px 14px;font-size:14px;font-weight:bold;display:flex;justify-content:space-between;align-items:center;';

    var titleEl = document.createElement('span');
    titleEl.textContent = (name || '위치 보기') + (address ? '  ' + address : '');
    titleEl.style.cssText = 'overflow:hidden;white-space:nowrap;text-overflow:ellipsis;max-width:530px;';

    var closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'background:none;border:none;color:#fff;font-size:18px;cursor:pointer;line-height:1;flex-shrink:0;';
    closeBtn.onclick = closeModal;

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    var mapDiv = document.createElement('div');
    mapDiv.id = 'bell-kakao-map';
    mapDiv.style.cssText = 'width:100%;height:450px;';

    modal.appendChild(header);
    modal.appendChild(mapDiv);

    document.body.appendChild(ov);
    document.body.appendChild(modal);

    loadSdk(function () {
      try {
        var container = document.getElementById('bell-kakao-map');
        var options = { center: new kakao.maps.LatLng(la, lo), level: 3 };
        var map = new kakao.maps.Map(container, options);
        var markerPos = new kakao.maps.LatLng(la, lo);
        var marker = new kakao.maps.Marker({ map: map, position: markerPos });
        var infoContent = '<div style="padding:6px 10px;font-size:13px;line-height:1.5;">'
          + (name    ? '<strong>' + name + '</strong>' : '')
          + (address ? '<br>' + address : '')
          + '</div>';
        var infowindow = new kakao.maps.InfoWindow({ content: infoContent });
        infowindow.open(map, marker);
      } catch (e) {
        console.error('[KakaoMap] map render error:', e);
      }
    });
  };
})();
