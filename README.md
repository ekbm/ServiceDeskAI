# DeskAI — Service Desk AI Assistant

A browser-based AI-powered service desk tool that guides agents through the full ticket lifecycle — from the initial customer call through triage, troubleshooting, email drafting, vendor escalation, and ticket closure.

Built with plain HTML, CSS, and JavaScript. Hosted free on GitHub Pages. Powered by the Claude API.

---

## What it does

| Stage | What the AI generates |
|---|---|
| 1. Ticket Intake | Captures and stores all ticket details |
| 2. Customer Call | Generates a tailored call script with triage questions |
| 3. Triage | Classifies fault as hardware/software/network with reasoning |
| 4. Troubleshoot | Produces a step-by-step checklist for the specific fault |
| 5. Email Drafts | Drafts initial contact, findings, escalation, and resolution emails |
| 6. Escalation Pack | Builds a complete vendor escalation document |
| 7. Close & Document | Writes closure notes and a knowledge base article |

---

## Deploy to GitHub Pages (step by step)

### Step 1 — Create a GitHub account
Go to [github.com](https://github.com) and sign up if you don't have an account.

### Step 2 — Create a new repository
1. Click the **+** icon (top right) → **New repository**
2. Name it: `servicedesk-assistant` (or anything you like)
3. Set visibility to **Public**
4. Check **"Add a README file"**
5. Click **Create repository**

### Step 3 — Upload the files
1. In your new repo, click **Add file** → **Upload files**
2. Upload these three files:
   - `index.html`
   - `style.css`
   - `app.js`
3. Scroll down, add a commit message like `Add service desk app files`
4. Click **Commit changes**

### Step 4 — Enable GitHub Pages
1. In your repo, click **Settings** (top tab)
2. In the left sidebar, click **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Set Branch to `main`, folder to `/ (root)`
5. Click **Save**

GitHub will show you your live URL — it looks like:
```
https://YOUR-USERNAME.github.io/servicedesk-assistant
```

It takes about 60 seconds to go live. Refresh the Pages settings page to see the URL appear.

### Step 5 — Get your Anthropic API key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Click **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-...`)
5. Add some credits under **Billing** (pay-per-use, small team usage is a few dollars/month)

### Step 6 — Use the app
1. Open your GitHub Pages URL
2. The app will prompt you to enter your API key
3. Paste your `sk-ant-...` key and click **Save & Continue**
4. The key is saved in your browser only — never in the repo

---

## Making changes

To edit the app after deploying:

**Option A — Edit directly on GitHub (easiest)**
1. Go to your repo on github.com
2. Click the file you want to edit (e.g. `app.js`)
3. Click the pencil icon (Edit)
4. Make your changes
5. Click **Commit changes**
6. GitHub Pages rebuilds automatically in ~60 seconds

**Option B — Edit locally with VS Code**
1. Install [Git](https://git-scm.com) and [VS Code](https://code.visualstudio.com)
2. Clone your repo: `git clone https://github.com/YOUR-USERNAME/servicedesk-assistant`
3. Open the folder in VS Code
4. Edit the files
5. In terminal: `git add . && git commit -m "Your change" && git push`
6. GitHub Pages rebuilds automatically

---

## File structure

```
servicedesk-assistant/
├── index.html    # App structure and all UI stages
├── style.css     # All styling
├── app.js        # Workflow logic and Claude API calls
└── README.md     # This file
```

---

## Security notes

- Your API key is stored in your browser's `localStorage` — it never touches this repo or any server other than Anthropic
- The app calls the Claude API directly from the browser using Anthropic's allowed browser access header
- For a shared team deployment, consider adding a simple password prompt before the API key entry, or setting up a Cloudflare Worker as a proxy to keep the key server-side

---

## Customising the prompts

All AI prompts are in `app.js`. Each function like `generateCallScript()`, `runTriage()`, `generateEmail()` contains a plain-English prompt string. Edit these to match your organisation's:
- Terminology and ticketing system names
- Email tone and sign-off format
- Escalation process specifics
- Troubleshooting runbooks

---

## Troubleshooting

**"API error 401"** — API key is wrong or expired. Click Settings (bottom of sidebar) to re-enter it.

**"API error 403"** — Your Anthropic account may need billing credits added.

**Page not loading on GitHub Pages** — Check Settings → Pages to confirm it's enabled and the branch is set to `main`.

**Changes not showing** — GitHub Pages can take up to 2 minutes to rebuild. Hard refresh with Ctrl+Shift+R.
