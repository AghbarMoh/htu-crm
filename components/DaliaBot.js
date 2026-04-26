'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot } from 'lucide-react'

export default function DaliaChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      text: "Hi Dalia! 👋 I'm your email assistant. Tell me what email you need and I'll write it for you — in English or Arabic, whatever you prefer." 
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
    window: { position: 'fixed', bottom: '85px', right: '24px', width: '400px', height: '75vh', maxHeight: '600px', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', zIndex: 9999 },
    header: { padding: '16px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    chatArea: { flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' },
    inputArea: { padding: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' },
    inputBox: { display: 'flex', gap: '8px' },
    input: { flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 14px', fontSize: '14px', color: '#fff', outline: 'none', resize: 'none', minHeight: '100px', maxHeight: '150px', fontFamily: 'inherit', lineHeight: '1.5' },
    sendBtn: { background: '#3b82f6', border: 'none', borderRadius: '12px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', alignSelf: 'flex-end', marginBottom: '2px' },
    msgBubble: (isUser) => ({ background: isUser ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', color: '#fff', padding: '12px 16px', borderRadius: '16px', borderBottomRightRadius: isUser ? '4px' : '16px', borderBottomLeftRadius: !isUser ? '4px' : '16px', maxWidth: '85%', alignSelf: isUser ? 'flex-end' : 'flex-start', fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word', whiteSpace: 'pre-wrap' })
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

          

          {/* Input Area */}
          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)' }}>
            <form onSubmit={handleSendMessage} style={s.inputBox}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
                placeholder="Ask about your schedule..."
                style={s.input}
                disabled={isLoading}
                rows={4}
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