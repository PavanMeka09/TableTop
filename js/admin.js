// Admin-specific functionality

async function fetchAllOrders() {
    try {
        const response = await fetch('backend/admin.php', {
            method: 'GET',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'get_all_orders' })
        })
        const data = await response.json();
        if (data.error) {
            alert(data.error);
        } else {
            renderOrders(data);
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
}

// Render orders
function renderOrders(orders) {
    const ordersContainer = document.getElementById('ordersContainer');
    ordersContainer.innerHTML = '';
    orders.forEach(order => {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'p-4 border rounded shadow';
        orderDiv.innerHTML = `
            <h2 class="text-xl font-semibold">Order #${order.id}</h2>
            <p>Status: ${order.status}</p>
            <p>Total Price: ₹${order.total_price}</p>
            <p>Created At: ${order.created_at}</p>
        `;
        ordersContainer.appendChild(orderDiv);
    });
}

async function fetchAllReservations() {
    try {
        const response = await fetch('backend/admin.php', {
            method: 'GET',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'get_all_reservations' })
        })
        const data = await response.json();
        if (data.error) {
            alert(data.error);
        } else {
            renderReservations(data);
        }
    } catch (error) {
        console.error('Error fetching reservations:', error);
    }
}

// Render reservations
function renderReservations(reservations) {
    const reservationsContainer = document.getElementById('reservationsContainer');
    reservationsContainer.innerHTML = '';
    reservations.forEach(reservation => {
        const reservationDiv = document.createElement('div');
        reservationDiv.className = 'p-4 border rounded shadow';
        reservationDiv.innerHTML = `
            <h2 class="text-xl font-semibold">Reservation #${reservation.id}</h2>
            <p>Table Number: ${reservation.table_number}</p>
            <p>Reservation Time: ${reservation.reservation_time}</p>
            <p>Status: ${reservation.status}</p>
        `;
        reservationsContainer.appendChild(reservationDiv);
    });
}

async function fetchAllFeedback() {
    try {
        const response = await fetch('../backend/feedback.php', {
            method: 'GET',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'get_feedback' })
        })
        const data = await response.json();
        if (data.error) {
            alert(data.error);
        } else {
            renderFeedback(data);
        }
    } catch (error) {
        console.error('Error fetching feedback:', error);
    }
}

function renderFeedback(feedback) {
    const feedbackContainer = document.getElementById('feedbackContainer');
    feedbackContainer.innerHTML = '';
    feedback.forEach(item => {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'p-4 border rounded shadow';
        feedbackDiv.innerHTML = `
            <h2 class="text-xl font-semibold">Feedback #${item.id}</h2>
            <p>User ID: ${item.user_id}</p>
            <p>Message: ${item.message}</p>
            <p>Rating: ${item.rating}</p>
            <p>Created At: ${item.created_at}</p>
        `;
        feedbackContainer.appendChild(feedbackDiv);
    });
}

fetchAllOrders();
fetchAllReservations();
fetchAllFeedback();