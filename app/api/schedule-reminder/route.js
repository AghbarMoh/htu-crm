import { NextResponse } from 'next/server';

export async function POST(request) {
  const body = await request.json();
  const { visit_id, school_name, visit_date, visit_time, reminder_time, old_message_id } = body;

  const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

  // 1. If Dalia is updating a visit, cancel the old scheduled reminder first
  if (old_message_id) {
    await fetch(`https://qstash.upstash.io/v2/messages/${old_message_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${QSTASH_TOKEN}` }
    });
  }

  // 2. Calculate the exact Unix Timestamp for the reminder
  // We combine the date and time, then subtract the reminder minutes
  const eventDate = new Date(`${visit_date}T${visit_time}`);
  const triggerDate = new Date(eventDate.getTime() - (parseInt(reminder_time) * 60000));
  const notBeforeTimestamp = Math.floor(triggerDate.getTime() / 1000);

  // 3. Schedule the new reminder with Upstash QStash
  const upstashRes = await fetch(`https://qstash.upstash.io/v2/publish/${APP_URL}/api/send-reminder?secret=HTU_SECURE_123`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${QSTASH_TOKEN}`,
      'Content-Type': 'application/json',
      'Upstash-Not-Before': notBeforeTimestamp.toString(), // This tells Upstash exactly when to wake up
    },
    body: JSON.stringify({
      school_name,
      visit_date,
      visit_time,
      reminder_time
    })
  });

  const data = await upstashRes.json();
  
  // Return the new Upstash Message ID so we can save it in Supabase
  return NextResponse.json({ messageId: data.messageId });
}