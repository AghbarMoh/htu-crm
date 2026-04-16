import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const SYSTEM_PROMPT = `
You are the dedicated internal CRM Assistant for Dalia Zawaideh at the Students Recruitment & Outreach Office of Al-Hussein Technical University (HTU).
Your primary job is to help Dalia manage her school visits, track her schedule, retrieve student metrics, and manage her professional contacts.

Tone & Style:
Talk exclusively to Dalia. Be warm, professional, and highly concise. Do not use generic AI fluff or long introductions. Dalia is busy; give her the exact data she asks for immediately. Use bullet points or bold text for readability. 
You are fully bilingual and can understand and respond in both English and Arabic as Dalia prefers.

Operational Rules:
1. CHECK SCHEDULE: Always use 'get_school_visits' when asked about the schedule.
2. ADD VISITS: If Dalia asks to add a visit, use 'add_school_visit'. You MUST ensure you have the School Name and Date before calling the tool.
3. UPDATE/DELETE VISITS: To update or delete a visit, you MUST use the exact database 'id'. Call 'get_school_visits' FIRST to find the ID if you don't have it in the history.
4. ADD CONTACTS: If Dalia asks to save a contact, use 'add_contact'. You MUST ensure you have the "Full Name" and "Role". If she mentions a name but not a role, ask her for the role before calling the tool.

STRICT OUTPUT FORMAT FOR LISTING VISITS:
You MUST output the data for EVERY school visit in this exact HTML block format:

📅 [Date] at [Time]<br>
🏫 School: [School Name]<br>
👥 Companion: [Companion Name or "None assigned"]<br>
✅ Status: [Pending or Completed]<br>
<br>
`;

const toolDefinitions = {
  functionDeclarations: [
    {
      name: "get_school_visits",
      description: "Retrieves all of Dalia's school visits from the CRM.",
    },
    {
      name: "add_school_visit",
      description: "Adds a new school visit to the CRM.",
      parameters: {
        type: "OBJECT",
        properties: {
          school_name: { type: "STRING" },
          visit_date: { type: "STRING" },
          visit_time: { type: "STRING" },
          city: { type: "STRING" },
          country: { type: "STRING" },
          companion: { type: "STRING" },
          type: { type: "STRING" },
          private_or_public: { type: "STRING" },
          connection_status: { type: "STRING" }
        },
        required: ["school_name", "visit_date"]
      }
    },
    {
      name: "update_school_visit",
      description: "Updates an existing school visit. Requires the exact visit ID.",
      parameters: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          visit_date: { type: "STRING" },
          visit_time: { type: "STRING" },
          companion: { type: "STRING" }
        },
        required: ["id"]
      }
    },
    {
      name: "delete_school_visit",
      description: "Deletes a school visit. Requires the exact visit ID.",
      parameters: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" }
        },
        required: ["id"]
      }
    },
    // NEW TOOL: Based on your provided contacts schema
    {
      name: "add_contact",
      description: "Adds a new professional contact to Dalia's contacts table.",
      parameters: {
        type: "OBJECT",
        properties: {
          full_name: { type: "STRING", description: "The full name of the contact person" },
          role: { type: "STRING", description: "The job title or role (e.g., Counselor, Principal)" },
          school_name: { type: "STRING", description: "The name of the school they belong to" },
          email: { type: "STRING", description: "Their professional email address" },
          phone: { type: "STRING", description: "Their phone number" },
          notes: { type: "STRING", description: "Any additional notes about the contact" }
        },
        required: ["full_name", "role"] // Full Name is mandatory in DB; Role is mandatory by Dalia's request
      }
    }
  ],
};

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const history = messages.slice(1, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));
    
    const latestMessage = messages[messages.length - 1].text;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite", // Maintaining your model version
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      tools: [toolDefinitions],
    });

    const chat = model.startChat({ history });

    let result = await chat.sendMessage(latestMessage);
    let response = result.response;

    let functionCall = response.functionCalls()?.[0];

    // Tool Execution Loop
    while (functionCall) {
      const toolName = functionCall.name;
      const args = functionCall.args;
      let toolResponseData = {};

      if (toolName === "get_school_visits") {
        const { data: visits } = await supabase.from('school_visits').select('*');
        const { data: completions } = await supabase.from('visit_completions').select('*');
        const { data: students } = await supabase.from('visit_students').select('visit_id');

        toolResponseData = { visits: (visits || []).map(visit => {
          const completionRecord = (completions || []).find(c => c.visit_id === visit.id);
          const studentCount = (students || []).filter(s => s.visit_id === visit.id).length;
          return {
            id: visit.id,
            schoolName: visit.school_name,
            visitDate: visit.visit_date,
            visitTime: visit.visit_time,
            companion: visit.companion || '',
            status: completionRecord ? 'Completed' : 'Pending',
            studentsCollected: studentCount
          };
        })};
      } 
      
      else if (toolName === "add_school_visit") {
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
          reminder_time: 'none'
        }]);
        toolResponseData = { success: !error, message: error ? error.message : "Visit successfully added." };
      }

      else if (toolName === "update_school_visit") {
        const { error } = await supabase.from('school_visits').update({
          visit_date: args.visit_date,
          visit_time: args.visit_time,
          companion: args.companion
        }).eq('id', args.id);
        toolResponseData = { success: !error, message: error ? error.message : "Visit updated." };
      }

      else if (toolName === "delete_school_visit") {
        const { error } = await supabase.from('school_visits').delete().eq('id', args.id);
        toolResponseData = { success: !error, message: error ? error.message : "Visit deleted." };
      }

      // NEW: Contact Addition Logic based on your provided schema
      else if (toolName === "add_contact") {
        const { error } = await supabase.from('contacts').insert([{
          full_name: args.full_name,
          role: args.role || null,
          school_name: args.school_name || null,
          email: args.email || null,
          phone: args.phone || null,
          notes: args.notes || null
        }]);
        toolResponseData = { success: !error, message: error ? error.message : "Contact successfully saved." };
      }

      // Chain back to Gemini for final response
      result = await chat.sendMessage([{
        functionResponse: { name: toolName, response: toolResponseData }
      }]);
      response = result.response;
      functionCall = response.functionCalls()?.[0];
    }

    return NextResponse.json({ reply: response.text() });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}