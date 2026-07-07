'use strict';

window.showBellMap = function (lat, lng, name, address) {
  var la = parseFloat(lat);
  var lo = parseFloat(lng);
  if (!la || !lo) { alert('위치 정보가 없습니다'); return; }
  var url = 'map_pop.html?lat=' + la + '&lng=' + lo
    + '&name='    + encodeURIComponent(name    || '')
    + '&address=' + encodeURIComponent(address || '');
  var w    = 800;
  var h    = 600;
  var left = Math.round((screen.width  - w) / 2);
  var top  = Math.round((screen.height - h) / 2);
  window.open(url, 'bellMap', 'width=' + w + ',height=' + h + ',left=' + left + ',top=' + top + ',scrollbars=no,resizable=yes');
};
