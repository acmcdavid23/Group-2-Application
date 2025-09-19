const api = (path, opts) => fetch(path, opts).then(r=>{ if(!r.ok) return r.json().then(e=>{throw e}); return r.json(); });

// Calendar state
let currentDate = new Date(2025, 8, 1); // September 2025
let events = [];

// DOM elements
let calendarTitle = document.getElementById('calendarTitle');
let calendarGrid = document.getElementById('calendarGrid');
let prevMonthBtn = document.getElementById('prevMonth');
let nextMonthBtn = document.getElementById('nextMonth');
let todayBtn = document.getElementById('todayBtn');
let addEventBtn = document.getElementById('addEventBtn');
let eventModal = document.getElementById('eventModal');
let eventForm = document.getElementById('eventForm');
let cancelEvent = document.getElementById('cancelEvent');
let saveEvent = document.getElementById('saveEvent');

// Initialize calendar
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing custom calendar...');
    
    // Event listeners
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        renderCalendar();
    });
    
    addEventBtn.addEventListener('click', () => {
        openEventModal();
    });
    
    cancelEvent.addEventListener('click', () => {
        closeEventModal();
    });
    
    saveEvent.addEventListener('click', async () => {
        await saveEventToCalendar();
    });
    
    // Initial render
    renderCalendar();
    loadEvents();
});

// Render the calendar
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update title
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    calendarTitle.textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    // Clear grid
    calendarGrid.innerHTML = '';
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
        const prevMonth = new Date(year, month, -startingDayOfWeek + i + 1);
        const dayElement = createDayElement(prevMonth.getDate(), true, prevMonth);
        calendarGrid.appendChild(dayElement);
    }
    
    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayElement = createDayElement(day, false, date);
        calendarGrid.appendChild(dayElement);
    }
    
    // Add empty cells to complete the grid (6 weeks = 42 cells)
    const totalCells = startingDayOfWeek + daysInMonth;
    const remainingCells = 42 - totalCells;
    
    for (let i = 1; i <= remainingCells; i++) {
        const nextMonth = new Date(year, month + 1, i);
        const dayElement = createDayElement(i, true, nextMonth);
        calendarGrid.appendChild(dayElement);
    }
}

// Create a day element
function createDayElement(dayNumber, isOtherMonth, date) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    if (isOtherMonth) {
        dayElement.classList.add('other-month');
    }
    
    // Check if it's today
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
        dayElement.classList.add('today');
    }
    
    // Day number
    const dayNumberElement = document.createElement('div');
    dayNumberElement.className = 'day-number';
    dayNumberElement.textContent = dayNumber;
    dayElement.appendChild(dayNumberElement);
    
    // Events for this day
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'day-events';
    
    const dayEvents = events.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate.toDateString() === date.toDateString();
    });
    
    dayEvents.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = `event ${event.extendedProps?.type || 'custom'}`;
        eventElement.textContent = event.title;
        eventElement.title = event.title;
        eventElement.addEventListener('click', (e) => {
            e.stopPropagation();
            showEventDetails(event);
        });
        eventsContainer.appendChild(eventElement);
    });
    
    dayElement.appendChild(eventsContainer);
    
    // Click to add event
    dayElement.addEventListener('click', () => {
        if (!isOtherMonth) {
            openEventModal(date.toISOString().split('T')[0]);
        }
    });
    
    return dayElement;
}

// Load events from server
async function loadEvents() {
    try {
        const postings = await api('/api/postings');
        events = postings
            .filter(p => p.dueDate)
            .map(p => ({
                id: `posting-${p.id}`,
                title: `${p.title} - ${p.company}`,
                start: p.dueDate,
                extendedProps: {
                    type: 'posting',
                    posting: p
                }
            }));
        
        renderCalendar(); // Re-render to show events
    } catch (error) {
        console.error('Failed to load events:', error);
    }
}

// Modal functions
function openEventModal(dateStr = null) {
    eventForm.reset();
    if (dateStr) {
        eventForm.date.value = dateStr;
    }
    eventModal.setAttribute('aria-hidden', 'false');
}

function closeEventModal() {
    eventModal.setAttribute('aria-hidden', 'true');
    eventForm.reset();
}

async function saveEventToCalendar() {
    const formData = new FormData(eventForm);
    const title = formData.get('title');
    const date = formData.get('date');
    const time = formData.get('time');
    const description = formData.get('description');
    
    if (!title || !date) {
        alert('Title and date are required');
        return;
    }
    
    const startDateTime = time ? `${date}T${time}` : date;
    
    const event = {
        id: `custom-${Date.now()}`,
        title: title,
        start: startDateTime,
        extendedProps: {
            type: 'custom',
            description: description
        }
    };
    
    events.push(event);
    renderCalendar();
    closeEventModal();
    
    // TODO: Save to server if you want persistence
    // await api('/api/events', { method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(event) });
}

function showEventDetails(event) {
    const props = event.extendedProps;
    let details = `Title: ${event.title}\n`;
    details += `Date: ${new Date(event.start).toLocaleDateString()}\n`;
    
    if (props.type === 'posting') {
        details += `Company: ${props.posting.company}\n`;
        details += `URL: ${props.posting.url || 'N/A'}\n`;
        details += `Status: ${props.posting.status}`;
    } else if (props.description) {
        details += `Description: ${props.description}`;
    }
    
    alert(details);
}