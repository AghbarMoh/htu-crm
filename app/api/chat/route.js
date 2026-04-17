// app/api/chat/route.js  (REPLACE existing file)
// Protected — requires authenticated session
// Uses service key for all Supabase operations inside tool execution loop

import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createServiceClient } from '@/lib/supabase-server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY)

const SYSTEM_PROMPT = `
You are DaliaBot, the dedicated internal CRM Assistant for Dalia Zawaideh at Al-Hussein Technical University (HTU).

OPERATIONAL RULES:
1. IDENTIFICATION: When listing visits or contacts, always use a simple index number (1, 2, 3...) as the ID. These numbers MUST match the order of the data you receive. 
2. REFERENCING: If Dalia says "Delete 1", refer to the first item in the most recent list you provided.
3. SPACING: Use the exact HTML format below. Do not add extra lines or double spaces.

TONE & STYLE:
- Talk exclusively to Dalia. Be professional, warm, and highly concise.
- You are fully bilingual (English & Arabic). Always reply in the language Dalia uses.
- Use bold text for IDs to make them easy to find.

STRICT OUTPUT FORMATS:

FOR VISITS:
[Index] | 📅 [Date] at [Time]<br>🏫 **[School Name]** ([Type])<br>👥 Companion: [Companion]<br>✅ Status: [Status]
<br>

FOR CONTACTS:
[Index] | 👤 **[Full Name]**<br>💼 [Role] at [School]<br>📧 [Email] | 📞 [Phone]
<br>
`

const toolDefinitions = {
  functionDeclarations: [
    {
      name: 'get_school_visits',
      description: "Retrieves all of Dalia's school visits from the CRM.",
    },
    {
      name: 'add_school_visit',
      description: 'Adds a new school visit to the CRM.',
      parameters: {
        type: 'OBJECT',
        properties: {
          school_name: { type: 'STRING' },
          visit_date: { type: 'STRING' },
          visit_time: { type: 'STRING' },
          city: { type: 'STRING' },
          country: { type: 'STRING' },
          companion: { type: 'STRING' },
          type: { type: 'STRING' },
          private_or_public: { type: 'STRING' },
          connection_status: { type: 'STRING' },
        },
        required: ['school_name', 'visit_date'],
      },
    },
    {
      name: 'update_school_visit',
      description: 'Updates an existing school visit. Requires the exact visit ID.',
      parameters: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          visit_date: { type: 'STRING' },
          visit_time: { type: 'STRING' },
          companion: { type: 'STRING' },
        },
        required: ['id'],
      },
    },
    {
      name: 'delete_school_visit',
      description: 'Deletes a school visit. Requires the exact visit ID.',
      parameters: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
        },
        required: ['id'],
      },
    },
    {
      name: 'add_contact',
      description: "Adds a new professional contact to Dalia's contacts table.",
      parameters: {
        type: 'OBJECT',
        properties: {
          full_name: { type: 'STRING', description: 'The full name of the contact person' },
          role: { type: 'STRING', description: 'The job title or role (e.g., Counselor, Principal)' },
          school_name: { type: 'STRING', description: 'The name of the school they belong to' },
          email: { type: 'STRING', description: 'Their professional email address' },
          phone: { type: 'STRING', description: 'Their phone number' },
          notes: { type: 'STRING', description: 'Any additional notes about the contact' },
        },
        required: ['full_name', 'role'],
      },
    },
    {
      name: 'get_contacts',
      description: "Retrieves Dalia's contact list to find IDs for updating or deleting.",
    },
    {
      name: 'update_contact',
      description: 'Updates an existing contact. Requires the exact contact ID.',
      parameters: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          role: { type: 'STRING' },
          email: { type: 'STRING' },
          phone: { type: 'STRING' },
          notes: { type: 'STRING' },
        },
        required: ['id'],
      },
    },
    {
      name: 'delete_contact',
      description: 'Deletes a contact. Requires the exact contact ID.',
      parameters: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
        },
        required: ['id'],
      },
    },
  ],
}

export async function POST(req) {
  // Auth guard — only Dalia (authenticated users) can talk to the AI
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  // Service client — all tool DB calls use the service key
  const supabase = createServiceClient()

  try {
    const { messages } = await req.json()

    const history = messages.slice(1, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    }))

    const latestMessage = messages[messages.length - 1].text

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      tools: [toolDefinitions],
    })

    const chat = model.startChat({ history })
    let result = await chat.sendMessage(latestMessage)
    let response = result.response
    let functionCall = response.functionCalls()?.[0]

    while (functionCall) {
      const toolName = functionCall.name
      const args = functionCall.args
      let toolResponseData = {}

      // --- TOOL: GET VISITS ---
      if (toolName === 'get_school_visits') {
        const { data: visits } = await supabase.from('school_visits').select('*')
        const { data: completions } = await supabase.from('visit_completions').select('*')
        const { data: students } = await supabase.from('visit_students').select('visit_id')
        toolResponseData = {
          visits: (visits || []).map(visit => ({
            id: visit.id,
            schoolName: visit.school_name,
            visitDate: visit.visit_date,
            visitTime: visit.visit_time,
            companion: visit.companion || '',
            status: (completions || []).find(c => c.visit_id === visit.id) ? 'Completed' : 'Pending',
            studentsCollected: (students || []).filter(s => s.visit_id === visit.id).length,
          })),
        }

      // --- TOOL: ADD VISIT ---
      } else if (toolName === 'add_school_visit') {
        const { error } = await supabase.from('school_visits').insert([{
          school_name: args.school_name,
          visit_date: args.visit_date,
          visit_time: args.visit_time || null,
          city: args.city || null,
          country: args.country || null,
          companion: args.companion || null,
          type: args.type || 'School Tours',
          private_or_public: args.private_or_public || 'private',
          connection_status: args.connection_status || 'New',
          reminder_time: 'none',
        }])
        if (!error) {
          await supabase.from('activity_log').insert([{
            action: 'Scheduled school visit (via AI)',
            entity_type: 'visit',
            entity_name: args.school_name,
            details: `DaliaBot scheduled a visit for ${args.visit_date}`
          }])
        }
        toolResponseData = { success: !error, message: error ? error.message : 'Visit successfully added.' }

      // --- TOOL: UPDATE VISIT ---
      } else if (toolName === 'update_school_visit') {
        const { error } = await supabase.from('school_visits').update({
          visit_date: args.visit_date,
          visit_time: args.visit_time,
          companion: args.companion,
        }).eq('id', args.id)
        if (!error) {
          await supabase.from('activity_log').insert([{
            action: 'Updated visit (via AI)',
            entity_type: 'visit',
            entity_name: `Visit ID: ${args.id}`,
            details: 'DaliaBot modified the date/time.'
          }])
        }
        toolResponseData = { success: !error, message: error ? error.message : 'Visit updated.' }

      // --- TOOL: DELETE VISIT ---
      } else if (toolName === 'delete_school_visit') {
        let targetId = args.id;

        // ID LINKING LOGIC: If Dalia gave a small number (like "1"), find the UUID from the visits list
        if (targetId.length < 5) {
          const { data: currentVisits } = await supabase.from('school_visits').select('id').order('created_at', { ascending: true });
          const index = parseInt(targetId) - 1;
          if (currentVisits[index]) targetId = currentVisits[index].id;
        }

        const { error } = await supabase.from('school_visits').delete().eq('id', targetId);
        
        if (!error) {
          await supabase.from('activity_log').insert([{
            action: 'Cancelled visit (via AI)',
            entity_type: 'visit',
            entity_name: `ID: ${args.id}`
          }]);
        }
        toolResponseData = { success: !error, message: error ? error.message : 'Visit deleted.' };
      } else if (toolName === 'get_contacts') {
        const { data } = await supabase.from('contacts').select('*')
        toolResponseData = { contacts: data || [] }

      // --- TOOL: ADD CONTACT ---
      } else if (toolName === 'add_contact') {
        const { error } = await supabase.from('contacts').insert([{
          full_name: args.full_name,
          role: args.role || null,
          school_name: args.school_name || null,
          email: args.email || null,
          phone: args.phone || null,
          notes: args.notes || null,
        }])
        if (!error) {
          await supabase.from('activity_log').insert([{
            action: 'Added contact (via AI)',
            entity_type: 'contact',
            entity_name: args.full_name,
            details: `Saved at ${args.school_name || 'unknown school'}`
          }])
        }
        toolResponseData = { success: !error, message: error ? error.message : 'Contact saved.' }

      // --- TOOL: UPDATE CONTACT ---
      } else if (toolName === 'update_contact') {
        const { error } = await supabase.from('contacts').update({
          role: args.role, email: args.email, phone: args.phone, notes: args.notes
        }).eq('id', args.id)
        if (!error) {
          await supabase.from('activity_log').insert([{
            action: 'Updated contact (via AI)',
            entity_type: 'contact',
            entity_name: `ID: ${args.id}`
          }])
        }
        toolResponseData = { success: !error, message: error ? error.message : 'Contact updated.' }

      // --- TOOL: DELETE CONTACT ---
      } else if (toolName === 'delete_contact') {
        let targetId = args.id;

        // ID LINKING LOGIC: Map simple number back to UUID
        if (targetId.length < 5) {
          const { data: currentContacts } = await supabase.from('contacts').select('id').order('created_at', { ascending: true });
          const index = parseInt(targetId) - 1;
          if (currentContacts[index]) targetId = currentContacts[index].id;
        }

        const { error } = await supabase.from('contacts').delete().eq('id', targetId);
        
        if (!error) {
          await supabase.from('activity_log').insert([{
            action: 'Deleted contact (via AI)',
            entity_type: 'contact',
            entity_name: `ID: ${args.id}`
          }]);
        }
        toolResponseData = { success: !error, message: error ? error.message : 'Contact deleted.' };
      } // Closes the tools if/else chain

      // Send the tool results back to the model to get the final text response
      result = await chat.sendMessage([{
        functionResponse: { name: toolName, response: toolResponseData },
      }])
      response = result.response
      functionCall = response.functionCalls()?.[0]
    } // Closes the while loop

    return NextResponse.json({ reply: response.text() })
  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
} // Closes the POST function