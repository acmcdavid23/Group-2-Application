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
let statusChart = null;

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

function unlockBodyScroll() {
  document.body.classList.remove('scroll-locked');
}

// Close edit modal function
function closeEditModal() {
  console.log('closeEditModal function called');
  const editModal = document.getElementById('editModal');
  if (editModal) {
    editModal.style.display = 'none';
    unlockBodyScroll();
  }
}


// Initialize EmailJS
(function() {
  emailjs.init("YOUR_PUBLIC_KEY"); // Replace with your EmailJS public key
})();

// Notification system
function showNotification(message, type = 'info') {
  // Remove any existing notifications
  const existingNotification = document.querySelector('.app-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification element with inline styles for guaranteed visibility
  const notification = document.createElement('div');
  notification.className = 'app-notification';
  
  // Set inline styles for guaranteed visibility
  notification.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    z-index: 99999 !important;
    max-width: 400px !important;
    min-width: 300px !important;
    padding: 16px !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    font-family: Arial, sans-serif !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    color: white !important;
    border: 2px solid !important;
    animation: slideInRight 0.3s ease-out !important;
  `;

  // Set background color based on type
  if (type === 'success') {
    notification.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    notification.style.borderColor = '#059669';
  } else if (type === 'error') {
    notification.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    notification.style.borderColor = '#dc2626';
  } else {
    notification.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)';
    notification.style.borderColor = '#1e40af';
  }

  notification.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
      <span style="flex: 1; font-weight: 500;">${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
      " onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='none'">×</button>
    </div>
  `;

  // Add to page
  document.body.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// Automated email functionality




// Load user-specific data
function loadUserData() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  
  if (currentUser.isDemo) {
    // Load demo data for demo user
    const demoData = JSON.parse(localStorage.getItem('demo_user_postings') || '[]');
    allPostings = demoData;
    filteredPostings = [...demoData];
    renderUserPostings();
  } else {
    // Load user's personal data (empty for new users)
    const userPostings = JSON.parse(localStorage.getItem(`user_${currentUser.id}_postings`) || '[]');
    allPostings = userPostings;
    filteredPostings = [...userPostings];
    renderUserPostings();
  }
  
  
  // Auto-populate notification email from user login
  populateNotificationEmail();
}

// Setup edit modal form submission
function setupEditModal() {
  const editForm = document.getElementById('editForm');
  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        const formData = new FormData(editForm);
        const id = formData.get('id');
        const title = formData.get('title');
        const company = formData.get('company');
        const description = formData.get('description');
        const dueDate = formData.get('due_date');
        const status = formData.get('status');
        const emailNotifications = formData.get('emailNotifications') === 'on';
        const notificationEmail = formData.get('notificationEmail');
        const notificationTiming = formData.get('notificationTiming');
        
        if (!title || !company || title.trim() === '' || company.trim() === '') {
          alert('Please fill in title and company');
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

      } catch (error) {
        console.error('Error updating posting:', error);
        alert('Error: ' + error.message);
      }
    });
  }
}

// Setup modal event handlers
function setupModalHandlers() {
  // Close modal buttons
  const closeEditModal = document.getElementById('closeEditModal');
  const cancelEdit = document.getElementById('cancelEdit');
  const editModal = document.getElementById('editModal');
  
  if (closeEditModal) {
    console.log('Setting up closeEditModal event listener');
    closeEditModal.addEventListener('click', () => {
      console.log('Close button clicked');
    editModal.style.display = 'none';
      unlockBodyScroll();
    });
  } else {
    console.log('closeEditModal button not found');
  }
  
  if (cancelEdit) {
    cancelEdit.addEventListener('click', () => {
      editModal.style.display = 'none';
      unlockBodyScroll();
    });
  }
  
  // Close modal when clicking outside
  if (editModal) {
    editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
        editModal.style.display = 'none';
        unlockBodyScroll();
      }
    });
  }
}

// Toggle email fields visibility
function toggleEmailFields() {
  const checkbox = document.getElementById('emailNotifications');
  const emailFields = document.getElementById('emailFields');
  
  if (checkbox.checked) {
    emailFields.style.opacity = '1';
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const emailField = document.getElementById('notificationEmail');
    if (emailField && currentUser.email) {
      emailField.value = currentUser.email;
    }
  } else {
    emailFields.style.opacity = '0';
  }
}

function toggleEditEmailFields() {
  const checkbox = document.getElementById('editEmailNotifications');
  const emailFields = document.getElementById('editEmailFields');
  
  if (checkbox.checked) {
    emailFields.style.opacity = '1';
  } else {
    emailFields.style.opacity = '0';
  }
}

// Auto-populate notification email from user login
function populateNotificationEmail() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const emailField = document.getElementById('notificationEmail');
  const timingField = document.getElementById('notificationTiming');
  
  if (emailField && currentUser.email) {
    emailField.value = currentUser.email;
  }
  
  if (timingField && !timingField.value) {
    timingField.value = '1_day'; // Default to 1 day before
  }
}

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

// Get display text for notification timing
function getTimingDisplayText(timing) {
  const timingTexts = {
    '1_day': '1 day before',
    '3_days': '3 days before',
    '1_week': '1 week before',
    '2_weeks': '2 weeks before',
    'on_due_date': 'on due date'
  };
  return timingTexts[timing] || '1 day before';
}

// Add job posting to calendar
function addJobPostingToCalendar(posting) {
  if (!posting.dueDate) return;
  
  // Convert date to proper format (YYYY-MM-DD)
  const dueDate = new Date(posting.dueDate);
  const formattedDate = dueDate.toISOString().split('T')[0];
  
  // Create calendar event from job posting
  const event = {
    id: `job_${posting.id}`,
    title: `${posting.title} - ${posting.company}`,
    start: formattedDate,
    allDay: true,
    color: getStatusColor(posting.status),
    extendedProps: {
      type: 'job_posting',
      jobId: posting.id,
      company: posting.company,
      status: posting.status,
      description: posting.description
    }
  };
  
  // Save to calendar events in localStorage
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const calendarEvents = JSON.parse(localStorage.getItem(`user_${currentUser.id}_calendar_events`) || '[]');
  
  // Remove existing event if it exists
  const filteredEvents = calendarEvents.filter(e => e.id !== event.id);
  filteredEvents.push(event);
  
  localStorage.setItem(`user_${currentUser.id}_calendar_events`, JSON.stringify(filteredEvents));
  
  console.log('Job posting added to calendar:', event);
}


// Automated reminder scheduling
function scheduleReminders() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  
  // Check for upcoming deadlines based on notification timing
  const today = new Date();
  const upcomingDeadlines = allPostings.filter(posting => {
    if (!posting.notifications?.email || !posting.notifications?.timing) return false;
    
    const dueDate = new Date(posting.dueDate);
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    
    // Check if today matches the notification timing
    const timing = posting.notifications.timing;
    switch (timing) {
      case '1_day':
        return daysUntilDue === 1;
      case '3_days':
        return daysUntilDue === 3;
      case '1_week':
        return daysUntilDue === 7;
      case '2_weeks':
        return daysUntilDue === 14;
      case 'on_due_date':
        return daysUntilDue === 0;
      default:
        return daysUntilDue <= 7 && daysUntilDue >= 0; // Fallback to within 7 days
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
}

async function sendAutomatedEmailReminder(posting, userEmail) {
  const subject = `Reminder: ${posting.title} - Due ${posting.dueDate}`;
  const body = `Don't forget about your application for ${posting.title} at ${posting.company}. Due date: ${posting.dueDate}`;
  
  try {
    const response = await apiWithAuth('/api/postings');
    const posts = await response.json();
    allPostings = posts;
    filteredPostings = [...posts];
    
    const container = document.getElementById('postings'); 
    
  if (container) {
  container.innerHTML = '';
  
    if (allPostings && allPostings.length > 0) {
      // Render user's postings
      allPostings.forEach((posting, index) => {
        const postingDiv = document.createElement('div');
        postingDiv.className = 'posting';
        postingDiv.setAttribute('data-id', posting.id || (index + 1));
        postingDiv.innerHTML = `
      <div class="posting-header">
            <h3 class="posting-title">${posting.title}</h3>
        </div>
          <div class="posting-company">${posting.company}</div>
          <div class="posting-description">${posting.description}</div>
          <div class="posting-due-date">Due: ${new Date(posting.dueDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</div>
          ${posting.notifications?.email ? `<div class="notification-indicator" style="font-size: 12px; color: #059669; margin-top: 5px;">🔔 Email notifications: ${getTimingDisplayText(posting.notifications.timing)}</div>` : ''}
            <div class="posting-actions">
              <button class="btn btn-sm edit-posting" onclick="editPosting(${posting.id || (index + 1)})">✏️ Edit</button>
              <button class="btn btn-sm danger delete-posting" onclick="deletePosting(${posting.id || (index + 1)})">🗑️ Delete</button>
          </div>
          <div class="posting-status-container" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
            <span class="posting-status status-${posting.status}" style="display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; background: ${getStatusColor(posting.status)}; color: white;">${posting.status.replace('_', ' ')}</span>
          </div>
        `;
        container.appendChild(postingDiv);
      });
      console.log('User data loaded successfully!');
    } else {
      // Show no postings message
      const noPostingsDiv = document.createElement('div');
      noPostingsDiv.className = 'no-content-message';
      noPostingsDiv.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #6b7280;">
          <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
          <h3 style="margin: 0 0 8px 0; color: #374151;">No job postings yet</h3>
          <p style="margin: 0; font-size: 14px;">Add your first job posting using the form on the left to get started.</p>
        </div>
      `;
      container.appendChild(noPostingsDiv);
      console.log('No postings found, showing empty state');
    }
  }
}

// API helper function
async function api(endpoint, options = {}) {
  const response = await fetch(endpoint, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing application... (main.js v10)');
  
  // Load user-specific data
  loadUserData();
  
  // Setup forms and modals
  setupForm();
  setupEditModal();
  setupModalHandlers();
  setupSearchAndFilter();
  
  // Update analytics
  updateAnalytics();
  
  // Create charts with delay to ensure Chart.js is loaded
  setTimeout(() => {
    createCharts();
  }, 1000);
  
});

// Update analytics display
function updateAnalytics() {
  console.log('updateAnalytics called with', allPostings.length, 'postings');
  
  const totalAppsElement = document.getElementById('totalApplications');
  const successRateElement = document.getElementById('successRate');
  
  console.log('Analytics elements found:', {
    totalApps: !!totalAppsElement,
    successRate: !!successRateElement
  });
  
  if (totalAppsElement) {
    totalAppsElement.textContent = allPostings.length;
    console.log('Updated total applications to:', allPostings.length);
  }
  
  if (successRateElement) {
    const offers = allPostings.filter(p => p.status === 'offer').length;
    const successRate = allPostings.length > 0 ? Math.round((offers / allPostings.length) * 100) : 0;
    successRateElement.textContent = successRate + '%';
    console.log('Updated success rate to:', successRate + '%');
  }
  
  // Recreate charts with updated data
  setTimeout(() => {
    createCharts();
  }, 100);
}

// Create charts
function createCharts() {
  console.log('Creating charts...');
  
  // Calculate status data from user's postings
  const statusCounts = {
    'applied': 0,
    'phone_screen': 0,
    'interview': 0,
    'offer': 0,
    'rejected': 0
  };
  
  allPostings.forEach(posting => {
    if (statusCounts.hasOwnProperty(posting.status)) {
      statusCounts[posting.status]++;
    }
  });
  
  // Filter out zero values for pie chart
  const statusLabels = [];
  const statusData = [];
  const statusColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];
  let colorIndex = 0;
  
  Object.keys(statusCounts).forEach(status => {
    if (statusCounts[status] > 0) {
      // Convert status to user-friendly labels
      const labelMap = {
        'applied': 'Applied',
        'phone_screen': 'Phone Screen',
        'interview': 'Interview',
        'offer': 'Offer',
        'rejected': 'Rejected'
      };
      statusLabels.push(labelMap[status] || status);
      statusData.push(statusCounts[status]);
    }
  });
  
  // Create pie chart
  const statusCtx = document.getElementById('statusChart');
  if (statusCtx && typeof Chart !== 'undefined') {
    if (statusChart) {
      statusChart.destroy();
    }
    
    if (statusData.length > 0) {
      statusChart = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
          labels: statusLabels,
          datasets: [{
            data: statusData,
            backgroundColor: statusColors.slice(0, statusData.length)
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    } else {
      // Show empty state
      statusChart = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
          labels: ['No Applications Yet'],
          datasets: [{
            data: [1],
            backgroundColor: ['#e5e7eb']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
    console.log('Status chart created!');
  } else {
    console.log('Status chart canvas not found or Chart.js not loaded');
  }
  
  // Calculate timeline data from user's postings
  const timelineData = [0, 0, 0, 0]; // Jan, Feb, Mar, Apr
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr'];
  
  allPostings.forEach(posting => {
    const createdDate = new Date(posting.createdAt);
    const month = createdDate.getMonth();
    if (month >= 0 && month <= 3) { // Jan = 0, Feb = 1, Mar = 2, Apr = 3
      timelineData[month]++;
    }
  });
  
  // Bar chart removed
}

// Setup form
function setupForm() {
  const form = document.getElementById('postingForm');
  if (form) {
    // Remove any existing event listeners to prevent duplicates
    form.removeEventListener('submit', form._submitHandler);
    
    form._submitHandler = async (e) => {
      e.preventDefault();
      
      try {
        const formData = new FormData(form);
        const title = formData.get('title');
        const company = formData.get('company');
        const description = formData.get('description');
        const dueDate = formData.get('due_date');
        const status = formData.get('status');
        const emailNotifications = formData.get('emailNotifications') === 'on';
        const notificationEmail = formData.get('notificationEmail');
        const notificationTiming = formData.get('notificationTiming');
        
        console.log('Form data:', { title, company, description, dueDate, status });
        
        if (!title || !company || title.trim() === '' || company.trim() === '') {
          console.log('Validation failed:', { title, company, titleTrimmed: title?.trim(), companyTrimmed: company?.trim() });
          alert('Please fill in title and company');
      return;
    }
    
    renderFilteredPostings();
    // renderCalendarPreview(posts); // Function removed
  } catch (error) {
    console.error('Error loading postings:', error);
    // Keep the hardcoded content if API fails
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
  
  // Find the posting in our data
  const posting = allPostings.find(p => p.id == id);
  if (!posting) {
    console.log('Posting data not found');
    return;
  }
  
  // Fill modal form with current values
  document.getElementById('editPostingId').value = posting.id;
  document.getElementById('editTitle').value = posting.title;
  document.getElementById('editCompany').value = posting.company;
  document.getElementById('editDescription').value = posting.description || '';
  document.getElementById('editDueDate').value = posting.dueDate || '';
  document.getElementById('editStatus').value = posting.status;
  
  // Set notification settings
  document.getElementById('editEmailNotifications').checked = posting.notifications?.email || false;
  document.getElementById('editNotificationEmail').value = posting.notifications?.emailAddress || '';
  document.getElementById('editNotificationTiming').value = posting.notifications?.timing || '1_day';
  
  // Show/hide email fields based on checkbox state
  toggleEditEmailFields();
  
  // Show modal
  document.getElementById('editModal').style.display = 'flex';
  lockBodyScroll();
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
    
    // Remove from localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userPostings = JSON.parse(localStorage.getItem(`user_${currentUser.id}_postings`) || '[]');
    const updatedPostings = userPostings.filter(p => p.id != id);
    localStorage.setItem(`user_${currentUser.id}_postings`, JSON.stringify(updatedPostings));
    
    // Update local arrays
    allPostings = updatedPostings;
    filteredPostings = [...allPostings];
    
    // Re-render the postings
    renderUserPostings();
    
    // Update analytics
    updateAnalytics();
    
    console.log('Job posting deleted successfully!');
  }
}

// Cancel edit function

// Make functions globally available
window.editPosting = editPosting;
window.deletePosting = deletePosting;
window.toggleEmailFields = toggleEmailFields;
window.toggleEditEmailFields = toggleEditEmailFields;
window.closeEditModal = closeEditModal;