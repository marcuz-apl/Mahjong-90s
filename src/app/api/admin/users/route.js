import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAllUsers, updateUserChips, deleteUser } from '@/lib/db';

async function verifyAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_session')?.value === 'authenticated';
}

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = getAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('API Admin Users GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId, chips } = body;

    if (!userId || chips === undefined) {
      return NextResponse.json({ error: 'Missing userId or chips parameter' }, { status: 400 });
    }

    const updated = updateUserChips(userId, parseInt(chips, 10));
    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('API Admin Users PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    deleteUser(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Admin Users DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
