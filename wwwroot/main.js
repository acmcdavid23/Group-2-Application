console.log('Main.js is loading...');

// Check authentication on page load
if (!isAuthenticated()) {
  redirectToLogin();
}

// Load email service
const emailScript = document.createElement('script');
emailScript.src = 'email-service.js';
emailScript.onload = () => {
  console.log('Email service script loaded');
};
document.head.appendChild(emailScript);

const api = (path, opts) => fetch(path, opts).then(r=>{ if(!r.ok) return r.json().then(e=>{throw e}); return r.json(); });

// Resume functionality moved to resumes.js

// Navigation is now handled by hamburger-menu.js

// Status label helper function
function getStatusLabel(status) {
  if (window.translator) {
    return window.translator.translate(`home.status.${status}`, status);
  }
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

// Authentication management
function getAuthToken() {
  return localStorage.getItem('authToken');
}

function getCurrentUser() {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
}

function isAuthenticated() {
  return getAuthToken() && getCurrentUser();
}

function redirectToLogin() {
  window.location.href = 'login.html';
}

// API helper with authentication
async function apiWithAuth(url, options = {}) {
  const token = getAuthToken();
  if (!token) {
    redirectToLogin();
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  // If unauthorized, redirect to login
  if (response.status === 401) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    redirectToLogin();
    return;
  }
  
  return response;
}

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
      <div class="posting-content">
        <div class="posting-title">${p.title}</div>
        ${p.company ? `<div class="posting-company">@ ${p.company}</div>` : ''}
        ${p.description ? `<div class="posting-description">${p.description}</div>` : ''}
        ${p.dueDate ? `<div class="posting-due-date">Due: ${p.dueDate}</div>` : ''}
        <div class="posting-status">
          <span class="status-badge status-${p.status || 'interested'}">${getStatusLabel(p.status || 'interested')}</span>
        </div>
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
        status: formData.get('status'),
        sendReminder: formData.get('sendReminder') === 'true'
      };
      
      const response = await apiWithAuth(`/api/postings/${formData.get('id')}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      
      if (response.ok) {
        // Check if reminder should be sent
        if (body.sendReminder && body.dueDate) {
          const userSettings = getUserEmailSettings();
          if (shouldSendReminder(body, userSettings)) {
            // Send immediate reminder if within reminder window
            setTimeout(async () => {
              try {
                if (window.emailService && window.emailService.isInitialized) {
                  const success = await window.emailService.sendReminderEmail(body, userSettings.userEmail, 'due_date');
                  if (success) {
                    const message = window.translator ? window.translator.translate('settings.emailReminderSent') : 'Reminder email sent for updated posting!';
                    window.toast.success(message);
                  } else {
                    const message = window.translator ? window.translator.translate('settings.emailError') : 'Failed to send reminder email';
                    window.toast.warning(message);
                  }
                } else {
                  console.log('Email service not ready, skipping reminder');
                }
              } catch (error) {
                console.error('Failed to send reminder email:', error);
              }
            }, 1000); // Small delay to ensure posting is saved
          }
        }
        
        closeModal();
        await loadPostings();
      } else {
        console.error('Failed to update posting: ' + response.statusText);
      }
    } catch (error) {
      console.error('Error updating posting: ' + error.message);
    }
  });
});

// Email reminder button toggle functionality
document.addEventListener('DOMContentLoaded', function() {
  // Add posting form reminder button
  const sendReminderBtn = document.getElementById('sendReminderBtn');
  const sendReminderInput = document.getElementById('sendReminder');
  
  if (sendReminderBtn && sendReminderInput) {
    sendReminderBtn.addEventListener('click', function() {
      const isActive = sendReminderInput.value === 'true';
      sendReminderInput.value = isActive ? 'false' : 'true';
      
      if (isActive) {
        sendReminderBtn.style.background = '#e5e7eb';
        sendReminderBtn.style.color = '#374151';
        sendReminderBtn.style.border = '1px solid #d1d5db';
      } else {
        sendReminderBtn.style.background = '#3b82f6';
        sendReminderBtn.style.color = 'white';
        sendReminderBtn.style.border = '1px solid #3b82f6';
      }
    });
  }
  
  // Edit posting form reminder button
  const editSendReminderBtn = document.getElementById('editSendReminderBtn');
  const editSendReminderInput = document.getElementById('editSendReminder');
  
  if (editSendReminderBtn && editSendReminderInput) {
    editSendReminderBtn.addEventListener('click', function() {
      const isActive = editSendReminderInput.value === 'true';
      editSendReminderInput.value = isActive ? 'false' : 'true';
      
      if (isActive) {
        editSendReminderBtn.style.background = '#e5e7eb';
        editSendReminderBtn.style.color = '#374151';
        editSendReminderBtn.style.border = '1px solid #d1d5db';
      } else {
        editSendReminderBtn.style.background = '#3b82f6';
        editSendReminderBtn.style.color = 'white';
        editSendReminderBtn.style.border = '1px solid #3b82f6';
      }
    });
  }
});

// Resume functionality moved to resumes.js

document.getElementById('postingForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const body = { 
    title: e.target.title.value, 
    company: e.target.company.value, 
    description: e.target.description.value, 
    dueDate: e.target.due_date.value,
    sendReminder: e.target.sendReminder ? e.target.sendReminder.value === 'true' : false
  };
  try {
    const response = await apiWithAuth('/api/postings', { method:'POST', body: JSON.stringify(body) });
    if (response.ok) {
      // Check if reminder should be sent
      if (body.sendReminder && body.dueDate) {
        const userSettings = getUserEmailSettings();
        if (shouldSendReminder(body, userSettings)) {
          // Send immediate reminder if within reminder window
          setTimeout(async () => {
            try {
              if (window.emailService && window.emailService.isInitialized) {
                const success = await window.emailService.sendReminderEmail(body, userSettings.userEmail, 'due_date');
                if (success) {
                  const message = window.translator ? window.translator.translate('settings.emailReminderSent') : 'Reminder email sent for new posting!';
                  window.toast.success(message);
                } else {
                  const message = window.translator ? window.translator.translate('settings.emailError') : 'Failed to send reminder email';
                  window.toast.warning(message);
                }
              } else {
                console.log('Email service not ready, skipping reminder');
              }
            } catch (error) {
              console.error('Failed to send reminder email:', error);
            }
          }, 1000); // Small delay to ensure posting is saved
        }
      }
      
      e.target.reset();
      await loadPostings(); // This will update both postings list and calendar preview
    } else {
      console.error('Failed to add posting: ' + response.statusText);
    }
  } catch (error) {
    console.error('Error adding posting: ' + error.message);
  }
});

let calendar;
async function loadPostings(){
  try {
    const response = await apiWithAuth('/api/postings');
    const posts = await response.json();
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
    // renderCalendarPreview(posts); // Function removed
  } catch (error) {
    console.error('Error loading postings:', error);
  }
}

async function tailorResume(post){
  console.log('TAILOR FUNCTION CALLED - NEW VERSION'); // Debug log
  const resumes = await apiWithAuth('/api/resumes');
  if(!resumes.length) {
    const message = window.translator ? window.translator.translate('common.uploadResumeFirst') : 'Please upload a resume first before using the Tailor Resume feature.';
    if (window.toast) {
      window.toast.warning(message);
    } else {
      alert(message);
    }
    return;
  }
  
  // Get the first resume
  const resume = resumes[0];
  const resumeName = resume.DisplayName || resume.OriginalName || resume.originalName || 'Resume';
  
  // Fetch resume content
  let resumeContent = '';
  try {
    const resumeId = resume.Id || resume.id; // Handle both cases
    const contentResponse = await apiWithAuth(`/api/resumes/${resumeId}/content`);
    resumeContent = contentResponse.content || 'Unable to extract resume content';
  } catch (error) {
    resumeContent = 'Unable to fetch resume content';
  }
  
  // Create the tailored prompt for the AI assistant
  const tailoredPrompt = `I need help tailoring my resume for this specific internship opportunity:

**Job Details:**
- Job Title: ${post.title || 'Not specified'}
- Company: ${post.company || 'Not specified'}
- Job Description: ${post.description || 'Not provided'}

**My Current Resume:**
${resumeContent}

Please provide specific tips and suggestions on how to adjust my resume to better match this internship posting. Focus on:
1. Keywords to emphasize from the job description
2. Skills to highlight that match the requirements
3. Experience to rephrase or reorder
4. Any gaps to address or strengths to emphasize
5. Formatting suggestions to make it more relevant

Please be specific and actionable in your recommendations.`;

  // Store the prompt in localStorage for the AI page to use
  localStorage.setItem('tailoredResumePrompt', tailoredPrompt);
  localStorage.setItem('tailoredResumeJobTitle', post.title || 'Not specified');
  localStorage.setItem('tailoredResumeCompany', post.company || 'Not specified');
  
  // Navigate to the AI assistant page
  window.location.href = 'ai.html';
}

let currentEditingPosting = null;

async function editPosting(id) {
  try {
    const response = await apiWithAuth('/api/postings');
    const postings = await response.json();
    const posting = postings.find(p => p.id === id);
    if (!posting) {
      console.error('Posting not found');
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
    
    // Set reminder button state (default to false for existing postings)
    const editSendReminderBtn = document.getElementById('editSendReminderBtn');
    const editSendReminderInput = document.getElementById('editSendReminder');
    if (editSendReminderBtn && editSendReminderInput) {
      editSendReminderInput.value = 'false';
      editSendReminderBtn.style.background = '#e5e7eb';
      editSendReminderBtn.style.color = '#374151';
      editSendReminderBtn.style.border = '1px solid #d1d5db';
    }
    
    // Show the modal
    document.getElementById('editModal').style.display = 'flex';
  } catch (error) {
    console.error('Error loading posting: ' + error.message);
  }
}

async function deletePosting(id) {
  try {
    const response = await apiWithAuth('/api/postings/' + id, { method: 'DELETE' });
    if (response.ok) {
      await loadPostings(); // Reload the postings list
    } else {
      console.error('Delete failed: ' + response.statusText);
    }
  } catch (error) {
    console.error('Delete failed: ' + error.message);
  }
}

// Calendar preview functionality removed - now handled on calendar page

loadPostings();
setupSearchAndFilter();

// Export functionality
function exportPostings() {
  const dataToExport = filteredPostings.length > 0 ? filteredPostings : allPostings;
  
  if (dataToExport.length === 0) {
    console.warn('No postings to export');
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

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
  
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
