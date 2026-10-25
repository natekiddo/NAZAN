import { NextResponse } from 'next/server';
import { processDueRemindersForAllUsers } from '@/lib/actions/reminders';

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'Reminder cron is not configured.' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
  }

  try {
    const result = await processDueRemindersForAllUsers();
    const error = 'error' in result ? result.error : null;
    return NextResponse.json(result, { status: error ? 500 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process reminders';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}