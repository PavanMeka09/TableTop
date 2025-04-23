
document.getElementById('mobile-menu-button').addEventListener('click', function() {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.toggle('hidden');
});

function loadFeedback() {
  fetch(`http://localhost/tabletop/backend/feedback.php?action=get_feedback&status=all`)
      .then(res => res.json())
      .then(data => {
          const container = document.getElementById('feedbackList');
          container.innerHTML = '';
          if (data.length === 0) {
              container.innerHTML = '<p class="text-center py-12 text-gray-500">No feedback found</p>';
              return;
          }
          data.forEach(feedback => {
              const div = document.createElement('div');
              div.className = 'bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow';
              
              const starRating = Array(5).fill(0).map((_, i) => 
                  `<i class="fas fa-star ${i < feedback.rating ? 'text-amber-400' : 'text-gray-300'}"></i>`
              ).join('');
              
              div.innerHTML = `
                  <div class="flex justify-between items-start mb-4">
                      <div>
                          <h3 class="font-bold text-lg text-gray-900">${feedback.name}</h3>
                          <p class="text-sm text-gray-500">${feedback.email}</p>
                          <p class="text-sm text-gray-500">Order ID: ${feedback.order_id}</p>
                          <div class="mt-2">${starRating}</div>
                      </div>
                  </div>
                  <p class="text-gray-700 mb-4">${feedback.message}</p>
                  <div class="flex justify-between items-center">
                      <p class="text-sm text-gray-500">${new Date(feedback.created_at).toLocaleString()}</p>
                  </div>
              `;
              container.appendChild(div);
          });
      });
}

document.addEventListener('DOMContentLoaded', loadFeedback);