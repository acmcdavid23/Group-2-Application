// Email Service for Job Posting Reminders
class EmailService {
  constructor() {
    this.isInitialized = false;
    this.init();
  }

  async init() {
    try {
      // Wait for EmailJS to be available
      if (typeof emailjs === 'undefined') {
        console.log('EmailJS not loaded yet, waiting...');
        await this.waitForEmailJS();
      }
      
      // Initialize EmailJS with your public key
      emailjs.init("X80istNGO-VJ1Q9zZ");
      this.isInitialized = true;
      console.log('EmailJS initialized successfully');
    } catch (error) {
      console.error('Failed to initialize EmailJS:', error);
    }
  }

  async waitForEmailJS() {
    return new Promise((resolve) => {
      const checkEmailJS = () => {
        if (typeof emailjs !== 'undefined') {
          resolve();
        } else {
          setTimeout(checkEmailJS, 100);
        }
      };
      checkEmailJS();
    });
  }

  async sendReminderEmail(posting, userEmail, reminderType = 'due_date') {
    if (!this.isInitialized) {
      console.error('EmailJS not initialized');
      return false;
    }

    if (!userEmail) {
      console.error('No user email provided');
      return false;
    }

    try {
      const templateParams = {
        to_email: userEmail,
        job_title: posting.title,
        company: posting.company,
        due_date: posting.dueDate,
        description: posting.description || 'No description provided',
        reminder_type: reminderType,
        days_until_due: this.calculateDaysUntilDue(posting.dueDate)
      };

      // Send email using EmailJS
      const result = await emailjs.send(
        'service_lk4nt0v',
        'template_a3kh9cp',
        templateParams
      );

      console.log('Reminder email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Failed to send reminder email:', error);
      return false;
    }
  }

  calculateDaysUntilDue(dueDate) {
    if (!dueDate) return 0;
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  async scheduleReminder(posting, userEmail, reminderDays = 7) {
    if (!posting.sendReminder || !userEmail) {
      return false;
    }

    const daysUntilDue = this.calculateDaysUntilDue(posting.dueDate);
    
    // Only send reminder if we're within the reminder window
    if (daysUntilDue <= reminderDays && daysUntilDue > 0) {
      return await this.sendReminderEmail(posting, userEmail, 'due_date');
    }
    
    return false;
  }

  async sendTestEmail(userEmail) {
    const testPosting = {
      title: 'Test Job Posting',
      company: 'Test Company',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      description: 'This is a test email to verify email reminders are working correctly.'
    };

    return await this.sendReminderEmail(testPosting, userEmail, 'test');
  }
}

// Create global instance
window.emailService = new EmailService();

// Helper function to get user settings
function getUserEmailSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem('appSettings')) || {};
    return {
      emailReminders: settings.emailReminders || false,
      userEmail: settings.userEmail || '',
      reminderDays: settings.reminderDays || 7,
      reminderTime: settings.reminderTime || '09:00'
    };
  } catch (error) {
    console.error('Failed to load user settings:', error);
    return {
      emailReminders: false,
      userEmail: '',
      reminderDays: 7,
      reminderTime: '09:00'
    };
  }
}

// Helper function to check if reminder should be sent
function shouldSendReminder(posting, userSettings) {
  if (!userSettings.emailReminders || !userSettings.userEmail || !posting.sendReminder) {
    return false;
  }

  if (!posting.dueDate) {
    return false;
  }

  const daysUntilDue = window.emailService.calculateDaysUntilDue(posting.dueDate);
  return daysUntilDue <= userSettings.reminderDays && daysUntilDue > 0;
}

// Export for use in other scripts
window.getUserEmailSettings = getUserEmailSettings;
window.shouldSendReminder = shouldSendReminder;
