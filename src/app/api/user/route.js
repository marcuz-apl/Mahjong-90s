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
      return NextResponse.json({ error: '請輸入用戶名' }, { status: 400 });
    }

    const trimmedId = userId.trim();
    if (trimmedId.length < 2 || trimmedId.length > 12) {
      return NextResponse.json({ error: '用戶名長度必須在 2 到 12 個字元之間' }, { status: 400 });
    }

    // Allow letters, numbers, underscores, dashes, and Chinese characters
    const usernameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(trimmedId)) {
      return NextResponse.json({ error: '用戶名只能包含中文、英文字母、數字、底線和破折號' }, { status: 400 });
    }

    // Check if user already exists
    let user = getUser(trimmedId);
    if (!user) {
      user = createUser(trimmedId);
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('API User POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
