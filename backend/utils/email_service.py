import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    """
    Email service for sending invitation and notification emails
    
    Configuration:
    Set these environment variables in .env file:
    - EMAIL_ENABLED: Set to 'true' to enable email sending (default: false)
    - EMAIL_HOST: SMTP server host (default: smtp.gmail.com)
    - EMAIL_PORT: SMTP server port (default: 587)
    - EMAIL_USER: Email address to send from
    - EMAIL_PASSWORD: Email password or app password
    - EMAIL_USE_TLS: Use TLS (default: true)
    
    For Gmail:
    1. Use your Gmail address as EMAIL_USER
    2. Generate an App Password: https://myaccount.google.com/apppasswords
    3. Use the app password as EMAIL_PASSWORD
    """
    
    def __init__(self):
        self.enabled = os.getenv('EMAIL_ENABLED', 'false').lower() == 'true'
        self.host = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
        self.port = int(os.getenv('EMAIL_PORT', '587'))
        self.user = os.getenv('EMAIL_USER', '')
        self.password = os.getenv('EMAIL_PASSWORD', '')
        self.use_tls = os.getenv('EMAIL_USE_TLS', 'true').lower() == 'true'
        self.from_name = os.getenv('EMAIL_FROM_NAME', 'Drug Track & Trace')
    
    def send_email(self, to_email: str, subject: str, body: str, html_body: Optional[str] = None) -> bool:
        """
        Send an email
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Plain text email body
            html_body: Optional HTML email body
        
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        if not self.enabled:
            print(f"[EMAIL DISABLED] Would send email to {to_email}")
            print(f"Subject: {subject}")
            print(f"Body: {body}")
            return True
        
        if not self.user or not self.password:
            print("[EMAIL ERROR] EMAIL_USER or EMAIL_PASSWORD not configured")
            return False
        
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.from_name} <{self.user}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Attach plain text
            msg.attach(MIMEText(body, 'plain'))
            
            # Attach HTML if provided
            if html_body:
                msg.attach(MIMEText(html_body, 'html'))
            
            # Connect to SMTP server
            with smtplib.SMTP(self.host, self.port) as server:
                if self.use_tls:
                    server.starttls()
                server.login(self.user, self.password)
                server.send_message(msg)
            
            print(f"[EMAIL SENT] Successfully sent email to {to_email}")
            return True
            
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send email to {to_email}: {str(e)}")
            return False
    
    def send_invitation_email(self, to_email: str, role: str, invited_by_name: str, company_name: Optional[str] = None) -> bool:
        """
        Send invitation email to a new user
        
        Args:
            to_email: Recipient email address
            role: User role (manufacturer, distributor, retailer)
            invited_by_name: Name of the person who sent the invitation
            company_name: Optional company name
        
        Returns:
            bool: True if email sent successfully
        """
        subject = f"You've been invited to join Drug Track & Trace as {role.title()}"
        
        # Plain text body
        body = f"""Hello,

You have been invited by {invited_by_name} to join the Drug Track & Trace system as a {role.title()}.
{f'Company: {company_name}' if company_name else ''}

To complete your registration:
1. Open the Drug Track & Trace mobile app
2. Go to the Login screen
3. Enter your email: {to_email}
4. Click "Continue"
5. You will be prompted to set up your password and complete your profile

Your role: {role.title()}
Invited by: {invited_by_name}

If you did not expect this invitation, please ignore this email.

Best regards,
Drug Track & Trace Team
"""
        
        # HTML body
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .role-badge {{ display: inline-block; background-color: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }}
        .steps {{ background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }}
        .step {{ margin: 10px 0; padding-left: 20px; }}
        .footer {{ text-align: center; color: #6b7280; margin-top: 20px; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 You're Invited!</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>You have been invited by <strong>{invited_by_name}</strong> to join the <strong>Drug Track & Trace</strong> system.</p>
            
            <div style="text-align: center;">
                <div class="role-badge">{role.upper()}</div>
                {f'<p><strong>Company:</strong> {company_name}</p>' if company_name else ''}
            </div>
            
            <div class="steps">
                <h3>📱 To complete your registration:</h3>
                <div class="step">1️⃣ Open the Drug Track & Trace mobile app</div>
                <div class="step">2️⃣ Go to the Login screen</div>
                <div class="step">3️⃣ Enter your email: <strong>{to_email}</strong></div>
                <div class="step">4️⃣ Click "Continue"</div>
                <div class="step">5️⃣ Set up your password and complete your profile</div>
            </div>
            
            <p><strong>Your Role:</strong> {role.title()}<br>
            <strong>Invited By:</strong> {invited_by_name}</p>
            
            <p style="color: #6b7280; font-size: 14px;">If you did not expect this invitation, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>© 2026 Drug Track & Trace. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""
        
        return self.send_email(to_email, subject, body, html_body)

# Singleton instance
email_service = EmailService()
