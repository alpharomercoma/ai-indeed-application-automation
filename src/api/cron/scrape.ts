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

const scrapeJobMatrix = async (maxJobs: number = 2) => {
    let allJobs: any[] = [];

    // For testing, only search first country and first search term
    const countries = Object.keys(preferenceMatrix.country).slice(0, 1);
    const searchTerms = preferenceMatrix.searchTerm.slice(0, 1);

    for (const country of countries) {
        for (const term of searchTerms) {
            console.log(`Searching for "${term}" in ${country}...`);
            try {
                const jobs = await scrapeJobs({
                    siteName: ['indeed'],
                    searchTerm: term,
                    location: country,
                    resultsWanted: maxJobs * 2, // Get more jobs to account for filtering
                    hoursOld: 168, // 1 week
                    easyApply: false, // Don't filter by easy apply to get more results
                    countryIndeed: preferenceMatrix.country[country as keyof typeof preferenceMatrix.country],
                });
                console.log(`Found ${jobs.length} raw jobs`);
                allJobs = allJobs.concat(cleanJobs(jobs));

                // Stop if we have enough jobs
                if (allJobs.length >= maxJobs) {
                    break;
                }
            } catch (error) {
                console.error(`Error scraping ${term} in ${country}:`, error);
            }
        }
        if (allJobs.length >= maxJobs) {
            break;
        }
    }

    // Deduplicate based on id and limit to maxJobs
    const uniqueJobs = Array.from(new Map(allJobs.map(job => [job.id, job])).values());
    return uniqueJobs.slice(0, maxJobs);
};

export { scrapeJobMatrix };
