# Alpha AI – Complete System

Deploy instructions:

1. Clone repo, install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill in all variables.
3. Run Supabase migration (see `supabase/migrations/`).
4. Set up Google Sheets and share with service account.
5. Configure Google My Business API and add service account as manager to clients.
6. Deploy to Vercel (set environment variables in Vercel dashboard).
7. For review responder, enable Vercel Cron Jobs (Pro) or use external cron.
8. Start onboarding clients!

See full spec in the project files.
