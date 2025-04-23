async function loadStats() {
  const pending = document.querySelector('.pending-orders');
  const feedback = document.querySelector('.new-feedback');
  const menu = document.querySelector('.menu-items');
  pending.textContent = feedback.textContent = menu.textContent = '...';
  try {
      const res = await fetch('http://localhost/tabletop/backend/admin.php?action=get_quick_stats');
      const data = await res.json();
      if (!data.error && data.data) {
          pending.textContent = data.data.pending_orders;
          feedback.textContent = data.data.new_feedback;
          menu.textContent = data.data.menu_items;
      } else {
          alert('Failed to load stats');
      }
  } catch (e) {
      alert('Failed to load stats');
  }
}
document.addEventListener('DOMContentLoaded', loadStats);
Array.from(document.getElementsByClassName('logout-btn')).forEach(function(logoutBtn) {
  logoutBtn.addEventListener('click', async function() {
      await fetch('http://localhost/tabletop/backend/auth.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ action: 'logout' })
      });
      window.location.href = '../../index.html';
  });
});

