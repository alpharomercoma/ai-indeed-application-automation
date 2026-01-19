import { NextRequest, NextResponse } from 'next/server';
import { scrapeJobMatrix } from '../../../api/cron/scrape';
import { aiProcessJobs } from '../../../api/cron/ai';
import applyToJobs from '../../../api/cron/apply';

export const maxDuration = 300; // 5 minutes max execution time for Vercel Hobby plan

export async function GET(request: NextRequest) {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('🚀 Starting cron job execution...');

        // Step 1: Scrape jobs from Indeed
        console.log('📊 Scraping jobs from Indeed...');
        const jobs = await scrapeJobMatrix();
        console.log(`✅ Scraped ${jobs.length} jobs`);

        if (jobs.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No jobs found matching criteria',
                jobsScraped: 0,
                jobsMatched: 0,
                jobsApplied: 0
            });
        }

        // Step 2: Filter jobs using Gemini AI
        console.log('🤖 Filtering jobs with AI...');
        const aiFilteredJobs = await aiProcessJobs(jobs);
        console.log(`✅ Found ${aiFilteredJobs.length} jobs matching user preferences`);

        if (aiFilteredJobs.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No jobs matched user preferences',
                jobsScraped: jobs.length,
                jobsMatched: 0,
                jobsApplied: 0
            });
        }

        // Step 3: Apply to jobs
        console.log('📝 Starting job applications...');
        const jobsToApply = aiFilteredJobs.map(item => item.job);
        const results = await applyToJobs(jobsToApply, true);
        console.log('✅ Job applications completed');

        return NextResponse.json({
            success: true,
            message: 'Cron job completed successfully',
            jobsScraped: jobs.length,
            jobsMatched: aiFilteredJobs.length,
            jobsApplied: jobsToApply.length,
            results
        });

    } catch (error) {
        console.error('❌ Error in cron job:', error);
        return NextResponse.json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
