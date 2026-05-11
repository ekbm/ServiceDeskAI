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
