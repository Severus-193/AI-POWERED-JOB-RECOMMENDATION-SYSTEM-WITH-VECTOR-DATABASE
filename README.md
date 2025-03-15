# AI-POWERED-JOB-RECOMMENDATION-SYSTEM-WITH-VECTOR-DATABASE

## Project Overview

This project enables AI-driven job recommendations through text queries or resume uploads. It utilizes advanced Natural Language Processing (NLP) techniques and semantic embeddings to provide precise job suggestions based on user input.

## Features

- **Text Query Search**: Users can search for jobs using text queries.
- **Resume Upload for Personalized Recommendations**: Extracts key skills and experience from resumes.
- **AI-Driven Recommendations**: Uses NLP techniques and semantic embeddings.
- **Efficient Search and Matching**: Implements `all-MiniLM-L6-v2` model and `pgvector` in PostgreSQL to generate compact and efficient embeddings.
- **Cosine Similarity for Matching**: Ensures precise job suggestions by comparing job descriptions, user queries, and resumes.

## Dataset

The system uses `**jobPostings.js**` as the primary dataset. This dataset is utilized in the first stage for job searches based on text queries. The second stage enhances recommendations by analyzing user-uploaded resumes.

## Implementation Details

- **First Stage**: Implemented in `jobRecommendationSystem.js`, where job postings are searched based on text queries.
- **Second Stage**: Implemented in `smartRecommendationSystem.js`, which processes user resumes for enhanced recommendations.
- **Skill and Experience Extraction**: Extracts skills and experience from PDF resumes, converting them into embeddings for precise job matches.

## Technologies Used

- **Hugging Face Sentence Transformer Model**: `all-MiniLM-L6-v2`
- **Database**: PostgreSQL with `pgvector` extension
- **Vector Database Usage**: The `pgvector` extension in PostgreSQL enables efficient storage and retrieval of semantic embeddings. It allows the system to compare job descriptions, queries, and resume embeddings using cosine similarity, ensuring highly relevant job recommendations.
- **Semantic Search**: Cosine similarity for efficient job matching
- **Natural Language Processing**: NLP techniques for extracting skills and experience


## Usage

1. **Text Query Search**: Enter job-related text queries in the system to find relevant job postings.
2. **Resume Upload**: Upload your resume to get personalized job recommendations.
3. **AI-Driven Matching**: The system analyzes the resume and provides job suggestions based on extracted skills and experience.




