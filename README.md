# ExamPrep - Question Aggregation Platform

A full-stack web application for crowd-sourced competitive exam questions. Practice, contribute, and excel in your exams with community-generated content.

## 🚀 Features

- **Question Management**: Create, edit, and verify multiple-choice questions
- **AI-Powered Question Generation**: Generate variations of existing questions using Cohere AI
- **Quiz System**: Create and take quizzes with instant feedback
- **Voting System**: Upvote/downvote questions to maintain quality
- **Leaderboards**: Track top contributors by verified questions and upvotes
- **Subject Organization**: Categorize questions by subjects and difficulty levels
- **User Authentication**: Secure login/signup with session management
- **Admin Panel**: Administrative controls for content moderation
- **LaTeX Support**: Mathematical equations and formatting support
- **Responsive Design**: Modern UI with Tailwind CSS

## 🏗️ Architecture

### Frontend (`/frontend`)
- **Framework**: React 19 with TypeScript
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **Math Rendering**: KaTeX for LaTeX equations
- **Markdown**: React Markdown with math support
- **Build Tool**: Vite

### Backend (`/question-aggregation-backend`)
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Express sessions with MongoDB store
- **Password Hashing**: bcrypt
- **CORS**: Configured for cross-origin requests

### AI Service (`/mutate-question`)
- **AI Provider**: Cohere API
- **Framework**: LangChain
- **Purpose**: Generate question variations

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- Cohere API key (for AI features)


### Backend Setup

cd backend
npm install

# Create .env file
cat > .env 
DATABASE_URI=mongodb://localhost:27017/examprep
PORT=3500

### AI Service Setup

cd mutate-question
npm install

# Create .env file with your Cohere API key
cat > .env 
COHERE_API_KEY=your-cohere-api-key

### Frontend Setup

cd frontend
npm install
npm run dev