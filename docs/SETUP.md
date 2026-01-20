# Setup Guide

## Prerequisites

- Node.js 18+
- Gemini API key ([Get one here](https://ai.google.dev))
- Browser-Use SDK credentials ([Sign up here](https://browser-use.com))

## Installation

```bash
cd my-app
npm install
```

## Environment Variables

Copy the template and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini AI API key |
| `BROWSER_USE_API_KEY` | Browser-Use SDK API key |
| `BROWSER_PROFILE_ID` | Browser profile with Indeed cookies |
| `USER_PREFERENCES` | Your job search preferences (used by AI) |
| `CRON_SECRET` | Secret for Vercel cron endpoint (optional) |

Example `.env`:

```bash
GEMINI_API_KEY=AIza...
BROWSER_USE_API_KEY=bu_...
BROWSER_PROFILE_ID=8e797f30-...
USER_PREFERENCES="I am looking for remote software engineering positions with React, TypeScript, and Node.js"
CRON_SECRET=your_secure_random_string
```

## Local Testing

### Test with Mock Data (Recommended First)

```bash
npm run apply:test
```

This uses fake job data to verify your API keys work without hitting Indeed.

### Test with Real Scraping

```bash
npm run apply
```

This scrapes real jobs from Indeed, filters with AI, and attempts applications.

## Vercel Deployment

### 1. Set Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables, add all variables from your `.env` file.

### 2. Deploy

```bash
vercel --prod
```

### 3. Cron Schedule

The job runs daily at 9 AM UTC by default. Modify `vercel.json` to change:

```json
{
  "crons": [{
    "path": "/api/cron",
    "schedule": "0 9 * * *"
  }]
}
```

Schedule examples:
- `0 9 * * *` - Daily at 9 AM
- `0 */6 * * *` - Every 6 hours
- `0 9 * * 1-5` - Weekdays only at 9 AM

### 4. Manual Trigger

```bash
curl -X GET https://your-app.vercel.app/api/cron \
  -H "Authorization: Bearer your_cron_secret"
```

## Customization

### Job Search Criteria

Edit `src/api/cron/scrape.ts`:

```typescript
const countries = ["Singapore", "Philippines", "USA"];
const searchTerms = ["software engineer", "full-stack developer"];
```

### User Preferences

Update the `USER_PREFERENCES` environment variable. The AI uses this to decide which jobs match your criteria.

## Troubleshooting

### "Quota exceeded" Error
Gemini free tier has rate limits. Wait 1 minute or upgrade your plan.

### No Jobs Found
- Check search terms in `scrape.ts`
- Indeed may be rate limiting - try again later

### Applications Failing
- Check Browser-Use dashboard for session logs
- Ensure your browser profile has Indeed login cookies
- Cloudflare may be blocking - the system has built-in handling for this

## Cost Considerations

| Service | Free Tier | Notes |
|---------|-----------|-------|
| Gemini AI | 15 RPM, 1M tokens/day | Sufficient for most use |
| Browser-Use | Pay per minute | Sessions auto-stop |
| Vercel | Cron jobs included | Check your plan limits |
