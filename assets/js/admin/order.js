document.addEventListener('DOMContentLoaded', () => {
  fetch('../../backend/admin.php?action=get_all_orders')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('ordersContainer');
      if (data.error) {
        container.innerHTML = `<p class="text-red-600">${data.error}</p>`;
        return;
      }
      container.innerHTML = data.map(order => `
        <div class="p-4 border rounded shadow bg-white">
          <h3 class="text-xl font-semibold">Order #${order.id}</h3>
          <p><strong>User ID:</strong> ${order.user_id}</p>
          <p><strong>Total Price:</strong> ₹${order.total_price}</p>
          <p><strong>Status:</strong> ${order.status}</p>
          <p><strong>Created At:</strong> ${order.created_at}</p>
        </div>
      `).join('');
    })
    .catch(err => {
      console.error('Error:', err);
    });
});