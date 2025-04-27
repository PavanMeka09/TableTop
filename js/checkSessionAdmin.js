document.addEventListener('DOMContentLoaded', async () => {
  try {
      const res = await fetch('http://localhost/tabletop/backend/auth.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ action: 'check_session' })
      });
      const data = await res.json();
      if (data.role === "user") {
        window.location.href = 'http://localhost/tabletop/index.html';
      } else if (!data.logged_in){
        window.location.href = 'http://localhost/tabletop/pages/login.html';
      }
  } catch (e) {
      window.location.href = 'http://localhost/tabletop/pages/login.html';
  }
});