import { GoogleGenAI } from '@google/genai';
import { z } from "zod";

// Batch schema for processing multiple jobs at once
const batchGeneratedSchema = z.array(z.object({
    jobIndex: z.number().describe("The index of the job in the batch (0-based)"),
    matchesPreferences: z.boolean().describe("Indicates if the job matches the user's preferences"),
    reasoning: z.string().describe("Explanation of why the job matches or does not match the user's preferences")
}));

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

// Sleep utility for rate limiting
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Process jobs in batches to reduce API calls
async function processBatch(ai: GoogleGenAI, jobs: any[], userPreferences: string, batchIndex: number) {
    // Limit description length to avoid token limits
    const MAX_DESC_LENGTH = 500;

    const jobDescriptions = jobs.map((job, idx) => {
        const description = job.description || 'N/A';
        const truncatedDesc = description.length > MAX_DESC_LENGTH
            ? description.substring(0, MAX_DESC_LENGTH) + '...'
            : description;

        return `
[Job ${idx}]
Title: ${job.title || 'N/A'}
Company: ${job.company || 'N/A'}
Location: ${job.location || 'N/A'}
Type: ${job.jobType || 'N/A'}
Description: ${truncatedDesc}
${job.minAmount || job.maxAmount ? `Salary: ${job.minAmount || ''}-${job.maxAmount || ''} ${job.currency || ''}` : ''}
        `.trim();
    }).join('\n\n---\n\n');

    const prompt = `
User Preferences:
${userPreferences}

Analyze these ${jobs.length} job postings and determine which ones match the user's preferences.

Jobs:
${jobDescriptions}

Respond with a JSON array containing an object for EVERY job with:
- jobIndex: the job number (0 to ${jobs.length - 1})
- matchesPreferences: boolean (true if it matches user preferences, false if not)
- reasoning: brief explanation of why it matches or doesn't match

IMPORTANT: You MUST include ALL ${jobs.length} jobs in your response array, even if they don't match.
Each job should have matchesPreferences set to true or false based on the user's preferences.
`;

    let retries = 0;
    const MAX_RETRIES = 3;

    while (retries < MAX_RETRIES) {
        try {
            console.log(`  Processing batch ${batchIndex + 1} (${jobs.length} jobs)...`);

            // Debug: Show first job in batch to verify data quality
            if (process.env.DEBUG_AI === 'true' && jobs[0]) {
                console.log(`  🔍 Sample job being analyzed:`);
                console.log(`     Title: ${jobs[0].title}`);
                console.log(`     Company: ${jobs[0].company}`);
                console.log(`     Location: ${jobs[0].location}`);
                console.log(`     Description preview: ${(jobs[0].description || 'N/A').substring(0, 200)}...`);
            }

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [prompt],
                config: {
                    responseJsonSchema: batchGeneratedSchema,
                }
            });

            let responseText = response.text ?? '[]';
            responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            // Debug: Show raw AI response
            if (process.env.DEBUG_AI === 'true') {
                console.log(`  🤖 Raw AI response: ${responseText.substring(0, 500)}...`);
            }

            const batchResults = JSON.parse(responseText);

            // Debug: Show all jobs and AI decisions
            console.log(`  📋 AI Analysis Results for Batch ${batchIndex + 1}:`);
            jobs.forEach((job, idx) => {
                const result = batchResults.find((r: any) => r.jobIndex === idx);
                if (result) {
                    const icon = result.matchesPreferences ? '✅' : '❌';
                    console.log(`    ${icon} [${idx}] ${job.title} at ${job.company}`);
                    console.log(`       Reasoning: ${result.reasoning}`);
                } else {
                    console.log(`    ⚠️  [${idx}] ${job.title} at ${job.company} - NO RESPONSE FROM AI`);
                }
            });

            // Map results back to jobs
            const matches = batchResults
                .filter((r: any) => r.matchesPreferences)
                .map((r: any) => ({
                    job: jobs[r.jobIndex],
                    matchResult: {
                        matchesPreferences: r.matchesPreferences,
                        reasoning: r.reasoning
                    }
                }));

            console.log(`  ✅ Batch ${batchIndex + 1}: ${matches.length}/${jobs.length} jobs matched\n`);
            return matches;

        } catch (error: any) {
            if (error?.status === 429) {
                // Rate limit hit - extract retry delay from error message
                const retryMatch = error.message?.match(/retry in ([\d.]+)s/);
                let retryDelay: number;

                if (retryMatch) {
                    // Use the delay from the error message
                    retryDelay = parseFloat(retryMatch[1]) * 1000;
                } else {
                    // If we hit the per-minute limit (15 RPM), wait until the next minute window
                    // RPM limits reset every 60 seconds, so wait 65 seconds to be safe
                    retryDelay = 65000;
                }

                console.log(`  ⚠️  Rate limit hit (429 error).`);
                console.log(`  💡 This usually means you've exceeded 15 requests per minute.`);
                console.log(`  ⏳ Waiting ${Math.round(retryDelay / 1000)}s for rate limit to reset (retry ${retries + 1}/${MAX_RETRIES})...`);

                await sleep(retryDelay);
                retries++;

                if (retries >= MAX_RETRIES) {
                    console.log(`  ❌ Max retries reached for batch ${batchIndex + 1}. Skipping this batch.`);
                    console.log(`  💡 TIP: You may have hit the daily limit (20-50 requests/day). Wait until midnight PT.`);
                    return [];
                }
            } else {
                console.error(`  ❌ Error processing batch ${batchIndex + 1}:`, error.message);
                return [];
            }
        }
    }

    return [];
}

async function aiProcessJobs(jobs: any[], options?: { batchSize?: number, delayBetweenBatches?: number; }) {
    const ai = await initializeAI();
    const USER_PREFERENCES = process.env.USER_PREFERENCES;

    if (!USER_PREFERENCES) {
        throw new Error('USER_PREFERENCES environment variable is not set');
    }

    // Batch configuration for free tier
    // Gemini 2.5 Flash free tier: 15 RPM (requests per minute)
    // To stay safe under 15 RPM, we need minimum 4 seconds between requests (60s / 15 = 4s)
    // Using 5 seconds to have a safety buffer
    const BATCH_SIZE = options?.batchSize ?? 10; // Process 10 jobs per request to maximize efficiency
    const DELAY_BETWEEN_BATCHES = options?.delayBetweenBatches ?? 5000; // 5 second delay (safe for 15 RPM limit)

    console.log(`🤖 Processing ${jobs.length} jobs in batches of ${BATCH_SIZE}...`);
    console.log(`⏱️  Delay between batches: ${DELAY_BETWEEN_BATCHES}ms (optimized for 15 RPM free tier limit)`);
    console.log(`📊 Estimated time: ~${Math.ceil((jobs.length / BATCH_SIZE) * (DELAY_BETWEEN_BATCHES / 1000))} seconds\n`);

    const results = [];
    const batches = [];

    // Split jobs into batches
    for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
        batches.push(jobs.slice(i, i + BATCH_SIZE));
    }

    console.log(`📦 Total batches: ${batches.length}\n`);

    // Track timing to ensure we don't exceed RPM
    const startTime = Date.now();

    // Process each batch with delay
    for (let i = 0; i < batches.length; i++) {
        const batchStartTime = Date.now();
        const batchResults = await processBatch(ai, batches[i], USER_PREFERENCES, i);
        results.push(...batchResults);

        // Add delay between batches (except for last batch)
        if (i < batches.length - 1) {
            // Calculate how long the request took
            const requestDuration = Date.now() - batchStartTime;
            // Ensure we wait at least DELAY_BETWEEN_BATCHES total (including request time)
            const actualDelay = Math.max(DELAY_BETWEEN_BATCHES - requestDuration, 1000);

            console.log(`  ⏳ Waiting ${Math.round(actualDelay / 1000)}s before next batch...\n`);
            await sleep(actualDelay);
        }
    }

    const totalTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✅ Finished processing all batches in ${totalTime}s. Total matches: ${results.length}/${jobs.length}\n`);
    return results;
}

export { aiProcessJobs };
