document.getElementById('mobile-menu-button').addEventListener('click', function() {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.toggle('hidden');
  });
  
function renderBookingStatus(order) {
    const statusColors = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'preparing': 'bg-amber-100 text-amber-800',
        'on the way': 'bg-blue-100 text-blue-800',
        'delivered': 'bg-green-100 text-green-800',
        'confirmed': 'bg-green-100 text-green-800',
        'cancelled': 'bg-red-100 text-red-800'
    };
    return `<span class="px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}">${order.status}</span>`;
}

function renderFeedbackUI(order) {
    if (order.status === 'delivered') {
        if (order.feedbackExists) {
            return `<p class='text-green-600'>Feedback submitted</p>`;
        }
        return `
            <div id="feedback-${order.id}" class="mt-4 p-4 bg-gray-50 border rounded-lg">
                <h4 class="text-sm font-bold mb-2">We value your feedback!</h4>
                <p class="text-sm text-gray-600 mb-4">Please rate your experience with this order.</p>
                <form onsubmit="submitFeedback(event, ${order.id})">
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-1">Rating</label>
                        <div id="stars-${order.id}" class="flex space-x-1">
                            ${[1, 2, 3, 4, 5].map(star => `
                                <i class="fas fa-star text-gray-400 cursor-pointer text-2xl" data-value="${star}" onclick="selectStar(${order.id}, ${star})"></i>
                            `).join('')}
                        </div>
                        <input type="hidden" id="rating-${order.id}" name="rating" autocomplete="off">
                    </div>
                    <div class="mb-4">
                        <label for="message-${order.id}" class="block text-sm font-medium mb-1">Message (optional)</label>
                        <textarea id="message-${order.id}" name="message" rows="3" class="w-full border rounded p-2 focus:ring-amber-500 focus:border-amber-500" autocomplete="off"></textarea>
                    </div>
                    <button type="submit" class="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 cursor-pointer">Submit Feedback</button>
                </form>
            </div>
        `;
    }
    return '';
}

function selectStar(orderId, starValue) {
    const stars = document.querySelectorAll(`#stars-${orderId} .fa-star`);
    stars.forEach((star, index) => {
        if (index < starValue) {
            star.classList.remove('text-gray-400');
            star.classList.add('text-amber-500');
        } else {
            star.classList.remove('text-amber-500');
            star.classList.add('text-gray-400');
        }
    });
    document.getElementById(`rating-${orderId}`).value = starValue;
}

async function submitFeedback(event, orderId) {
    event.preventDefault();
    const rating = document.getElementById(`rating-${orderId}`).value;
    const message = document.getElementById(`message-${orderId}`).value;

    try {
        const res = await fetch('http://localhost/tabletop/backend/feedback.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'create_feedback',
                order_id: orderId,
                rating,
                message
            })
        });
        const data = await res.json();
        if (data.success) {
            alert('Thank you for your feedback!');
            document.getElementById(`feedback-${orderId}`).innerHTML = '<p class="text-green-600">Your feedback has been submitted. Thank you!</p>';
        } else {
            alert(data.error || 'Failed to submit feedback.');
        }
    } catch (error) {
        alert('An error occurred while submitting feedback.');
    }
}

async function fetchOrders() {
    const ordersContainer = document.getElementById('orders');
    ordersContainer.innerHTML = '<div class="text-center py-8 text-gray-400">Loading orders...</div>';
    try {
        const res = await fetch('http://localhost/tabletop/backend/order.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'get_orders' })
        });
        const text = await res.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            ordersContainer.innerHTML = '<div class="text-center py-12"><p class="text-red-600">Server error: Invalid response</p></div>';
            return;
        }
        if (data.error) {
            ordersContainer.innerHTML = `<div class='text-center py-12'><p class='text-red-600'>${data.error}</p></div>`;
            return;
        }
        // Show reservations if present
        if (Array.isArray(data.reservations) && data.reservations.length > 0) {
            const reservationsHTML = data.reservations.map(r => `
                <div class='mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200'>
                    <h3 class='font-bold text-lg mb-2 flex items-center gap-2'><i class='fas fa-chair'></i> Table Reservation</h3>
                    <div class='mb-1'><b>Table Number:</b> ${r.table_number}</div>
                    <div class='mb-1'><b>Date & Time:</b> ${new Date(r.reservation_time).toLocaleString()}</div>
                    <div><b>Status:</b> <span class='px-2 py-1 rounded text-sm ${r.status==='confirmed'?'bg-green-100 text-green-800':r.status==='cancelled'?'bg-red-100 text-red-800':'bg-yellow-100 text-yellow-800'}'>${r.status}</span></div>
                </div>
            `).join('');
            ordersContainer.innerHTML = reservationsHTML;
        } else {
            ordersContainer.innerHTML = '';
        }
        // Sort orders by descending order of ID
        data.orders.sort((a, b) => b.id - a.id);
        // Show orders
        if (!Array.isArray(data.orders) || data.orders.length === 0) {
            ordersContainer.innerHTML += '<div class="text-center py-12"><p class="text-gray-500">No orders found</p></div>';
            return;
        }
        data.orders.forEach(order => {
            const div = document.createElement('div');
            div.className = 'bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow mb-6';
            div.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="font-bold text-lg">Order #${order.id}</h3>
                        <p class="text-sm text-gray-500 mt-1">Ordered on: ${new Date(order.created_at).toLocaleString()}</p>
                        <p class="text-sm text-gray-700 mt-1"><b>Address:</b> ${order.address}</p>
                    </div>
                    ${renderBookingStatus(order)}
                </div>
                <div class="mb-2">
                    <b>Items:</b>
                    <ul class="list-disc ml-6 mt-1">
                        ${order.items.map(item => `<li>${item.name} x${item.quantity} <span class='text-gray-500'>(₹${item.price})</span></li>`).join('')}
                    </ul>
                </div>
                <div class="flex justify-between items-center mt-4">
                    <p class="text-xl font-bold text-amber-600">₹${order.total_price}</p>
                    <span class="text-sm text-gray-500">${order.items.length} item(s)</span>
                </div>
                ${renderFeedbackUI(order)}
            `;
            ordersContainer.appendChild(div);
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        ordersContainer.innerHTML = '<div class="text-center py-12"><p class="text-gray-500">Failed to load orders</p></div>';
    }
}
document.addEventListener('DOMContentLoaded', fetchOrders);