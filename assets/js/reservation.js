// Reservation functionality

// User-friendly toast feedback
function showToast(msg, type = 'info') {
    alert(msg);
}

// Create a reservation
async function createReservation(tableNumber, reservationTime) {
    if (!tableNumber || !reservationTime) {
        showToast('Table number and reservation time are required.', 'error');
        return;
    }
    const btn = document.getElementById('reserveBtn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Reserving...';
    }
    try {
        const response = await fetch('../backend/reservation.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'create_reservation', table_number: tableNumber, reservation_time: reservationTime })
        });
        const data = await response.json();
        if (data.error) {
            showToast(data.error, 'error');
        } else {
            showToast('Reservation created successfully!', 'success');
            // Optionally redirect or update UI
        }
    } catch (error) {
        showToast('Error creating reservation.', 'error');
    }
    if (btn) {
        btn.disabled = false;
        btn.textContent = 'Reserve';
    }
}

// Example usage
// createReservation(5, '2025-04-20 19:00:00');