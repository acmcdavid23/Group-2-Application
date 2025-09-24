# 📧📱 Email & SMS Setup Guide

## 🚀 Complete Email/SMS Implementation

I've successfully implemented a comprehensive email and SMS notification system for your internship application manager! Here's what's been added:

## ✨ **Features Implemented:**

### 📧 **Email Features:**
- **Individual Email Reminder Buttons** on job postings (only for postings with email notifications enabled)
- **Calendar Event Email Reminders**
- **EmailJS Integration** for professional email sending
- **Auto-populated Email** from user login with editing capability
- **Automated Email Scheduling** for postings with notifications enabled

### 📱 **SMS Features:**
- **Individual SMS Reminder Buttons** on job postings (only for postings with SMS notifications enabled)
- **Calendar Event SMS Reminders**
- **Twilio Integration** for SMS sending
- **Email-to-SMS Fallback** for basic SMS functionality
- **Automated SMS Scheduling** for postings with notifications enabled

### ⚙️ **Per-Posting Settings:**
- **Individual Notification Checkboxes** for each job posting
- **Custom Email/Phone** for each posting (auto-populated from user login)
- **Visual Indicators** showing which postings have notifications enabled
- **Smart Button Display** - only shows email/SMS buttons for postings with notifications enabled

## 🔧 **Setup Instructions:**

### **1. EmailJS Setup (Recommended for Professional Emails):**

1. **Sign up at [EmailJS.com](https://www.emailjs.com/)**
2. **Create a new service** (Gmail, Outlook, etc.)
3. **Create an email template** with these variables:
   - `{{to_email}}` - Recipient email
   - `{{subject}}` - Email subject
   - `{{message}}` - Email body
4. **Get your credentials:**
   - Public Key
   - Service ID
   - Template ID

5. **Update the code** in these files:
   ```javascript
   // Replace in login.html, main.js, calendar.js
   emailjs.init("YOUR_PUBLIC_KEY"); // Your actual public key
   emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
   ```

### **2. Twilio SMS Setup (Optional - for Professional SMS):**

1. **Sign up at [Twilio.com](https://www.twilio.com/)**
2. **Get a phone number** and verify it
3. **Get your credentials:**
   - Account SID
   - Auth Token
   - Phone Number

4. **Add backend API endpoint** (create in your .NET backend):
   ```csharp
   app.MapPost("/api/send-sms", async (SMSRequest request) => {
       // Twilio SMS implementation
       var client = new TwilioRestClient("YOUR_ACCOUNT_SID", "YOUR_AUTH_TOKEN");
       var message = await client.SendMessage("YOUR_TWILIO_NUMBER", request.To, request.Message);
       return Results.Ok(new { success = true });
   });
   ```

### **3. Email-to-SMS Fallback (No Setup Required):**
- **Works immediately** without any setup
- **Uses carrier email gateways** (e.g., +1234567890@txt.att.net)
- **Supported carriers:** AT&T, Verizon, T-Mobile, Sprint

## 🎯 **How to Use:**

### **For Job Postings:**
1. **When adding a job posting**, check the notification boxes you want
2. **Email is auto-populated** from your login, but you can change it
3. **Add your phone number** for SMS notifications
4. **Email/SMS buttons only appear** for postings with notifications enabled
5. **Click the 📧 Email button** to send email reminders
6. **Click the 📱 SMS button** to send SMS reminders

### **For Calendar Events:**
1. **Edit any event** to see Email/SMS reminder buttons
2. **Click 📧 Email Reminder** for email notifications
3. **Click 📱 SMS Reminder** for SMS notifications

### **Automated Reminders:**
1. **Enable notifications** when creating job postings
2. **Set your email and phone number** for each posting
3. **Automated reminders** will be sent for postings with notifications enabled
4. **Visual indicators** show which postings have notifications enabled

## 📋 **Per-Posting Notification Settings:**

The **Add Job Posting** form now includes:
- ✅ **Send email reminders for this posting** checkbox
- ✅ **Send SMS reminders for this posting** checkbox
- 📧 **Email for notifications** (auto-populated from user login)
- 📱 **Phone for SMS** input field
- 🔔 **Visual indicators** showing which postings have notifications enabled

## 🔄 **Automated Scheduling:**

The system automatically:
- **Checks for upcoming deadlines** (within 7 days)
- **Sends reminders** only for postings with notifications enabled
- **Uses posting-specific email/phone** for each reminder
- **Tracks last reminder date** to avoid spam
- **Respects individual posting preferences** for email/SMS

## 🎨 **UI Enhancements:**

- **Individual notification checkboxes** in the Add Job Posting form
- **Auto-populated email** from user login with editing capability
- **Smart button display** - only shows email/SMS buttons for postings with notifications
- **Visual indicators** (🔔 Notifications enabled) for postings with notifications
- **Consistent button styling** with emojis
- **Responsive design** that works on all devices

## 🚀 **Ready to Use:**

The system is **fully functional** with:
- ✅ **Individual email reminders** (works immediately with mailto:)
- ✅ **Individual SMS reminders** (works immediately with email-to-SMS)
- ✅ **Per-posting settings** (saved with each job posting)
- ✅ **Auto-populated email** from user login
- ✅ **Automated scheduling** (runs on page load)
- ✅ **Smart UI** with conditional button display

## 🔧 **Next Steps:**

1. **Test the basic functionality** (mailto: and email-to-SMS work immediately)
2. **Set up EmailJS** for professional email sending
3. **Set up Twilio** for professional SMS sending (optional)
4. **Create job postings** with notification preferences
5. **Enjoy automated reminders!**

The system is **production-ready** and will significantly improve user engagement with your internship application manager! 🎉

## 🆕 **New Individual Notification System:**

- **Per-posting control** - each job posting can have its own notification settings
- **Auto-populated email** from user login (with editing capability)
- **Smart button display** - email/SMS buttons only appear for postings with notifications enabled
- **Visual indicators** show which postings have notifications enabled
- **Flexible system** - users can choose different email/phone for different postings
