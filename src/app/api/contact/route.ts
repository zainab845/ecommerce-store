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
      return NextResponse.json({ error: 'Name, email and message are required' }, { status: 400 });
    }

    const newContact = await Contact.create({ 
      name, 
      email, 
      message, 
      subject: subject || 'General Inquiry' 
    });

    // Send notification (won't crash if Firebase fails)
    await pushNotification({
      type: 'contact_form',
      title: 'New Contact Message',
      message: `From ${name} (${email}): ${subject || 'General inquiry'}`,
    });

    return NextResponse.json({ 
      message: 'Message sent successfully!' 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Contact form error:', error);
    return NextResponse.json({ 
      error: 'Something went wrong. Please try again.' 
    }, { status: 500 });
  }
}