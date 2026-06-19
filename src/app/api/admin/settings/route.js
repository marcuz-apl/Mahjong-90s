import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSettings, updateSetting } from '@/lib/db';

async function verifyAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_session')?.value === 'authenticated';
}

export async function GET() {
  try {
    const settings = getSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('API Admin Settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid settings data' }, { status: 400 });
    }

    for (const [k, v] of Object.entries(settings)) {
      updateSetting(k, v);
    }

    return NextResponse.json({ success: true, settings: getSettings() });
  } catch (error) {
    console.error('API Admin Settings POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
