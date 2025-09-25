console.log('Resumes.js is loading...');

// Check authentication on page load
if (!isAuthenticated()) {
  redirectToLogin();
}

// Authentication management (shared with main.js)
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

const api = (path, opts) => apiWithAuth(path, opts).then(r=>{ if(!r.ok) return r.json().then(e=>{throw e}); return r.json(); });

const uploadForm = document.getElementById('uploadForm');
const fileInput = uploadForm.elements['resume'];
const previewModal = document.getElementById('previewModal');
const previewContent = document.getElementById('previewContent');
const cancelPreview = document.getElementById('cancelPreview');
const confirmUpload = document.getElementById('confirmUpload');
const resumeNameInput = document.getElementById('resumeName');
let selectedFile = null;

// Navigation is now handled by hamburger-menu.js

// Help modal functionality
document.addEventListener('DOMContentLoaded', function() {
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

fileInput.addEventListener('change', (e)=>{
  const f = e.target.files[0];
  if(!f) return;
  selectedFile = f;
  showPreview(f);
});

uploadForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const f = selectedFile || uploadForm.elements['resume'].files[0];
  if(!f) return alert('Pick a file');
  try{
    await doUpload(f);
  }catch(err){
    alert('Upload failed: ' + (err.message || err));
  }
});

async function loadResumes(){
  // Only server-side persisted resumes are listed
  let serverRes = [];
  try{ serverRes = await api('/api/resumes'); }catch(e){ serverRes = []; }
  const container = document.getElementById('resumes'); container.innerHTML='';
  
  if (serverRes.length === 0) {
    const noResumesMsg = document.createElement('div');
    noResumesMsg.className = 'no-content-message';
    noResumesMsg.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #6b7280;">
        <div style="font-size: 48px; margin-bottom: 16px;">📄</div>
        <h3 style="margin: 0 0 8px 0; color: #374151;">No resumes uploaded yet</h3>
        <p style="margin: 0; font-size: 14px;">Upload your first resume using the form above to get started.</p>
      </div>
    `;
    container.appendChild(noResumesMsg);
    return;
  }
  
  serverRes.forEach(r=>{
    const title = r.DisplayName || r.OriginalName || r.originalName;
    const d = document.createElement('div'); d.className='resume';
    const left = document.createElement('div'); left.className = 'resume-left';
    const a = document.createElement('a'); a.href = '#'; a.textContent = title; a.addEventListener('click',(e)=>{ e.preventDefault(); openResumePreview(r); });
    left.appendChild(a);
    const badge = document.createElement('span'); badge.className = 'badge saved'; badge.textContent = 'Saved'; left.appendChild(badge);
    d.appendChild(left);
    const right = document.createElement('div'); right.className = 'resume-right';
    // Removed datetime display as requested
    const del = document.createElement('button'); del.className = 'btn btn-sm danger'; del.textContent = 'Delete';
    del.addEventListener('click', async ()=>{
      try{ 
        // Use both Id and id to handle case sensitivity
        const resumeId = r.Id || r.id;
        const response = await fetch('/api/resumes/'+resumeId, { method: 'DELETE' });
        if (response.ok) {
          await loadResumes(); // Reload the resume list
        } else {
          const errorText = await response.text();
          alert('Delete failed: ' + response.statusText + ' - ' + errorText);
        }
      }catch(e){ 
        alert('Delete failed: '+(e.message||e)); 
      }
    });
    right.appendChild(del);
    d.appendChild(right);
    container.appendChild(d);
  });
}

// Preview modal logic
function showPreview(file){
  // clear
  previewContent.innerHTML = '';
  const url = URL.createObjectURL(file);
  if(file.type.startsWith('image/')){
    const img = document.createElement('img'); img.src = url; previewContent.appendChild(img);
  } else if(file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')){
    const iframe = document.createElement('iframe'); iframe.src = url; previewContent.appendChild(iframe);
  } else {
    const p = document.createElement('div'); p.textContent = `File selected: ${file.name}`; previewContent.appendChild(p);
  }
  previewModal.setAttribute('aria-hidden', 'false');
  // prefill name with filename
  if(resumeNameInput) resumeNameInput.value = file.name.replace(/\.[^/.]+$/, '');
}

cancelPreview.addEventListener('click', ()=>{
  previewModal.setAttribute('aria-hidden', 'true');
  selectedFile = null; fileInput.value = '';
});

confirmUpload.addEventListener('click', async ()=>{
  if(!selectedFile) return;
  try{
    await doUpload(selectedFile);
  }catch(err){
    alert('Upload failed: ' + (err.message||err));
  }
});

async function doUpload(file){
  const fd = new FormData(); fd.append('resume', file);
  if(resumeNameInput && resumeNameInput.value) fd.append('name', resumeNameInput.value);
  try{
    const resp = await fetch('/api/resumes', { method:'POST', body: fd });
    if(!resp.ok){ const data = await resp.json().catch(()=>({})); throw new Error(data?.error || 'Upload failed'); }
    previewModal.setAttribute('aria-hidden','true');
    selectedFile = null; fileInput.value = '';
    await loadResumes();
  }catch(err){
    alert('Upload failed: ' + (err.message||err));
    throw err;
  }
}

async function openResumePreview(record){
  // record may be local (has url blob) or server (has url to /uploads)
  previewContent.innerHTML = '';
  let url = null;
  // always fetch server file as blob and create object URL
  try{
    const resp = await fetch(record.Url || record.url);
    if(!resp.ok) throw new Error('Failed to fetch file');
    const blob = await resp.blob();
    url = URL.createObjectURL(blob);
  }catch(err){ alert('Could not load preview: '+err.message); return; }
  // decide how to render by extension
  const lower = (record.FileName || record.fileName || '').toLowerCase();
  if(lower.match(/\.(png|jpe?g|gif|bmp|webp)$/)){
    const img = document.createElement('img'); img.src = url; previewContent.appendChild(img);
  } else if(lower.endsWith('.pdf')){
    const iframe = document.createElement('iframe'); iframe.src = url; previewContent.appendChild(iframe);
  } else {
    const p = document.createElement('div'); p.textContent = record.displayName || record.originalName; previewContent.appendChild(p);
  }
  previewModal.setAttribute('aria-hidden','false');
}

// Load resumes immediately
loadResumes();
