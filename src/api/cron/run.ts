import { scrapeJobMatrix } from './scrape';
import { aiProcessJobs } from './ai';
import applyToJobs from './apply';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const runCronJob = async () => {
    try {
        console.log('🚀 Starting manual cron job execution...\n');

        // Step 1: Scrape jobs from Indeed
        console.log('📊 Scraping jobs from Indeed...');
        const jobs = await scrapeJobMatrix(2); // Limit to 2 jobs for testing
        console.log(`✅ Scraped ${jobs.length} jobs\n`);

        if (jobs.length === 0) {
            console.log('❌ No jobs found matching criteria');
            return;
        }

        console.log('📋 Jobs found:');
        jobs.forEach((job, idx) => {
            console.log(`   ${idx + 1}. ${job.title} at ${job.company}`);
            console.log(`      Location: ${job.location}`);
            console.log(`      URL: ${job.jobUrl}\n`);
        });

        // Step 2: Filter jobs using Gemini AI
        console.log('🤖 Filtering jobs with AI...');
        const aiFilteredJobs = await aiProcessJobs(jobs);
        console.log(`✅ Found ${aiFilteredJobs.length} jobs matching user preferences\n`);

        if (aiFilteredJobs.length === 0) {
            console.log('❌ No jobs matched user preferences');
            return;
        }

        console.log('✅ Matched jobs:');
        aiFilteredJobs.forEach((item, idx) => {
            console.log(`   ${idx + 1}. ${item.job.title} at ${item.job.company}`);
            console.log(`      Reasoning: ${item.matchResult.reasoning}\n`);
        });

        // Step 3: Apply to jobs
        console.log('📝 Starting job applications...');
        const jobsToApply = aiFilteredJobs.map(item => item.job);
        const results = await applyToJobs(jobsToApply, true);

        console.log('\n✅ Job applications completed!');
        console.log('📊 Summary:');
        console.log(`   Jobs scraped: ${jobs.length}`);
        console.log(`   Jobs matched: ${aiFilteredJobs.length}`);
        console.log(`   Jobs applied: ${jobsToApply.length}`);
        console.log('\n🎉 Cron job completed successfully!');

        return results;
    } catch (error) {
        console.error('\n❌ Error in cron job:', error);
        throw error;
    }
};

runCronJob();
