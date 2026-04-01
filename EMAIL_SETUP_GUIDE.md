# Email Setup Guide - Gmail SMTP Configuration

## 📧 **How to Configure Email Sending**

The system is configured to send invitation emails using Gmail's SMTP server. Follow these steps to enable email functionality.

---

## 🔧 **STEP 1: Get Gmail App Password**

### **Why App Password?**
Gmail requires an "App Password" for third-party applications to send emails securely. Your regular Gmail password won't work.

### **How to Generate App Password:**

1. **Go to Google Account Settings:**
   - Visit: https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → 2-Step Verification → App passwords

2. **Enable 2-Step Verification** (if not already enabled):
   - Go to: https://myaccount.google.com/security
   - Click "2-Step Verification"
   - Follow the setup process

3. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Enter name: `Drug Track & Trace`
   - Click **Generate**
   - **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

4. **Save the App Password:**
   - You'll use this in the `.env` file
   - **Important:** Remove spaces from the password when copying

---

## 🔧 **STEP 2: Configure Backend .env File**

### **Location:**
`backend/.env`

### **Configuration:**

Open `backend/.env` and update these lines:

```env
# Email Configuration (SMTP)
EMAIL_ENABLED=true                          # Change to 'true' to enable emails
EMAIL_HOST=smtp.gmail.com                   # Gmail SMTP server (don't change)
EMAIL_PORT=587                              # Gmail SMTP port (don't change)
EMAIL_USER=aiguru9873@gmail.com            # Your Gmail address
EMAIL_PASSWORD=abcdefghijklmnop            # Your 16-char app password (no spaces!)
EMAIL_USE_TLS=true                          # Use TLS encryption (don't change)
EMAIL_FROM_NAME=Drug Track & Trace         # Sender name in emails
```

### **Your Specific Configuration:**

Since you provided `aiguru9873@gmail.com`, update like this:

```env
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=aiguru9873@gmail.com
EMAIL_PASSWORD=YOUR_16_CHAR_APP_PASSWORD_HERE
EMAIL_USE_TLS=true
EMAIL_FROM_NAME=Drug Track & Trace
```

**Replace `YOUR_16_CHAR_APP_PASSWORD_HERE` with your actual app password!**

---

## 🔧 **STEP 3: Restart Backend Server**

After updating `.env`, restart the backend:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd backend
python app.py
```

---

## ✅ **STEP 4: Test Email Sending**

### **Test 1: Send Invitation (Email Disabled)**

With `EMAIL_ENABLED=false`, the system will print email content to console:

```bash
[EMAIL DISABLED] Would send email to manufacturer@example.com
Subject: You've been invited to join Drug Track & Trace as Manufacturer
Body: Hello, You have been invited...
```

### **Test 2: Send Invitation (Email Enabled)**

With `EMAIL_ENABLED=true`, the system will actually send the email:

```bash
[EMAIL SENT] Successfully sent email to manufacturer@example.com
```

### **Test 3: Check Recipient Inbox**

The invited user should receive an email with:
- Subject: "You've been invited to join Drug Track & Trace as [Role]"
- Formatted HTML email with instructions
- Role badge and company name
- Step-by-step setup instructions

---

## 🎯 **Email Flow in the System**

### **When Owner Sends Invitation:**

1. **Owner Dashboard** → Click "Send Invitation"
2. Fill form: email, role, company name
3. Click "Send Invitation"
4. **Backend:**
   - Creates invitation in database
   - Calls `email_service.send_invitation_email()`
   - If `EMAIL_ENABLED=true`: Sends actual email via Gmail SMTP
   - If `EMAIL_ENABLED=false`: Prints to console
5. **Frontend:** Shows success message

### **Email Content:**

**Plain Text Version:**
```
Hello,

You have been invited by owner@company.com to join the Drug Track & Trace system as a Manufacturer.
Company: XYZ Pharma Ltd

To complete your registration:
1. Open the Drug Track & Trace mobile app
2. Go to the Login screen
3. Enter your email: manufacturer@example.com
4. Click "Continue"
5. You will be prompted to set up your password and complete your profile

Your role: Manufacturer
Invited by: owner@company.com

Best regards,
Drug Track & Trace Team
```

**HTML Version:**
- Beautiful formatted email with colors
- Role badge (green)
- Step-by-step instructions in a card
- Professional footer

---

## 🔒 **Security Best Practices**

### **1. Never Commit .env File**
The `.env` file contains sensitive credentials and should **NEVER** be committed to Git.

**Already protected:**
- `.env` is in `.gitignore`
- Use `.env.example` as template

### **2. Use App Password, Not Regular Password**
- ✅ Use 16-character app password
- ❌ Don't use your Gmail login password

### **3. Rotate App Passwords Regularly**
- Generate new app password every 3-6 months
- Revoke old app passwords

### **4. Limit App Password Scope**
- Only use for this application
- Don't share with other services

---

## 🐛 **Troubleshooting**

### **Problem: Email not sending**

**Check 1: EMAIL_ENABLED setting**
```env
EMAIL_ENABLED=true  # Must be 'true', not 'false'
```

**Check 2: App password is correct**
- No spaces in password
- 16 characters long
- Copy-pasted correctly

**Check 3: 2-Step Verification enabled**
- Required for app passwords
- Check: https://myaccount.google.com/security

**Check 4: Backend logs**
```bash
# Look for:
[EMAIL SENT] Successfully sent email to ...
# Or:
[EMAIL ERROR] Failed to send email: ...
```

### **Problem: "Invalid credentials" error**

**Solution:**
1. Regenerate app password
2. Make sure you're using app password, not regular password
3. Check for typos in EMAIL_USER

### **Problem: "SMTP connection failed"**

**Solution:**
1. Check internet connection
2. Verify EMAIL_HOST and EMAIL_PORT are correct
3. Check firewall settings

### **Problem: Email goes to spam**

**Solution:**
1. Ask recipient to check spam folder
2. Mark as "Not Spam"
3. Add sender to contacts

---

## 📝 **Environment Variables Reference**

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `EMAIL_ENABLED` | Enable/disable email sending | `false` | Yes |
| `EMAIL_HOST` | SMTP server hostname | `smtp.gmail.com` | Yes |
| `EMAIL_PORT` | SMTP server port | `587` | Yes |
| `EMAIL_USER` | Gmail address to send from | - | Yes |
| `EMAIL_PASSWORD` | Gmail app password | - | Yes |
| `EMAIL_USE_TLS` | Use TLS encryption | `true` | Yes |
| `EMAIL_FROM_NAME` | Sender name in emails | `Drug Track & Trace` | No |

---

## 🔄 **Switching to Different Email Provider**

### **For Other Gmail Account:**
Just update `EMAIL_USER` and `EMAIL_PASSWORD`

### **For Outlook/Hotmail:**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your_email@outlook.com
EMAIL_PASSWORD=your_password
EMAIL_USE_TLS=true
```

### **For Custom SMTP Server:**
```env
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=your_password
EMAIL_USE_TLS=true
```

---

## ✅ **Quick Setup Checklist**

- [ ] Enable 2-Step Verification on Gmail
- [ ] Generate App Password
- [ ] Copy app password (remove spaces)
- [ ] Update `backend/.env`:
  - [ ] Set `EMAIL_ENABLED=true`
  - [ ] Set `EMAIL_USER=aiguru9873@gmail.com`
  - [ ] Set `EMAIL_PASSWORD=<your_app_password>`
- [ ] Restart backend server
- [ ] Test by sending invitation
- [ ] Check recipient inbox
- [ ] Verify email received

---

## 📧 **Your Configuration**

**Email:** `aiguru9873@gmail.com`

**Steps to Complete:**
1. Generate app password for `aiguru9873@gmail.com`
2. Update `backend/.env`:
   ```env
   EMAIL_ENABLED=true
   EMAIL_USER=aiguru9873@gmail.com
   EMAIL_PASSWORD=<paste_your_16_char_app_password_here>
   ```
3. Restart backend
4. Test!

---

## 🎉 **Success!**

Once configured, every invitation sent by an owner will automatically send a professional email to the invited user with setup instructions!

**Email will include:**
- Welcome message
- Role assignment
- Company name
- Step-by-step setup instructions
- Invited by information

---

**Need Help?** Check the troubleshooting section or backend console logs for detailed error messages.
