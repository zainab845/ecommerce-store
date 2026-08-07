import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Newsletter from '@/lib/models/Newsletter';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const existing = await Newsletter.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'You are already subscribed!' }, { status: 400 });
    }

    await Newsletter.create({ email });
    return NextResponse.json({ message: 'Subscribed successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to subscribe. Please try again.' }, { status: 500 });
  }
}