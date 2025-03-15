const { Client } = require('pg');
const { HfInference } = require('@huggingface/inference');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const readline = require('readline');

// Hugging Face API Key
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
// Load job postings from jobPostings.js
const jobPostings = require('./jobPostings.js'); // Assuming jobPostings.js is in the same directory

// Function to extract text from a PDF file
function extractTextFromPDF(filePath) {
  return new Promise((resolve, reject) => {
    const dataBuffer = fs.readFileSync(filePath);
    pdfParse(dataBuffer).then(function (data) {
      console.log('Extracted Text from PDF:', data.text); // Log the extracted text
      resolve(data.text);
    }).catch(reject);
  });
}

// Function to generate embeddings for a given text using Hugging Face API
async function generateEmbeddings(texts) {
  try {
    const results = await hf.featureExtraction({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      inputs: texts,
    });
    return results;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    return [];
  }
}

// Function to calculate cosine similarity between two arrays (embeddings)
function cosineSimilarity(vec1, vec2) {
  const dotProduct = vec1.reduce((acc, val, i) => acc + val * vec2[i], 0);
  const magnitude1 = Math.sqrt(vec1.reduce((acc, val) => acc + val * val, 0));
  const magnitude2 = Math.sqrt(vec2.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (magnitude1 * magnitude2);
}

// Function to prompt user input (for resume file path)
function promptUserInput() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("Enter the path to the candidate's resume PDF: ", (filePath) => {
      rl.close();
      resolve(filePath);
    });
  });
}

// Function to query job recommendations based on the resume text
async function queryJobRecommendations(resumeText) {
  // Generate embedding for the resume
  const resumeEmbedding = await generateEmbeddings([resumeText]);

  if (resumeEmbedding.length === 0) {
    console.log('Failed to generate embedding for resume.');
    return;
  }

  // Generate embeddings for all job descriptions
  const jobEmbeddings = await generateEmbeddings(jobPostings.map((job) => job.jobDescription));

  // Calculate similarity scores
  const jobSimilarities = jobPostings.map((job, index) => {
    const similarity = cosineSimilarity(resumeEmbedding[0], jobEmbeddings[index]);
    return { job, similarity };
  });

  // Sort by similarity score in descending order
  jobSimilarities.sort((a, b) => b.similarity - a.similarity);

  // Get the top 5 similar jobs
  const top5Jobs = jobSimilarities.slice(0, 5);
  console.log('Top 5 Job Recommendations based on your resume:');
  top5Jobs.forEach(({ job, similarity }) => {
    console.log(`Job ID: ${job.jobId}`);
    console.log(`Job Title: ${job.jobTitle}`);
    console.log(`Company: ${job.company}`);
    console.log(`Location: ${job.location}`);
    console.log(`Job Type: ${job.jobType}`);
    console.log(`Salary: ${job.salary}`);
    console.log(`Job Description: ${job.jobDescription}`);
    console.log(`Responsibilities: ${job.jobResponsibilities}`);
    console.log(`Preferred Qualifications: ${job.preferredQualifications}`);
    console.log(`Application Deadline: ${job.applicationDeadline}`);
    console.log(`Similarity: ${similarity.toFixed(4)}`);
    console.log('---');
  });
}

// Main function to run the workflow
async function main() {
  try {
    // Prompt user to provide resume PDF file path
    const filePath = await promptUserInput();

    // Extract text from the provided resume PDF
    const resumeText = await extractTextFromPDF(filePath);
    if (!resumeText) {
      console.error('Failed to extract text from resume. Exiting.');
      return;
    }

    // Query job recommendations based on the resume text
    await queryJobRecommendations(resumeText);
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the main function
main();
