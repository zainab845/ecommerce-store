import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { requireAdmin } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Contact from '@/lib/models/Contact';

/**
 * @swagger
 * /api/admin/contact/{id}/reply:
 *   post:
 *     tags: [Admin - Contact]
 *     summary: Reply to a customer contact message via email
 *     description: Sends a reply email to the customer using Nodemailer and marks the contact message as replied.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [replySubject, replyBody]
 *             properties:
 *               replySubject:
 *                 type: string
 *                 example: Re - Your inquiry
 *               replyBody:
 *                 type: string
 *                 example: Hi, thank you for contacting us...
 *     responses:
 *       200:
 *         description: Reply sent
 *       404:
 *         description: Contact message not found
 */

export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    let body: { replySubject?: string; replyBody?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { replySubject, replyBody } = body;

    if (!replySubject?.trim() || !replyBody?.trim()) {
      return NextResponse.json(
        { error: 'Subject and reply message are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const contact = await Contact.findById(id);
    if (!contact) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    // FIX: Updated to look for SMTP_USER and SMTP_PASS to match your .env
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json(
        { error: 'Email configuration missing on server' },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        // FIX: Updated to use SMTP_ variables
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      // FIX: Updated to use SMTP_ variables
      from: `"E-Shop Support" <${process.env.SMTP_USER}>`,
      to: contact.email,
      subject: replySubject.trim(),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p>Hello ${contact.name},</p>
          <div style="margin: 16px 0; line-height: 1.6;">
            ${replyBody.trim().replace(/\n/g, '<br>')}
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px;">
            This is a reply to your message:<br>
            <em>"${contact.message}"</em>
          </p>
        </div>
      `,
    });

    contact.replied = true;
    contact.repliedAt = new Date();
    await contact.save();

    return NextResponse.json({ message: 'Reply sent successfully' });
  } catch (error: any) {
    console.error('Reply error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send reply' },
      { status: 500 }
    );
  }
}