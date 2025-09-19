// DOM helper functions
const api = (path, opts) => fetch(path, opts).then(r=>{ if(!r.ok) return r.json().then(e=>{throw e}); return r.json(); });

// Common DOM utilities
function createElement(tag, className, textContent) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (textContent) el.textContent = textContent;
    return el;
}

function showAlert(message, type = 'info') {
    alert(message); // Simple alert for now, can be enhanced with Bootstrap modals
}

function confirmAction(message) {
    return confirm(message);
}
