# HeyTutor RFP Tracker

A branded proposal tracking app for the HeyTutor team. Track RFP deadlines, submission requirements, contacts, and proposal status — all from a shared URL.

## Quick Deploy to Vercel (5 minutes)

### Step 1: Push to GitHub
1. Create a new repo on GitHub (e.g., `heytutor-rfp-tracker`)
2. Push this project:
   ```bash
   cd heytutor-rfp-tracker
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/heytutor-rfp-tracker.git
   git push -u origin main
   ```

### Step 2: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import your `heytutor-rfp-tracker` repo
4. Vercel auto-detects React — just click **Deploy**
5. In ~60 seconds you'll get a live URL like `heytutor-rfp-tracker.vercel.app`
6. Share that URL with your team!

## Enable Real-Time Team Sync (Optional but Recommended)

By default, the app saves data locally in each person's browser. To make it truly shared (like a Google Doc), set up Firebase — it's free for your team's usage.

### Step 1: Create Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Create a project"** → name it `heytutor-rfp-tracker`
3. Skip Google Analytics (not needed)

### Step 2: Create Realtime Database
1. In the Firebase console, go to **Build → Realtime Database**
2. Click **"Create Database"**
3. Choose your region (us-central1 is fine)
4. Select **"Start in test mode"** (we'll secure it next)
5. Copy your database URL — it looks like:
   ```
   https://heytutor-rfp-tracker-default-rtdb.firebaseio.com
   ```

### Step 3: Add Security Rules
In the Firebase console, go to **Realtime Database → Rules** and paste:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
> **Note:** For production, you'd want authentication. This setup works great for an internal team tool where the URL itself is the access control.

### Step 4: Connect to Your App
1. Open `src/App.js`
2. Find this line near the top:
   ```js
   const FIREBASE_DB_URL = "";
   ```
3. Paste your database URL:
   ```js
   const FIREBASE_DB_URL = "https://heytutor-rfp-tracker-default-rtdb.firebaseio.com";
   ```
4. Commit and push — Vercel auto-redeploys:
   ```bash
   git add .
   git commit -m "Enable Firebase sync"
   git push
   ```

That's it! Your team now shares a single source of truth. The app polls every 5 seconds for changes, so when someone adds or updates an RFP, everyone sees it within moments.

## Features

- **Dashboard** with active RFPs, upcoming deadlines, overdue count, and wins
- **Search** across districts, titles, states, and contacts
- **Filter** by status (Not Started, In Progress, Under Review, Submitted, Won, Lost)
- **Sort** by due date, district name, or status
- **Detail panel** with all submission info, contacts, guidelines, and notes
- **Export/Import** JSON backups via the ⋮ More menu
- **Live Sync** indicator when Firebase is connected
- **HeyTutor branded** with your exact brand colors

## Custom Domain (Optional)

Want it at something like `rfp.heytutor.com`?
1. In Vercel, go to your project → **Settings → Domains**
2. Add your custom domain
3. Update your DNS as Vercel instructs

## Tech Stack

- React 18
- Firebase Realtime Database (optional)
- Hosted on Vercel (free tier)
