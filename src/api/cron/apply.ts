import { BrowserUseClient } from "browser-use-sdk";

async function applyToJobs(jobs: any[], waitForCompletion = false) {
    console.log(`\n🚀 Starting job application process for ${jobs.length} job(s)...\n`);

    // Initialize client here to ensure environment variables are loaded
    const BROWSER_USE_API_KEY = process.env.BROWSER_USE_API_KEY;
    const BROWSER_PROFILE_ID = process.env.BROWSER_PROFILE_ID;

    if (!BROWSER_USE_API_KEY) {
        throw new Error('BROWSER_USE_API_KEY environment variable is not set');
    }
    if (!BROWSER_PROFILE_ID) {
        throw new Error('BROWSER_PROFILE_ID environment variable is not set');
    }

    const client = new BrowserUseClient({
        apiKey: BROWSER_USE_API_KEY,
    });

    console.log(`🔑 Using browser profile: ${BROWSER_PROFILE_ID}`);
    console.log(`💡 This profile has Indeed cookies, so you should already be logged in!\n`);

    // Create a session with the browser profile and residential proxy
    console.log(`🆕 Creating session with browser profile and residential proxy...`);
    const session = await client.sessions.createSession({
        profileId: BROWSER_PROFILE_ID,
        persistMemory: true,
        proxyCountryCode: 'ph', // Use Philippines residential proxy to avoid Cloudflare
    });
    const sessionId = session.id;
    console.log(`✅ Session created: ${sessionId}`);
    if (session.liveUrl) {
        console.log(`🔗 Live URL: ${session.liveUrl}`);
    }

    // Build task for applying to jobs (skip login since we have cookies)
    const jobUrls = jobs.map(job => job.jobUrl);
    const jobList = jobUrls.map((url, idx) => `${idx + 1}. ${url}`).join('\n');


    function getNextWeekDates() {
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const timeRange = '5PM to 9PM PH time';
        const tuesday = `${new Date(nextWeek.setDate(nextWeek.getDate() + 1))}` + ' ' + timeRange;
        const wednesday = `${new Date(nextWeek.setDate(nextWeek.getDate() + 2))}` + ' ' + timeRange;
        return { tuesday, wednesday };
    }
    const comprehensiveTask = `
You need to apply to multiple jobs on Indeed. You should already be logged in via saved cookies.

IMPORTANT - CLOUDFLARE HANDLING:
- If you encounter a Cloudflare verification page, WAIT for it to complete automatically
- Do NOT click any buttons on the Cloudflare page
- The verification should complete within 5-10 seconds

STEP 1: VERIFY LOGIN STATUS
- Go to https://www.indeed.com
- Wait for any Cloudflare verification to complete
- Check if you're already logged in (look for your account name or profile icon)
- If you see you're logged in, proceed to applying for jobs
- If NOT logged in, go to login page and sign in with Google

STEP 2: APPLY TO EACH JOB
Apply to the following ${jobs.length} job(s) one by one:

${jobList}

For each job:
1. Navigate to the job URL
2. Wait for Cloudflare verification if it appears (usually 5-10 seconds)
3. Look for and click the "Apply" or "Apply now" button
4. Fill out any required application fields using autofill where available
5. If file upload is required (resume, cover letter), note that you cannot upload and skip this job
6. If the form is simple (no file uploads), submit the application
7. Confirm the application was submitted successfully
8. Move to the next job

IMPORTANT:
- Always wait for Cloudflare verifications to complete automatically
- Stay logged in throughout the entire process
- Skip jobs that require file uploads or complex multi-page forms
- Complete as many ${jobs.length} applications as possible
- Report the status of each job application (submitted, skipped, error)
- Don't apply to jobs in the home page. Only apply to the specific jobs you are given.

APPLICATION INFORMATION:
Use the following information if needed to apply to the job.
- 3 years of AI/ML Experience
- 4 years of Software Engineering Experience
- Able to start working immediately
- Able to work remotely
- Able to work full-time/part-time
- Only available on ${getNextWeekDates().tuesday} and ${getNextWeekDates().wednesday}
`;
    console.log(`📋 Creating task to apply to ${jobs.length} jobs...`);

    const task = await client.tasks.createTask({
        task: comprehensiveTask,
        sessionId: sessionId,
    });

    console.log(`\n✅ Task created successfully!`);
    console.log(`📋 Task ID: ${task.id}`);
    console.log(`🔗 Watch live session at: https://cloud.browser-use.com/thread/${task.sessionId}`);
    console.log(`\n📝 Jobs to be applied:`);
    jobs.forEach((job, idx) => {
        console.log(`   ${idx + 1}. ${job.title} at ${job.company}`);
        console.log(`      URL: ${job.jobUrl}`);
    });

    const taskInfo = {
        taskId: task.id,
        sessionId: sessionId,
        viewUrl: `https://cloud.browser-use.com/thread/${task.sessionId}`,
        jobCount: jobs.length,
        jobs: jobs.map(job => ({
            title: job.title,
            company: job.company,
            url: job.jobUrl
        }))
    };

    if (waitForCompletion) {
        console.log(`\n⏳ Waiting for all applications to complete...`);
        console.log(`💡 This may take several minutes. Watch progress at the URL above.`);

        try {
            const result = await task.complete();
            console.log(`\n✅ All tasks completed!`);
            console.log(`📊 Result:`, result.output);

            // Always stop the session after completion to avoid charges
            console.log(`\n🛑 Stopping session ${sessionId}...`);
            await client.sessions.updateSession({
                session_id: sessionId,
                action: 'stop'
            });
            console.log(`✅ Session stopped successfully.`);

            console.log(`\n${'='.repeat(60)}\n`);
            return { ...taskInfo, result: result.output };
        } catch (error) {
            // Stop session even on error
            console.log(`\n🛑 Error occurred, stopping session ${sessionId}...`);
            await client.sessions.updateSession({
                session_id: sessionId,
                action: 'stop'
            });
            throw error;
        }
    } else {
        console.log(`\n🚀 Task started! The browser will apply to all jobs.`);
        console.log(`💡 Watch the progress live at: https://cloud.browser-use.com/thread/${task.id}`);
        console.log(`\n⚠️  Remember to stop the session when done to avoid charges:`);
        console.log(`   Session ID: ${sessionId}`);

        console.log(`\n${'='.repeat(60)}\n`);
        return taskInfo;
    }
}

export default applyToJobs;

// Main execution when run directly
if (require.main === module) {
    import('dotenv').then(dotenv => {
        dotenv.config();

        // Import dependencies
        return Promise.all([
            import('./scrape'),
            import('./ai')
        ]);
    }).then(([{ scrapeJobMatrix }, { aiProcessJobs }]) => {
        console.log('🚀 Starting full job application workflow...\n');

        // Run the full workflow
        return scrapeJobMatrix(1).then(jobs => {
            console.log(`✅ Scraped ${jobs.length} jobs\n`);
            return aiProcessJobs(jobs);
        }).then(aiFilteredJobs => {
            console.log(`✅ AI filtered to ${aiFilteredJobs.length} matching jobs\n`);

            if (aiFilteredJobs.length === 0) {
                console.log('❌ No jobs matched user preferences');
                return;
            }

            const jobsToApply = aiFilteredJobs.map(item => item.job);
            return applyToJobs(jobsToApply, true);
        }).then(results => {
            console.log('\n✅ Workflow completed!');
            console.log('📊 Results:', results);
        });
    }).catch(error => {
        console.error('\n❌ Error in workflow:', error);
        process.exit(1);
    });
}
