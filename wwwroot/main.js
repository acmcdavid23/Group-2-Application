const api = (path, opts) => fetch(path, opts).then(r=>{ if(!r.ok) return r.json().then(e=>{throw e}); return r.json(); });

// Resume functionality moved to resumes.js

// Navigation handling
document.addEventListener('DOMContentLoaded', function() {
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const panel = this.getAttribute('data-panel');
      navButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      if (panel === 'resumes') {
        window.location.href = 'resumes.html';
      } else if (panel === 'calendar') {
        window.location.href = 'calendar.html';
      }
      // Job Postings is the current page, no action needed
    });
  });
});

// Edit modal event listeners
document.addEventListener('DOMContentLoaded', function() {
  const editModal = document.getElementById('editModal');
  const closeEditModal = document.getElementById('closeEditModal');
  const cancelEdit = document.getElementById('cancelEdit');
  const saveEdit = document.getElementById('saveEdit');
  const editForm = document.getElementById('editForm');
  
  // Close modal functions
  function closeModal() {
    editModal.style.display = 'none';
    editForm.reset();
    currentEditingPosting = null;
  }
  
  // Close modal events
  closeEditModal.addEventListener('click', closeModal);
  cancelEdit.addEventListener('click', closeModal);
  
  // Click outside modal to close
  editModal.addEventListener('click', function(e) {
    if (e.target === editModal) {
      closeModal();
    }
  });
  
  // Save edit
  saveEdit.addEventListener('click', async function() {
    try {
      const formData = new FormData(editForm);
      const body = {
        title: formData.get('title'),
        company: formData.get('company'),
        description: formData.get('description'),
        dueDate: formData.get('due_date')
      };
      
      const response = await fetch(`/api/postings/${formData.get('id')}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (response.ok) {
        closeModal();
        await loadPostings();
      } else {
        alert('Failed to update posting: ' + response.statusText);
      }
    } catch (error) {
      alert('Error updating posting: ' + error.message);
    }
  });
});

// Resume functionality moved to resumes.js

document.getElementById('postingForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const body = { title: e.target.title.value, company: e.target.company.value, description: e.target.description.value, dueDate: e.target.due_date.value };
  try {
    const response = await fetch('/api/postings', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(body) });
    if (response.ok) {
      e.target.reset();
      await loadPostings(); // This will update both postings list and calendar preview
    } else {
      alert('Failed to add posting: ' + response.statusText);
    }
  } catch (error) {
    alert('Error adding posting: ' + error.message);
  }
});

let calendar;
async function loadPostings(){
  try {
    const posts = await api('/api/postings');
    console.log('Loaded postings:', posts);
    const container = document.getElementById('postings'); 
    container.innerHTML='';
    
    if (posts.length === 0) {
      const noPostingsMsg = document.createElement('div');
      noPostingsMsg.className = 'no-content-message';
      noPostingsMsg.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #6b7280;">
          <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
          <h3 style="margin: 0 0 8px 0; color: #374151;">No job postings yet</h3>
          <p style="margin: 0; font-size: 14px;">Add your first job posting using the form on the left to get started.</p>
        </div>
      `;
      container.appendChild(noPostingsMsg);
      return;
    }
    
    posts.forEach(p=>{
      const el = document.createElement('div'); el.className='posting';
      el.innerHTML = `
        <div class="posting-header">
          <div>
            <span class="posting-title">${p.title}</span>
            ${p.company ? `<span class="posting-company">@ ${p.company}</span>` : ''}
          </div>
        </div>
        <div class="posting-details">
          ${p.description ? `<div class="posting-description">${p.description}</div>` : ''}
          ${p.dueDate ? `<div class="posting-due-date">Due: ${p.dueDate}</div>` : ''}
        </div>
        <div class="posting-actions">
          <button class="btn btn-sm" onclick="editPosting(${p.id})">Edit</button>
          <button class="btn btn-sm danger" onclick="deletePosting(${p.id})">Delete</button>
          <button class="btn btn-sm primary" onclick="tailorResume(${JSON.stringify(p).replace(/"/g, '&quot;')})">Tailor Resume</button>
        </div>
      `;
      container.appendChild(el);
    });
    renderCalendarPreview(posts);
  } catch (error) {
    console.error('Error loading postings:', error);
  }
}

async function tailorResume(post){
  console.log('TAILOR FUNCTION CALLED - NEW VERSION'); // Debug log
  const resumes = await api('/api/resumes');
  if(!resumes.length) return alert('Upload a resume first');
  
  // Get the first resume
  const resume = resumes[0];
  const resumeName = resume.DisplayName || resume.OriginalName || resume.originalName || 'Resume';
  
  // Fetch resume content
  let resumeContent = '';
  try {
    const resumeId = resume.Id || resume.id; // Handle both cases
    const contentResponse = await api(`/api/resumes/${resumeId}/content`);
    resumeContent = contentResponse.content || 'Unable to extract resume content';
  } catch (error) {
    resumeContent = 'Unable to fetch resume content';
  }
  
  // Create the prompt for ChatGPT
  const prompt = `Job Title: ${post.title || 'Not specified'}
Company: ${post.company || 'Not specified'}
Job Description: ${post.description || 'Not provided'}

Resume Content:
${resumeContent}

Please adjust the resume info accordingly.`;

  console.log('ChatGPT Prompt:', prompt); // Debug log
  
  // Encode the prompt for URL
  const encodedPrompt = encodeURIComponent(prompt);
  
  // Open ChatGPT with the prompt
  const chatgptUrl = `https://chat.openai.com/?q=${encodedPrompt}`;
  window.open(chatgptUrl, '_blank');
}

let currentEditingPosting = null;

async function editPosting(id) {
  try {
    const postings = await api('/api/postings');
    const posting = postings.find(p => p.id === id);
    if (!posting) {
      alert('Posting not found');
      return;
    }
    
    currentEditingPosting = posting;
    
    // Populate the edit form
    const editForm = document.getElementById('editForm');
    editForm.title.value = posting.title || '';
    editForm.company.value = posting.company || '';
    editForm.description.value = posting.description || '';
    editForm.due_date.value = posting.dueDate || '';
    editForm.id.value = posting.id;
    
    // Show the modal
    document.getElementById('editModal').style.display = 'flex';
  } catch (error) {
    alert('Error loading posting: ' + error.message);
  }
}

async function deletePosting(id) {
  try {
    const response = await fetch('/api/postings/' + id, { method: 'DELETE' });
    if (response.ok) {
      await loadPostings(); // Reload the postings list
    } else {
      alert('Delete failed: ' + response.statusText);
    }
  } catch (error) {
    alert('Delete failed: ' + error.message);
  }
}

// Calendar preview functionality removed - now handled on calendar page

loadPostings();
