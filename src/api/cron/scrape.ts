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

const scrapeJobMatrix = async () => {
    let allJobs: any[] = [];
    for (const country of Object.keys(preferenceMatrix.country)) {
        for (const term of preferenceMatrix.searchTerm) {
            const jobs = await scrapeJobs({
                siteName: ['indeed'],
                searchTerm: term,
                location: country,
                resultsWanted: 20,
                hoursOld: 24,
                easyApply: true,
                countryIndeed: preferenceMatrix.country[country as keyof typeof preferenceMatrix.country],
            });
            allJobs = allJobs.concat(cleanJobs(jobs));
        }
    }
    // deduplicate based on id
    return Array.from(new Map(allJobs.map(job => [job.id, job])).values());
};

export { scrapeJobMatrix };
