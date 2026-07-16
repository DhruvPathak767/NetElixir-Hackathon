import re
import secrets
import asyncio
import smtplib
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User
from app.security import get_password_hash
from app.logger import logger

class PasswordService:
    @staticmethod
    async def process_forgot_password(db: Session, email: str) -> None:
        """
        Generates a secure reset token and schedules email delivery if the user exists.
        Always returns success status to prevent user enumeration.
        """
        # 1. Check if user exists
        user = db.query(User).filter(User.email == email).first()
        if not user:
            logger.info(f"Forgot password request: Email {email} not found in database. Silently ignoring.")
            return

        # 2. Generate cryptographically secure token
        token = secrets.token_urlsafe(32)
        expiry = datetime.now(timezone.utc) + timedelta(minutes=15)
        
        # 3. Store on user model
        user.reset_token = token
        user.reset_token_expires = expiry
        db.add(user)
        db.commit()

        # Log the reset link for local testing and debugging
        base_url = "http://localhost:5173"
        if settings.GOOGLE_REDIRECT_URI:
            base_url = settings.GOOGLE_REDIRECT_URI.split("/login")[0]
        reset_link = f"{base_url}/reset-password/{token}"
        logger.info(f"PASSWORD RESET LINK GENERATED: {reset_link}")
        
        # 4. Send email in a background thread to prevent blocking
        asyncio.create_task(PasswordService.send_smtp_email_async(email, user.full_name, token))

    @staticmethod
    async def send_smtp_email_async(to_email: str, full_name: str, token: str) -> None:
        """
        Wrapper to execute the synchronous SMTP send in a worker thread.
        """
        try:
            await asyncio.to_thread(PasswordService.send_smtp_email, to_email, full_name, token)
        except Exception as e:
            logger.error(f"Async SMTP background task failed for {to_email}: {str(e)}")

    @staticmethod
    def send_smtp_email(to_email: str, full_name: str, token: str) -> None:
        """
        Synchronously builds and sends the HTML reset email via smtplib.
        """
        base_url = "http://localhost:5173"
        if settings.GOOGLE_REDIRECT_URI:
            base_url = settings.GOOGLE_REDIRECT_URI.split("/login")[0]
            
        reset_link = f"{base_url}/reset-password/{token}"
        subject = "Reset Your ForecastIQ Password"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Reset Your Password</title>
            <style>
                body {{
                    background-color: #0a0b10;
                    color: #e2e8f0;
                    font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
                    margin: 0;
                    padding: 0;
                    -webkit-font-smoothing: antialiased;
                }}
                .container {{
                    max-width: 580px;
                    margin: 40px auto;
                    padding: 32px;
                    background-color: #12131a;
                    border: 1px solid #1e293b;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 32px;
                }}
                .logo-text {{
                    font-size: 24px;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                    background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }}
                .content {{
                    line-height: 1.6;
                    font-size: 16px;
                }}
                h1 {{
                    font-size: 20px;
                    font-weight: 600;
                    margin-top: 0;
                    color: #ffffff;
                }}
                p {{
                    margin: 0 0 16px;
                    color: #94a3b8;
                }}
                .btn-container {{
                    text-align: center;
                    margin: 32px 0;
                }}
                .btn {{
                    display: inline-block;
                    background-color: #8b5cf6;
                    color: #ffffff !important;
                    font-weight: 600;
                    text-decoration: none;
                    padding: 12px 32px;
                    border-radius: 8px;
                    transition: background-color 0.2s ease;
                }}
                .btn:hover {{
                    background-color: #7c3aed;
                }}
                .fallback-container {{
                    background-color: #181b29;
                    border-radius: 8px;
                    padding: 16px;
                    margin: 24px 0;
                    word-break: break-all;
                    font-size: 14px;
                    border: 1px solid #334155;
                }}
                .fallback-link {{
                    color: #a78bfa;
                    text-decoration: none;
                }}
                .footer {{
                    margin-top: 32px;
                    border-top: 1px solid #1e293b;
                    padding-top: 16px;
                    text-align: center;
                    font-size: 12px;
                    color: #64748b;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <span class="logo-text">ForecastIQ</span>
                </div>
                <div class="content">
                    <h1>Password Reset Request</h1>
                    <p>Hello {full_name},</p>
                    <p>We received a request to reset your password for your ForecastIQ account. Click the button below to set a new password:</p>
                    <div class="btn-container">
                        <a href="{reset_link}" class="btn" target="_blank">Reset Password</a>
                    </div>
                    <p><strong>Note:</strong> This link will expire in 15 minutes and can only be used once. If you did not request this, please ignore this email or contact support if you have concerns.</p>
                    <p>If you're having trouble with the button above, copy and paste the URL below into your web browser:</p>
                    <div class="fallback-container">
                        <a href="{reset_link}" class="fallback-link" target="_blank">{reset_link}</a>
                    </div>
                </div>
                <div class="footer">
                    &copy; 2026 ForecastIQ. All rights reserved.<br>
                    Sent from {settings.FROM_EMAIL}
                </div>
            </div>
        </body>
        </html>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"ForecastIQ <{settings.FROM_EMAIL}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_content, "html"))

        # Verify SMTP configurations
        if not settings.SMTP_SERVER or not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
            logger.error("SMTP configurations are incomplete. Please check environmental variables.")
            raise Exception("SMTP config error.")

        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.FROM_EMAIL, to_email, msg.as_string())
        logger.info(f"Password reset email sent to {to_email}")

    @staticmethod
    async def validate_reset_token(db: Session, token: str) -> User:
        """
        Validates the token from URL. Raises HTTPExceptions if invalid or expired.
        """
        if not token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token is required."
            )
            
        user = db.query(User).filter(User.reset_token == token).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The password reset token is invalid."
            )

        expires = user.reset_token_expires
        if expires:
            if expires.tzinfo is None:
                now = datetime.now(timezone.utc).replace(tzinfo=None)
            else:
                now = datetime.now(timezone.utc)
                
            if now > expires:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The password reset token has expired."
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The password reset token is invalid."
            )

        return user

    @staticmethod
    async def reset_password(db: Session, token: str, password: str) -> None:
        """
        Validates the token, checks password strength, hashes and updates the password,
        and invalidates the token.
        """
        user = await PasswordService.validate_reset_token(db, token)

        if len(password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long."
            )
        if not re.search(r"[A-Z]", password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one uppercase letter."
            )
        if not re.search(r"[0-9]", password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one number."
            )
        if not re.search(r"[^A-Za-z0-9]", password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one special character."
            )

        user.password_hash = get_password_hash(password)
        
        user.reset_token = None
        user.reset_token_expires = None
        
        db.add(user)
        db.commit()
        logger.info(f"Password reset successful for user ID: {user.id}")
