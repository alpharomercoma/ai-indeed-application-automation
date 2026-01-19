// trial scrape jobs from indeed
import 'dotenv/config';

// import jobs.json
import applyToJobs from './apply';
// import jobData from './job.json';
import * as fs from 'fs';

async function main() {
    const jobData = fs.readFileSync('./src/api/cron/job.json', 'utf8');
    console.log(jobData);
    const jobDataJson = JSON.parse(jobData);

    // Apply to jobs using the browser profile with Indeed cookies
    // waitForCompletion: true = wait for completion and auto-stop session
    // waitForCompletion: false = return immediately (you must manually stop session later)
    const result = await applyToJobs(jobDataJson, true);

    console.log('\n📝 Task Summary:');
    console.log(`   Task ID: ${result.taskId}`);
    console.log(`   Watch live: ${result.viewUrl}`);
    console.log(`   Total jobs: ${result.jobCount}`);
}

main().catch(console.error);
