# Indeed Job Application Automation

Automated job application system that scrapes Indeed listings, filters them using AI, and auto-applies to matching jobs.

## How It Works

1. **Scrape** - Fetches job listings from Indeed (remote, easy-apply jobs)
2. **Filter** - Uses Gemini AI to match jobs against your preferences
3. **Apply** - Uses Browser-Use SDK to automatically submit applications

## Quick Start

```bash
cp .env.example .env  # Configure your credentials
npm install
npm run apply:test    # Test with mock data
```

## Configuration

Create a `.env` file with:

```bash
GEMINI_API_KEY=your_gemini_api_key
BROWSER_USE_API_KEY=your_browser_use_api_key
BROWSER_PROFILE_ID=your_browser_profile_id
USER_PREFERENCES="I am looking for remote software engineering positions..."
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run apply:test` | Test with mock data (safe) |
| `npm run apply` | Run full pipeline with real scraping |
| `npm run dev` | Start Next.js dev server |

## Deployment

Deploy to Vercel for automated daily job applications:

```bash
vercel --prod
```

The cron job runs daily at 9 AM UTC. Configure the schedule in `vercel.json`.

## Project Structure

```
src/
├── api/cron/
│   ├── scrape.ts      # Job scraping from Indeed
│   ├── ai.ts          # Gemini AI job matching
│   └── apply.ts       # Browser automation
├── app/api/cron/
│   └── route.ts       # Vercel cron endpoint
docs/
├── SETUP.md           # Full setup instructions
└── COMMANDS.md        # Command reference
```

## Documentation

- [Setup Guide](docs/SETUP.md) - Full configuration and deployment instructions
- [Commands Reference](docs/COMMANDS.md) - All available commands

## Tech Stack

- **Next.js** - Web framework & API routes
- **ts-jobspy** - Indeed job scraping
- **Gemini AI** - Job matching & filtering
- **Browser-Use SDK** - Browser automation for applications
- **Vercel** - Hosting & cron jobs

## License

MIT
