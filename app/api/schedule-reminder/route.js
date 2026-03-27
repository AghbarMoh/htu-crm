import { NextResponse } from 'next/server';

export async function POST(request) {
  const body = await request.json();
  const { visit_id, school_name, visit_date, visit_time, reminder, old_message_id } = body;

  const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

  if (old_message_id) {
    await fetch(`https://qstash.upstash.io/v2/messages/${old_message_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${QSTASH_TOKEN}` }
    });
  }

  // ADDED +03:00 to force Jordan Timezone!
  const eventDate = new Date(`${visit_date}T${visit_time}+03:00`);
  const triggerDate = new Date(eventDate.getTime() - (parseInt(reminder) * 60000));
  const notBeforeTimestamp = Math.floor(triggerDate.getTime() / 1000);

  const upstashRes = await fetch(`https://qstash.upstash.io/v2/publish/${APP_URL}/api/send-reminder?secret=HTU_SECURE_123`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${QSTASH_TOKEN}`,
      'Content-Type': 'application/json',
      'Upstash-Not-Before': notBeforeTimestamp.toString(), 
    },
    body: JSON.stringify({
      school_name,
      visit_date,
      visit_time,
      reminder_time // CHANGED
    })
  });

  const data = await upstashRes.json();
  return NextResponse.json({ messageId: data.messageId });
}