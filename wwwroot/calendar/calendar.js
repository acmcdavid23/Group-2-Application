// Calendar rendering isolated in its own file to avoid merge conflicts
window.calendar = null;
window.renderCalendar = function(posts){
  const calendarEl = document.getElementById('calendar'); if(!calendarEl) return; calendarEl.innerHTML = '';
  if(window.calendar) window.calendar.destroy();
  window.calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    height: 600,
    events: posts.filter(p=>p.dueDate).map(p=>({ title: p.title + ' - ' + p.company, start: p.dueDate, extendedProps: p }))
  });
  window.calendar.render();
};
