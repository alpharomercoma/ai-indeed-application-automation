# Command Reference

Quick reference for all available commands in the Indeed automation system.

## Local Development

### Testing Commands

```bash
# Test with mock data (safe, no real API calls)
npm run apply:test

# Run full pipeline with real job scraping
npm run apply

# Start Next.js dev server
npm run dev

# Build for production
npm run build
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env  # or your preferred editor

# Required variables:
# - GEMINI_API_KEY
# - BROWSER_USE_API_KEY
# - BROWSER_PROFILE_ID
# - USER_PREFERENCES
```

## Vercel Deployment

### Deploy Commands

```bash
# Deploy to production
vercel --prod

# Deploy preview
vercel

# Check deployment status
vercel ls

# View logs
vercel logs
```

### Environment Variables

```bash
# Set via Vercel CLI
vercel env add GEMINI_API_KEY
vercel env add BROWSER_USE_API_KEY
vercel env add BROWSER_PROFILE_ID
vercel env add USER_PREFERENCES
vercel env add CRON_SECRET

# Or set via Vercel Dashboard:
# Project Settings → Environment Variables
```

## Testing the Cron Endpoint

### Local Testing (Next.js dev server)

```bash
# Start dev server
npm run dev

# In another terminal, test the endpoint
curl -X GET http://localhost:3000/api/cron \
  -H "Authorization: Bearer your_cron_secret"
```

### Production Testing

```bash
# Test the deployed endpoint
curl -X GET https://your-app.vercel.app/api/cron \
  -H "Authorization: Bearer your_cron_secret"
```

## Monitoring & Debugging

### View Logs

```bash
# Vercel logs (last 100 lines)
vercel logs --follow

# Filter by function
vercel logs --follow | grep cron

# View specific deployment logs
vercel logs [deployment-url]
```

### Check Cron Status

```bash
# View cron job history in Vercel Dashboard:
# Project → Deployments → [Deployment] → Functions → Cron

# Or via API
curl -H "Authorization: Bearer $VERCEL_TOKEN" \
  https://api.vercel.com/v1/deployments/[deployment-id]/crons
```

### Debug Browser Sessions

```bash
# Browser-Use dashboard
# Visit: https://cloud.browser-use.com

# List active sessions
curl -X GET https://api.browser-use.com/api/v2/sessions \
  -H "X-Browser-Use-API-Key: $BROWSER_USE_API_KEY"
```

## Configuration Changes

### Modify Cron Schedule

Edit `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron",
    "schedule": "0 */6 * * *"  // Change this
  }]
}
```

Then deploy:
```bash
vercel --prod
```

### Modify Job Search Criteria

Edit `src/api/cron/scrape.ts`:
```typescript
const preferenceMatrix = {
    country: {
        Netherlands: "NL",
        // Add more countries
    },
    searchTerm: ["software engineer", "your terms"],
};
```

### Modify User Preferences

Update environment variable:
```bash
# Local
echo 'USER_PREFERENCES="Your new preferences"' >> .env

# Vercel
vercel env add USER_PREFERENCES production
```

## Utility Scripts

### Clean Up Sessions (if needed)

```bash
# Create a cleanup script
cat > cleanup-sessions.sh << 'EOF'
#!/bin/bash
curl -X POST https://api.browser-use.com/api/v2/sessions/cleanup \
  -H "X-Browser-Use-API-Key: $BROWSER_USE_API_KEY"
EOF

chmod +x cleanup-sessions.sh
./cleanup-sessions.sh
```

### Check Gemini Quota

Visit: https://ai.dev/rate-limit

Or programmatically:
```bash
curl -X GET "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY"
```

## Git Operations

```bash
# Check for uncommitted secrets
git status

# Verify .env is ignored
git check-ignore -v .env

# Commit changes (safe - .env is ignored)
git add .
git commit -m "Update cron configuration"
git push
```

## Troubleshooting Commands

### Test Environment Variables

```bash
# Check if variables are set
node -e "require('dotenv').config(); console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✓ Set' : '✗ Missing')"
node -e "require('dotenv').config(); console.log('BROWSER_USE_API_KEY:', process.env.BROWSER_USE_API_KEY ? '✓ Set' : '✗ Missing')"
```

### Verify API Keys

```bash
# Test Gemini API
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'

# Test Browser-Use API
curl -X GET https://api.browser-use.com/api/v2/profiles \
  -H "X-Browser-Use-API-Key: $BROWSER_USE_API_KEY"
```

### Check Dependencies

```bash
# Verify installations
npm list @google/genai
npm list browser-use-sdk
npm list ts-jobspy

# Reinstall if needed
npm install
```

## Emergency Commands

### Stop All Browser Sessions

```bash
# If you have runaway sessions
curl -X POST https://api.browser-use.com/api/v2/sessions/stop-all \
  -H "X-Browser-Use-API-Key: $BROWSER_USE_API_KEY"
```

### Disable Cron Temporarily

Remove from `vercel.json`:
```json
{
  "crons": []
}
```

Then:
```bash
vercel --prod
```

Re-enable by adding back the cron configuration.

## Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Browser-Use Dashboard**: https://cloud.browser-use.com
- **Gemini API Console**: https://ai.google.dev
- **Indeed Jobs**: https://www.indeed.com

## Support

- Documentation: See `CRON_SETUP.md`
- Architecture: See `IMPLEMENTATION_SUMMARY.md`
- Test Results: See `TEST_RESULTS.md`
- Quick Start: See `QUICK_START.md`
