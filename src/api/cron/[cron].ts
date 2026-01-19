import { scrapeJobMatrix } from './scrape';
import { aiProcessJobs } from './ai';
import applyToJobs from './apply';
const runCronJob = async () => {
    const jobs = await scrapeJobMatrix();
    const aiFilteredJobs = await aiProcessJobs(jobs);
    console.log(`Found ${aiFilteredJobs.length} jobs matching user preferences.`);
    const results = await applyToJobs(aiFilteredJobs, true);
    console.log(results);
};

runCronJob();