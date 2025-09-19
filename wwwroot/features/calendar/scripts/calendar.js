// Calendar-specific functionality
let calendar;

async function loadPostings(){
  let posts = [];
  try {
    const response = await fetch('/api/postings');
    if (response.ok) posts = await response.json();
  } catch (e) {
    console.error('Failed to load postings:', e);
  }
  
  renderCalendar(posts);
  updateUpcomingDeadlines(posts);
  updateStats(posts);
}

function updateUpcomingDeadlines(posts) {
  const container = document.getElementById('upcomingDeadlines');
  if (!container) return;
  
  const upcoming = posts.filter(p => {
    if (!p.dueDate) return false;
    const due = new Date(p.dueDate);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return due >= now && due <= weekFromNow;
  }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  
  container.innerHTML = '';
  
  if (upcoming.length === 0) {
    container.innerHTML = '<div class="list-group-item text-center text-muted">No upcoming deadlines</div>';
    return;
  }
  
  upcoming.forEach(p => {
    const dueDate = new Date(p.dueDate);
    const daysLeft = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
    
    const item = document.createElement('div');
    item.className = 'list-group-item';
    
    item.innerHTML = `
      <div class="d-flex w-100 justify-content-between">
        <div>
          <h6 class="mb-1">${p.title}</h6>
          <small class="text-muted">${p.company}</small>
        </div>
        <span class="badge ${daysLeft <= 1 ? 'bg-danger' : daysLeft <= 3 ? 'bg-warning' : 'bg-primary'}">${daysLeft}d</span>
      </div>
    `;
    
    container.appendChild(item);
  });
}

function updateStats(posts) {
  const now = new Date();
  const thisMonth = posts.filter(p => {
    if (!p.dueDate) return false;
    const due = new Date(p.dueDate);
    return due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear();
  });
  
  const overdue = posts.filter(p => {
    if (!p.dueDate) return false;
    return new Date(p.dueDate) < now;
  });
  
  document.getElementById('thisMonth').textContent = thisMonth.length;
  document.getElementById('overdue').textContent = overdue.length;
}

function renderCalendar(posts){
  const calendarEl = document.getElementById('calendar'); 
  if (!calendarEl) return;
  
  // Clear existing calendar
  calendarEl.innerHTML='';
  if(calendar) calendar.destroy();
  
  calendar = new FullCalendar.Calendar(calendarEl, { 
    initialView: 'dayGridMonth', 
    height: 600,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,listWeek'
    },
    events: posts.filter(p=>p.dueDate).map(p=>{
      const dueDate = new Date(p.dueDate);
      const isOverdue = dueDate < new Date();
      const isDueSoon = dueDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      return {
        title: p.title + ' - ' + p.company, 
        start: p.dueDate, 
        color: isOverdue ? '#dc3545' : isDueSoon ? '#ffc107' : '#0d6efd',
        extendedProps: p 
      };
    }),
    eventClick: function(info) {
      const job = info.event.extendedProps;
      // Show job details in a modal or alert
      alert(`Job: ${job.title}\nCompany: ${job.company}\nDue: ${new Date(job.dueDate).toLocaleDateString()}`);
    }
  });
  calendar.render();
}

// Initialize calendar functionality
document.addEventListener('DOMContentLoaded', function() {
  loadPostings();
});