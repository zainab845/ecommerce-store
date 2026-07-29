import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

// Reuse Conversation model
const ConversationSchema = new mongoose.Schema(
  { unreadByAdmin: Number, status: String },
  { collection: 'conversations' }
);

const ConvModel =
  mongoose.models.Conversation ||
  mongoose.model('Conversation', ConversationSchema);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ count: 0 }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== 'admin') {
      return NextResponse.json({ count: 0 }, { status: 403 });
    }

    await dbConnect();

    const result = await ConvModel.aggregate([
      { $match: { status: 'open', unreadByAdmin: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$unreadByAdmin' } } },
    ]);

    const count = result[0]?.total ?? 0;
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}