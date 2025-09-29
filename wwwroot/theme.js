// Global Theme Management
class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem('appTheme') || 'light';
    this.init();
  }
  
  init() {
    this.applyTheme(this.currentTheme);
  }
  
  setTheme(theme) {
    this.currentTheme = theme;
    localStorage.setItem('appTheme', theme);
    this.applyTheme(theme);
  }
  
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    if (theme === 'dark') {
      this.applyDarkMode();
    } else {
      this.applyLightMode();
    }
  }
  
  applyDarkMode() {
    // Update CSS custom properties for dark mode - modern system-like colors
    const root = document.documentElement;
    root.style.setProperty('--bg-color', '#0d1117');
    root.style.setProperty('--text-color', '#f0f6fc');
    root.style.setProperty('--card-bg', '#161b22');
    root.style.setProperty('--border-color', '#30363d');
    root.style.setProperty('--input-bg', '#21262d');
    root.style.setProperty('--input-border', '#30363d');
    root.style.setProperty('--button-bg', '#238636');
    root.style.setProperty('--button-hover', '#2ea043');
    root.style.setProperty('--success-bg', '#0d4429');
    root.style.setProperty('--success-text', '#7ee787');
    root.style.setProperty('--warning-bg', '#7d4e00');
    root.style.setProperty('--warning-text', '#f0b72f');
    
    // Apply dark mode to body and html
    document.documentElement.style.background = '#0d1117';
    document.body.style.background = '#0d1117';
    document.body.style.color = '#f0f6fc';
    
    // Update ALL headers (title headers)
    this.updateElements('.hub-header, .settings-header', {
      background: 'linear-gradient(135deg, #161b22 0%, #21262d 100%)',
      color: '#f0f6fc'
    });
    
    this.updateElements('.hub-header h1, .settings-header h1', {
      color: '#f0f6fc'
    });
    
    this.updateElements('.hub-header p, .settings-header p', {
      color: '#8b949e',
      opacity: '1'
    });
    
    // Update all panels and cards
    this.updateElements('.panel, .hub-panel, .settings-section', {
      background: '#161b22',
      borderColor: '#30363d',
      color: '#f0f6fc'
    });
    
    // Update job and resume items
    this.updateElements('.job-item, .resume-item', {
      background: '#161b22',
      borderColor: '#30363d',
      color: '#f0f6fc'
    });
    
    // Update ALL inputs and form elements
    this.updateElements('input, textarea, select, .email-display, .timing-select', {
      background: '#21262d',
      borderColor: '#30363d',
      color: '#ffffff'
    });
    
    // Update ALL buttons
    this.updateElements('.button, .btn, button', {
      background: '#238636',
      color: '#ffffff',
      borderColor: '#238636'
    });
    
    // Update button hover states
    this.updateElements('.button:hover, .btn:hover, button:hover', {
      background: '#2ea043',
      borderColor: '#2ea043'
    });
    
    // Update secondary buttons
    this.updateElements('.button.secondary', {
      background: '#21262d',
      color: '#ffffff',
      borderColor: '#30363d'
    });
    
    // Update danger buttons
    this.updateElements('.button.danger', {
      background: '#e53e3e',
      color: '#ffffff',
      borderColor: '#e53e3e'
    });
    
    // Update calendar elements
    this.updateElements('.calendar-grid, .day-cell, .week-event, .event, .calendar-control-panel', {
      background: '#161b22',
      borderColor: '#30363d',
      color: '#f0f6fc'
    });
    
    // Update calendar title
    this.updateElements('.calendar-title', {
      color: '#f0f6fc'
    });
    
    // Update modal elements
    this.updateElements('.modal, .modal-content, .help-modal', {
      background: '#161b22',
      borderColor: '#30363d',
      color: '#f0f6fc'
    });
    
    // Update hamburger menu
    this.updateElements('.hamburger-menu-content', {
      background: '#161b22',
      borderColor: '#30363d'
    });
    
    this.updateElements('.hamburger-menu-item', {
      color: '#f0f6fc'
    });
    
    
    this.updateElements('.hamburger-menu-item:hover', {
      background: '#21262d',
      color: '#ffffff'
    });
    
    this.updateElements('.hamburger-menu-item.active', {
      background: '#238636',
      color: '#ffffff'
    });
    
    this.updateElements('.hamburger-menu-item.active:hover', {
      background: '#2ea043',
      color: '#ffffff'
    });
    
    // Update stat cards
    this.updateElements('.stat-card', {
      background: '#21262d',
      borderColor: '#30363d',
      color: '#ffffff'
    });
    
    // Update setting items
    this.updateElements('.setting-item', {
      borderColor: '#30363d'
    });
    
    this.updateElements('.setting-title', {
      color: '#ffffff'
    });
    
    this.updateElements('.setting-description', {
      color: '#8b949e'
    });
    
    // Update theme options
    this.updateElements('.theme-option', {
      borderColor: '#30363d',
      color: '#ffffff'
    });
    
    this.updateElements('.theme-option:hover', {
      borderColor: '#238636'
    });
    
    this.updateElements('.theme-option.active', {
      background: '#238636',
      borderColor: '#238636',
      color: '#ffffff'
    });
    
    // Update toggle switches
    this.updateElements('.toggle-switch', {
      background: '#21262d',
      color: '#8b949e'
    });
    
    this.updateElements('.toggle-switch.active', {
      background: '#10b981',
      color: '#ffffff'
    });
    
    // Update login page elements
    this.updateElements('.login-container, .signup-container', {
      background: '#161b22',
      borderColor: '#30363d',
      color: '#f0f6fc'
    });
    
    this.updateElements('.login-container h1, .signup-container h1', {
      color: '#f0f6fc'
    });
    
    // Update form labels
    this.updateElements('label', {
      color: '#ffffff'
    });
    
    // Update links
    this.updateElements('a', {
      color: '#58a6ff'
    });
    
    this.updateElements('a:hover', {
      color: '#79c0ff'
    });
    
    // Update help button
    this.updateElements('.help-btn', {
      background: '#238636',
      borderColor: '#238636',
      color: '#ffffff'
    });
    
    // Update notification elements
    this.updateElements('.notification', {
      background: '#161b22',
      color: '#ffffff',
      borderColor: '#30363d'
    });
    
    // Update any remaining text elements
    this.updateElements('h1, h2, h3, h4, h5, h6', {
      color: '#ffffff'
    });
    
    this.updateElements('p, span, div', {
      color: '#ffffff'
    });
  }
  
  applyLightMode() {
    // Reset to light mode
    const root = document.documentElement;
    root.style.setProperty('--bg-color', '#f8fafc');
    root.style.setProperty('--text-color', '#1a202c');
    root.style.setProperty('--card-bg', '#ffffff');
    root.style.setProperty('--border-color', '#e2e8f0');
    root.style.setProperty('--input-bg', '#ffffff');
    root.style.setProperty('--input-border', '#d1d5db');
    root.style.setProperty('--button-bg', '#3b82f6');
    root.style.setProperty('--button-hover', '#2563eb');
    root.style.setProperty('--success-bg', '#d1fae5');
    root.style.setProperty('--success-text', '#065f46');
    root.style.setProperty('--warning-bg', '#fef3c7');
    root.style.setProperty('--warning-text', '#92400e');
    
    // Reset body and html
    document.documentElement.style.background = '#f8fafc';
    document.body.style.background = '#f8fafc';
    document.body.style.color = '#1a202c';
    
    // Reset ALL headers (title headers)
    this.resetElements('.hub-header, .settings-header', {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
    
    this.resetElements('.hub-header h1, .settings-header h1', {
      color: 'white'
    });
    
    this.resetElements('.hub-header p, .settings-header p', {
      color: 'white',
      opacity: '0.9'
    });
    
    // Reset all panels and cards
    this.resetElements('.panel, .hub-panel, .settings-section', {
      background: 'white',
      borderColor: '#e2e8f0',
      color: '#1a202c'
    });
    
    // Reset job and resume items
    this.resetElements('.job-item, .resume-item', {
      background: 'white',
      borderColor: '#e2e8f0',
      color: '#1a202c'
    });
    
    // Reset ALL inputs and form elements
    this.resetElements('input, textarea, select, .email-display, .timing-select', {
      background: 'white',
      borderColor: '#d1d5db',
      color: '#1a202c'
    });
    
    // Reset ALL buttons
    this.resetElements('.button, .btn, button', {
      background: '#3b82f6',
      color: 'white',
      borderColor: '#3b82f6'
    });
    
    // Reset button hover states
    this.resetElements('.button:hover, .btn:hover, button:hover', {
      background: '#2563eb',
      borderColor: '#2563eb'
    });
    
    // Reset secondary buttons
    this.resetElements('.button.secondary', {
      background: '#e2e8f0',
      color: '#1a202c',
      borderColor: '#e2e8f0'
    });
    
    // Reset danger buttons
    this.resetElements('.button.danger', {
      background: '#e53e3e',
      color: 'white',
      borderColor: '#e53e3e'
    });
    
    // Reset calendar elements
    this.resetElements('.calendar-grid, .day-cell, .week-event, .event, .calendar-control-panel', {
      background: 'white',
      borderColor: '#e2e8f0',
      color: '#1a202c'
    });
    
    // Reset calendar title
    this.resetElements('.calendar-title', {
      color: '#1a202c'
    });
    
    // Reset modal elements
    this.resetElements('.modal, .modal-content, .help-modal', {
      background: 'white',
      borderColor: '#e2e8f0',
      color: '#1a202c'
    });
    
    // Reset hamburger menu
    this.resetElements('.hamburger-menu-content', {
      background: 'white',
      borderColor: '#e2e8f0'
    });
    
    this.resetElements('.hamburger-menu-item', {
      color: '#4a5568'
    });
    
    
    this.resetElements('.hamburger-menu-item:hover', {
      background: '#f7fafc',
      color: '#2d3748'
    });
    
    this.resetElements('.hamburger-menu-item.active', {
      background: '#3b82f6',
      color: 'white'
    });
    
    this.resetElements('.hamburger-menu-item.active:hover', {
      background: '#2563eb',
      color: 'white'
    });
    
    // Reset stat cards
    this.resetElements('.stat-card', {
      background: '#f8fafc',
      borderColor: '#e2e8f0',
      color: '#1a202c'
    });
    
    // Reset setting items
    this.resetElements('.setting-item', {
      borderColor: '#e2e8f0'
    });
    
    this.resetElements('.setting-title', {
      color: '#1a202c'
    });
    
    this.resetElements('.setting-description', {
      color: '#4a5568'
    });
    
    // Reset theme options
    this.resetElements('.theme-option', {
      borderColor: '#e2e8f0',
      color: '#1a202c'
    });
    
    this.resetElements('.theme-option:hover', {
      borderColor: '#3b82f6'
    });
    
    this.resetElements('.theme-option.active', {
      background: '#3b82f6',
      borderColor: '#3b82f6',
      color: 'white'
    });
    
    // Reset toggle switches
    this.resetElements('.toggle-switch', {
      background: '#d1d5db',
      color: '#6b7280'
    });
    
    this.resetElements('.toggle-switch.active', {
      background: '#10b981',
      color: '#ffffff'
    });
    
    // Reset login page elements
    this.resetElements('.login-container, .signup-container', {
      background: 'white',
      borderColor: '#e2e8f0',
      color: '#1a202c'
    });
    
    this.resetElements('.login-container h1, .signup-container h1', {
      color: '#1a202c'
    });
    
    // Reset form labels
    this.resetElements('label', {
      color: '#1a202c'
    });
    
    // Reset links
    this.resetElements('a', {
      color: '#3b82f6'
    });
    
    this.resetElements('a:hover', {
      color: '#2563eb'
    });
    
    // Reset help button
    this.resetElements('.help-btn', {
      background: '#3b82f6',
      borderColor: '#3b82f6',
      color: 'white'
    });
    
    // Reset notification elements
    this.resetElements('.notification', {
      background: 'white',
      color: '#1a202c',
      borderColor: '#e2e8f0'
    });
    
    // Reset any remaining text elements
    this.resetElements('h1, h2, h3, h4, h5, h6', {
      color: '#1a202c'
    });
    
    this.resetElements('p, span, div', {
      color: '#1a202c'
    });
  }
  
  updateElements(selector, styles) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      Object.assign(element.style, styles);
    });
  }
  
  resetElements(selector, styles) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      Object.assign(element.style, styles);
    });
  }
  
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  window.themeManager = new ThemeManager();
});

// Global functions for theme switching
function setTheme(theme) {
  if (window.themeManager) {
    window.themeManager.setTheme(theme);
  }
}

