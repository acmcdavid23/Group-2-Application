# 📧 Email Setup Guide

## Option 1: EmailJS (Recommended - Easiest)

### Step 1: Create EmailJS Account
1. Go to [emailjs.com](https://www.emailjs.com)
2. Sign up for a free account
3. Verify your email address

### Step 2: Add Email Service
1. In EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions
5. **Copy your Service ID** (e.g., `service_abc123`)

### Step 3: Create Email Template
1. Go to "Email Templates" in EmailJS dashboard
2. Click "Create New Template"
3. Use this template content:

```
Subject: {{subject}}

Hello {{to_name}},

{{message}}

Job Details:
- Position: {{job_title}}
- Company: {{company_name}}
- Due Date: {{due_date}}

Best regards,
{{from_name}}
```

4. **Copy your Template ID** (e.g., `template_xyz789`)

### Step 4: Get Public Key
1. Go to "Account" → "General"
2. **Copy your Public Key** (e.g., `user_abc123def456`)

### Step 5: Update the Code
Replace these values in `wwwroot/main.js`:

```javascript
const serviceId = 'YOUR_SERVICE_ID';        // Replace with your Service ID
const templateId = 'YOUR_TEMPLATE_ID';      // Replace with your Template ID  
const publicKey = 'YOUR_PUBLIC_KEY';        // Replace with your Public Key
```

### Step 6: Test
1. Add a job posting with email notifications enabled
2. Click the "📧 Email" button
3. Check your email inbox!

---

## Option 2: Backend Email Service

### Using SMTP (More Complex)
If you want to use your own email server:

1. **Install nodemailer** (if using Node.js backend):
```bash
npm install nodemailer
```

2. **Update Program.cs** with real SMTP settings:
```csharp
class EmailService
{
    public async Task SendEmailAsync(string to, string subject, string body)
    {
        // Add your SMTP configuration here
        // Example for Gmail:
        // - SMTP Server: smtp.gmail.com
        // - Port: 587
        // - Username: your-email@gmail.com
        // - Password: your-app-password
    }
}
```

---

## Option 3: Third-Party Services

### SendGrid
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Get API key
3. Update backend to use SendGrid API

### Mailgun
1. Sign up at [mailgun.com](https://mailgun.com)
2. Get API credentials
3. Update backend accordingly

---

## 🎯 Recommended: EmailJS

**EmailJS is the easiest option because:**
- ✅ No backend changes needed
- ✅ Works directly from frontend
- ✅ Free tier available
- ✅ Easy to set up
- ✅ Secure and reliable

**Just follow the EmailJS steps above and you'll have working emails in minutes!**
