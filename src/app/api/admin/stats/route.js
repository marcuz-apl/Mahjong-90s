import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminStats } from '@/lib/db';

async function verifyAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_session')?.value === 'authenticated';
}

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stats = getAdminStats();
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('API Admin Stats GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
