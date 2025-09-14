// User related types
export interface User {
    _id: string;
    name: string;
    email: string;
    isAdmin: boolean;
  }
  
  // Subject related types
  export interface Subject {
    _id: string;
    name: string;
    description: string;
  }
  
  // Question related types
  export interface Answer {
    key: number;
    text: string;
  }
  
  export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
  
  export interface Question {
    _id: string;
    question: string;
    description?: string;
    subject: string | Subject;
    answers: Answer[];
    correctAnswerKey: number;
    correctAnswerExplanation?: string;
    uploader: string | User;
    difficulty: Difficulty;
    verified: boolean;
    upvoteCount?: number;
    downvoteCount?: number;
    upvoted?: boolean;
    downvoted?: boolean;
    generatedFrom?: string;
  }
  
  export interface QuestionFormData {
    question: string;
    description?: string;
    subject: string;
    answers: Answer[];
    correctAnswerKey: number;
    correctAnswerExplanation?: string;
    difficulty: Difficulty;
  }
  
  // Quiz related types
  export interface Quiz {
    _id: string;
    name: string;
    questions: string[] | Question[];
    creator: string | User;
    isPublic: boolean;
  }
  
  // Attempt related types
  export interface AttemptAnswer {
    question: string;
    answerKey: number;
    isCorrect?: boolean;
  }
  
  export interface Attempt {
    _id: string;
    user: string | User;
    quiz: string | Quiz;
    answers: AttemptAnswer[];
    createdAt: string;
    updatedAt: string;
    correctCount?: number;
    incorrectCount?: number;
    unansweredCount?: number;
  } 