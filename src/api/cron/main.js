import fs from 'fs';
import { scrapeJobs } from 'ts-jobspy';

const jobs = await scrapeJobs({
    siteName: ['indeed', 'linkedin'],
    searchTerm: 'software engineer',
    location: 'San Francisco, CA',
    resultsWanted: 20,
    hoursOld: 72,
    countryIndeed: 'USA',
    linkedinFetchDescription: true
});

const cleanedJobs = jobs.map(job => {
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
    return rest
});

console.log(`Found ${jobs.length} jobs`);
fs.writeFileSync('jobs.json', JSON.stringify(jobs, null, 2));





import { GoogleGenAI } from '@google/genai';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const meetsPreferences = z.object({
    meetsPreference: z.boolean(),
    reasons: z.string().array()
});

const systemInstruction = `
You are an expert job matching AI. Given a job description and a user's preferences, determine if the job meets the user's preferences.
`;


async function main() {
  const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseJsonSchema: zodToJsonSchema(meetsPreferences),
      }

  });
  console.log(response.text);
}
