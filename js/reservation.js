document.getElementById('mobile-menu-button').addEventListener('click', function() {
  const mobileMenu = document.getElementById('mobile-menu');
  mobileMenu.classList.toggle('hidden');
});

// Time slots config
// Each slot is now an object with start and end
const TIME_SLOTS = [
  { start: '18:00', end: '19:00' },
  { start: '19:00', end: '20:00' },
  { start: '20:00', end: '21:00' },
  { start: '21:00', end: '22:00' }
];
const TABLE_COUNT = 10;
let selectedSlot = null;
let selectedTable = null;
let bookedTablesBySlot = {};
let bookedTablesByTime = {}; // Added to handle the API response format

// Convert 24-hour time to 12-hour format
function convertTo12HourFormat(time) {
  const [hour, minute] = time.split(':');
  const hourInt = parseInt(hour);
  const period = hourInt >= 12 ? 'PM' : 'AM';
  const hour12 = hourInt % 12 || 12;
  return `${hour12}:${minute} ${period}`;
}

function renderTimeSlots() {
  const container = document.getElementById('timeSlots');
  container.innerHTML = '';
  TIME_SLOTS.forEach(slot => {
      const slotKey = slot.start + '-' + slot.end;
      // Check time with and without seconds
      const timeKey = slot.start + ':00';
      const timeKeyNoSeconds = slot.start;
      
      // Check if the time slot is fully booked
      const bookedTables = bookedTablesByTime[timeKey] || bookedTablesByTime[timeKeyNoSeconds] || [];
      const isFullyBooked = bookedTables.length === TABLE_COUNT;
      
      const btn = document.createElement('button');
      btn.className = 'bg-white p-3 rounded-lg shadow text-center hover:shadow-md text-base w-44 cursor-pointer transition-all duration-200';
      btn.textContent = `${convertTo12HourFormat(slot.start)} to ${convertTo12HourFormat(slot.end)}`;
      btn.dataset.slot = slotKey;
      btn.dataset.timeKey = timeKey;
      btn.disabled = isFullyBooked;
      
      if (isFullyBooked) {
          btn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-gray-100');
          btn.innerHTML += '<div class="text-red-600 text-xs mt-1">Booked</div>';
      } else if (selectedSlot && selectedSlot.start === slot.start && selectedSlot.end === slot.end) {
          btn.classList.add('border-2', 'border-amber-600', 'bg-amber-50');
      }
      
      if (!isFullyBooked) {
          btn.onclick = () => selectTimeSlot(slot, timeKey);
      }
      container.appendChild(btn);
  });
}

function fetchBookedTimes() {
  const date = document.getElementById('reservationDate').value;
  fetch('http://localhost/tabletop/backend/reservation.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ action: 'get_booked_times', date })
  })
  .then(res => res.json())
  .then(data => {
      console.log('Received booking data:', data);
      
      // Store both formats of data for compatibility
      bookedTablesByTime = data.booked_tables_by_time || {};
      bookedTablesBySlot = data.booked_tables_by_slot || {};
      
      renderTimeSlots();
  })
  .catch(error => {
      console.error('Error fetching booked times:', error);
      bookedTablesByTime = {};
      bookedTablesBySlot = {};
      renderTimeSlots();
  });
}

function selectTimeSlot(slot, timeKey) {
  selectedSlot = slot;
  selectedSlot.timeKey = timeKey; // Store the time key for later use
  document.getElementById('tableSelection').classList.remove('hidden');
  document.getElementById('confirmationMsg').classList.add('hidden');
  
  // Update selected time visual state
  const timeButtons = document.querySelectorAll('#timeSlots button');
  timeButtons.forEach(button => {
      if (button.dataset.slot === slot.start + '-' + slot.end) {
          button.classList.add('border-2', 'border-amber-600', 'bg-amber-50');
      } else {
          button.classList.remove('border-2', 'border-amber-600', 'bg-amber-50');
      }
  });
  
  renderTables();
}

function renderTables() {
  const grid = document.getElementById('tablesGrid');
  grid.innerHTML = '';
  
  if (!selectedSlot) return;
  
  // Get booked tables for this time slot
  const timeKey = selectedSlot.timeKey;
  const bookedTables = bookedTablesByTime[timeKey] || [];
  
  for (let i = 1; i <= TABLE_COUNT; i++) {
      const btn = document.createElement('button');
      btn.className = 'bg-white p-4 rounded-lg shadow text-center hover:shadow-md w-36 h-24 flex flex-col items-center justify-center cursor-pointer transition-all duration-200';
      
      const isBooked = bookedTables.map(Number).includes(Number(i));
      btn.disabled = isBooked;
      btn.dataset.table = i;
      
      if (isBooked) {
          btn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-gray-100');
          btn.innerHTML = `
              <h3 class="font-bold">Table ${i}</h3>
              <span class="text-red-600 text-sm">Booked</span>
          `;
      } else if (selectedTable === i) {
          btn.classList.add('border-2', 'border-amber-600', 'bg-amber-50');
          btn.innerHTML = `
              <h3 class="font-bold">Table ${i}</h3>
              <span class="text-green-600 text-sm">Selected</span>
          `;
      } else {
          btn.innerHTML = `
              <h3 class="font-bold">Table ${i}</h3>
              <span class="text-green-600 text-sm">Available</span>
          `;
      }
      
      if (!isBooked) {
          btn.onclick = () => showConfirmation(i);
      }
      grid.appendChild(btn);
  }
}

function showConfirmation(tableNumber) {
  const date = document.getElementById('reservationDate').value;
  if (!date || !selectedSlot) return;
  
  const formattedDate = new Date(date).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
  });
  
  const confirmMessage = `Are you sure you want to book Table ${tableNumber} on ${formattedDate} from ${convertTo12HourFormat(selectedSlot.start)} to ${convertTo12HourFormat(selectedSlot.end)}?`;
  
  if (window.confirm(confirmMessage)) {
      selectedTable = tableNumber;
      renderTables(); // Update visual selection
      bookTable(tableNumber);
  }
}

async function bookTable(tableNumber) {
  const date = document.getElementById('reservationDate').value;
  if (!date || !selectedSlot) return;
  
  const reservation_start = date + ' ' + selectedSlot.start + ':00';
  const reservation_end = date + ' ' + selectedSlot.end + ':00';
  
  const data = new URLSearchParams({
      action: 'create_reservation',
      table_number: tableNumber,
      reservation_start,
      reservation_end
  });
  
  document.getElementById('tableFeedback').textContent = 'Booking table...';
  
  try {
      const response = await fetch('http://localhost/tabletop/backend/reservation.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: data
      });
      
      const result = await response.json();
      
      if (result.success) {
          const formattedDate = new Date(date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
          });
          
          document.getElementById('confirmationText').innerHTML = `
              Your reservation for Table ${tableNumber} on ${formattedDate} from ${convertTo12HourFormat(selectedSlot.start)} to ${convertTo12HourFormat(selectedSlot.end)} has been confirmed!
              <div class="mt-4">
                  <button onclick="startNewReservation()" class="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors mt-2">
                      Make Another Reservation
                  </button>
              </div>
          `;
          
          document.getElementById('confirmationMsg').classList.remove('hidden');
          document.getElementById('tableFeedback').textContent = '';
          document.getElementById('tableSelection').classList.add('hidden');
          
          // Update the booked tables data
          const timeKey = selectedSlot.timeKey;
          if (!bookedTablesByTime[timeKey]) {
              bookedTablesByTime[timeKey] = [];
          }
          bookedTablesByTime[timeKey].push(tableNumber);
          
      } else {
          document.getElementById('tableFeedback').textContent = result.error || 'Failed to make reservation';
          fetchBookedTimes(); // Refresh data in case of errors
      }
  } catch (error) {
      document.getElementById('tableFeedback').textContent = 'Failed to make reservation';
      fetchBookedTimes(); // Refresh data in case of errors
  }
}

function startNewReservation() {
  selectedSlot = null;
  selectedTable = null;
  document.getElementById('confirmationMsg').classList.add('hidden');
  document.getElementById('tableSelection').classList.add('hidden');
  fetchBookedTimes();
}

document.addEventListener('DOMContentLoaded', function() {
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('reservationDate');
  dateInput.min = today;
  dateInput.value = today;
  dateInput.addEventListener('change', function() {
      selectedSlot = null;
      selectedTable = null;
      document.getElementById('tableSelection').classList.add('hidden');
      document.getElementById('confirmationMsg').classList.add('hidden');
      fetchBookedTimes();
  });
  window.startNewReservation = startNewReservation;
  fetchBookedTimes();
});