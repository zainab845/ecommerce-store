import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema(
  { name: String, email: String, subject: String, message: String },
  { timestamps: true }
);
const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email and message are required' }, { status: 400 });
    }

    await Contact.create(body);
    return NextResponse.json({ message: 'Message sent successfully' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}