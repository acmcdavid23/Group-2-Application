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
    // Update CSS custom properties for dark mode - GitHub-like colors
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
    
    // Force dark mode on application hub
    this.updateElements('.application-hub', {
      background: '#0d1117 !important'
    });
    
    // Force dark mode on hub panels
    this.updateElements('.hub-panel', {
      background: '#161b22 !important',
      borderColor: '#30363d !important'
    });
    
    // Force dark mode on panel content
    this.updateElements('.panel-content', {
      background: '#161b22 !important',
      color: '#f0f6fc !important'
    });
    
    // Force dark mode on panel headers
    this.updateElements('.panel-header', {
      background: '#21262d !important',
      color: '#f0f6fc !important',
      borderBottomColor: '#30363d !important'
    });
    
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
      background: '#da3633',
      color: '#ffffff',
      borderColor: '#da3633'
    });
    
    // Update specific AI Assistant buttons
    this.updateElements('.ai-actions button', {
      background: '#238636 !important',
      color: '#ffffff !important',
      borderColor: '#238636 !important'
    });
    
    this.updateElements('.ai-actions button:hover', {
      background: '#2ea043 !important',
      borderColor: '#2ea043 !important'
    });
    
    // Update add job button
    this.updateElements('.add-job-btn', {
      background: '#238636 !important',
      color: '#ffffff !important',
      borderColor: '#238636 !important'
    });
    
    this.updateElements('.add-job-btn:hover', {
      background: '#2ea043 !important',
      borderColor: '#2ea043 !important'
    });
    
    // Update btn-primary and btn-secondary classes
    this.updateElements('.btn-primary', {
      background: '#238636 !important',
      color: '#ffffff !important',
      borderColor: '#238636 !important'
    });
    
    this.updateElements('.btn-primary:hover', {
      background: '#2ea043 !important',
      borderColor: '#2ea043 !important'
    });
    
    this.updateElements('.btn-secondary', {
      background: '#21262d !important',
      color: '#ffffff !important',
      borderColor: '#30363d !important'
    });
    
    this.updateElements('.btn-secondary:hover', {
      background: '#30363d !important',
      borderColor: '#30363d !important'
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
    this.updateElements('.hamburger-btn', {
      background: 'rgba(22, 27, 34, 0.9)',
      color: '#f0f6fc',
      borderColor: '#30363d'
    });
    
    this.updateElements('.hamburger-btn:hover', {
      background: '#21262d',
      color: '#ffffff'
    });
    
    this.updateElements('.hamburger-menu-content', {
      background: '#161b22',
      borderColor: '#30363d',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
    });
    
    this.updateElements('.hamburger-menu-item', {
      color: '#f0f6fc',
      background: 'transparent'
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
    
    this.updateElements('.hamburger-menu-item.logout', {
      color: '#f85149',
      borderTopColor: '#30363d'
    });
    
    this.updateElements('.hamburger-menu-item.logout:hover', {
      background: '#da3633',
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
      background: '#0d1117',
      borderColor: '#30363d',
      color: '#f0f6fc'
    });
    
    this.updateElements('.login-card', {
      background: 'rgba(22, 27, 34, 0.95)',
      borderColor: '#30363d',
      color: '#f0f6fc'
    });
    
    this.updateElements('.login-container h1, .signup-container h1', {
      color: '#f0f6fc'
    });
    
    this.updateElements('.login-logo', {
      background: 'linear-gradient(135deg, #58a6ff 0%, #79c0ff 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    });
    
    this.updateElements('.login-subtitle', {
      color: '#8b949e'
    });
    
    this.updateElements('.form-group label', {
      color: '#f0f6fc'
    });
    
    this.updateElements('.form-group input', {
      background: '#21262d',
      borderColor: '#30363d',
      color: '#f0f6fc'
    });
    
    this.updateElements('.form-group input:focus', {
      borderColor: '#58a6ff',
      boxShadow: '0 0 0 3px rgba(88, 166, 255, 0.1)'
    });
    
    this.updateElements('.login-actions button', {
      background: '#238636',
      borderColor: '#238636',
      color: '#ffffff'
    });
    
    this.updateElements('.login-actions button:hover', {
      background: '#2ea043',
      borderColor: '#2ea043'
    });
    
    this.updateElements('.login-footer a', {
      color: '#58a6ff'
    });
    
    this.updateElements('.login-footer a:hover', {
      color: '#79c0ff'
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
      background: '#238636 !important',
      borderColor: '#238636 !important',
      color: '#ffffff !important'
    });
    
    this.updateElements('.help-btn:hover', {
      background: '#2ea043 !important',
      borderColor: '#2ea043 !important'
    });
    
    // Update panel headers and text
    this.updateElements('.panel-header', {
      background: '#21262d',
      color: '#f0f6fc'
    });
    
    // Update context info boxes
    this.updateElements('.context-info', {
      background: '#0d4429',
      borderColor: '#238636',
      color: '#7ee787'
    });
    
    // Update AI prompt and response areas
    this.updateElements('.ai-prompt-area', {
      background: '#21262d',
      borderColor: '#30363d',
      color: '#f0f6fc'
    });
    
    this.updateElements('.ai-response-area', {
      background: '#161b22',
      borderColor: '#30363d',
      color: '#f0f6fc'
    });
    
    // Update empty state text
    this.updateElements('.empty-state', {
      color: '#8b949e'
    });
    
    this.updateElements('.empty-state h3', {
      color: '#f0f6fc'
    });
    
    // Update status badges
    this.updateElements('.status-badge', {
      color: '#ffffff'
    });
    
    // Update description and due date indicators
    this.updateElements('.description-indicator', {
      background: '#0d4429',
      color: '#7ee787',
      borderColor: '#238636'
    });
    
    this.updateElements('.due-date-indicator', {
      background: '#7d4e00',
      color: '#f0b72f',
      borderColor: '#f0b72f'
    });
    
    // Update notification elements
    this.updateElements('.notification', {
      background: '#161b22',
      color: '#ffffff',
      borderColor: '#30363d'
    });
    
    // Update specific text elements (more targeted)
    this.updateElements('.job-content h4, .resume-item h4', {
      color: '#f0f6fc'
    });
    
    this.updateElements('.job-content p, .resume-item p', {
      color: '#8b949e'
    });
    
    // Update all remaining text elements to ensure proper contrast
    this.updateElements('h1, h2, h3, h4, h5, h6', {
      color: '#f0f6fc'
    });
    
    this.updateElements('p, span, div, li', {
      color: '#8b949e'
    });
    
    this.updateElements('strong, b', {
      color: '#f0f6fc'
    });
    
    this.updateElements('small', {
      color: '#6e7681'
    });
    
    // Update any remaining white backgrounds to dark
    this.updateElements('*', {
      backgroundColor: 'transparent'
    });
    
    // Force dark backgrounds for common elements
    this.updateElements('.content, .main-content, .page-content', {
      background: '#0d1117',
      color: '#f0f6fc'
    });
    
    this.updateElements('.sidebar, .nav, .navigation', {
      background: '#161b22',
      color: '#f0f6fc'
    });
    
    this.updateElements('.footer', {
      background: '#161b22',
      color: '#8b949e'
    });
    
    // Force dark mode on all inline styled elements
    this.updateElements('*[style*="background: white"]', {
      background: '#161b22 !important'
    });
    
    this.updateElements('*[style*="background: #f3f4f6"]', {
      background: '#21262d !important'
    });
    
    this.updateElements('*[style*="color: #374151"]', {
      color: '#f0f6fc !important'
    });
    
    this.updateElements('*[style*="color: #6b7280"]', {
      color: '#8b949e !important'
    });
    
    this.updateElements('*[style*="border: 1px solid #d1d5db"]', {
      borderColor: '#30363d !important'
    });
    
    this.updateElements('*[style*="border: 2px solid #6b7280"]', {
      borderColor: '#30363d !important'
    });
    
    // Update AI Assistant specific elements
    this.updateElements('.ai-step', {
      background: '#161b22 !important',
      borderColor: '#30363d !important',
      color: '#f0f6fc !important'
    });
    
    this.updateElements('.ai-step-header', {
      background: '#21262d !important',
      color: '#f0f6fc !important'
    });
    
    this.updateElements('.ai-ready-box', {
      background: '#161b22 !important',
      borderColor: '#30363d !important',
      color: '#f0f6fc !important'
    });
    
    this.updateElements('.ai-info-box', {
      background: '#0d4429 !important',
      borderColor: '#238636 !important',
      color: '#7ee787 !important'
    });
    
    this.updateElements('.ai-prompt-textarea', {
      background: '#21262d !important',
      borderColor: '#30363d !important',
      color: '#f0f6fc !important'
    });
    
    this.updateElements('.ai-response-textarea', {
      background: '#161b22 !important',
      borderColor: '#30363d !important',
      color: '#f0f6fc !important'
    });
    
    // Update empty states
    this.updateElements('.empty-state', {
      color: '#8b949e'
    });
    
    this.updateElements('.empty-state h3', {
      color: '#f0f6fc'
    });
    
    // Update drag and drop area
    this.updateElements('.upload-area', {
      background: '#161b22 !important',
      borderColor: '#30363d !important',
      color: '#8b949e !important'
    });
    
    this.updateElements('.upload-area:hover', {
      borderColor: '#238636 !important',
      background: '#21262d !important'
    });
    
    // Update file upload area
    this.updateElements('.file-upload-area', {
      background: '#161b22 !important',
      borderColor: '#30363d !important',
      color: '#8b949e !important'
    });
    
    this.updateElements('.file-upload-area:hover', {
      borderColor: '#238636 !important',
      background: '#21262d !important'
    });
    
    // Force dark mode on all divs with inline styles
    this.updateElements('div[style]', {
      background: '#161b22 !important',
      color: '#f0f6fc !important'
    });
    
    // Override specific inline styles
    this.updateElements('*[style*="background: #dbeafe"]', {
      background: '#0d4429 !important',
      borderColor: '#238636 !important'
    });
    
    this.updateElements('*[style*="color: #1e40af"]', {
      color: '#7ee787 !important'
    });
    
    this.updateElements('*[style*="color: #0c4a6e"]', {
      color: '#7ee787 !important'
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
    this.resetElements('.hamburger-btn', {
      background: 'rgba(255, 255, 255, 0.9)',
      color: '#2d3748',
      borderColor: 'transparent'
    });
    
    this.resetElements('.hamburger-btn:hover', {
      background: 'white',
      color: '#2d3748'
    });
    
    this.resetElements('.hamburger-menu-content', {
      background: 'white',
      borderColor: '#e2e8f0',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
    });
    
    this.resetElements('.hamburger-menu-item', {
      color: '#4a5568',
      background: 'transparent'
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
    
    this.resetElements('.hamburger-menu-item.logout', {
      color: '#4a5568',
      borderTopColor: '#e2e8f0'
    });
    
    this.resetElements('.hamburger-menu-item.logout:hover', {
      background: '#fed7d7',
      color: '#c53030'
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderColor: '#e2e8f0',
      color: '#1a202c'
    });
    
    this.resetElements('.login-card', {
      background: 'rgba(255, 255, 255, 0.95)',
      borderColor: 'rgba(255,255,255,0.3)',
      color: '#1a202c'
    });
    
    this.resetElements('.login-container h1, .signup-container h1', {
      color: '#1a202c'
    });
    
    this.resetElements('.login-logo', {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    });
    
    this.resetElements('.login-subtitle', {
      color: '#64748b'
    });
    
    this.resetElements('.form-group label', {
      color: '#1a202c'
    });
    
    this.resetElements('.form-group input', {
      background: 'white',
      borderColor: '#d1d5db',
      color: '#1a202c'
    });
    
    this.resetElements('.form-group input:focus', {
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    });
    
    this.resetElements('.login-actions button', {
      background: '#3b82f6',
      borderColor: '#3b82f6',
      color: 'white'
    });
    
    this.resetElements('.login-actions button:hover', {
      background: '#2563eb',
      borderColor: '#2563eb'
    });
    
    this.resetElements('.login-footer a', {
      color: '#3b82f6'
    });
    
    this.resetElements('.login-footer a:hover', {
      color: '#2563eb'
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
      background: '#3b82f6 !important',
      borderColor: '#3b82f6 !important',
      color: 'white !important'
    });
    
    this.resetElements('.help-btn:hover', {
      background: '#2563eb !important',
      borderColor: '#2563eb !important'
    });
    
    // Reset panel headers and text
    this.resetElements('.panel-header', {
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      color: '#2d3748'
    });
    
    // Reset context info boxes
    this.resetElements('.context-info', {
      background: '#f0f9ff',
      borderColor: '#0ea5e9',
      color: '#0369a1'
    });
    
    // Reset AI prompt and response areas
    this.resetElements('.ai-prompt-area', {
      background: '#f8fafc',
      borderColor: '#e2e8f0',
      color: '#1e293b'
    });
    
    this.resetElements('.ai-response-area', {
      background: 'white',
      borderColor: '#e2e8f0',
      color: '#1e293b'
    });
    
    // Reset empty state text
    this.resetElements('.empty-state', {
      color: '#718096'
    });
    
    this.resetElements('.empty-state h3', {
      color: '#4a5568'
    });
    
    // Reset status badges
    this.resetElements('.status-badge', {
      color: 'white'
    });
    
    // Reset description and due date indicators
    this.resetElements('.description-indicator', {
      background: '#e6f3ff',
      color: '#2563eb',
      borderColor: '#bfdbfe'
    });
    
    this.resetElements('.due-date-indicator', {
      background: '#fef3c7',
      color: '#92400e',
      borderColor: '#f59e0b'
    });
    
    // Reset notification elements
    this.resetElements('.notification', {
      background: 'white',
      color: '#1a202c',
      borderColor: '#e2e8f0'
    });
    
    // Reset specific text elements (more targeted)
    this.resetElements('.job-content h4, .resume-item h4', {
      color: '#1e293b'
    });
    
    this.resetElements('.job-content p, .resume-item p', {
      color: '#64748b'
    });
    
    // Reset all remaining text elements
    this.resetElements('h1, h2, h3, h4, h5, h6', {
      color: '#1a202c'
    });
    
    this.resetElements('p, span, div, li', {
      color: '#4a5568'
    });
    
    this.resetElements('strong, b', {
      color: '#1a202c'
    });
    
    this.resetElements('small', {
      color: '#718096'
    });
    
    // Reset common elements
    this.resetElements('.content, .main-content, .page-content', {
      background: '#f8fafc',
      color: '#1a202c'
    });
    
    this.resetElements('.sidebar, .nav, .navigation', {
      background: 'white',
      color: '#1a202c'
    });
    
    this.resetElements('.footer', {
      background: '#f8fafc',
      color: '#4a5568'
    });
    
    // Reset application hub
    this.resetElements('.application-hub', {
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important'
    });
    
    this.resetElements('.hub-panel', {
      background: 'white !important',
      borderColor: '#e2e8f0 !important'
    });
    
    this.resetElements('.panel-content', {
      background: 'white !important',
      color: '#1a202c !important'
    });
    
    this.resetElements('.panel-header', {
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important',
      color: '#2d3748 !important',
      borderBottomColor: '#e2e8f0 !important'
    });
    
    // Reset AI Assistant specific elements
    this.resetElements('.ai-step', {
      background: 'white',
      borderColor: '#e2e8f0',
      color: '#1a202c'
    });
    
    this.resetElements('.ai-step-header', {
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      color: '#2d3748'
    });
    
    this.resetElements('.ai-ready-box', {
      background: 'white',
      borderColor: '#e2e8f0',
      color: '#1a202c'
    });
    
    this.resetElements('.ai-info-box', {
      background: '#f0f9ff',
      borderColor: '#0ea5e9',
      color: '#0369a1'
    });
    
    this.resetElements('.ai-prompt-textarea', {
      background: 'white',
      borderColor: '#d1d5db',
      color: '#1a202c'
    });
    
    this.resetElements('.ai-response-textarea', {
      background: 'white',
      borderColor: '#d1d5db',
      color: '#1a202c'
    });
    
    // Reset drag and drop area
    this.resetElements('.upload-area', {
      background: 'white !important',
      borderColor: '#d1d5db !important',
      color: '#64748b !important'
    });
    
    this.resetElements('.upload-area:hover', {
      borderColor: '#3b82f6 !important',
      background: '#f8fafc !important'
    });
    
    // Reset file upload area
    this.resetElements('.file-upload-area', {
      background: '#f8fafc !important',
      borderColor: '#cbd5e0 !important',
      color: '#4a5568 !important'
    });
    
    this.resetElements('.file-upload-area:hover', {
      borderColor: '#3b82f6 !important',
      background: '#f1f5f9 !important'
    });
    
    // Reset btn-primary and btn-secondary classes
    this.resetElements('.btn-primary', {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important',
      color: 'white !important',
      borderColor: 'transparent !important'
    });
    
    this.resetElements('.btn-primary:hover', {
      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%) !important'
    });
    
    this.resetElements('.btn-secondary', {
      background: '#f8fafc !important',
      color: '#4a5568 !important',
      borderColor: '#e2e8f0 !important'
    });
    
    this.resetElements('.btn-secondary:hover', {
      background: '#e2e8f0 !important'
    });
    
    // Reset all inline styled elements
    this.resetElements('*[style*="background: white"]', {
      background: 'white !important'
    });
    
    this.resetElements('*[style*="background: #f3f4f6"]', {
      background: '#f3f4f6 !important'
    });
    
    this.resetElements('*[style*="color: #374151"]', {
      color: '#374151 !important'
    });
    
    this.resetElements('*[style*="color: #6b7280"]', {
      color: '#6b7280 !important'
    });
    
    this.resetElements('*[style*="border: 1px solid #d1d5db"]', {
      borderColor: '#d1d5db !important'
    });
    
    this.resetElements('*[style*="border: 2px solid #6b7280"]', {
      borderColor: '#6b7280 !important'
    });
    
    this.resetElements('*[style*="background: #dbeafe"]', {
      background: '#dbeafe !important',
      borderColor: '#3b82f6 !important'
    });
    
    this.resetElements('*[style*="color: #1e40af"]', {
      color: '#1e40af !important'
    });
    
    this.resetElements('*[style*="color: #0c4a6e"]', {
      color: '#0c4a6e !important'
    });
    
    this.resetElements('div[style]', {
      background: 'white !important',
      color: '#1a202c !important'
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

