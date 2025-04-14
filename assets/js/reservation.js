// Reservation functionality

// Create a reservation
async function createReservation(tableNumber, reservationTime) {
    try {
        const response = await fetch('../backend/reservation.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'create_reservation', table_number: tableNumber, reservation_time: reservationTime })
        });
        const data = await response.json();
        if (data.error) {
            alert(data.error);
        } else {
            alert('Reservation created successfully!');
            console.log(data); // Replace with redirect or UI update
        }
    } catch (error) {
        console.error('Error creating reservation:', error);
    }
}

// Example usage
// createReservation(5, '2025-04-20 19:00:00');