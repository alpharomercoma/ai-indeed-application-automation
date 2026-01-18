import { GoogleGenAI } from '@google/genai';
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const USER_PREFERENCES = process.env.USER_PREFERENCES;
const parsedPreferences = z.string().parse(USER_PREFERENCES);

const systemInstruction = `
You are an expert job matching AI. Given a job description and a user's preferences, determine if the job meets the user's preferences.
`;

const generatedSchema = z.object({
    matchesPreferences: z.boolean().describe("Indicates if the job matches the user's preferences"),
    reasoning: z.string().describe("Explanation of why the job matches or does not match the user's preferences")
});

const cache = await ai.caches.create({
    model: 'models/gemini-3.0-flash',
    config: {
        systemInstruction,
        contents: [parsedPreferences],
        ttl: "30m",
    }
});

async function aiProcessJobs(jobs: any[]) {
    const results = [];
    for (const job of jobs) {
        // This runs one by one. Slower, but won't crash the API.
        const response = await ai.models.generateContent({
            model: 'gemini-3.0-flash',
            contents: [""],
            config: {
                cachedContent: cache.name,
                responseMimeType: "application/json",
                responseJsonSchema: zodToJsonSchema(generatedSchema),
            }
        });
        const matchResult = JSON.parse(response.text ?? '{}');
        if (matchResult.matchesPreferences) { results.push({ job, matchResult }); }
    }
    return results;
}

export { aiProcessJobs };