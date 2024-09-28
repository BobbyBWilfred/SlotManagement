const slots = {
  '2024-09-28': [
      { time: '9:00 AM - 9:15 AM', booked: false },
      { time: '9:15 AM - 9:30 AM', booked: false },
      { time: '9:30 AM - 9:45 AM', booked: false },
      { time: '9:45 AM - 10:00 AM', booked: false },
      { time: '10:00 AM - 10:15 AM', booked: false },
      { time: '10:15 AM - 10:30 AM', booked: false },
      { time: '10:30 AM - 10:45 AM', booked: false },
      { time: '10:45 AM - 11:00 AM', booked: false },
      { time: '11:00 AM - 11:15 AM', booked: false },
      { time: '11:15 AM - 11:30 AM', booked: false },
      { time: '11:30 AM - 11:45 AM', booked: false },
      { time: '5:50 PM - 6:30 PM', booked: false }
  ],
  '2024-09-29': [
      { time: '9:00 AM - 9:15 AM', booked: false },
      { time: '9:15 AM - 9:30 AM', booked: false },
      { time: '9:30 AM - 9:45 AM', booked: false },
      { time: '9:45 AM - 10:00 AM', booked: false },
      { time: '10:00 AM - 10:15 AM', booked: false },
      { time: '10:15 AM - 10:30 AM', booked: false },
      { time: '10:30 AM - 10:45 AM', booked: false },
      { time: '10:45 AM - 11:00 AM', booked: false }
  ],
  '2024-09-30': [
      { time: '9:00 AM - 9:15 AM', booked: false },
      { time: '9:15 AM - 9:30 AM', booked: false },
      { time: '9:30 AM - 9:45 AM', booked: false },
      { time: '9:45 AM - 10:00 AM', booked: false },
      { time: '10:00 AM - 10:15 AM', booked: false },
      { time: '10:15 AM - 10:30 AM', booked: false },
      { time: '10:30 AM - 10:45 AM', booked: false },
      { time: '10:45 AM - 11:00 AM', booked: false }
  ]
};

document.addEventListener('DOMContentLoaded', function() {
    // Ensure the DOM is fully loaded before accessing elements

    let selectedSlot = null;
    let selectedDate = null;
    let db;

    const request = indexedDB.open('SlotBookingDB', 1);

    request.onerror = function(event) {
        console.log('Database error:', event.target.errorCode);
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        loadBookedSlots();
    };

    request.onupgradeneeded = function(event) {
        const db = event.target.result;
        db.createObjectStore('bookings', { keyPath: 'id', autoIncrement: true });
    };

    function loadBookedSlots() {
        const transaction = db.transaction(['bookings'], 'readonly');
        const objectStore = transaction.objectStore('bookings');

        const request = objectStore.getAll();

        request.onsuccess = function(event) {
            const bookings = event.target.result;
            bookings.forEach(booking => {
                const date = booking.date;
                const time = booking.time;
                const slot = slots[date].find(slot => slot.time === time);
                if (slot) {
                    slot.booked = true;
                }
            });
            loadSlots(selectedDate || '2024-09-28'); 
        };
    }

    document.getElementById('dateSelect').addEventListener('change', function() {
        selectedDate = this.value;
        loadSlots(selectedDate);
    });

    function loadSlots(date) {
        const slotBox = document.getElementById('slotBox');
        slotBox.innerHTML = '';
        if (date) {
            slots[date].forEach((slot) => {
                const slotElement = document.createElement('div');
                slotElement.classList.add('slot');
                slotElement.textContent = slot.time;
                if (slot.booked) {
                    slotElement.classList.add('booked');
                    slotElement.onclick = () => {
                        alert('This slot is already booked!');
                    };
                } else {
                    slotElement.onclick = () => {
                        if (selectedSlot) {
                            selectedSlot.classList.remove('selected');
                        }
                        selectedSlot = slotElement;
                        selectedSlot.classList.add('selected');
                    };
                }
                slotBox.appendChild(slotElement);
            });
        }
    }

    document.getElementById('bookingForm').addEventListener('submit', function(event) {
        event.preventDefault();
        console.log("Form submitted");

        if (!selectedSlot) {
            alert('Please select a time slot.');
            console.log("No time slot selected");
            return;
        }

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const regno = document.getElementById('regno').value;

        const bookingData = {
            name,
            email,
            phone,
            regno,
            time: selectedSlot.textContent,
            date: selectedDate
        };

        const transaction = db.transaction(['bookings'], 'readwrite');
        const objectStore = transaction.objectStore('bookings');

        const request = objectStore.add(bookingData);
        console.log("Booking data:", bookingData);

        request.onsuccess = function() {
            console.log("Slot booked successfully:", selectedSlot.textContent);
            selectedSlot.classList.add('booked');
            selectedSlot.onclick = () => {
                alert('This slot is already booked!');
            };

            document.getElementById('successMessage').style.display = 'block';
            console.log("Success message displayed.");

            console.log("Scheduling reminder email...");
            scheduleReminderEmail(name, email, selectedDate, selectedSlot.textContent);
        };

        request.onerror = function() {
            alert('Error booking the slot. Please try again.');
            console.error('Error adding booking to the database:', event.target.error);
        };
    });

    function scheduleReminderEmail(name, email, date, time) {
        const [slotStartTime] = time.split(' - ');
        const bookingTime = new Date(`${date} ${slotStartTime}`);

        const reminderTime = new Date(bookingTime.getTime() - 10 * 60000); 

        const now = new Date();
        const delay = reminderTime - now;

        console.log(`Now: ${now}`);
        console.log(`Booking Time: ${bookingTime}`);
        console.log(`Reminder Time: ${reminderTime}`);
        console.log(`Delay: ${delay} milliseconds`);

        if (delay > 0) {
            console.log(`Reminder set to send in ${Math.round(delay / 1000)} seconds.`);
            setTimeout(() => {
                sendReminderEmail(name, email, date, time);
            }, delay);
        } else {
            console.warn("Reminder time has already passed, won't send email.");
        }
    }

    function sendReminderEmail(name, email, date, time) {
        const templateParams = {
            from_name: name,
            user_name: name,
            interview_date: date,
            interview_time: time,
            reply_to: email
        };

        emailjs.send('service_7whaieh', 'template_4abcegc', templateParams)
            .then((response) => {
                console.log('Reminder email sent successfully!', response);
            }, (error) => {
                console.error('Failed to send reminder email. Error:', error);
            });
    }

});
