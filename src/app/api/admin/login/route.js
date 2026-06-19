import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Handle Logout
    if (body.action === 'logout') {
      const cookieStore = await cookies();
      cookieStore.set('admin_session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/'
      });
      return NextResponse.json({ success: true });
    }

    const { password } = body;
    const correctPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (password === correctPassword) {
      const cookieStore = await cookies();
      cookieStore.set('admin_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 2, // 2 hours
        path: '/'
      });
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: '密碼錯誤' }, { status: 401 });
    }
  } catch (error) {
    console.error('API Admin Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
