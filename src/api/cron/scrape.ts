import scrapeJobs from "ts-jobspy";

// Must use FULL country names from the Indeed supported list
// See: https://github.com/alpharomercoma/ts-jobspy README for full list
const countries = [
    "Singapore",
    "Philippines",
    // "Netherlands",
    // "UK",
    // "Germany",
    // "France",
    // "Japan",
    // "Canada",
    // "Australia",
    // "USA",
];

const searchTerms = [
    "software engineer",
    "full-stack developer",
    "AI Engineer"
];

function cleanJobs(jobList: any[]) {
    return jobList.map(job => {
        const {
            jobLevel,
            jobFunction,
            listingType,
            emails,
            companyIndustry,
            companyLogo,
            companyUrlDirect,
            companyAddresses,
            companyNumEmployees,
            companyRevenue,
            companyDescription,
            skills,
            experienceRange,
            companyRating,
            companyReviewsCount,
            vacancyCount,
            workFromHomeType,
            ...rest
        } = job;
        return rest;
    });
}

const scrapeJobMatrix = async (resultsPerSearch: number = 10) => {
    let allJobs: any[] = [];

    for (const countryName of countries) {
        for (const term of searchTerms) {
            console.log(`Searching for "${term}" in ${countryName}...`);
            try {
                // CRITICAL: Indeed only allows ONE of: hoursOld, (jobType & isRemote), or easyApply
                // We prioritize: easyApply (for one-click applications)
                // Strategy: Use easyApply filter, add "remote" to search term, then filter for remote jobs
                const jobs = await scrapeJobs({
                    siteName: 'indeed',
                    searchTerm: term + ' remote', // Add "remote" to search term to get remote jobs
                    location: '', // Search nationwide within the specified country
                    resultsWanted: resultsPerSearch,
                    easyApply: true, // ONLY jobs with easy apply (one-click application)
                    countryIndeed: countryName, // Use full country name, not code
                });
                console.log(`  Found ${jobs.length} raw jobs from Indeed (easy apply only)`);

                // Filter for remote jobs (since we can't use isRemote param with easyApply)
                const remoteJobs = jobs.filter(job => {
                    const location = (job.location || '').toLowerCase();
                    const title = (job.title || '').toLowerCase();
                    const description = (job.description || '').toLowerCase();

                    const isRemote = job.isRemote === true ||
                        location.includes('remote') ||
                        location.includes('anywhere') ||
                        title.includes('remote') ||
                        description.includes('remote work') ||
                        description.includes('work from home');

                    return isRemote;
                });

                console.log(`  After remote filter: ${remoteJobs.length}/${jobs.length} jobs`);

                // Clean jobs and add to list
                const filteredJobs = cleanJobs(remoteJobs);
                allJobs = allJobs.concat(filteredJobs);
            } catch (error) {
                console.error(`Error scraping ${term} in ${countryName}:`, error);
                if (error instanceof Error) {
                    console.error(`  Error message: ${error.message}`);
                    console.error(`  Error stack: ${error.stack}`);
                }
            }
        }
    }

    // Deduplicate based on id
    const uniqueJobs = Array.from(new Map(allJobs.map(job => [job.id, job])).values());
    console.log(`Total unique jobs after deduplication: ${uniqueJobs.length}`);
    return uniqueJobs;
};

export { scrapeJobMatrix };
