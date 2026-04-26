'use client'

import { useState, useEffect, useRef } from 'react'
import { Bot, Send, Mic, MicOff, Trash2 } from 'lucide-react'

export default function AIAssistantPage() {
  const [chatMessages, setChatMessages] = useState([{
    role: 'assistant',
    text: `Hi Dalia! 👋 I'm your AI Assistant.<br/><br/>How can I help you today? You can ask me to draft emails, write reports, or translate text.`
  }])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceLang, setVoiceLang] = useState('en-US') // 'en-US' for English, 'ar-SA' for Arabic
  
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)

  // --- Scroll to bottom when messages change ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg = input.trim()
    const updated = [...chatMessages, { role: 'user', text: userMsg }]
    
    setChatMessages(updated)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      })
      const data = await res.json()
      setChatMessages(prev => [...prev, { role: 'assistant', text: data.reply || "Sorry, I encountered an error." }])
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: "Connection error. Please try again." }])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setChatMessages([{ role: 'assistant', text: 'Chat cleared. How can I help you now?' }])
  }

  // --- Voice Input Logic ---
   // --- Voice Input Logic ---
  const toggleMic = () => {
    if (typeof window === 'undefined') return

    if (isListening) {
      // Properly stop the microphone if it's currently on
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.")
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    
    // Set to TRUE so it keeps listening even if you take a breath!
    recognition.continuous = true 
    recognition.interimResults = false
    recognition.lang = voiceLang 

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false) 
    
    recognition.onresult = (event) => {
      // Get the latest sentence/chunk you just spoke
      const currentChunkIndex = event.results.length - 1
      const transcript = event.results[currentChunkIndex][0].transcript
      
      setInput(prev => prev + (prev ? ' ' : '') + transcript)
    }

    recognition.start()
  }

  // --- Styles ---
  const s = {
    container: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', maxWidth: '1200px', margin: '0 auto', width: '100%' },
    chatWindow: { 
      flex: 1, background: 'rgba(255,255,255,0.04)', 
      border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', 
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)' 
    },
    header: { padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)' },
    messages: { flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' },
    msgBubble: (isUser) => ({
      maxWidth: '75%', padding: '12px 16px', borderRadius: '12px',
      background: isUser ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
      border: `1px solid ${isUser ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)'}`,
      color: '#fff', fontSize: '15px', lineHeight: '1.6',
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      borderBottomRightRadius: isUser ? '2px' : '12px',
      borderBottomLeftRadius: isUser ? '12px' : '2px',
      wordBreak: 'break-word', whiteSpace: 'pre-wrap',
      unicodeBidi: 'plaintext', textAlign: 'start'
    }),
    inputArea: { padding: '20px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' },
    inputBox: { position: 'relative' },
    // Added standard control button style
    controlBtn: { 
      position: 'absolute', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
      background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', 
      borderRadius: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s', width: '36px', height: '36px' 
  }}

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: 0 }}>AI Assistant</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Draft emails, translate text, or get help.</p>
        </div>
      </div>

      <div style={s.container}>
        <div style={s.chatWindow}>
          
          {/* Chat Header */}
          <div style={s.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={18} color="#fff" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#fff' }}>AI Assistant</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Online</span>
                </div>
              </div>
            </div>
            <button onClick={clearChat} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
              <Trash2 size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={s.messages}>
            {chatMessages.map((msg, i) => (
              <div key={i} dir="auto" style={s.msgBubble(msg.role === 'user')}>
                <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*/g, '') }} />
              </div>
            ))}
            {isLoading && (
              <div style={{ ...s.msgBubble(false), padding: '8px 16px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[0, 1, 2].map(n => (
                  <div key={n} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.5)', animation: `bounce 1.2s ${n * 0.2}s infinite` }} />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={s.inputArea}>
            <form onSubmit={handleSend} style={s.inputBox}>
              
              {/* 1. Mic Button */}
              <button 
                type="button"
                onClick={toggleMic}
                style={{ 
                  ...s.controlBtn, left: '14px', width: '44px', height: '44px', // Larger
                  color: isListening ? '#ef4444' : 'rgba(255,255,255,0.5)',
                  background: isListening ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                  border: isListening ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent'
                }}
              >
                {isListening ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              {/* 2. Language Toggle Button (EN / AR) */}
              <button
                type="button"
                onClick={() => setVoiceLang(prev => prev === 'en-US' ? 'ar-SA' : 'en-US')}
                style={{
                  ...s.controlBtn, left: '68px', // Positioned right of Mic
                  width: '44px', height: '44px',
                  background: 'rgba(255,255,255,0.05)',
                  fontWeight: '700', fontSize: '11px', color: voiceLang === 'ar-SA' ? '#fbbf24' : '#fff'
                }}
                title="Toggle Language (English / Arabic)"
              >
                {voiceLang === 'en-US' ? 'EN' : 'AR'}
              </button>

              <textarea
                dir="auto"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
                placeholder="Type your message here..."
                disabled={isLoading}
                rows={2}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', padding: '14px 60px 14px 125px', // Increased Left Padding for 2 buttons
                  fontSize: '14px', color: '#fff', outline: 'none', resize: 'none', fontFamily: 'inherit',
                  transition: 'border-color 0.2s', lineHeight: '1.5'
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              
              {/* 3. Send Button */}
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', 
                  width: '44px', height: '44px', // Larger
                  borderRadius: '10px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: input.trim() ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'rgba(255,255,255,0.1)',
                  color: input.trim() ? '#fff' : 'rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0) } 30% { transform: translateY(-4px) } }
      `}</style>
    </div>
  )
}