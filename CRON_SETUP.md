# Indeed Automation Cron Job Setup

This document explains how to set up and use the automated job scraping, filtering, and application system for both Vercel Cron Jobs and local execution.

## Overview

The system performs the following steps:
1. **Scrape Jobs**: Scrapes relevant job listings from Indeed
2. **AI Filtering**: Uses Gemini AI to match jobs against your preferences
3. **Auto-Apply**: Uses Browser-Use SDK to automatically apply to matched jobs

## Project Structure

```
src/
├── api/cron/
│   ├── scrape.ts          # Job scraping logic
│   ├── ai.ts              # AI job matching
│   ├── apply.ts           # Browser automation for applications
│   ├── run.ts             # Manual local execution script
│   ├── test-run.ts        # Test with mock data
│   └── test-data.ts       # Mock job data for testing
└── app/api/cron/
    └── route.ts           # Vercel API route handler

vercel.json                # Vercel cron configuration
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
# Required for AI job matching
GEMINI_API_KEY=your_gemini_api_key

# Required for job application automation
BROWSER_USE_API_KEY=your_browser_use_api_key
BROWSER_PROFILE_ID=your_browser_profile_id

# Required for Vercel Cron (optional for local testing)
CRON_SECRET=your_secure_random_string

# User preferences for AI matching
USER_PREFERENCES="I am looking for remote software engineering positions..."
```

## Local Testing

### 1. Test with Mock Data (Recommended for First Run)

```bash
npm run apply:test
```

This will:
- Use 2 mock job listings
- Filter them with Gemini AI
- Attempt to apply (you can Ctrl+C to skip actual application)

### 2. Test with Real Job Scraping

```bash
npm run apply
```

This will:
- Scrape 2 real jobs from Indeed
- Filter with Gemini AI
- Apply to matched jobs

## Vercel Deployment

### 1. Set Up Environment Variables

In your Vercel project dashboard:
1. Go to Settings → Environment Variables
2. Add all the variables from your `.env` file
3. Make sure `CRON_SECRET` is set to a secure random string

### 2. Deploy

```bash
vercel --prod
```

### 3. Configure Cron Job

The cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 9 * * *"
    }
  ]
}
```

This runs daily at 9:00 AM UTC. Modify the `schedule` field using cron syntax:
- `0 9 * * *` - Daily at 9:00 AM
- `0 */6 * * *` - Every 6 hours
- `0 9 * * 1-5` - Weekdays at 9:00 AM

### 4. Test Vercel Cron Manually

You can trigger the cron job manually:

```bash
curl -X GET https://your-app.vercel.app/api/cron \
  -H "Authorization: Bearer your_cron_secret"
```

## API Endpoint

**GET** `/api/cron`

**Headers:**
- `Authorization: Bearer <CRON_SECRET>` (optional but recommended)

**Response:**
```json
{
  "success": true,
  "message": "Cron job completed successfully",
  "jobsScraped": 10,
  "jobsMatched": 3,
  "jobsApplied": 3,
  "results": { ... }
}
```

## Customization

### Modify Job Search Criteria

Edit `src/api/cron/scrape.ts`:

```typescript
const preferenceMatrix = {
    country: {
        Netherlands: "NL",
        UnitedKingdom: "UK",
        // Add more countries
    },
    searchTerm: ["software engineer", "full-stack developer"],
};
```

### Modify User Preferences

Update the `USER_PREFERENCES` environment variable with your job preferences. The AI will use this to filter jobs.

### Adjust Cron Schedule

Modify `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 */12 * * *"  // Every 12 hours
    }
  ]
}
```

## Troubleshooting

### Rate Limiting

If you see "quota exceeded" errors for Gemini AI:
- Wait for the rate limit to reset (usually 1 minute for free tier)
- Consider upgrading your Gemini API plan
- Reduce the number of jobs being processed

### No Jobs Found

If scraping returns 0 jobs:
- Check if the search terms and locations are valid
- Try increasing `hoursOld` parameter in `scrape.ts`
- Remove the `easyApply: true` filter to get more results
- The ts-jobspy library may have rate limiting or API changes

### Browser Automation Fails

If job applications don't work:
- Check that `BROWSER_USE_API_KEY` and `BROWSER_PROFILE_ID` are correct
- Ensure your browser profile has Indeed login cookies saved
- Check the Browser-Use dashboard for session logs

## Security Notes

- Never commit `.env` file to version control
- Use Vercel environment variables for production secrets
- The `CRON_SECRET` prevents unauthorized access to the cron endpoint
- All API keys are accessed via `process.env` and never hardcoded

## Cost Considerations

- **Gemini AI**: Free tier with rate limits, pay-as-you-go after that
- **Browser-Use SDK**: Charges per minute of browser session time
- **Vercel**: Free tier includes cron jobs, check limits for your plan
- **Indeed API/Scraping**: Free through ts-jobspy library

## Monitoring

- Check Vercel logs for cron job execution history
- Monitor Browser-Use dashboard for application sessions
- Review Gemini API usage at https://ai.dev/rate-limit

## Next Steps

1. Test locally with mock data
2. Test with real job scraping
3. Deploy to Vercel
4. Monitor the first few cron executions
5. Adjust preferences and schedule as needed
