import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  // Simple security check so random people can't trigger your emails
  const url = new URL(request.url);
  if (url.searchParams.get('secret') !== 'HTU_SECURE_123') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { school_name, visit_date, visit_time, reminder_time } = body;

  // Format the reminder text for the email body
  let notice = "";
  if (reminder_time == "30") notice = "in 30 Minutes";
  else if (reminder_time == "60") notice = "in 1 Hour";
  else if (reminder_time == "120") notice = "in 2 Hours";
  else if (reminder_time == "1440") notice = "Tomorrow";
  else if (reminder_time == "2880") notice = "in 2 Days";
  else if (reminder_time == "10080") notice = "in 1 Week";

  try {
    await resend.emails.send({
      from: 'HTU CRM <onboarding@resend.dev>', // Keep this exactly as is while on Resend's free tier
      to: '23110015@htu.edu.jo', // Your email!
      subject: `🚨 Reminder: Visit at ${school_name} ${notice}!`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #3b82f6;">School Visit Reminder</h2>
          <p>Hi Dalia,</p>
          <p>This is an automated reminder that you have a school visit scheduled <strong>${notice.toLowerCase()}</strong>.</p>
          <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>School:</strong> ${school_name}</p>
            <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${visit_date}</p>
            <p style="margin: 0;"><strong>Time:</strong> ${visit_time}</p>
          </div>
          <p>Good luck!</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}