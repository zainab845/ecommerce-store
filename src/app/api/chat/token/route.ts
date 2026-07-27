import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify the token is valid before handing it to the client
    await jwtVerify(token, secret);

    // Return the token — the chat server uses the same JWT_SECRET to verify it
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}