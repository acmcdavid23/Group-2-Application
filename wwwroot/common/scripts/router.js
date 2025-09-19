// Router and navigation utilities
// Simple navigation helper for single-page app features
function navigateToFeature(feature) {
    const featurePages = {
        'resume': '/features/resume/pages/resume.html',
        'calendar': '/features/calendar/pages/calendar.html',
        'jobs': '/features/jobs/pages/jobs.html'
    };
    
    if (featurePages[feature]) {
        window.location.href = featurePages[feature];
    }
}

// Initialize common functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add any common initialization code here
    console.log('Common router initialized');
});
