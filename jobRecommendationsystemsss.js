const { Client } = require('pg');
const { HfInference } = require('@huggingface/inference');
const jobPostings = require('./jobPostings');


const hf = new HfInference('your-secret-key');
// PostgreSQL Client Setup
const client = new Client({
    user: 'postgres',
    host: '172.21.73.52',
    database: 'postgres',
    password: 'your-password',
    port: 5432,
  });
  
  client.connect();
  
  
// Function to generate embeddings
async function generateEmbeddings(jobTexts) {
    try {
        const results = await hf.featureExtraction({
            model: "sentence-transformers/all-MiniLM-L6-v2",
            inputs: jobTexts,
        });
        return results;
    } catch (error) {
        console.error("Error generating embeddings:", error);
        return [];
    }
}

// Function to classify text into labels
async function classifyText(word, labels) {
    try {
        const response = await hf.request({
            model: "facebook/bart-large-mnli",
            inputs: word,
            parameters: { candidate_labels: labels },
        });

        if (response && response.labels && response.labels.length > 0) {
            return {
                label: response.labels[0],
                score: response.scores[0],
            };
        } else {
            console.error("No classification response for word:", word);
            return {};
        }
    } catch (error) {
        console.error("Error classifying text:", error);
        return {};
    }
}

// Function to extract filter criteria from query
async function extractFilterCriteria(query) {
    const criteria = {
        location: null,
        jobTitle: null,
        jobType: null,
        company: null,
    };

    const labels = ["location", "job title", "company", "job type"];
    const words = query.split(" ");

    for (const word of words) {
        const result = await classifyText(word, labels);
        if (result.score > 0.5) {
            switch (result.label) {
                case "location":
                    criteria.location = word;
                    break;
                case "job title":
                    criteria.jobTitle = word;
                    break;
                case "company":
                    criteria.company = word;
                    break;
                case "job type":
                    criteria.jobType = word;
                    break;
            }
        }
    }

    return criteria;
}

// Perform similarity search
async function performSimilaritySearch(queryTerm, jobPostings) {
    try {
        const queryEmbedding = await generateEmbeddings([queryTerm]);
        const jobsWithEmbeddings = await Promise.all(
            jobPostings.map(async (job) => {
                const textToEmbed = `${job.jobTitle} ${job.jobDescription}`;
                const embedding = await generateEmbeddings([textToEmbed]);
                return { ...job, embedding: embedding[0] };
            })
        );

        const results = jobsWithEmbeddings.map((job) => {
            const distance = job.embedding.reduce((sum, val, i) => {
                return sum + Math.pow(val - queryEmbedding[0][i], 2);
            }, 0);
            return { ...job, similarityScore: Math.sqrt(distance) };
        });

        results.sort((a, b) => a.similarityScore - b.similarityScore);
        return results.slice(0, 3); // Top 3 results
    } catch (error) {
        console.error("Error performing similarity search:", error);
        return [];
    }
}

// Main function
async function main() {
    try {
        const query = "Creative Studio"; // User query
        console.log("Searching for:", query);

        // Extract filter criteria
        const filterCriteria = await extractFilterCriteria(query);
        console.log("Filter criteria:", filterCriteria);

        // Perform similarity search
        const initialResults = await performSimilaritySearch(query, jobPostings);
        console.log("Initial similarity search results:", initialResults);

        // Apply extracted filter criteria
        const filteredResults = initialResults.filter((job) => {
            return (
                (!filterCriteria.location || job.location.includes(filterCriteria.location)) &&
                (!filterCriteria.jobTitle || job.jobTitle.includes(filterCriteria.jobTitle)) &&
                (!filterCriteria.jobType || job.jobType.includes(filterCriteria.jobType)) &&
                (!filterCriteria.company || job.company.includes(filterCriteria.company))
            );
        });

        if (filteredResults.length === 0) {
            console.log("No job postings found after applying filters.");
        } else {
            filteredResults.forEach((job) => {
                console.log("Job ID:", job.jobId);
                console.log("Job Title:", job.jobTitle);
                console.log("Company:", job.company);
                console.log("Location:", job.location);
                console.log("Job Type:", job.jobType);
                console.log("Salary:", job.salary);
                console.log("Job Description:", job.jobDescription);
                console.log("Responsibilities:", job.jobResponsibilities.join(", "));
                console.log("Preferred Qualifications:", job.preferredQualifications.join(", "));
                console.log("Application Deadline:", job.applicationDeadline);
                console.log("Similarity Score:", job.similarityScore);
                console.log("------");
            });
        }
    } catch (error) {
        console.error("Error in main function:", error);
    }
}

// Run the main function
main();
