function doLogout() {
  fetch('/api/logout', { method: 'POST', credentials: 'same-origin' })
    .then(function() { location.href = '/pages/login.html'; })
    .catch(function() { location.href = '/pages/login.html'; });
}
