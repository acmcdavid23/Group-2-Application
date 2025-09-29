// Global variables
let allPostings = [];
let filteredPostings = [];
let statusChart = null;

// Body scroll lock functions
function lockBodyScroll() {
  document.body.classList.add('scroll-locked');
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
  emailjs.init("X80istNGO-VJ1Q9zZ");
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
  
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userPostings = JSON.parse(localStorage.getItem(`user_${currentUser.id}_postings`) || '[]');
        
        console.log('Updating existing posting:', id);
        
        // Update existing posting
        const postingIndex = userPostings.findIndex(p => p.id == id);
        if (postingIndex !== -1) {
          userPostings[postingIndex] = {
            ...userPostings[postingIndex],
            title,
            company,
            description,
            dueDate,
            status,
            notifications: {
              email: emailNotifications,
              emailAddress: notificationEmail,
              timing: notificationTiming
            }
          };
          
          localStorage.setItem(`user_${currentUser.id}_postings`, JSON.stringify(userPostings));
          
          // Reload data from localStorage to ensure consistency
          allPostings = userPostings;
          filteredPostings = [...allPostings];
          
          // Update calendar event
          if (dueDate) {
            addJobPostingToCalendar(userPostings[postingIndex]);
            if (typeof window.refreshCalendar === 'function') {
              window.refreshCalendar();
            }
          }
          
          console.log('Posting updated successfully!');
          
          // Close modal
          document.getElementById('editModal').style.display = 'none';
          unlockBodyScroll();
          
          // Render updated list and update analytics
          renderUserPostings();
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
  
  // Send reminders for postings with notifications enabled
  const lastReminder = localStorage.getItem(`user_${currentUser.id}_last_reminder`) || '';
  const todayStr = today.toDateString();
  
  if (lastReminder !== todayStr) {
    upcomingDeadlines.forEach(posting => {
      if (posting.notifications?.email && posting.notifications?.emailAddress) {
        sendAutomatedEmailReminder(posting, posting.notifications.emailAddress);
      }
    });
    
    localStorage.setItem(`user_${currentUser.id}_last_reminder`, todayStr);
  }
}

async function sendAutomatedEmailReminder(posting, userEmail) {
  const subject = `Reminder: ${posting.title} - Due ${posting.dueDate}`;
  const body = `Don't forget about your application for ${posting.title} at ${posting.company}. Due date: ${posting.dueDate}`;
  
  try {
    // Check if EmailJS is loaded
    if (typeof emailjs === 'undefined') {
      console.log('EmailJS not available for automated email');
      return;
    }

    const templateParams = {
      to_email: userEmail,
      to_name: 'User',
      from_name: 'Internship Application Manager',
      subject: subject,
      message: body,
      job_title: posting.title,
      company_name: posting.company,
      due_date: posting.dueDate
    };

    // EmailJS credentials
    const serviceId = 'service_lk4nt0v';
    const templateId = 'template_a3kh9cp';
    const publicKey = 'X80istNGO-VJ1Q9zZ';

    await emailjs.send(serviceId, templateId, templateParams, publicKey);
    console.log('Automated email sent successfully!');
  } catch (error) {
    console.error('Error sending automated email:', error);
  }
}


// Render user-specific postings
function renderUserPostings() {
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
              ${posting.notifications?.email ? `<button class="btn btn-sm primary" onclick="sendEmailReminder(${posting.id || (index + 1)})" style="background: #059669; color: white;">📧 Email</button>` : ''}
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
    
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userPostings = JSON.parse(localStorage.getItem(`user_${currentUser.id}_postings`) || '[]');
        
        console.log('Adding new posting');
        
        const newPosting = {
          id: Date.now(),
          title,
          company,
          description,
          dueDate,
          status,
          createdAt: new Date().toISOString(),
          notifications: {
            email: emailNotifications,
            emailAddress: notificationEmail,
            timing: notificationTiming
          }
        };
        
        userPostings.push(newPosting);
        localStorage.setItem(`user_${currentUser.id}_postings`, JSON.stringify(userPostings));
        
        // Reload data from localStorage to ensure consistency
        allPostings = userPostings;
        filteredPostings = [...allPostings];
        
        // Add to calendar if due date is provided
        if (dueDate) {
          addJobPostingToCalendar(newPosting);
          if (typeof window.refreshCalendar === 'function') {
            window.refreshCalendar();
          }
        }
        
        // Reset form
        form.reset();
        
        console.log('Posting added successfully!');
        
        // Render updated list and update analytics
        renderUserPostings();
        updateAnalytics();
        
  } catch (error) {
        console.error('Error with posting:', error);
        alert('Error: ' + error.message);
      }
    };
    
    form.addEventListener('submit', form._submitHandler);
  }
}

// Setup search and filter
function setupSearchAndFilter() {
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  
  function filterPostings() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusFilterValue = statusFilter ? statusFilter.value : '';
    
    const postings = document.querySelectorAll('.posting');
    let visibleCount = 0;
    
    postings.forEach(posting => {
      const title = posting.querySelector('h3').textContent.toLowerCase();
      const company = posting.querySelector('p').textContent.toLowerCase();
      const status = posting.querySelectorAll('p')[1].textContent.toLowerCase();
      
      const matchesSearch = !searchTerm || 
        title.includes(searchTerm) ||
        company.includes(searchTerm);
      
      const matchesStatus = !statusFilterValue || 
        status.includes(statusFilterValue);
      
      if (matchesSearch && matchesStatus) {
        posting.style.display = 'block';
        visibleCount++;
      } else {
        posting.style.display = 'none';
      }
    });
    
    // Show "no results" message if no postings are visible
    const container = document.getElementById('postings');
    let noResultsDiv = container.querySelector('.no-content-message');
    
    if (visibleCount === 0 && postings.length > 0) {
      if (!noResultsDiv) {
        noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-content-message';
        noResultsDiv.innerHTML = `
          <div style="text-align: center; padding: 40px; color: #6b7280;">
            <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
            <h3 style="margin: 0 0 8px 0; color: #374151;">No results found</h3>
            <p style="margin: 0; font-size: 14px;">Try adjusting your search terms or status filter to find more job postings.</p>
          </div>
        `;
        container.appendChild(noResultsDiv);
      }
    } else if (noResultsDiv) {
      noResultsDiv.remove();
    }
  }
  
  if (searchInput) {
    searchInput.addEventListener('input', filterPostings);
  }
  
  if (statusFilter) {
    statusFilter.addEventListener('change', filterPostings);
  }
}

// Load postings from API
async function loadPostings() {
  try {
    console.log('Loading postings from API...');
    const posts = await api('/api/postings');
    console.log('Loaded postings:', posts);
    
    const container = document.getElementById('postings');
    if (container) {
      container.innerHTML = '';
      
      if (posts && Array.isArray(posts) && posts.length > 0) {
        // Update with real data
        posts.forEach((posting, index) => {
          const postingDiv = document.createElement('div');
          postingDiv.className = 'posting';
          postingDiv.setAttribute('data-id', posting.id || (index + 1));
          postingDiv.innerHTML = `
            <div class="posting-header">
              <h3 class="posting-title">${posting.title}</h3>
              <span class="posting-status status-${posting.status}">${posting.status}</span>
            </div>
            <div class="posting-company">${posting.company}</div>
            <div class="posting-description">${posting.description}</div>
            <div class="posting-due-date">Due: ${new Date(posting.dueDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</div>
            <div class="posting-actions">
              <button class="btn btn-sm edit-posting" onclick="editPosting(${posting.id || (index + 1)})">✏️ Edit</button>
              <button class="btn btn-sm danger delete-posting" onclick="deletePosting(${posting.id || (index + 1)})">🗑️ Delete</button>
            </div>
          `;
          container.appendChild(postingDiv);
        });
        console.log('Real data loaded successfully!');
    } else {
        // Show no postings message
        const noPostingsDiv = document.createElement('div');
        noPostingsDiv.className = 'no-postings';
        noPostingsDiv.style.cssText = `
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
          background: #f8fafc;
          border-radius: 12px;
          border: 2px dashed #cbd5e1;
        `;
        noPostingsDiv.innerHTML = `
          <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
          <h3 style="margin: 0 0 8px 0; color: #475569; font-size: 18px;">No Job Postings Yet</h3>
          <p style="margin: 0; font-size: 14px; line-height: 1.5;">
            Start tracking your internship applications by adding your first job posting using the form on the left.
          </p>
        `;
        container.appendChild(noPostingsDiv);
        console.log('No postings found, showing empty state');
      }
    }
  } catch (error) {
    console.error('Error loading postings:', error);
    // Keep the hardcoded content if API fails
  }
}

// Manual chart creation for debugging
window.createChartsManually = function() {
  console.log('Manually creating charts...');
  createCharts();
};

// Force create charts with simple data
window.forceCreateCharts = function() {
  console.log('Force creating charts with simple data...');
  createCharts();
};

// Test chart creation immediately
window.testCharts = function() {
  console.log('Testing chart creation...');
  console.log('Chart.js available:', typeof Chart);
  console.log('Status canvas:', document.getElementById('statusChart'));
  createCharts();
};

// Edit and Delete Functions
function editPosting(id) {
  console.log('Edit posting:', id);
  const postingElement = document.querySelector(`[data-id="${id}"]`);
  if (!postingElement) {
    console.log('Posting not found');
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

function deletePosting(id) {
  console.log('Delete posting:', id);
  const postingElement = document.querySelector(`[data-id="${id}"]`);
  if (postingElement) {
    postingElement.remove();
    console.log('Posting deleted from UI');
    
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

// Send email reminder function
function sendEmailReminder(postingId) {
  const posting = allPostings.find(p => p.id == postingId);
  if (!posting) {
    alert('Posting not found');
    return;
  }
  
  if (!posting.notifications?.email || !posting.notifications?.emailAddress) {
    alert('Email notifications not enabled for this posting');
    return;
  }
  
  const subject = `Reminder: ${posting.title} - Due ${posting.dueDate}`;
  const body = `Don't forget about your application for ${posting.title} at ${posting.company}. Due date: ${posting.dueDate}`;
  
  try {
    // Check if EmailJS is loaded
    if (typeof emailjs === 'undefined') {
      alert('EmailJS not available. Please refresh the page and try again.');
      return;
    }

    const templateParams = {
      to_email: posting.notifications.emailAddress,
      to_name: 'User',
      from_name: 'Internship Application Manager',
      subject: subject,
      message: body,
      job_title: posting.title,
      company_name: posting.company,
      due_date: posting.dueDate
    };

    // EmailJS credentials
    const serviceId = 'service_lk4nt0v';
    const templateId = 'template_a3kh9cp';
    const publicKey = 'X80istNGO-VJ1Q9zZ';

    emailjs.send(serviceId, templateId, templateParams, publicKey)
      .then(response => {
        console.log('Email sent successfully!', response);
        showNotification('Email reminder sent successfully!', 'success');
      })
      .catch(error => {
        console.error('Error sending email:', error);
        showNotification('Failed to send email. Please try again.', 'error');
      });
  } catch (error) {
    console.error('Error sending email:', error);
    showNotification('Failed to send email. Please try again.', 'error');
  }
}

// Make functions globally available
window.editPosting = editPosting;
window.deletePosting = deletePosting;
window.toggleEmailFields = toggleEmailFields;
window.toggleEditEmailFields = toggleEditEmailFields;
window.closeEditModal = closeEditModal;
window.sendEmailReminder = sendEmailReminder;