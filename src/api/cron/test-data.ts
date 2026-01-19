// Mock job data for testing the end-to-end flow
export const mockJobs = [
    {
        id: "test-job-1",
        title: "Senior Full Stack Engineer (Remote)",
        company: "TechCorp Inc",
        location: "Remote - Netherlands",
        jobType: "Full-time",
        description: "We are looking for a Senior Full Stack Engineer with expertise in React, TypeScript, and Node.js. You will work on building scalable web applications and collaborate with our distributed team.",
        datePosted: new Date().toISOString(),
        jobUrl: "https://www.indeed.com/viewjob?jk=test123",
        minAmount: 80000,
        maxAmount: 120000,
        currency: "EUR"
    },
    {
        id: "test-job-2",
        title: "AI/ML Engineer",
        company: "DataScience Solutions",
        location: "Amsterdam, Netherlands",
        jobType: "Full-time",
        description: "Join our AI team to build cutting-edge machine learning models. Experience with Python, TensorFlow, and PyTorch required. We work on NLP and computer vision projects.",
        datePosted: new Date().toISOString(),
        jobUrl: "https://www.indeed.com/viewjob?jk=test456",
        minAmount: 90000,
        maxAmount: 130000,
        currency: "EUR"
    }
];
