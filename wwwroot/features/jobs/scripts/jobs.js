// Jobs-specific functionality
document.getElementById('postingForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const formData = new FormData(e.target);
  const body = { 
    title: formData.get('title'), 
    company: formData.get('company'), 
    url: formData.get('url'), 
    dueDate: formData.get('due_date') 
  };
  
  try {
    const response = await fetch('/api/postings', { 
      method:'POST', 
      headers:{'content-type':'application/json'}, 
      body: JSON.stringify(body) 
    });
    
    if (response.ok) {
      e.target.reset();
      loadPostings();
      // Show success message
      const alert = document.createElement('div');
      alert.className = 'alert alert-success alert-dismissible fade show';
      alert.innerHTML = `
        Job added successfully!
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;
      document.querySelector('.container-fluid').insertBefore(alert, document.querySelector('.row'));
    } else {
      throw new Error('Failed to add job');
    }
  } catch (error) {
    alert('Failed to add job: ' + error.message);
  }
});

async function loadPostings(){
  let posts = [];
  try {
    const response = await fetch('/api/postings');
    if (response.ok) posts = await response.json();
  } catch (e) {
    console.error('Failed to load postings:', e);
  }
  
  const container = document.getElementById('postings'); 
  if (!container) return;
  
  container.innerHTML='';
  
  if (posts.length === 0) {
    container.innerHTML = '<div class="list-group-item text-center text-muted">No job applications yet</div>';
    return;
  }
  
  posts.forEach(p=>{
    const dueDate = p.dueDate ? new Date(p.dueDate).toLocaleDateString() : 'No deadline';
    const isOverdue = p.dueDate && new Date(p.dueDate) < new Date();
    const isDueSoon = p.dueDate && new Date(p.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const item = document.createElement('div');
    item.className = `list-group-item ${isOverdue ? 'list-group-item-danger' : isDueSoon ? 'list-group-item-warning' : ''}`;
    
    item.innerHTML = `
      <div class="d-flex w-100 justify-content-between">
        <div>
          <h6 class="mb-1">${p.title}</h6>
          <p class="mb-1 text-muted">${p.company}</p>
          <small>Due: ${dueDate}</small>
        </div>
        <div class="btn-group" role="group">
          <button class="btn btn-outline-primary btn-sm" onclick="tailorResume(${JSON.stringify(p).replace(/"/g, '&quot;')})">Tailor Resume</button>
          <button class="btn btn-outline-danger btn-sm" onclick="deleteJob(${p.id})">Delete</button>
        </div>
      </div>
    `;
    
    container.appendChild(item);
  });
  
  // Update stats
  document.getElementById('totalJobs').textContent = posts.length;
  const dueSoon = posts.filter(p => {
    if (!p.dueDate) return false;
    const due = new Date(p.dueDate);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return due >= now && due <= weekFromNow;
  });
  document.getElementById('dueSoon').textContent = dueSoon.length;
  
  renderCalendar(posts);
}

async function tailorResume(post){
  try {
    const response = await fetch('/api/resumes');
    if (!response.ok) throw new Error('Failed to load resumes');
    const resumes = await response.json();
    
    if(!resumes.length) {
      alert('Upload a resume first');
      return;
    }
    
    const resumeId = resumes[0].id;
    const tailorResponse = await fetch('/api/tailor', { 
      method:'POST', 
      headers:{'content-type':'application/json'}, 
      body: JSON.stringify({ postingUrl: post.url || post.title, resumeId }) 
    });
    
    if (tailorResponse.ok) {
      const result = await tailorResponse.json();
      alert('Tailored keywords: ' + result.keywords.join(', '));
    } else {
      throw new Error('Failed to tailor resume');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function deleteJob(id) {
  if (!confirm('Delete this job application?')) return;
  try {
    const response = await fetch('/api/postings/' + id, { method: 'DELETE' });
    if (response.ok) {
      loadPostings();
    } else {
      alert('Delete failed');
    }
  } catch (error) {
    alert('Delete failed: ' + error.message);
  }
}

function renderCalendar(posts){
  const calendarEl = document.getElementById('calendar'); 
  if (!calendarEl) return;
  
  // Clear existing calendar
  calendarEl.innerHTML='';
  if(window.calendar) window.calendar.destroy();
  
  window.calendar = new FullCalendar.Calendar(calendarEl, { 
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
      tailorResume(job);
    }
  });
  window.calendar.render();
}

// Initialize jobs functionality
document.addEventListener('DOMContentLoaded', function() {
  loadPostings();
});