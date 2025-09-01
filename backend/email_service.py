import boto3
from botocore.exceptions import ClientError
import os
import random
import string
from datetime import datetime, timedelta
from typing import Optional


class EmailService:
    """Service for sending emails via Amazon SES"""
    
    def __init__(self):
        self.ses_client = None
        self.sender_email = os.getenv("AWS_SES_SENDER_EMAIL", "noreply@photorestoration.app")
        self.sender_name = os.getenv("AWS_SES_SENDER_NAME", "Photo Restoration")
        
        # Initialize SES client if credentials are available
        aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
        aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        aws_region = os.getenv("AWS_REGION", "us-east-1")
        
        if aws_access_key and aws_secret_key:
            self.ses_client = boto3.client(
                'ses',
                region_name=aws_region,
                aws_access_key_id=aws_access_key,
                aws_secret_access_key=aws_secret_key
            )
    
    def generate_verification_code(self) -> str:
        """Generate a 6-digit verification code"""
        return ''.join(random.choices(string.digits, k=6))
    
    async def send_verification_email(self, email: str, code: str, device_name: str) -> bool:
        """Send verification code email to user"""
        if not self.ses_client:
            print("SES client not configured")
            return False
        
        subject = "Verify Your Device - Photo Restoration"
        
        html_body = f"""
        <html>
        <head></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f5f5f5; padding: 30px; border-radius: 10px;">
                <h1 style="color: #333; text-align: center;">Photo Restoration</h1>
                <h2 style="color: #555; text-align: center;">Device Verification</h2>
                
                <p style="color: #666; font-size: 16px;">
                    You're trying to link a new device ({device_name}) to your Photo Restoration account.
                </p>
                
                <div style="background-color: #fff; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
                    <p style="color: #999; margin: 0;">Your verification code is:</p>
                    <h1 style="color: #007AFF; letter-spacing: 10px; margin: 10px 0;">{code}</h1>
                    <p style="color: #999; font-size: 14px; margin: 0;">This code expires in 10 minutes</p>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                    If you didn't request this verification, please ignore this email.
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                    This is an optional feature for syncing your restoration history across devices.
                    Your purchase history is managed separately through your app store account.
                </p>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Photo Restoration - Device Verification
        
        You're trying to link a new device ({device_name}) to your Photo Restoration account.
        
        Your verification code is: {code}
        
        This code expires in 10 minutes.
        
        If you didn't request this verification, please ignore this email.
        
        Note: This is an optional feature for syncing your restoration history across devices.
        Your purchase history is managed separately through your app store account.
        """
        
        try:
            response = self.ses_client.send_email(
                Source=f"{self.sender_name} <{self.sender_email}>",
                Destination={'ToAddresses': [email]},
                Message={
                    'Subject': {'Data': subject},
                    'Body': {
                        'Text': {'Data': text_body},
                        'Html': {'Data': html_body}
                    }
                }
            )
            return True
        except ClientError as e:
            print(f"Failed to send email: {e}")
            return False
    
    async def send_device_removed_email(self, email: str, device_name: str) -> bool:
        """Send notification when a device is removed"""
        if not self.ses_client:
            return False
        
        subject = "Device Removed - Photo Restoration"
        
        html_body = f"""
        <html>
        <head></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f5f5f5; padding: 30px; border-radius: 10px;">
                <h1 style="color: #333; text-align: center;">Photo Restoration</h1>
                <h2 style="color: #555; text-align: center;">Device Removed</h2>
                
                <p style="color: #666; font-size: 16px;">
                    The device "{device_name}" has been removed from your account.
                </p>
                
                <p style="color: #666; font-size: 14px;">
                    If you didn't remove this device, please check your linked devices in the app.
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                    Your restoration history on this device will no longer sync with your account.
                </p>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Photo Restoration - Device Removed
        
        The device "{device_name}" has been removed from your account.
        
        If you didn't remove this device, please check your linked devices in the app.
        
        Your restoration history on this device will no longer sync with your account.
        """
        
        try:
            response = self.ses_client.send_email(
                Source=f"{self.sender_name} <{self.sender_email}>",
                Destination={'ToAddresses': [email]},
                Message={
                    'Subject': {'Data': subject},
                    'Body': {
                        'Text': {'Data': text_body},
                        'Html': {'Data': html_body}
                    }
                }
            )
            return True
        except ClientError as e:
            print(f"Failed to send email: {e}")
            return False