function doLogout() {
  fetch('/api/logout', { method: 'POST', credentials: 'same-origin' })
    .then(function() { location.href = '/pages/login.html'; })
    .catch(function() { location.href = '/pages/login.html'; });
}

function loadTopbarUser() {
  fetch('/api/me', { credentials: 'same-origin' })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (d && d.ok && d.user && d.user.mem_name) {
        var el = document.getElementById('topbar-username');
        if (el) el.textContent = d.user.mem_name;
      }
    })
    .catch(function() {});
}
