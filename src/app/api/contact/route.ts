import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Contact from '@/lib/models/Contact';
import { pushNotification } from '@/lib/firebase-admin';

/**
 * @swagger
 * /api/contact:
 *   post:
 *     tags: [Contact]
 *     summary: Submit a contact form message
 *     description: Saves the message to the database and sends a real-time notification to the admin via Firebase.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, message]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Zainab Bilal
 *               email:
 *                 type: string
 *                 format: email
 *                 example: zainab@example.com
 *               subject:
 *                 type: string
 *                 example: Question about my order
 *               message:
 *                 type: string
 *                 example: Hi, I would like to know about...
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Missing required fields
 *   get:
 *     tags: [Contact]
 *     summary: Get all contact messages (public endpoint — secured at admin page level)
 *     responses:
 *       200:
 *         description: List of contact messages
 */

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { name, email, message, subject } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email and message are required' }, { status: 400 });
    }

    await Contact.create({ 
      name, 
      email, 
      message, 
      subject: subject || 'General Inquiry' 
    });

    await pushNotification({
      type: 'contact_form',
      title: 'New Contact Message',
      message: `From ${name} (${email})`,
    });

    return NextResponse.json({ message: 'Message sent successfully!' }, { status: 201 });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await dbConnect();
    const contacts = await Contact.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Failed to fetch contacts:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}