import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return success even if user not found — prevents email enumeration attacks
    if (!user) {
      return NextResponse.json({
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    // Google-only accounts have no password to reset
    if (user.authProvider === 'google') {
      return NextResponse.json({
        error: 'This account uses Google Sign-In. Please sign in with Google instead.',
      }, { status: 400 });
    }

    // Generate a random 32-byte token
    const rawToken = crypto.randomBytes(32).toString('hex');

    // Store the hashed version in DB — never store raw tokens
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour from now
    await user.save();

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${rawToken}`;

    // Send email
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email credentials not configured');
      return NextResponse.json({
        error: 'Email service is not configured. Please contact support.',
      }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"E-Shop" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Reset your E-Shop password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4f46e5; margin-bottom: 8px;">E-Shop Password Reset</h2>
          <p style="color: #6b7280; margin-bottom: 24px;">Hi ${user.name},</p>
          <p style="color: #374151; margin-bottom: 16px;">
            We received a request to reset your password. Click the button below to create a new one.
          </p>
          <a href="${resetUrl}"
            style="display: inline-block; padding: 14px 28px; background-color: #4f46e5; color: white; font-weight: 700; text-decoration: none; border-radius: 12px; margin-bottom: 24px;">
            Reset Password
          </a>
          <p style="color: #9ca3af; font-size: 13px; margin-bottom: 8px;">
            This link expires in <strong>1 hour</strong>.
          </p>
          <p style="color: #9ca3af; font-size: 13px;">
            If you didn't request this, please ignore this email. Your password won't change.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #d1d5db; font-size: 11px;">
            If the button doesn't work, copy this link: ${resetUrl}
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 });
  }
}