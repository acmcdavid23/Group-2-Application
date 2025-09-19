const api = (path, opts) => fetch(path, opts).then(r=>{ if(!r.ok) return r.json().then(e=>{throw e}); return r.json(); });

let calendar;
let eventModal = document.getElementById('eventModal');
let eventForm = document.getElementById('eventForm');
let cancelEvent = document.getElementById('cancelEvent');
let saveEvent = document.getElementById('saveEvent');
let todayBtn = document.getElementById('todayBtn');
let addEventBtn = document.getElementById('addEventBtn');

// Initialize calendar
document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        height: 'auto',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: [],
        eventClick: function(info) {
            showEventDetails(info.event);
        },
        dateClick: function(info) {
            openEventModal(info.dateStr);
        }
    });
    
    calendar.render();
    loadEvents();
});

// Load events from server (postings + any custom events)
async function loadEvents() {
    try {
        const postings = await api('/api/postings');
        const events = postings
            .filter(p => p.dueDate)
            .map(p => ({
                id: `posting-${p.id}`,
                title: `${p.title} - ${p.company}`,
                start: p.dueDate,
                backgroundColor: '#3b82f6',
                borderColor: '#2563eb',
                extendedProps: {
                    type: 'posting',
                    posting: p
                }
            }));
        
        calendar.removeAllEvents();
        calendar.addEventSource(events);
    } catch (error) {
        console.error('Failed to load events:', error);
    }
}

// Event handlers
todayBtn.addEventListener('click', () => {
    calendar.today();
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
        title: title,
        start: startDateTime,
        backgroundColor: '#10b981',
        borderColor: '#059669',
        extendedProps: {
            type: 'custom',
            description: description
        }
    };
    
    calendar.addEvent(event);
    closeEventModal();
    
    // TODO: Save to server if you want persistence
    // await api('/api/events', { method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(event) });
}

function showEventDetails(event) {
    const props = event.extendedProps;
    let details = `Title: ${event.title}\n`;
    details += `Date: ${event.start.toLocaleDateString()}\n`;
    
    if (props.type === 'posting') {
        details += `Company: ${props.posting.company}\n`;
        details += `URL: ${props.posting.url || 'N/A'}\n`;
        details += `Status: ${props.posting.status}`;
    } else if (props.description) {
        details += `Description: ${props.description}`;
    }
    
    alert(details);
}
