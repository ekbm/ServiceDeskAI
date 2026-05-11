// api/triage.js
export default async function handler(req, res) {
  // This function runs on Vercel's servers
  if (req.method === 'POST') {
    const data = req.body;
    
    // For now, we just log it. Later, this pushes to SAP.
    console.log("Received Triage Data:", data);

    return res.status(200).json({ 
      message: "Triage successful",
      ticketId: data.ticketRef 
    });
  } else {
    res.status(405).json({ message: "Only POST requests allowed" });
  }
}
import { createClient } from '@supabase/supabase-client';

// These come from your Vercel Environment Variables
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { ticketId, customerName, customerEmail, appName, issueDescription, priority } = req.body;

  // UPSERT: This will update the record if the ticketId exists, or create a new one if it doesn't
  const { data, error } = await supabase
    .from('ticket_journey')
    .upsert({ 
      ticket_id: ticketId,
      customer_name: customerName,
      customer_email: customerEmail,
      app_name: appName,
      issue_description: issueDescription,
      priority: priority,
      updated_at: new Date()
    }, { onConflict: 'ticket_id' });

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ message: 'Journey updated successfully', data });
}
