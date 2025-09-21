console.log('Main.js is loading...');
const api = (path, opts) => fetch(path, opts).then(r=>{ if(!r.ok) return r.json().then(e=>{throw e}); return r.json(); });

// Resume functionality moved to resumes.js

// Navigation is now handled by hamburger-menu.js

// Status label helper function
function getStatusLabel(status) {
  const labels = {
    'interested': 'Interested',
    'applied': 'Applied',
    'phone_screen': 'Phone Screen',
    'interview': 'Interview',
    'offer': 'Offer',
    'rejected': 'Rejected'
  };
  return labels[status] || 'Interested';
}

// Global variables for search and filter
let allPostings = [];
let filteredPostings = [];

// Search and filter functionality
function setupSearchAndFilter() {
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  
  function filterPostings() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusFilterValue = statusFilter.value;
    
    filteredPostings = allPostings.filter(posting => {
      const matchesSearch = !searchTerm || 
        posting.title.toLowerCase().includes(searchTerm) ||
        posting.company.toLowerCase().includes(searchTerm) ||
        posting.description.toLowerCase().includes(searchTerm);
      
      const matchesStatus = !statusFilterValue || posting.status === statusFilterValue;
      
      return matchesSearch && matchesStatus;
    });
    
    renderFilteredPostings();
  }
  
  searchInput.addEventListener('input', filterPostings);
  statusFilter.addEventListener('change', filterPostings);
}

function renderFilteredPostings() {
  const container = document.getElementById('postings');
  container.innerHTML = '';
  
  if (filteredPostings.length === 0) {
    container.innerHTML = '<div class="no-results">No postings match your search criteria.</div>';
    return;
  }
  
  filteredPostings.forEach(p => {
    const el = document.createElement('div'); 
    el.className='posting';
    el.innerHTML = `
      <div class="posting-header">
        <div>
          <span class="posting-title">${p.title}</span>
          ${p.company ? `<span class="posting-company">@ ${p.company}</span>` : ''}
        </div>
        <div class="posting-status">
          <span class="status-badge status-${p.status || 'interested'}">${getStatusLabel(p.status || 'interested')}</span>
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
  
  // Update analytics
  updateAnalytics();
}

function updateAnalytics() {
  const totalApplications = allPostings.length;
  const appliedCount = allPostings.filter(p => p.status === 'applied' || p.status === 'phone_screen' || p.status === 'interview' || p.status === 'offer' || p.status === 'rejected').length;
  const interviewCount = allPostings.filter(p => p.status === 'interview' || p.status === 'offer').length;
  const offerCount = allPostings.filter(p => p.status === 'offer').length;
  const successRate = appliedCount > 0 ? Math.round((offerCount / appliedCount) * 100) : 0;
  
  document.getElementById('totalApplications').textContent = totalApplications;
  document.getElementById('appliedCount').textContent = appliedCount;
  document.getElementById('interviewCount').textContent = interviewCount;
  document.getElementById('offerCount').textContent = offerCount;
  document.getElementById('successRate').textContent = successRate + '%';
}

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
        dueDate: formData.get('due_date'),
        status: formData.get('status')
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
    allPostings = posts;
    filteredPostings = [...posts];
    
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
    
    renderFilteredPostings();
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
    editForm.status.value = posting.status || 'interested';
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
setupSearchAndFilter();

// Export functionality
function exportPostings() {
  const dataToExport = filteredPostings.length > 0 ? filteredPostings : allPostings;
  
  if (dataToExport.length === 0) {
    alert('No postings to export');
    return;
  }
  
  // Convert to CSV format
  const headers = ['Title', 'Company', 'Status', 'Description', 'Due Date', 'Created'];
  const csvContent = [
    headers.join(','),
    ...dataToExport.map(posting => [
      `"${posting.title || ''}"`,
      `"${posting.company || ''}"`,
      `"${getStatusLabel(posting.status || 'interested')}"`,
      `"${(posting.description || '').replace(/"/g, '""')}"`,
      `"${posting.dueDate || ''}"`,
      `"${new Date(posting.createdAt).toLocaleDateString()}"`
    ].join(','))
  ].join('\n');
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `job-postings-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Add export button event listener
document.addEventListener('DOMContentLoaded', function() {
  const exportBtn = document.getElementById('exportPostings');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportPostings);
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
});
