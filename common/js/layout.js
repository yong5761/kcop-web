(function () {
  var pageContents = {
    home:    '<p class="t2">HOME</p><p class="t1">HOME 화면 (준비 중)</p>',
    bell:    '<p class="t2">비상벨작동정보</p><p class="t1">비상벨작동정보 화면 (준비 중)</p>',
    device:  '<p class="t2">장비정보관리</p><p class="t1">장비정보관리 화면 (준비 중)</p>',
    diagn:   '<p class="t2">실시간장애진단</p><p class="t1">실시간장애진단 화면 (준비 중)</p>',
    member:  '<p class="t2">멤버등록관리</p><p class="t1">멤버등록관리 화면 (준비 중)</p>',
    sendlog: '<p class="t2">전송로그</p><p class="t1">전송로그 화면 (준비 중)</p>',
    stats:   '<p class="t2">통계</p><p class="t1">통계 화면 (준비 중)</p>'
  };

  function setDate() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    var el = document.getElementById('topDate');
    if (el) el.textContent = y + '.' + m + '.' + day;
  }

  function initNav() {
    var items = document.querySelectorAll('#nav li');
    var articleContent = document.getElementById('articleContent');

    items.forEach(function (li) {
      li.addEventListener('click', function (e) {
        e.preventDefault();
        items.forEach(function (item) { item.className = 'nav'; });
        li.className = 'nav_ov';
        var page = li.getAttribute('data-page');
        if (articleContent && pageContents[page]) {
          articleContent.innerHTML = pageContents[page];
        }
      });
    });
  }

  function initMusicSwitch() {
    var sw = document.getElementById('musicSwitch');
    if (!sw) return;
    sw.addEventListener('change', function () {
    });
  }

  function doLogout() {
    location.href = 'login.html';
  }

  window.doLogout = doLogout;

  window.addEventListener('load', function () {
    setDate();
    initNav();
    initMusicSwitch();
  });
})();
