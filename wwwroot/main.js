const api = (path, opts) => fetch(path, opts).then(r=>{ if(!r.ok) return r.json().then(e=>{throw e}); return r.json(); });

const uploadForm = document.getElementById('uploadForm');
const fileInput = uploadForm.elements['resume'];
const previewModal = document.getElementById('previewModal');
const previewContent = document.getElementById('previewContent');
const cancelPreview = document.getElementById('cancelPreview');
const confirmUpload = document.getElementById('confirmUpload');
const resumeNameInput = document.getElementById('resumeName');
let selectedFile = null;

// --- IndexedDB helpers to persist local resumes across reloads ---
// Note: local IndexedDB fallback removed - uploads must persist to server

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
    // No local fallback by design
    alert('Upload failed and local fallback is disabled: ' + (err.message || err));
  }
});

async function loadResumes(){
  // Only server-side persisted resumes are listed
  let serverRes = [];
  try{ serverRes = await api('/api/resumes'); }catch(e){ serverRes = []; }
  const container = document.getElementById('resumes'); container.innerHTML='';
  serverRes.forEach(r=>{
    const title = r.DisplayName || r.OriginalName || r.originalName;
    const d = document.createElement('div'); d.className='resume';
    const left = document.createElement('div'); left.className = 'resume-left';
    const a = document.createElement('a'); a.href = '#'; a.textContent = title; a.addEventListener('click',(e)=>{ e.preventDefault(); openResumePreview(r); });
    left.appendChild(a);
    const badge = document.createElement('span'); badge.className = 'badge saved'; badge.textContent = 'Saved'; left.appendChild(badge);
    d.appendChild(left);
    const right = document.createElement('div'); right.className = 'resume-right';
    const meta = document.createElement('small'); meta.textContent = new Date(r.CreatedAt || r.createdAt).toLocaleString(); right.appendChild(meta);
    const del = document.createElement('button'); del.className = 'btn btn-sm danger'; del.textContent = 'Delete';
    del.addEventListener('click', async ()=>{
      if(!confirm('Delete this resume?')) return;
      try{ await fetch('/api/resumes/'+r.Id, { method: 'DELETE' }); await loadResumes(); }catch(e){ alert('Delete failed: '+(e.message||e)); }
    });
    right.appendChild(del);
    d.appendChild(right);
    container.appendChild(d);
  });
}

document.getElementById('postingForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const body = { title: e.target.title.value, company: e.target.company.value, url: e.target.url.value, dueDate: e.target.due_date.value };
  await fetch('/api/postings', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(body) });
  e.target.reset();
  loadPostings();
});

let calendar;
async function loadPostings(){
  const posts = await api('/api/postings');
  const container = document.getElementById('postings'); container.innerHTML='';
  posts.forEach(p=>{
    const el = document.createElement('div'); el.className='posting';
    el.innerHTML = `<strong>${p.title}</strong> @ ${p.company} - due ${p.dueDate || 'N/A'} <button data-id="${p.id}">Tailor Resume</button>`;
    el.querySelector('button').addEventListener('click', ()=> tailor(p));
    container.appendChild(el);
  });
  renderCalendar(posts);
}

async function tailor(post){
  const resumes = await api('/api/resumes');
  if(!resumes.length) return alert('Upload a resume first');
  const resumeId = resumes[0].id;
  const resp = await api('/api/tailor', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ postingUrl: post.url || post.title, resumeId }) });
  alert('Tailored keywords: ' + resp.keywords.join(', '));
}

function renderCalendar(posts){
  const calendarEl = document.getElementById('calendar'); calendarEl.innerHTML='';
  if(calendar) calendar.destroy();
  calendar = new FullCalendar.Calendar(calendarEl, { initialView: 'dayGridMonth', height: 600, events: posts.filter(p=>p.dueDate).map(p=>({ title: p.title + ' - ' + p.company, start: p.dueDate, extendedProps: p })) });
  calendar.render();
}

loadResumes(); loadPostings();

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
  // No local fallback by design
  alert('Upload failed and local fallback is disabled: ' + (err.message || err));
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
// No local resume persistence; load server resumes immediately
loadResumes();

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
