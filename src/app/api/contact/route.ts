import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import mongoose from 'mongoose';
import { createNotification } from '@/lib/controllers/adminController';

const ContactSchema = new mongoose.Schema(
  { 
    name: String, 
    email: String, 
    subject: String, 
    message: String 
  },
  { timestamps: true }
);

const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { name, email, message, subject = 'General Inquiry' } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email and message are required' }, { status: 400 });
    }

    const contact = await Contact.create(body);

    // Create notification for admin
    await createNotification({
      type: 'contact_form',
      title: 'New Contact Form Submission',
      message: `From ${name} (${email}): ${subject}`
    });

    return NextResponse.json({ 
      message: 'Message sent successfully. We will get back to you soon.' 
    }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const contacts = await Contact.find().sort({ createdAt: -1 });
    return NextResponse.json({ contacts });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}