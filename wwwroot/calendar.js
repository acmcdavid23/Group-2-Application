console.log('Calendar.js is loading...');
const api = (path, opts) => fetch(path, opts).then(r=>{ if(!r.ok) return r.json().then(e=>{throw e}); return r.json(); });

// Body scroll lock functions
function lockBodyScroll() {
  document.body.classList.add('scroll-locked');
}

function unlockBodyScroll() {
  document.body.classList.remove('scroll-locked');
}

// Cleanup function to unlock scroll when leaving the page
window.addEventListener('beforeunload', function() {
  unlockBodyScroll();
});

// Get status color for styling
function getStatusColor(status) {
  const statusColors = {
    'interested': '#3b82f6',      // Blue
    'applied': '#8b5cf6',         // Purple
    'phone_screen': '#f59e0b',    // Orange
    'interview': '#ef4444',       // Red
    'offer': '#10b981',          // Green
    'rejected': '#6b7280'        // Gray
  };
  return statusColors[status] || '#6b7280';
}

// Email and SMS functionality for calendar events
async function sendEventEmailReminder(event) {
  const subject = `Reminder: ${event.title}`;
  const body = `You have an upcoming event: ${event.title} on ${event.date}`;
  
  // Get current user's email
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const emailAddress = currentUser.email || '';
  
  if (!emailAddress) {
    alert('No email address found. Please log in with an email address.');
    return;
  }
  
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: emailAddress,
        subject: subject,
        body: body
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Event reminder email sent successfully!');
    } else {
      alert('Failed to send email: ' + result.error);
    }
  } catch (error) {
    console.error('Error sending email:', error);
    alert('Failed to send email. Please try again.');
  }
}



function sendEventEmailJSReminder(event) {
  const templateParams = {
    to_email: 'user@example.com',
    subject: `Event Reminder: ${event.title}`,
    message: `You have an upcoming event: ${event.title} on ${event.date}`
  };
  
  emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
    .then(response => {
      console.log('Event reminder email sent!', response);
      alert('Event reminder email sent successfully!');
    })
    .catch(error => {
      console.log('Error:', error);
      alert('Failed to send event reminder email. Please try again.');
    });
}

// Calendar state
let currentDate = new Date(2025, 8, 1); // September 2025
let events = [];
let customEvents = []; // Separate array for custom events
let editingEvent = null; // Track which event we're editing

// DOM elements - will be initialized in DOMContentLoaded
let calendarTitle, calendarGrid, prevMonthBtn, nextMonthBtn, todayBtn, addEventBtn;
let eventModal, eventForm, cancelEvent, saveEvent, deleteEvent, notesTextarea, todoBtn;
let dayViewBtn, weekViewBtn, monthViewBtn;

// Current view state
let currentView = 'month';

// Initialize calendar
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing custom calendar...');
    
    // Initialize DOM elements
    calendarTitle = document.getElementById('calendarTitle');
    calendarGrid = document.getElementById('calendarGrid');
    prevMonthBtn = document.getElementById('prevMonth');
    nextMonthBtn = document.getElementById('nextMonth');
    todayBtn = document.getElementById('todayBtn');
    addEventBtn = document.getElementById('addEventBtn');
    eventModal = document.getElementById('eventModal');
    eventForm = document.getElementById('eventForm');
    cancelEvent = document.getElementById('cancelEvent');
    saveEvent = document.getElementById('saveEvent');
    deleteEvent = document.getElementById('deleteEvent');
    notesTextarea = document.getElementById('notesTextarea');
    todoBtn = document.getElementById('todoBtn');
    dayViewBtn = document.getElementById('dayViewBtn');
    weekViewBtn = document.getElementById('weekViewBtn');
    monthViewBtn = document.getElementById('monthViewBtn');
    
    // Check if elements exist
    console.log('Calendar elements:', {
        calendarTitle: !!calendarTitle,
        calendarGrid: !!calendarGrid,
        prevMonthBtn: !!prevMonthBtn,
        nextMonthBtn: !!nextMonthBtn
    });
    
    // Event listeners - only add if elements exist
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            if (currentView === 'day') {
                currentDate.setDate(currentDate.getDate() - 1);
            } else if (currentView === 'week') {
                currentDate.setDate(currentDate.getDate() - 7);
            } else {
            currentDate.setMonth(currentDate.getMonth() - 1);
            }
            renderCalendar();
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            if (currentView === 'day') {
                currentDate.setDate(currentDate.getDate() + 1);
            } else if (currentView === 'week') {
                currentDate.setDate(currentDate.getDate() + 7);
            } else {
            currentDate.setMonth(currentDate.getMonth() + 1);
            }
            renderCalendar();
        });
    }
    
    if (todayBtn) {
        todayBtn.addEventListener('click', () => {
            currentDate = new Date();
            renderCalendar();
        });
    }
    
    if (addEventBtn) {
        addEventBtn.addEventListener('click', () => {
            openEventModal();
        });
    }
    
    if (todoBtn) {
        todoBtn.addEventListener('click', () => {
            window.location.href = 'todo.html';
        });
    }
    
    // View button event listeners
    if (dayViewBtn) {
        dayViewBtn.addEventListener('click', () => {
            setView('day');
        });
    }
    
    if (weekViewBtn) {
        weekViewBtn.addEventListener('click', () => {
            setView('week');
        });
    }
    
    if (monthViewBtn) {
        monthViewBtn.addEventListener('click', () => {
            setView('month');
        });
    }
    
    if (cancelEvent) {
        cancelEvent.addEventListener('click', () => {
            closeEventModal();
        });
    }
    
    if (saveEvent) {
        saveEvent.addEventListener('click', async () => {
            await saveEventToCalendar();
        });
    }
    
    if (deleteEvent) {
        deleteEvent.addEventListener('click', async () => {
            await deleteEventFromCalendar();
        });
    }
    
    // Notes functionality
    if (notesTextarea) {
        notesTextarea.addEventListener('input', () => {
            saveNotes();
        });
    }
    
    // Get current user first
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Load user-specific custom events
    loadCustomEvents();
    loadNotes();
    
    // Only add sample events for demo users
    if (currentUser.isDemo) {
        addSampleEvents(); // Add sample events for demonstration
    }
    
    // Set initial view class
    if (calendarGrid) {
        calendarGrid.classList.add('month-view');
    }
    
    // Recurring event functionality
    const isRecurringCheckbox = document.getElementById('isRecurring');
    const recurringOptions = document.getElementById('recurringOptions');
    
    if (isRecurringCheckbox && recurringOptions) {
        isRecurringCheckbox.addEventListener('change', function() {
            if (this.checked) {
                recurringOptions.style.display = 'flex';
            } else {
                recurringOptions.style.display = 'none';
            }
        });
    }
    
    // Export functionality
    const exportEventsBtn = document.getElementById('exportEvents');
    if (exportEventsBtn) {
        exportEventsBtn.addEventListener('click', exportEvents);
    }
    
    // Help modal functionality
    const helpBtn = document.getElementById('helpBtn');
    const helpModal = document.getElementById('helpModal');
    const closeHelpModal = document.getElementById('closeHelpModal');
    
    console.log('Help button found:', helpBtn);
    console.log('Help modal found:', helpModal);
    console.log('Close button found:', closeHelpModal);
    
    if (helpBtn && helpModal && closeHelpModal) {
        console.log('Setting up help modal event listeners');
        helpBtn.addEventListener('click', function() {
            console.log('Help button clicked');
            helpModal.style.display = 'flex';
        });
        
        closeHelpModal.addEventListener('click', function() {
            console.log('Close button clicked');
            helpModal.style.display = 'none';
        });
        
        // Close modal when clicking outside
        helpModal.addEventListener('click', function(e) {
            if (e.target === helpModal) {
                helpModal.style.display = 'none';
            }
        });
    } else {
        console.log('Help modal elements not found');
    }
    
    // Ensure calendar renders
    setTimeout(() => {
        clearOldEvents(); // Clear any old/duplicate events first
        renderCalendar();
        loadEvents();
        
        // Lock scroll if starting in day view
        if (currentView === 'day') {
            lockBodyScroll();
        }
    }, 100);
});

// Set calendar view
function setView(view) {
    currentView = view;
    
    // Update button states
    if (dayViewBtn) dayViewBtn.classList.toggle('active', view === 'day');
    if (weekViewBtn) weekViewBtn.classList.toggle('active', view === 'week');
    if (monthViewBtn) monthViewBtn.classList.toggle('active', view === 'month');
    
    // Update calendar grid CSS class
    if (calendarGrid) {
        calendarGrid.classList.remove('day-view', 'week-view', 'month-view');
        calendarGrid.classList.add(`${view}-view`);
    }
    
    // Lock body scroll for day view (since it has its own scrollable area)
    if (view === 'day') {
        lockBodyScroll();
    } else {
        unlockBodyScroll();
    }
    
    // Re-render calendar
    renderCalendar();
}

// Render the calendar
function renderCalendar() {
    console.log('Rendering calendar...', currentView);
    
    if (!calendarGrid) {
        console.error('Calendar grid element not found!');
        return;
    }
    
    // Clear the calendar grid before rendering
    calendarGrid.innerHTML = '';
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update title based on current view
    if (calendarTitle) {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        if (currentView === 'day') {
            const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
            const monthName = monthNames[month];
            const day = currentDate.getDate();
            calendarTitle.textContent = `${dayName}, ${monthName} ${day}, ${year}`;
        } else if (currentView === 'week') {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            
            const startMonth = monthNames[startOfWeek.getMonth()];
            const endMonth = monthNames[endOfWeek.getMonth()];
            const startDay = startOfWeek.getDate();
            const endDay = endOfWeek.getDate();
            const startYear = startOfWeek.getFullYear();
            const endYear = endOfWeek.getFullYear();
            
            if (startMonth === endMonth && startYear === endYear) {
                calendarTitle.textContent = `${startMonth} ${startDay}-${endDay}, ${startYear}`;
            } else if (startYear === endYear) {
                calendarTitle.textContent = `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
            } else {
                calendarTitle.textContent = `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
            }
        } else {
        calendarTitle.textContent = `${monthNames[month]} ${year}`;
        }
    }
    
    // Clear grid
    calendarGrid.innerHTML = '';
    
    console.log('About to render calendar view:', currentView);
    
    if (currentView === 'month') {
        console.log('Rendering month view for:', year, month);
        renderMonthView(year, month);
    } else if (currentView === 'week') {
        console.log('Rendering week view for:', year, month);
        renderWeekView(year, month);
    } else if (currentView === 'day') {
        console.log('Rendering day view for:', year, month);
        renderDayView(year, month);
    }
    
    console.log('Calendar grid children count:', calendarGrid.children.length);
    
    // Fallback: if no children were added, create a simple grid
    if (calendarGrid.children.length === 0) {
        console.log('No calendar children found, creating fallback grid');
        createFallbackCalendar();
    }
}

// Render month view
function renderMonthView(year, month) {
    console.log('renderMonthView called with:', year, month);
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    console.log('Month details:', { firstDay, lastDay, daysInMonth, startingDayOfWeek });
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
        const prevMonth = new Date(year, month, -startingDayOfWeek + i + 1);
        const dayElement = createWeekDayElement(prevMonth);
        dayElement.classList.add('other-month');
        calendarGrid.appendChild(dayElement);
    }
    
    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayElement = createWeekDayElement(date);
        calendarGrid.appendChild(dayElement);
    }
    
    // Add empty cells to complete the grid (5 weeks = 35 cells)
    const totalCells = startingDayOfWeek + daysInMonth;
    const remainingCells = 35 - totalCells;
    
    for (let i = 1; i <= remainingCells; i++) {
        const nextMonth = new Date(year, month + 1, i);
        const dayElement = createWeekDayElement(nextMonth);
        dayElement.classList.add('other-month');
        calendarGrid.appendChild(dayElement);
    }
}

// Render week view
function renderWeekView(year, month) {
    console.log('renderWeekView called with:', year, month);
    
    // Get the current date and find the start of the week (Sunday)
    const targetDate = new Date(year, month, currentDate.getDate() || 1);
    const startOfWeek = new Date(targetDate);
    startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    
    // Create 7 day columns
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        
        // Create day container
        const dayElement = document.createElement('div');
        dayElement.className = 'week-day';
        if (dayDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // Day header
        const dayHeader = document.createElement('div');
        dayHeader.className = 'week-day-header';
        
        const dayName = document.createElement('div');
        dayName.className = 'week-day-name';
        dayName.textContent = dayNames[i];
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'week-day-number';
        dayNumber.textContent = dayDate.getDate();
        
        dayHeader.appendChild(dayName);
        dayHeader.appendChild(dayNumber);
        dayElement.appendChild(dayHeader);
        
        // Events container
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'week-events';
        
        // Get events for this day
        const allEvents = [...events, ...customEvents];
        const dayEvents = allEvents.filter(event => {
            const eventDate = new Date(event.start);
            return eventDate.toDateString() === dayDate.toDateString();
        });
        
        // Add events to this day
        dayEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = `week-event ${event.extendedProps?.type || 'custom'}`;
            eventElement.textContent = event.title;
            eventElement.title = `${event.title}\n${new Date(event.start).toLocaleTimeString()}`;
            
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
        
        // Add click event to create events
        dayElement.addEventListener('click', () => {
            openEventModal(dayDate.toISOString().slice(0, 10));
        });
        
        dayElement.appendChild(eventsContainer);
        calendarGrid.appendChild(dayElement);
    }
}

// Render day view
function renderDayView(year, month) {
    console.log('renderDayView called with:', year, month);
    
    // Get the current date
    const targetDate = new Date(year, month, currentDate.getDate() || 1);
    
    // Create custom day element for day view (no header)
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.style.cssText = `
        grid-column: 1;
        height: 500px;
        padding: 0;
        border-right: 1px solid #dadce0;
        border-bottom: 1px solid #dadce0;
        background: white;
        display: flex;
        flex-direction: column;
        cursor: default;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
    `;
    
    // Add time slots for day view
    const timeSlots = document.createElement('div');
    timeSlots.className = 'time-slots';
    timeSlots.style.cssText = `
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1px;
        padding: 4px 8px;
        overflow-y: auto;
        max-height: 450px;
        min-height: 450px;
    `;
    
    // Create hourly time slots
    for (let hour = 0; hour < 24; hour++) {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        timeSlot.style.cssText = `
            display: flex;
            align-items: center;
            min-height: 28px;
            height: 28px;
            border-bottom: 1px solid #e2e8f0;
            padding: 0;
            margin: 0;
        `;
        
        const timeLabel = document.createElement('div');
        timeLabel.style.cssText = `
            width: 80px;
            font-size: 13px;
            color: #374151;
            font-weight: 600;
            text-align: right;
            padding-right: 12px;
        `;
        timeLabel.textContent = hour === 0 ? '12:00 AM' : 
                               hour < 12 ? `${hour}:00 AM` : 
                               hour === 12 ? '12:00 PM' : 
                               `${hour - 12}:00 PM`;
        
        const timeContent = document.createElement('div');
        timeContent.style.cssText = `
            flex: 1;
            min-height: 20px;
            height: 20px;
            border-radius: 3px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            padding: 0 6px;
            margin: 0;
        `;
        
        timeContent.addEventListener('click', () => {
            const timeStr = hour.toString().padStart(2, '0') + ':00';
            openEventModal(targetDate.toISOString().split('T')[0], timeStr);
        });
        
        timeContent.addEventListener('mouseenter', () => {
            timeContent.style.backgroundColor = '#f1f5f9';
            timeContent.style.borderColor = '#cbd5e1';
            timeContent.style.transform = 'translateY(-1px)';
            timeContent.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        });
        
        timeContent.addEventListener('mouseleave', () => {
            timeContent.style.backgroundColor = '#f8fafc';
            timeContent.style.borderColor = '#e2e8f0';
            timeContent.style.transform = 'translateY(0)';
            timeContent.style.boxShadow = 'none';
        });
        
        timeSlot.appendChild(timeLabel);
        timeSlot.appendChild(timeContent);
        timeSlots.appendChild(timeSlot);
    }
    
    dayElement.appendChild(timeSlots);
    calendarGrid.appendChild(dayElement);
}

// Create week day element
function createWeekDayElement(date) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.style.cssText = `
        min-height: 120px;
        padding: 4px;
        border-right: 1px solid #dadce0;
        border-bottom: 1px solid #dadce0;
        background: white;
        display: flex;
        flex-direction: column;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
    `;
    
    // Check if it's today
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
        dayElement.style.background = '#dbeafe';
        dayElement.style.border = '2px solid #3b82f6';
        dayElement.style.boxShadow = '0 0 0 1px #3b82f6';
    }
    
    // Handle other-month styling if class is added later
    if (dayElement.classList.contains('other-month')) {
        dayElement.style.background = '#f9fafb';
        dayElement.style.color = '#9ca3af';
    }
    
    // Day number
    const dayNumberElement = document.createElement('div');
    dayNumberElement.className = 'day-number';
    dayNumberElement.textContent = date.getDate();
    dayNumberElement.style.cssText = `
        font-weight: 400;
        font-size: 13px;
        color: #3c4043;
        margin-bottom: 4px;
        padding: 4px 8px;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        align-self: flex-start;
    `;
    
    if (date.toDateString() === today.toDateString()) {
        dayNumberElement.style.background = '#1a73e8';
        dayNumberElement.style.color = 'white';
        dayNumberElement.style.fontWeight = '500';
    }
    
    dayElement.appendChild(dayNumberElement);
    
    // Events for this day
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'day-events';
    eventsContainer.style.cssText = 'flex: 1; font-size: 0.75em;';
    
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
        eventElement.style.cssText = `
            background: #3b82f6;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            margin-bottom: 2px;
            cursor: pointer;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        `;
        
        if (event.extendedProps?.type === 'posting') {
            eventElement.style.background = '#10b981';
        } else if (event.extendedProps?.type === 'custom') {
            eventElement.style.background = '#8b5cf6';
        }
        
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
    
    // Hover effects
    dayElement.addEventListener('mouseenter', () => {
        if (date.toDateString() !== today.toDateString()) {
            if (dayElement.classList.contains('other-month')) {
                dayElement.style.background = '#f3f4f6';
            } else {
                dayElement.style.background = '#f0f9ff';
            }
            dayElement.style.transform = 'scale(1.02)';
            dayElement.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        }
    });
    
    dayElement.addEventListener('mouseleave', () => {
        if (date.toDateString() !== today.toDateString()) {
            if (dayElement.classList.contains('other-month')) {
                dayElement.style.background = '#f9fafb';
            } else {
                dayElement.style.background = 'white';
            }
            dayElement.style.transform = 'scale(1)';
            dayElement.style.boxShadow = 'none';
        }
    });
    
    // Click to add event
    dayElement.addEventListener('click', () => {
        openEventModal(date.toISOString().split('T')[0]);
    });
    
    return dayElement;
}

// Fallback calendar creation
function createFallbackCalendar() {
    console.log('Creating fallback calendar');
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.innerHTML = '<div class="day-number"></div>';
        calendarGrid.appendChild(dayElement);
    }
    
    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.innerHTML = `<div class="day-number">${day}</div>`;
        calendarGrid.appendChild(dayElement);
    }
    
    // Add empty cells to complete the grid
    const totalCells = startingDayOfWeek + daysInMonth;
    const remainingCells = 42 - totalCells;
    
    for (let i = 1; i <= remainingCells; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.innerHTML = `<div class="day-number">${i}</div>`;
        calendarGrid.appendChild(dayElement);
    }
    
    console.log('Fallback calendar created with', calendarGrid.children.length, 'cells');
}

// Create a day element
function createDayElement(dayNumber, isOtherMonth, date) {
    console.log('Creating day element:', dayNumber, isOtherMonth, date);
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
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        // Ensure we have a valid user
        if (!currentUser.id && !currentUser.isDemo) {
            console.log('No valid user found, initializing empty events');
            customEvents = [];
            return;
        }
        
        const userKey = currentUser.isDemo ? 'demo_calendar_events' : `user_${currentUser.id}_calendar_events`;
        const saved = localStorage.getItem(userKey);
        if (saved) {
            customEvents = JSON.parse(saved);
            console.log(`Loaded ${customEvents.length} events for user: ${currentUser.email || 'demo'}`);
        } else {
            // Initialize empty events for new users
            customEvents = [];
            console.log('No saved events found, initializing empty array');
        }
    } catch (error) {
        console.error('Failed to load custom events:', error);
        customEvents = [];
    }
}

// Save custom events to localStorage
function saveCustomEvents() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userKey = currentUser.isDemo ? 'demo_calendar_events' : `user_${currentUser.id}_calendar_events`;
        localStorage.setItem(userKey, JSON.stringify(customEvents));
    } catch (error) {
        console.error('Failed to save custom events:', error);
    }
}

// Load notes from localStorage
function loadNotes() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userKey = currentUser.isDemo ? 'demo_calendar_notes' : `user_${currentUser.id}_calendar_notes`;
        const saved = localStorage.getItem(userKey);
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
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userKey = currentUser.isDemo ? 'demo_calendar_notes' : `user_${currentUser.id}_calendar_notes`;
        localStorage.setItem(userKey, notesTextarea.value);
    } catch (error) {
        console.error('Failed to save notes:', error);
    }
}

// Global function to refresh calendar from other pages
window.refreshCalendar = function() {
    console.log('Refreshing calendar from external call');
    loadEvents();
};

// Clear old/duplicate events
function clearOldEvents() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userKey = currentUser.isDemo ? 'demo_calendar_events' : `user_${currentUser.id}_calendar_events`;
        
        // Clear old events that might be causing duplicates
        localStorage.removeItem(userKey);
        customEvents = [];
        
        console.log('Cleared old calendar events');
    } catch (error) {
        console.error('Failed to clear old events:', error);
    }
}

// Load events from user-specific data
async function loadEvents() {
    try {
        console.log('loadEvents() called - loading user-specific data');
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        console.log('Current user:', currentUser);
        
        // Load user-specific job postings
        let userPostings = [];
        if (currentUser.isDemo) {
            // Load demo data
            userPostings = JSON.parse(localStorage.getItem('demo_user_postings') || '[]');
            console.log('Loading demo data:', userPostings.length, 'postings');
        } else if (currentUser.id) {
            // Load user-specific data
            userPostings = JSON.parse(localStorage.getItem(`user_${currentUser.id}_postings`) || '[]');
            console.log('Loading user data:', userPostings.length, 'postings');
        } else {
            console.log('No valid user found, using empty array');
        }
        
        // Convert job postings to calendar events
        events = userPostings
            .filter(p => p.dueDate) // Use dueDate to match job posting structure
            .map(p => {
                // Convert date to proper format (YYYY-MM-DD)
                const dueDate = new Date(p.dueDate);
                const formattedDate = dueDate.toISOString().split('T')[0];
                
                return {
                    id: `posting-${p.id}`,
                    title: `${p.title} - ${p.company}`,
                    start: formattedDate,
                    allDay: true,
                    color: getStatusColor(p.status),
                    extendedProps: {
                        type: 'posting',
                        posting: p
                    }
                };
            });
        
        console.log(`Loaded ${events.length} job posting events for user: ${currentUser.email || 'demo'}`);
        console.log('Job posting events:', events);
        console.log('Custom events:', customEvents);
        console.log('Total events:', events.length + customEvents.length);
        renderCalendar(); // Re-render to show events
    } catch (error) {
        console.error('Failed to load events:', error);
        events = []; // Ensure events is empty on error
    }
}

// Modal functions
function openEventModal(dateStr = null, timeStr = null) {
    editingEvent = null;
    eventForm.reset();
    if (dateStr) {
        eventForm.date.value = dateStr;
    }
    if (timeStr) {
        eventForm.time.value = timeStr;
    }
    
    // Color picker removed - no need to set color
    
    // Hide delete button for new events
    deleteEvent.style.display = 'none';
    
    // Update modal title
    document.querySelector('.modal-header h3').textContent = 'Add Event';
    
    eventModal.setAttribute('aria-hidden', 'false');
    lockBodyScroll();
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
    
    // Color picker removed - no need to set color
    
    // Show delete button and email button for existing events
    deleteEvent.style.display = 'inline-block';
    document.getElementById('emailEvent').style.display = 'inline-block';
    
    // Update modal title
    document.querySelector('.modal-header h3').textContent = 'Edit Event';
    
    eventModal.setAttribute('aria-hidden', 'false');
    lockBodyScroll();
}

function closeEventModal() {
    eventModal.setAttribute('aria-hidden', 'true');
    unlockBodyScroll();
    eventForm.reset();
    editingEvent = null;
    deleteEvent.style.display = 'none';
    document.getElementById('emailEvent').style.display = 'none';
}

// Create recurring events
function createRecurringEvents(title, startDate, time, description, color, recurringType, endDate, category) {
    const events = [];
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + (365 * 24 * 60 * 60 * 1000)); // Default to 1 year
    const current = new Date(start);
    
    let eventId = `custom-${Date.now()}`;
    let eventCounter = 0;
    
    while (current <= end && eventCounter < 100) { // Limit to 100 events max
        const eventDate = current.toISOString().split('T')[0];
        const startDateTime = time ? `${eventDate}T${time}` : eventDate;
        
        const event = {
            id: `${eventId}-${eventCounter}`,
            title: title,
            start: startDateTime,
            color: color,
            extendedProps: {
                type: 'custom',
                description: description,
                recurring: true,
                recurringType: recurringType,
                category: category
            }
        };
        
        events.push(event);
        
        // Move to next occurrence
        if (recurringType === 'daily') {
            current.setDate(current.getDate() + 1);
        } else if (recurringType === 'weekly') {
            current.setDate(current.getDate() + 7);
        } else if (recurringType === 'monthly') {
            current.setMonth(current.getMonth() + 1);
        }
        
        eventCounter++;
    }
    
    return events;
}

async function saveEventToCalendar() {
    const formData = new FormData(eventForm);
    const title = formData.get('title');
    const date = formData.get('date');
    const time = formData.get('time');
    const description = formData.get('description');
    const isRecurring = formData.get('isRecurring') === 'on';
    const recurringType = formData.get('recurringType');
    const recurringEnd = formData.get('recurringEnd');
    const category = formData.get('category') || 'other';
    // Color picker removed - use default color
    const color = '#3b82f6';
    
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
        // Create new event(s)
        if (isRecurring && recurringType) {
            // Create recurring events
            const events = createRecurringEvents(title, date, time, description, color, recurringType, recurringEnd, category);
            customEvents.push(...events);
        } else {
            // Create single event
            const event = {
                id: `custom-${Date.now()}`,
                title: title,
                start: startDateTime,
                color: color,
                extendedProps: {
                    type: 'custom',
                    description: description,
                    category: category
                }
            };
            customEvents.push(event);
        }
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

// Export events functionality
function exportEvents() {
    const allEvents = [...events, ...customEvents];
    
    if (allEvents.length === 0) {
        alert('No events to export');
        return;
    }
    
    // Convert to CSV format
    const headers = ['Title', 'Date', 'Time', 'Description', 'Type', 'Recurring'];
    const csvContent = [
        headers.join(','),
        ...allEvents.map(event => {
            const startDate = new Date(event.start);
            const date = startDate.toISOString().split('T')[0];
            const time = event.start.includes('T') ? event.start.split('T')[1] : '';
            const description = event.extendedProps?.description || '';
            const type = event.extendedProps?.type || 'api';
            const recurring = event.extendedProps?.recurring ? 'Yes' : 'No';
            
            return [
                `"${event.title || ''}"`,
                `"${date}"`,
                `"${time}"`,
                `"${description.replace(/"/g, '""')}"`,
                `"${type}"`,
                `"${recurring}"`
            ].join(',');
        })
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `calendar-events-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function showEventDetails(event) {
    const props = event.extendedProps;
    let details = `Title: ${event.title}\n`;
    details += `Date: ${new Date(event.start).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}\n`;
    
    if (props.type === 'posting') {
        details += `Company: ${props.posting.company}\n`;
        details += `URL: ${props.posting.url || 'N/A'}\n`;
        details += `Status: ${props.posting.status}`;
    } else if (props.description) {
        details += `Description: ${props.description}`;
    }
    
    alert(details);
}

// Add sample events for demonstration
function addSampleEvents() {
    // Check if sample events already exist for this user
    const existingSampleEvents = customEvents.filter(event => 
        event.extendedProps?.isSample === true
    );
    
    if (existingSampleEvents.length > 0) {
        console.log('Sample events already exist for this user');
        return; // Sample events already exist
    }
    
    console.log('Adding sample events for demo user');
    
    const today = new Date();
    const sampleEvents = [
        {
            id: `sample-${Date.now()}-1`,
            title: 'Microsoft Interview - Round 1',
            start: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T10:00',
            color: '#3b82f6',
            extendedProps: {
                type: 'custom',
                description: 'Technical interview for Software Development Intern position',
                category: 'interview',
                isSample: true
            }
        },
        {
            id: `sample-${Date.now()}-2`,
            title: 'Google Phone Screen',
            start: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T14:00',
            color: '#10b981',
            extendedProps: {
                type: 'custom',
                description: 'Initial phone screening for Data Analytics Intern role',
                category: 'interview',
                isSample: true
            }
        },
        {
            id: `sample-${Date.now()}-3`,
            title: 'Apple Application Deadline',
            start: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            color: '#f59e0b',
            extendedProps: {
                type: 'custom',
                description: 'Final deadline for Marketing Intern application',
                category: 'deadline',
                isSample: true
            }
        },
        {
            id: `sample-${Date.now()}-4`,
            title: 'IBM Follow-up Call',
            start: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T15:30',
            color: '#8b5cf6',
            extendedProps: {
                type: 'custom',
                description: 'Follow-up call regarding Cybersecurity Intern application',
                category: 'follow-up',
                isSample: true
            }
        },
        {
            id: `sample-${Date.now()}-5`,
            title: 'Tech Career Fair',
            start: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T09:00',
            color: '#ef4444',
            extendedProps: {
                type: 'custom',
                description: 'Annual technology career fair - great networking opportunity',
                category: 'networking',
                isSample: true
            }
        },
        {
            id: `sample-${Date.now()}-6`,
            title: 'Adobe Design Portfolio Review',
            start: new Date(today.getTime() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T11:00',
            color: '#06b6d4',
            extendedProps: {
                type: 'custom',
                description: 'Portfolio review session for UX/UI Design Intern position',
                category: 'interview',
                isSample: true
            }
        }
    ];
    
    // Add sample events to customEvents array
    customEvents.push(...sampleEvents);
    
    // Save to localStorage
    saveCustomEvents();
    
    // Re-render calendar to show sample events
    renderCalendar();
}