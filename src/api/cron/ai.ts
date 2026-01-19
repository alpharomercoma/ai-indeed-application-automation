import { GoogleGenAI } from '@google/genai';
import { z } from "zod";

const generatedSchema = z.object({
    matchesPreferences: z.boolean().describe("Indicates if the job matches the user's preferences"),
    reasoning: z.string().describe("Explanation of why the job matches or does not match the user's preferences")
});

let aiInstance: GoogleGenAI | null = null;

async function initializeAI() {
    if (!aiInstance) {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY environment variable is not set');
        }
        aiInstance = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    }
    return aiInstance;
}

async function aiProcessJobs(jobs: any[]) {
    const ai = await initializeAI();
    const USER_PREFERENCES = process.env.USER_PREFERENCES;

    if (!USER_PREFERENCES) {
        throw new Error('USER_PREFERENCES environment variable is not set');
    }

    const results = [];
    for (const job of jobs) {
        // Create job description for AI analysis
        const jobDescription = `
Job Title: ${job.title || 'N/A'}
Company: ${job.company || 'N/A'}
Location: ${job.location || 'N/A'}
Job Type: ${job.jobType || 'N/A'}
Description: ${job.description || 'N/A'}
Date Posted: ${job.datePosted || 'N/A'}
${job.minAmount || job.maxAmount ? `Salary: ${job.minAmount || ''} - ${job.maxAmount || ''} ${job.currency || ''}` : ''}
Job URL: ${job.jobUrl || 'N/A'}
        `.trim();

        const prompt = `
User Preferences:
${USER_PREFERENCES}

Job Information:
${jobDescription}

Based on the user's preferences, does this job match? Respond with a JSON object containing:
- matchesPreferences: boolean indicating if the job is a good match
- reasoning: explanation of your decision
`;

        // This runs one by one. Slower, but won't crash the API.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: [prompt],
            config: {
                responseJsonSchema: generatedSchema,
            }
        });

        // Clean up the response text - remove markdown code blocks if present
        let responseText = response.text ?? '{}';
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const matchResult = JSON.parse(responseText);
        if (matchResult.matchesPreferences) {
            results.push({ job, matchResult });
        }
    }
    return results;
}

export { aiProcessJobs };
