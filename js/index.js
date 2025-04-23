function handleLogout(e) {
  e.preventDefault();
  fetch('http://localhost/tabletop/backend/auth.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ action: 'logout' })
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          window.location.reload();
      }
  })
  .catch(error => console.error('Logout error:', error));
}

function updateAuthUI() {
  const nav = document.querySelector('nav .flex.items-center.space-x-4');
  const loginBtn = nav.querySelector('.login-btn');
  const logoutBtn = nav.querySelector('.logout-btn');

  fetch('http://localhost/tabletop/backend/auth.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ action: 'check_session' })
  })
  .then(res => res.json())
  .then(data => {
      if (data.logged_in) {
          if (loginBtn) loginBtn.style.display = 'none';
          if (!logoutBtn) {
              const logout = document.createElement('a');
              logout.textContent = 'Logout';
              logout.href = '#';
              logout.className = 'bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors logout-btn cursor-pointer';
              logout.onclick = handleLogout;
              nav.appendChild(logout);
          }
      } else {
          if (loginBtn) loginBtn.style.display = '';
          if (logoutBtn) logoutBtn.remove();
      }
  })
  .catch(error => {
      console.error('Auth check failed:', error);
      if (loginBtn) loginBtn.style.display = '';
      if (logoutBtn) logoutBtn.remove();
  });
}

document.addEventListener('DOMContentLoaded', updateAuthUI);