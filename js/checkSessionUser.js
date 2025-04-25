document.addEventListener('DOMContentLoaded', async () => {
  try {
      const res = await fetch('http://localhost/tabletop/backend/auth.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ action: 'check_session' })
      });
      const data = await res.jswon();
      if (data.role === 'admin') {
          window.location.href = '/admin/dashboard.html';
        } else if(!data.logged_in){
          window.location.href = 'login.html';
      }
  } catch (e) {
      window.location.href = 'login.html';
  }
});