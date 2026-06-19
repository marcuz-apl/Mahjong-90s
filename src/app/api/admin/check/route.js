import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    const authenticated = token === 'authenticated';
    return NextResponse.json({ authenticated });
  } catch (error) {
    console.error('API Admin Check error:', error);
    return NextResponse.json({ authenticated: false });
  }
}
