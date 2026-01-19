import dotenv from 'dotenv';
import { aiProcessJobs } from './ai';
import applyToJobs from './apply';
import { mockJobs } from './test-data';

// Load environment variables
dotenv.config();

const testCronJob = async () => {
    try {
        console.log('🧪 Starting TEST cron job execution (using mock data)...\n');

        // Use mock data instead of scraping
        console.log('📊 Using mock job data for testing...');
        const jobs = mockJobs;
        console.log(`✅ Loaded ${jobs.length} test jobs\n`);

        console.log('📋 Test jobs:');
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
            console.log('💡 Try adjusting your USER_PREFERENCES in .env file\n');
            return;
        }

        console.log('✅ Matched jobs:');
        aiFilteredJobs.forEach((item, idx) => {
            console.log(`   ${idx + 1}. ${item.job.title} at ${item.job.company}`);
            console.log(`      Reasoning: ${item.matchResult.reasoning}\n`);
        });

        // Step 3: Apply to jobs
        console.log('📝 Starting job applications...');
        console.log('⚠️  NOTE: This will use Browser-Use SDK to actually apply to jobs!');
        console.log('💡 To skip this step, press Ctrl+C now. Continuing in 5 seconds...\n');

        // Wait 5 seconds to allow user to cancel
        await new Promise(resolve => setTimeout(resolve, 5000));

        const jobsToApply = aiFilteredJobs.map(item => item.job);
        const results = await applyToJobs(jobsToApply, true);

        console.log('\n✅ Job applications completed!');
        console.log('📊 Summary:');
        console.log(`   Jobs loaded: ${jobs.length}`);
        console.log(`   Jobs matched: ${aiFilteredJobs.length}`);
        console.log(`   Jobs applied: ${jobsToApply.length}`);
        console.log('\n🎉 Test cron job completed successfully!');

        return results;
    } catch (error) {
        console.error('\n❌ Error in test cron job:', error);
        throw error;
    }
};

testCronJob();
