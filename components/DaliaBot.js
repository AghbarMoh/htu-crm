'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User } from 'lucide-react'

export default function DaliaChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      text: `Hi Dalia! 👋 I'm your CRM Assistant developed by Aghbar. I'm here to help you stay organized. Here is what I can do for you:<br><br>
      📅 <b>School Visits:</b> Add new visits, update times, or cancel them.<br>
      👥 <b>Contacts:</b> Save new professional contacts (Name & Role required).<br>
      📊 <b>Insights:</b> Ask me about your schedule or student metrics.<br><br>
      I'm fluent in both <b>English & Arabic</b>—how can I help you today?` 
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  useEffect(() => { scrollToBottom() }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    
    // 1. Capture the entire conversation history, plus the new message
    const updatedMessages = [...messages, { role: 'user', text: userMessage }]
    
    // Update the screen instantly
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 2. Send the ENTIRE array (messages), not just the single string
        body: JSON.stringify({ messages: updatedMessages }) 
      })

      const data = await res.json()

      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.reply }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I ran into an issue finding that data." }])
      }
    } catch (error) {
      console.error("Chat Error:", error)
      setMessages(prev => [...prev, { role: 'assistant', text: "Looks like the connection dropped. Try again!" }])
    } finally {
      setIsLoading(false)
    }
  }

  // Styles tailored to your CRM's dark theme
  const s = {
    button: { position: 'fixed', bottom: '24px', right: '24px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', border: 'none', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 25px rgba(59,130,246,0.4)', zIndex: 9999 },
    window: { position: 'fixed', bottom: '90px', right: '24px', width: '350px', height: '500px', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', zIndex: 9999 },
    header: { padding: '16px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    chatArea: { flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' },
    inputArea: { padding: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' },
    inputBox: { display: 'flex', gap: '8px' },
    input: { flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#fff', outline: 'none' },
    sendBtn: { background: '#3b82f6', border: 'none', borderRadius: '10px', width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' },
    msgBubble: (isUser) => ({ background: isUser ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', color: '#fff', padding: '10px 14px', borderRadius: '14px', borderBottomRightRadius: isUser ? '4px' : '14px', borderBottomLeftRadius: !isUser ? '4px' : '14px', maxWidth: '85%', alignSelf: isUser ? 'flex-end' : 'flex-start', fontSize: '13px', lineHeight: '1.4' })
  }

  return (
    <>
      {/* Floating Toggle Button */}
      <button onClick={() => setIsOpen(!isOpen)} style={s.button}>
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={s.window}>
          <div style={s.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={20} color="#60a5fa" />
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#fff' }}>CRM Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          <div style={s.chatArea}>
            {messages.map((msg, index) => (
              <div key={index} style={s.msgBubble(msg.role === 'user')}>
                <span dangerouslySetInnerHTML={{ __html: msg.text }} />
              </div>
            ))}
            {isLoading && (
              <div style={s.msgBubble(false)}>
                <span style={{ opacity: 0.5 }}>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={s.inputArea}>
            <form onSubmit={handleSendMessage} style={s.inputBox}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your schedule..."
                style={s.input}
                disabled={isLoading}
              />
              <button type="submit" style={s.sendBtn} disabled={isLoading || !input.trim()}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}