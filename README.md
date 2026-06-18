# FamilyOS

A self-hostable family mobile app — tasks, calendar, vault, calls, and more. Built with React + Express + SQLite.

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4
- **Backend**: Express.js
- **Database**: SQLite via sql.js
- **Auth**: JWT + bcrypt
- **AI**: Google Gemini API (optional)
- **Real-time**: WebRTC signaling via Express

## Setup

1. `npm install`
2. Create `.env` from `.env.example` and set `JWT_SECRET` (required) and optionally `GEMINI_API_KEY`
3. `npm run dev` — development server on port 3000
4. `npm run build && npm start` — production build

## Self-hosting

- App runs on **port 3000** by default.
- First registered user automatically becomes **admin**.
- Subsequent users require **admin approval** before login.
- File uploads stored in `./uploads/vault/`
- Database stored in `./data/familyos.db`

## Features

- Tasks & chore scoreboard with points
- Shared calendar with events
- AI-powered voice command parser (Gemini or local fallback)
- Gift suggestion engine
- Encrypted vault for secrets and files
- Family video/voice calls (WebRTC)
- SOS emergency beacon
- Notification center
- Admin panel for user approval