import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Contact from '@/lib/models/Contact';
import { pushNotification } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { name, email, message, subject } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email and message are required' },
        { status: 400 }
      );
    }

    await Contact.create({ name, email, message, subject: subject || 'General Inquiry' });

    await pushNotification({
      type: 'contact_form',
      title: 'New Contact Message',
      message: `From ${name}: ${subject || 'General inquiry'}`,
    });

    return NextResponse.json(
      { message: 'Message sent successfully.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await dbConnect();
    const contacts = await Contact.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ contacts });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}