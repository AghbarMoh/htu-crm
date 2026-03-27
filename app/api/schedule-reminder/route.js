import { NextResponse } from 'next/server';
import { Client } from "@upstash/qstash";

export async function POST(request) {
  try {
    const body = await request.json();
    const { school_name, visit_date, visit_time, reminder, old_message_id } = body;

    const token = (process.env.QSTASH_TOKEN || "").trim();
    let appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim();
    if (appUrl.endsWith('/')) appUrl = appUrl.slice(0, -1);

    // Initialize the official Upstash Client
    const client = new Client({
      token: token,
      // IMPORTANT: If you still get the "region" error, 
      // check your Upstash dashboard and change this to match your region.
      
    });

    // 1. Delete old reminder if it exists
    if (old_message_id) {
      try {
        await client.messages.delete(old_message_id);
      } catch (e) {
        console.log("No old message to delete or already gone.");
      }
    }

    // 2. Calculate the "Not Before" time (Jordan UTC+3)
    const eventDate = new Date(`${visit_date}T${visit_time}+03:00`);
    const triggerDate = new Date(eventDate.getTime() - (parseInt(reminder) * 60000));
    const notBeforeTimestamp = Math.floor(triggerDate.getTime() / 1000);

    // 3. Publish using the SDK
    const result = await client.publishJSON({
      url: `${appUrl}/api/send-reminder?secret=HTU_SECURE_123`,
      body: {
        school_name,
        visit_date,
        visit_time,
        reminder
      },
      notBefore: notBeforeTimestamp, // This is the scheduler part!
    });

    return NextResponse.json({ messageId: result.messageId });
    
  } catch (err) {
    console.error("Scheduling Error:", err);
    return NextResponse.json({ error: `SDK Error: ${err.message}` });
  }
}