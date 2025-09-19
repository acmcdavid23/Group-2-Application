// Resume-specific functionality
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('resumeFile');
const previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
const previewContent = document.getElementById('previewContent');
const confirmUpload = document.getElementById('confirmUpload');
const resumeNameInput = document.getElementById('resumeName');
let selectedFile = null;

fileInput?.addEventListener('change', (e)=>{
  const f = e.target.files[0];
  if(!f) return;
  selectedFile = f;
  showPreview(f);
});

uploadForm?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const f = selectedFile || fileInput.files[0];
  if(!f) return alert('Pick a file');
  try{
    await doUpload(f);
  }catch(err){
    alert('Upload failed: ' + (err.message || err));
  }
});

async function loadResumes(){
  let serverRes = [];
  try{ 
    const response = await fetch('/api/resumes');
    if (response.ok) serverRes = await response.json();
  }catch(e){ 
    serverRes = []; 
  }
  
  const container = document.getElementById('resumes'); 
  if (!container) return;
  
  container.innerHTML='';
  
  if (serverRes.length === 0) {
    container.innerHTML = '<div class="list-group-item text-center text-muted">No resumes uploaded yet</div>';
    return;
  }
  
  serverRes.forEach(r=>{
    const title = r.DisplayName || r.OriginalName || r.originalName;
    const date = new Date(r.CreatedAt || r.createdAt).toLocaleDateString();
    
    const item = document.createElement('div');
    item.className = 'list-group-item d-flex justify-content-between align-items-center';
    
    item.innerHTML = `
      <div>
        <h6 class="mb-1">${title}</h6>
        <small class="text-muted">Uploaded ${date}</small>
      </div>
      <div class="btn-group" role="group">
        <button class="btn btn-outline-primary btn-sm" onclick="openResumePreview(${JSON.stringify(r).replace(/"/g, '&quot;')})">Preview</button>
        <button class="btn btn-outline-danger btn-sm" onclick="deleteResume(${r.Id})">Delete</button>
      </div>
    `;
    
    container.appendChild(item);
  });
  
  // Update stats
  document.getElementById('resumeCount').textContent = serverRes.length;
  const recent = serverRes.filter(r => {
    const created = new Date(r.CreatedAt || r.createdAt);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return created > weekAgo;
  });
  document.getElementById('recentCount').textContent = recent.length;
}

function showPreview(file){
  if (!previewContent) return;
  previewContent.innerHTML = '';
  const url = URL.createObjectURL(file);
  if(file.type.startsWith('image/')){
    const img = document.createElement('img'); 
    img.src = url; 
    img.className = 'img-fluid';
    previewContent.appendChild(img);
  } else if(file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')){
    const iframe = document.createElement('iframe'); 
    iframe.src = url; 
    iframe.className = 'w-100';
    iframe.style.height = '600px';
    previewContent.appendChild(iframe);
  } else {
    const p = document.createElement('div'); 
    p.className = 'alert alert-info';
    p.textContent = `File selected: ${file.name}`; 
    previewContent.appendChild(p);
  }
  previewModal.show();
  if(resumeNameInput) resumeNameInput.value = file.name.replace(/\.[^/.]+$/, '');
}

confirmUpload?.addEventListener('click', async ()=>{
  if(!selectedFile) return;
  try{
    await doUpload(selectedFile);
  }catch(err){
    alert('Upload failed: ' + (err.message || err));
  }
});

async function doUpload(file){
  const fd = new FormData(); 
  fd.append('resume', file);
  if(resumeNameInput && resumeNameInput.value) fd.append('name', resumeNameInput.value);
  
  try{
    const resp = await fetch('/api/resumes', { method:'POST', body: fd });
    if(!resp.ok){ 
      const data = await resp.json().catch(()=>({})); 
      throw new Error(data?.error || 'Upload failed'); 
    }
    previewModal.hide();
    selectedFile = null; 
    if (fileInput) fileInput.value = '';
    await loadResumes();
  }catch(err){
    alert('Upload failed: ' + (err.message||err));
    throw err;
  }
}

async function openResumePreview(record){
  if (!previewContent) return;
  previewContent.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
  
  let url = null;
  try{
    const resp = await fetch(record.Url || record.url);
    if(!resp.ok) throw new Error('Failed to fetch file');
    const blob = await resp.blob();
    url = URL.createObjectURL(blob);
  }catch(err){ 
    previewContent.innerHTML = '<div class="alert alert-danger">Could not load preview: ' + err.message + '</div>';
    return; 
  }
  
  previewContent.innerHTML = '';
  const lower = (record.FileName || record.fileName || '').toLowerCase();
  if(lower.match(/\.(png|jpe?g|gif|bmp|webp)$/)){
    const img = document.createElement('img'); 
    img.src = url; 
    img.className = 'img-fluid';
    previewContent.appendChild(img);
  } else if(lower.endsWith('.pdf')){
    const iframe = document.createElement('iframe'); 
    iframe.src = url; 
    iframe.className = 'w-100';
    iframe.style.height = '600px';
    previewContent.appendChild(iframe);
  } else {
    const p = document.createElement('div'); 
    p.className = 'alert alert-info';
    p.textContent = record.displayName || record.originalName; 
    previewContent.appendChild(p);
  }
  previewModal.show();
}

async function deleteResume(id) {
  if (!confirm('Delete this resume?')) return;
  try {
    const resp = await fetch('/api/resumes/' + id, { method: 'DELETE' });
    if (resp.ok) {
      await loadResumes();
    } else {
      alert('Delete failed');
    }
  } catch (e) {
    alert('Delete failed: ' + (e.message || e));
  }
}

// Initialize resume functionality
document.addEventListener('DOMContentLoaded', function() {
  loadResumes();
});