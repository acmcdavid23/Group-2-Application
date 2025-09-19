const api = (path, opts) => fetch(path, opts).then(r=>{ if(!r.ok) return r.json().then(e=>{throw e}); return r.json(); });

// Calendar state
let currentDate = new Date(2025, 8, 1); // September 2025
let events = [];
let customEvents = []; // Separate array for custom events
let editingEvent = null; // Track which event we're editing

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
let deleteEvent = document.getElementById('deleteEvent');
let notesTextarea = document.getElementById('notesTextarea');
let todoBtn = document.getElementById('todoBtn');

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
    
    todoBtn.addEventListener('click', () => {
        window.location.href = 'todo.html';
    });
    
    cancelEvent.addEventListener('click', () => {
        closeEventModal();
    });
    
    saveEvent.addEventListener('click', async () => {
        await saveEventToCalendar();
    });
    
    deleteEvent.addEventListener('click', async () => {
        await deleteEventFromCalendar();
    });
    
    // Notes functionality
    notesTextarea.addEventListener('input', () => {
        saveNotes();
    });
    
    // Initial render
    loadCustomEvents(); // Load saved custom events first
    loadNotes(); // Load saved notes
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
    
    // Combine server events and custom events
    const allEvents = [...events, ...customEvents];
    const dayEvents = allEvents.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate.toDateString() === date.toDateString();
    });
    
    dayEvents.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = `event ${event.extendedProps?.type || 'custom'}`;
        eventElement.textContent = event.title;
        eventElement.title = event.title;
        
        // Apply custom color if set
        if (event.color) {
            eventElement.style.backgroundColor = event.color;
        }
        
        eventElement.addEventListener('click', (e) => {
            e.stopPropagation();
            editEvent(event);
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

// Load custom events from localStorage
function loadCustomEvents() {
    try {
        const saved = localStorage.getItem('calendar-custom-events');
        if (saved) {
            customEvents = JSON.parse(saved);
        }
    } catch (error) {
        console.error('Failed to load custom events:', error);
        customEvents = [];
    }
}

// Save custom events to localStorage
function saveCustomEvents() {
    try {
        localStorage.setItem('calendar-custom-events', JSON.stringify(customEvents));
    } catch (error) {
        console.error('Failed to save custom events:', error);
    }
}

// Load notes from localStorage
function loadNotes() {
    try {
        const saved = localStorage.getItem('calendar-notes');
        if (saved) {
            notesTextarea.value = saved;
        }
    } catch (error) {
        console.error('Failed to load notes:', error);
    }
}

// Save notes to localStorage
function saveNotes() {
    try {
        localStorage.setItem('calendar-notes', notesTextarea.value);
    } catch (error) {
        console.error('Failed to save notes:', error);
    }
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
    editingEvent = null;
    eventForm.reset();
    if (dateStr) {
        eventForm.date.value = dateStr;
    }
    
    // Reset to default color
    document.getElementById('eventColor').value = '#3b82f6';
    
    // Hide delete button for new events
    deleteEvent.style.display = 'none';
    
    // Update modal title
    document.querySelector('.modal-header h3').textContent = 'Add Event';
    
    eventModal.setAttribute('aria-hidden', 'false');
}

function editEvent(event) {
    editingEvent = event;
    
    // Fill form with event data
    eventForm.title.value = event.title;
    eventForm.date.value = event.start.split('T')[0];
    
    if (event.start.includes('T')) {
        eventForm.time.value = event.start.split('T')[1].substring(0, 5);
    }
    
    if (event.extendedProps?.description) {
        eventForm.description.value = event.extendedProps.description;
    }
    
    // Set color
    if (event.color) {
        document.getElementById('eventColor').value = event.color;
    } else {
        document.getElementById('eventColor').value = '#3b82f6';
    }
    
    // Show delete button for existing events
    deleteEvent.style.display = 'inline-block';
    
    // Update modal title
    document.querySelector('.modal-header h3').textContent = 'Edit Event';
    
    eventModal.setAttribute('aria-hidden', 'false');
}

function closeEventModal() {
    eventModal.setAttribute('aria-hidden', 'true');
    eventForm.reset();
    editingEvent = null;
    deleteEvent.style.display = 'none';
}

async function saveEventToCalendar() {
    const formData = new FormData(eventForm);
    const title = formData.get('title');
    const date = formData.get('date');
    const time = formData.get('time');
    const description = formData.get('description');
    const color = formData.get('color');
    
    if (!title || !date) {
        alert('Title and date are required');
        return;
    }
    
    const startDateTime = time ? `${date}T${time}` : date;
    
    if (editingEvent) {
        // Update existing event
        editingEvent.title = title;
        editingEvent.start = startDateTime;
        editingEvent.color = color;
        editingEvent.extendedProps = {
            ...editingEvent.extendedProps,
            description: description
        };
        
        // Update in customEvents array if it's a custom event
        if (editingEvent.extendedProps?.type === 'custom') {
            const index = customEvents.findIndex(e => e.id === editingEvent.id);
            if (index > -1) {
                customEvents[index] = editingEvent;
            }
        }
    } else {
        // Create new event
        const event = {
            id: `custom-${Date.now()}`,
            title: title,
            start: startDateTime,
            color: color,
            extendedProps: {
                type: 'custom',
                description: description
            }
        };
        customEvents.push(event);
    }
    
    // Save to localStorage
    saveCustomEvents();
    
    renderCalendar();
    closeEventModal();
    
    // TODO: Save to server if you want persistence
    // await api('/api/events', { method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(event) });
}

async function deleteEventFromCalendar() {
    if (!editingEvent) return;
    
    if (!confirm(`Are you sure you want to delete "${editingEvent.title}"?`)) {
        return;
    }
    
    // Only allow deletion of custom events (not server postings)
    if (editingEvent.extendedProps?.type === 'custom') {
        // Remove from customEvents array
        const index = customEvents.findIndex(e => e.id === editingEvent.id);
        if (index > -1) {
            customEvents.splice(index, 1);
        }
        
        // Save to localStorage
        saveCustomEvents();
    } else {
        alert('Cannot delete job postings. They are managed by the server.');
        return;
    }
    
    renderCalendar();
    closeEventModal();
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