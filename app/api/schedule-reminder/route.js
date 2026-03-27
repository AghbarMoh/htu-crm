import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { school_name, visit_date, visit_time, reminder, old_message_id } = body;

    // 1. Clean the Vercel Environment Variables
    const QSTASH_TOKEN = (process.env.QSTASH_TOKEN || "").trim();
    let APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "").trim();
    
    if (APP_URL.endsWith('/')) {
        APP_URL = APP_URL.slice(0, -1);
    }

    // 2. THE FIX: The exact regional URL for Ireland (where your account is)
    const QSTASH_URL = "https://qstash-eu-west-1.upstash.io";

    if (!QSTASH_TOKEN || !APP_URL) {
      return NextResponse.json({ error: "Missing QSTASH_TOKEN or NEXT_PUBLIC_APP_URL in Vercel." }, { status: 500 });
    }

    // 3. Delete old reminder if it exists
    if (old_message_id) {
      try {
        await fetch(`${QSTASH_URL}/v2/messages/${old_message_id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${QSTASH_TOKEN}` }
        });
      } catch (e) {
        console.error("Old message delete failed, continuing...");
      }
    }

    // 4. Timing logic (Jordan is UTC+3)
    const eventDate = new Date(`${visit_date}T${visit_time}+03:00`);
    const triggerDate = new Date(eventDate.getTime() - (parseInt(reminder) * 60000));
    const notBeforeTimestamp = Math.floor(triggerDate.getTime() / 1000);

    const targetUrl = `${APP_URL}/api/send-reminder?secret=HTU_SECURE_123`;

    // 5. Schedule the new reminder
    const upstashRes = await fetch(`${QSTASH_URL}/v2/publish/${targetUrl}`, {
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
        reminder
      })
    });

    if (!upstashRes.ok) {
       const errText = await upstashRes.text();
       return NextResponse.json({ error: `Upstash rejected the request: ${errText}` });
    }

    const data = await upstashRes.json();
    return NextResponse.json({ messageId: data.messageId });
    
  } catch (err) {
    return NextResponse.json({ error: `Server Crash: ${err.message}` });
  }
}