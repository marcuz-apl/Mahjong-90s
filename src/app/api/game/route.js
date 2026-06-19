import { NextResponse } from 'next/server';
import { saveGameRecord, updateUserChips, getUser } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, round, outcome, scoreChange, newChips, yakuDetails } = body;

    if (!userId || round === undefined || !outcome || scoreChange === undefined || newChips === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Verify user exists
    const user = getUser(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Save game play record
    saveGameRecord(userId, round, outcome, scoreChange, yakuDetails);

    // Update current chips count
    const updatedUser = updateUserChips(userId, newChips);

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('API Game POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
