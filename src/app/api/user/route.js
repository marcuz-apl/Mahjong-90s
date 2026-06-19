import { NextResponse } from 'next/server';
import { getUser, createUser } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const user = getUser(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('API User GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Check if user already exists
    let user = getUser(userId);
    if (!user) {
      user = createUser(userId);
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('API User POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
