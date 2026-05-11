// ============================================================
// DeskAI — Service Desk AI Assistant
// Calls the Anthropic Claude API directly from the browser.
// API key is stored in localStorage only — never in this file.
// ============================================================

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL   = 'claude-sonnet-4-20250514';

// Session state — accumulates all ticket context as agent works through stages
let session = {
  ticketId: '', customerName: '', customerEmail: '',
  appName: '', issueDescription: '', priority: '',
  loggedTime: '', callNotes: '', faultType: '',
  troubleshootLog: '', troubleshootOutcome: '',
  vendorName: '', evidenceList: '', resolutionSummary: ''
};

// ============================================================
// Init
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  if (!getApiKey()) showApiModal();
  setDefaultTime();
  loadSession();
});

function setDefaultTime() {
  const el = document.getElementById('logged-time');
  if (el) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    el.value = now.toISOString().slice(0, 16);
  }
}

// ============================================================
// API Key
// ============================================================
function getApiKey() { return localStorage.getItem('deskAI_apiKey') || ''; }

function saveApiKey() {
  const key = document.getElementById('api-key-input').value.trim();
  if (!key.startsWith('sk-ant-')) {
    alert('That doesn\'t look like a valid Anthropic API key (should start with sk-ant-)');
    return;
  }
  localStorage.setItem('deskAI_apiKey', key);
  document.getElementById('api-modal').classList.add('hidden');
}

function showApiModal() {
  document.getElementById('api-key-input').value = getApiKey();
  document.getElementById('api-modal').classList.remove('hidden');
}

// ============================================================
// Stage navigation
// ============================================================
function showStage(name) {
  document.querySelectorAll('.stage').forEach(s => s.classList.remove('active'));
  document.getElementById('stage-' + name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(b => {
    b.classList.remove('active');
    if (b.dataset.stage === name) b.classList.add('active');
  });
}

// ============================================================
// Session persistence (localStorage)
// ============================================================
function saveSession() {
  localStorage.setItem('deskAI_session', JSON.stringify(session));
}

function loadSession() {
  const saved = localStorage.getItem('deskAI_session');
  if (!saved) return;
  try {
    session = { ...session, ...JSON.parse(saved) };
    // Restore form fields
    fillField('ticket-id', session.ticketId);
    fillField('customer-name', session.customerName);
    fillField('customer-email', session.customerEmail);
    fillField('app-name', session.appName);
    fillField('issue-description', session.issueDescription);
    fillField('priority', session.priority);
    fillField('logged-time', session.loggedTime);
    fillField('call-notes', session.callNotes);
    fillField('fault-type', session.faultType);
    fillField('troubleshoot-log', session.troubleshootLog);
    fillField('troubleshoot-outcome', session.troubleshootOutcome);
    fillField('vendor-name', session.vendorName);
    fillField('evidence-list', session.evidenceList);
    fillField('resolution-summary', session.resolutionSummary);
    updateTicketRef();
  } catch(e) { /* ignore */ }
}

function fillField(id, value) {
  const el = document.getElementById(id);
  if (el && value) el.value = value;
}

function clearSession() {
  if (!confirm('Start a new ticket? This will clear the current session.')) return;
  localStorage.removeItem('deskAI_session');
  session = { ticketId:'',customerName:'',customerEmail:'',appName:'',issueDescription:'',priority:'',loggedTime:'',callNotes:'',faultType:'',troubleshootLog:'',troubleshootOutcome:'',vendorName:'',evidenceList:'',resolutionSummary:'' };
  location.reload();
}

// ============================================================
// Stage save handlers
// ============================================================
async function saveIntake() {
    // 1. Capture current values from the form into the session object
    session.ticketId          = val('ticket-id');
    session.customerName      = val('customer-name');
    session.customerEmail     = val('customer-email');
    session.appName           = val('app-name');
    session.issueDescription  = val('issue-description');
    session.priority          = val('priority');
    session.loggedTime        = val('logged-time');

    // 2. Validation
    if (!session.ticketId || !session.customerName || !session.issueDescription) {
        alert('Please fill in Ticket ID, Customer Name, and Issue Description before continuing.');
        return;
    }

    // 3. NEW: Send data to your Vercel backend
    try {
        const response = await fetch('/api/triage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ticketId: session.ticketId,
                customerName: session.customerName,
                customerEmail: session.customerEmail,
                appName: session.appName,
                issueDescription: session.issueDescription,
                priority: session.priority
            })
        });

        if (response.ok) {
            console.log("Journey synchronized with Supabase.");
        } else {
            console.error("Sync failed:", await response.text());
        }
    } catch (err) {
        console.error("Network error connecting to Vercel:", err);
    }

    // 4. Existing logic to move to the next stage
    saveSession();     // This is the line 128 you saw!
    updateTicketRef();
    markDone('intake');
    showStage('call');
}

async function saveCall() {
    session.callNotes = val('call-notes');
    
    if (!session.callNotes) {
        alert('Please add call notes before continuing.');
        return;
    }

    // --- NEW: Sync Call Notes to the Journey ---
    try {
        await fetch('/api/triage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ticketId: session.ticketId, // Used to find the right row
                callNotes: session.callNotes 
            })
        });
        console.log("Call notes synced to journey.");
    } catch (err) {
        console.error("Sync error:", err);
    }
    // -------------------------------------------

    saveSession();
    markDone('call');
    showStage('triage');
}

async function saveTriage() {
    session.faultType = val('fault-type');
    if (!session.faultType || session.faultType === '') {
        alert('Please select a fault type.');
        return;
    }

    try {
        await fetch('/api/triage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ticketId: session.ticketId,
                faultType: session.faultType
            })
        });
    } catch (err) { console.error("Sync error:", err); }

    saveSession();
    markDone('triage');
    showStage('troubleshoot');
}

function saveTroubleshoot() {
  session.troubleshootLog     = val('troubleshoot-log');
  session.troubleshootOutcome = val('troubleshoot-outcome');
  saveSession();
  markDone('troubleshoot');
  showStage('email');
}

function closeTicket() {
  session.resolutionSummary = val('resolution-summary');
  saveSession();
  const output = document.getElementById('close-output');
  output.classList.remove('hidden');
  output.innerHTML = `<div class="ticket-closed"><h3>&#10003; Ticket Closed</h3><p>Ticket <strong>${session.ticketId}</strong> has been closed successfully. All session data has been saved.</p></div>`;
  markDone('close');
}

// ============================================================
// Claude API call
// ============================================================
async function callClaude(prompt, outputId, label) {
  const key = getApiKey();
  if (!key) { showApiModal(); return; }

  const output = document.getElementById(outputId);
  output.classList.remove('hidden');
  output.innerHTML = `<div class="ai-label">&#10024; ${label}</div><span class="loading-text"></span>`;
  output.classList.add('loading');
  setStatus('loading', 'AI thinking...');

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `API error ${res.status}`);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || 'No response received.';

    output.classList.remove('loading');
    output.innerHTML = `
      <div class="ai-label">&#10024; ${label}</div>
      <button class="copy-btn" onclick="copyText(this)">Copy</button>
      <div class="ai-text">${escHtml(text)}</div>
    `;
    setStatus('active', 'Ready');
  } catch(e) {
    output.classList.remove('loading');
    output.innerHTML = `<div class="ai-label" style="color:var(--danger)">&#9888; Error</div><p style="color:var(--danger)">${escHtml(e.message)}</p><p style="margin-top:8px;font-size:13px;color:var(--text2)">Check your API key in Settings, or check your Anthropic account has credits.</p>`;
    setStatus('', 'Error');
  }
}

// ============================================================
// AI Actions
// ============================================================
function generateCallScript() {
  const prompt = `You are an experienced IT service desk agent. Generate a structured call script for the following ticket.

Ticket details:
- Customer: ${session.customerName}
- Application/System: ${session.appName}
- Issue reported: ${session.issueDescription}
- Priority: ${session.priority}

Create a professional, friendly call script that:
1. Opens with a warm greeting and ticket reference
2. Lists 8-10 specific triage questions to gather first-hand information (symptoms, when started, who is affected, recent changes, error messages, steps already tried)
3. Closes with next steps explanation

Format clearly with sections. Be concise and practical.`;

  callClaude(prompt, 'call-script-area', 'Call script');
}

function runTriage() {
  if (!session.callNotes) { alert('Please save call notes first.'); return; }

  const prompt = `You are a senior IT service desk analyst. Based on the ticket information and call notes below, classify this fault and recommend next steps.

Ticket:
- Application: ${session.appName}
- Original issue: ${session.issueDescription}
- Priority: ${session.priority}

Call notes from customer:
${session.callNotes}

Provide:
1. FAULT CLASSIFICATION: Hardware / Software / Network / Access issue — with confidence level and reasoning (2-3 sentences)
2. MOST LIKELY ROOT CAUSE: Your top hypothesis
3. IMMEDIATE NEXT STEPS: 3-5 specific actions for the agent
4. WATCH OUT FOR: Any red flags or things that could indicate a more serious issue

Be direct and specific. Avoid vague advice.`;

  callClaude(prompt, 'triage-output', 'Triage analysis');
}

function generateSteps() {
  const faultType = val('fault-type') || session.faultType || 'Unknown';

  const prompt = `You are an expert IT support engineer. Generate a detailed troubleshooting checklist for the following issue.

Fault type: ${faultType}
Application/System: ${session.appName}
Issue: ${session.issueDescription}
Call notes: ${session.callNotes}

Provide 8-12 numbered troubleshooting steps, ordered from quickest/simplest to more involved. For each step include:
- What to do (specific command, tool, or action)
- What to look for / what a pass or fail result looks like
- What to do if that step reveals the problem

Focus on practical, actionable steps an agent can perform remotely or guide the customer through. Include specific tool names (e.g. mdsched.exe, CrystalDiskInfo, Event Viewer path).`;

  callClaude(prompt, 'steps-output', 'Troubleshooting steps');
}

function generateEmail(type) {
  const templates = {
    initial: `Write a professional IT service desk email to acknowledge a new ticket and set expectations.
Subject line included.
Tone: friendly, professional, reassuring.
Details:
- Customer: ${session.customerName} (${session.customerEmail})
- Ticket ref: ${session.ticketId}
- Issue: ${session.issueDescription}
- Priority: ${session.priority}
- Agent has reviewed the ticket and will be in touch shortly.`,

    findings: `Write a professional IT service desk update email to the customer after troubleshooting.
Subject line included.
Details:
- Customer: ${session.customerName}
- Ticket ref: ${session.ticketId}
- Issue: ${session.issueDescription}
- Fault type identified: ${session.faultType}
- Troubleshooting done: ${session.troubleshootLog}
- Current outcome: ${session.troubleshootOutcome}
Include findings, what was tried, current status, and next steps. Be clear and jargon-free.`,

    escalation: `Write a professional IT service desk email notifying the customer their ticket is being escalated to the vendor.
Subject line included.
Details:
- Customer: ${session.customerName}
- Ticket ref: ${session.ticketId}
- Issue: ${session.issueDescription}
- Vendor being contacted: ${session.vendorName || 'vendor support'}
- Steps already tried: ${session.troubleshootLog}
Be transparent about why escalation is needed. Give a realistic timeframe expectation. Keep customer confidence high.`,

    resolution: `Write a professional IT service desk resolution confirmation email.
Subject line included.
Details:
- Customer: ${session.customerName}
- Ticket ref: ${session.ticketId}
- Original issue: ${session.issueDescription}
- Resolution: ${session.resolutionSummary || 'Issue has been resolved'}
Confirm the fix, briefly explain what was done, ask the customer to verify, and advise what to do if the issue recurs.`
  };

  callClaude(templates[type], 'email-output', `${type.charAt(0).toUpperCase() + type.slice(1)} email`);
}

function generateEscalationPack() {
  session.vendorName   = val('vendor-name');
  session.evidenceList = val('evidence-list');
  saveSession();

  const prompt = `You are a senior IT service desk engineer preparing an escalation pack for a vendor.

Generate a complete, professional escalation document with these sections:
1. ESCALATION SUMMARY — one paragraph overview
2. CUSTOMER & TICKET DETAILS — formatted reference block
3. ISSUE DESCRIPTION — clear technical description
4. TIMELINE — chronological list of events
5. TROUBLESHOOTING PERFORMED — what was tried and outcomes
6. EVIDENCE ATTACHED — list and description of files
7. EXPECTED VENDOR ACTION — what you need from the vendor
8. CONTACT & SLA — urgency and escalation contact

Ticket data:
- Ref: ${session.ticketId}
- Customer: ${session.customerName} (${session.customerEmail})
- Application: ${session.appName}
- Priority: ${session.priority}
- Logged: ${session.loggedTime}
- Issue: ${session.issueDescription}
- Call notes: ${session.callNotes}
- Fault type: ${session.faultType}
- Troubleshooting log: ${session.troubleshootLog}
- Outcome: ${session.troubleshootOutcome}
- Target vendor: ${session.vendorName}
- Evidence collected: ${session.evidenceList}

Format professionally. Use clear headings. Be specific and technical.`;

  callClaude(prompt, 'escalation-output', 'Escalation pack');
}

function generateClosureNotes() {
  session.resolutionSummary = val('resolution-summary');
  saveSession();

  const prompt = `Write professional IT service desk closure notes for this ticket.

Include:
1. RESOLUTION SUMMARY — what the fix was
2. ROOT CAUSE — confirmed cause of the issue
3. STEPS TAKEN — brief timeline of actions
4. VERIFICATION — how resolution was confirmed
5. PREVENTIVE MEASURES — any recommendations to prevent recurrence

Ticket data:
- Ref: ${session.ticketId}
- Customer: ${session.customerName}
- Application: ${session.appName}
- Issue: ${session.issueDescription}
- Fault type: ${session.faultType}
- Troubleshooting: ${session.troubleshootLog}
- Resolution: ${session.resolutionSummary}

Be concise but complete. This will be stored in the ticketing system.`;

  callClaude(prompt, 'close-output', 'Closure notes');
}

function generateKBArticle() {
  const prompt = `Write a knowledge base article based on this resolved service desk ticket. 

Format as a proper KB article with:
- TITLE: descriptive title for the issue
- SYMPTOMS: what the user experiences
- CAUSE: root cause explanation
- SOLUTION: step-by-step fix (numbered)
- RELATED ISSUES: similar problems this might help with
- TAGS: comma-separated keywords for search

Keep it practical. Written for other service desk agents, not end users.

Ticket data:
- Application: ${session.appName}
- Issue: ${session.issueDescription}
- Fault type: ${session.faultType}
- Troubleshooting done: ${session.troubleshootLog}
- Resolution: ${session.resolutionSummary}`;

  callClaude(prompt, 'close-output', 'KB article draft');
}

// ============================================================
// Export session
// ============================================================
function exportSession() {
  const text = `SERVICE DESK SESSION EXPORT
===========================
Ticket: ${session.ticketId}
Customer: ${session.customerName} (${session.customerEmail})
Application: ${session.appName}
Priority: ${session.priority}
Logged: ${session.loggedTime}

ISSUE DESCRIPTION
-----------------
${session.issueDescription}

CALL NOTES
----------
${session.callNotes}

FAULT CLASSIFICATION
--------------------
${session.faultType}

TROUBLESHOOTING LOG
-------------------
${session.troubleshootLog}
Outcome: ${session.troubleshootOutcome}

EVIDENCE
--------
${session.evidenceList}

VENDOR
------
${session.vendorName}

RESOLUTION
----------
${session.resolutionSummary}

Exported: ${new Date().toLocaleString()}
`;

  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${session.ticketId || 'ticket'}-session-log.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// Helpers
// ============================================================
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
}

function updateTicketRef() {
  const ref = document.getElementById('ticket-ref');
  if (session.ticketId) {
    ref.textContent = `${session.ticketId} — ${session.customerName || ''} — ${session.appName || ''}`;
  }
}

function markDone(stage) {
  const btn = document.querySelector(`.nav-item[data-stage="${stage}"]`);
  if (btn) btn.classList.add('done');
}

function setStatus(cls, label) {
  const dot = document.getElementById('status-dot');
  const lbl = document.getElementById('status-label');
  dot.className = 'status-dot' + (cls ? ' ' + cls : '');
  lbl.textContent = label;
}

function copyText(btn) {
  const text = btn.parentElement.querySelector('.ai-text')?.innerText || '';
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy', 2000);
  });
}
