import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('https://stoic-quotes.com/api/quote')
    const data = await res.json()
    return NextResponse.json({ quote: data.text, author: data.author })
  } catch (error) {
    return NextResponse.json({ quote: null }, { status: 500 })
  }
}