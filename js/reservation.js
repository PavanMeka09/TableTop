// Reservation functionality

// Create a reservation
function createReservation(data) {
  const feedbackElement = document.getElementById('feedbackMessage');
  feedbackElement.textContent = 'Creating reservation...';
  feedbackElement.className = 'text-blue-600';

  fetch('/backend/reservation.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(response => {
      if (response.success) {
        feedbackElement.textContent = 'Reservation created successfully!';
        feedbackElement.className = 'text-green-600';
      } else {
        feedbackElement.textContent = response.error || 'Failed to create reservation';
        feedbackElement.className = 'text-red-600';
      }
    })
    .catch(() => {
      feedbackElement.textContent = 'Error creating reservation.';
      feedbackElement.className = 'text-red-600';
    });
}

// Example usage
// createReservation({ tableNumber: 5, reservationTime: '2025-04-20 19:00:00' });