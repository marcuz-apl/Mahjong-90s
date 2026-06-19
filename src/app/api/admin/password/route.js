import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSetting, updateSetting } from '@/lib/db';

async function verifyAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_session')?.value === 'authenticated';
}

export async function POST(request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: '請填寫完整密碼資訊' }, { status: 400 });
    }

    const dbPassword = getSetting('admin_password');
    const correctPassword = dbPassword || process.env.ADMIN_PASSWORD || 'admin123';

    if (oldPassword !== correctPassword) {
      return NextResponse.json({ error: '舊密碼不正確' }, { status: 400 });
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ error: '新密碼長度不能少於 4 個字元' }, { status: 400 });
    }

    updateSetting('admin_password', newPassword);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Admin Change Password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
