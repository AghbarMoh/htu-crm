// app/api/chat/route.js
import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY)

export async function POST(req) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  try {
    const { messages } = await req.json()
    const latestMessage = messages[messages.length - 1].text

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: {
        parts: [{
          text: `You are DaliaBot, an email assistant for Dalia Zawaideh at Al-Hussein Technical University (HTU), Students Recruitment & Outreach Office.

Your only job is to write emails based on Dalia's request.

LANGUAGE RULES:
- Detect the language Dalia is writing in.
- If she specifies a language for the email (e.g. "write it in English" or "اكتبيها بالعربي"), use that language for the email regardless of what language she typed in.
- If she does not specify, write the email in the same language she used.
- Always reply to Dalia's message (your conversational response) in whatever language she wrote in.

EMAIL RULES:
- Generate professional, well-structured emails.
- Include a subject line clearly labeled as: Subject: ...
- Be flexible with tone — formal, friendly, follow-up, reminder, introduction, whatever she needs.
- Sign off emails as: Dalia Zawaideh | Students Recruitment & Outreach Manager | Al-Hussein Technical University

If the request is unclear, ask Dalia one short clarifying question before writing the email.
Do not do anything other than write emails or ask clarifying questions about emails.`
        }]
      },
    })

    const history = messages.slice(1, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    }))

    const chat = model.startChat({ history })
    const result = await chat.sendMessage(latestMessage)
    const reply = result.response.text()

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}