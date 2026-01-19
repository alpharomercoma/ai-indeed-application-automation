import scrapeJobs from "ts-jobspy";

const preferenceMatrix = {
    country: {
        Netherlands: "NL",
        UnitedKingdom: "UK",
        Germany: "DE",
        France: "FR",
        Japan: "JP",
        Canada: "CA",
        Australia: "AU",
        UnitedStates: "US",
        Singapore: "SG",
        Philippines: "PH",
    },
    searchTerm: ["software engineer", "full-stack developer", "AI Engineer"],
};

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

    // Search all countries and search terms from preference matrix
    const countries = Object.keys(preferenceMatrix.country);
    const searchTerms = preferenceMatrix.searchTerm;

    for (const country of countries) {
        for (const term of searchTerms) {
            console.log(`Searching for "${term}" in ${country}...`);
            try {
                const countryCode = preferenceMatrix.country[country as keyof typeof preferenceMatrix.country];
                console.log(`  Using country code: ${countryCode}`);
                const jobs = await scrapeJobs({
                    siteName: 'indeed',
                    searchTerm: term,
                    location: '', // Leave empty to search nationwide
                    resultsWanted: resultsPerSearch,
                    hoursOld: 24, // 3 days to get more results
                    easyApply: true, // Don't filter by easy apply to get more results
                    countryIndeed: countryCode,
                });
                console.log(`Found ${jobs.length} raw jobs`);
                allJobs = allJobs.concat(cleanJobs(jobs));
            } catch (error) {
                console.error(`Error scraping ${term} in ${country}:`, error);
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
