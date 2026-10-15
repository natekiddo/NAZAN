import { NextResponse } from 'next/server';
import { processDueReminders } from '@/lib/actions/reminders';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }

    const result = await processDueReminders();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to process reminders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
