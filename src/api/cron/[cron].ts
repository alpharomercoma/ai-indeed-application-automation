import { scrapeJobMatrix } from './scrape';
import { aiProcessJobs } from './ai';

const runCronJob = async () => {
    const jobs = await scrapeJobMatrix();
    const aiFilteredJobs = await aiProcessJobs(jobs);
    console.log(`Found ${aiFilteredJobs.length} jobs matching user preferences.`);
    // Further processing can be done here, like saving to a database or sending notifications.
};

runCronJob();