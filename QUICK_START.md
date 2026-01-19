# Quick Start Guide

## Prerequisites
- Node.js installed
- Gemini API key
- Browser-Use SDK credentials

## Setup (5 minutes)

### 1. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials:
# - GEMINI_API_KEY
# - BROWSER_USE_API_KEY
# - BROWSER_PROFILE_ID
# - USER_PREFERENCES
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Test Locally
```bash
# Test with mock data (safe, no real API calls to Indeed)
npm run apply:test

# Test with real scraping (uses Gemini AI quota)
npm run apply
```

## Deploy to Vercel (5 minutes)

### 1. Set Environment Variables
Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add all variables from your `.env` file, plus:
```
CRON_SECRET=your_random_secure_string_here
```

### 2. Deploy
```bash
vercel --prod
```

### 3. Done!
Your cron job will now run daily at 9 AM UTC.

## Commands

| Command | Description |
|---------|-------------|
| `npm run apply:test` | Test with mock data (safe) |
| `npm run apply` | Run manually with real scraping |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build for production |

## Cron Schedule

Edit `vercel.json` to change schedule:

```json
{
  "crons": [{
    "path": "/api/cron",
    "schedule": "0 9 * * *"  ← Change this
  }]
}
```

**Examples:**
- `0 9 * * *` - Daily at 9 AM
- `0 */6 * * *` - Every 6 hours
- `0 9 * * 1-5` - Weekdays at 9 AM

## Troubleshooting

### "Quota exceeded" error
Wait 1 minute for Gemini free tier reset, or upgrade your API plan.

### No jobs found
Edit `src/api/cron/scrape.ts` to adjust search parameters.

### Applications failing
Check Browser-Use dashboard for session logs.

## Full Documentation
- See `CRON_SETUP.md` for detailed setup
- See `IMPLEMENTATION_SUMMARY.md` for architecture
