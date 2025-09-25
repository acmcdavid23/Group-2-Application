# Email Reminder Setup Guide

This guide will help you set up email reminders for job posting due dates using EmailJS.

## 📧 EmailJS Configuration

### Step 1: Create EmailJS Account
1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

### Step 2: Set Up Email Service
1. In your EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions for your provider
5. Note down your **Service ID**

### Step 3: Create Email Template
1. Go to "Email Templates" in your dashboard
2. Click "Create New Template"
3. Use this template content:

**Subject:** Job Application Reminder - {{job_title}} at {{company}}

**Body:**
```
Hello,

This is a reminder that you have a job application due soon:

Job Title: {{job_title}}
Company: {{company}}
Due Date: {{due_date}}
Days Until Due: {{days_until_due}}

Description:
{{description}}

Don't forget to submit your application on time!

Best regards,
Internship Application Manager
```

4. Save the template and note down your **Template ID**

### Step 4: Get Your Public Key
1. Go to "Account" in your EmailJS dashboard
2. Find your **Public Key** (also called User ID)
3. Copy this key

### Step 5: Update Configuration Files

Replace the following in your code:

**In `wwwroot/index.html` (line 601):**
```javascript
emailjs.init("X80istNGO-VJ1Q9zZ");
```

**In `wwwroot/settings.html` (line 154):**
```javascript
emailjs.init("X80istNGO-VJ1Q9zZ");
```

**In `wwwroot/email-service.js` (lines 43-44):**
```javascript
'service_lk4nt0v',
'template_a3kh9cp',
```

## 🔧 How It Works

### User Settings
- Users can enable/disable email reminders in Settings
- Users set their email address and preferred reminder time
- Users can configure how many days before due date to send reminders

### Reminder Logic
- When creating/editing a job posting, users can check "Send email reminder"
- If enabled and within the reminder window, an email is sent immediately
- Emails are sent using EmailJS with the configured template

### Email Template Variables
- `{{to_email}}` - User's email address
- `{{job_title}}` - Job posting title
- `{{company}}` - Company name
- `{{due_date}}` - Due date
- `{{description}}` - Job description
- `{{reminder_type}}` - Type of reminder (due_date, test)
- `{{days_until_due}}` - Days until due date

## 🧪 Testing

1. Go to Settings page
2. Enable "📧 Enable email reminders"
3. Enter your email address
4. Click "📧 Test Email" button
5. Check your inbox for the test email

## 🚀 Features

- ✅ Email reminders for job posting due dates
- ✅ User-configurable reminder settings
- ✅ Test email functionality
- ✅ Professional email templates
- ✅ Automatic reminder scheduling
- ✅ User-specific email addresses

## 🔒 Security Notes

- EmailJS handles email sending securely
- No email credentials are stored in the application
- All email configuration is done through EmailJS dashboard
- User email addresses are stored locally in browser settings

## 📝 Troubleshooting

### Common Issues:
1. **"EmailJS not initialized"** - Check that your public key is correct
2. **"Failed to send email"** - Verify your EmailJS service and template IDs
3. **"No user email provided"** - Make sure user has entered email in settings
4. **Emails not sending** - Check EmailJS dashboard for service status

### Debug Steps:
1. Open browser console (F12)
2. Check for error messages
3. Verify EmailJS configuration
4. Test with the "Test Email" button in settings

## 📞 Support

If you need help:
1. Check EmailJS documentation: https://www.emailjs.com/docs/
2. Verify your EmailJS account setup
3. Test with the built-in test email feature
