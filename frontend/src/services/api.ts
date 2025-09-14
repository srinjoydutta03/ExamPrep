import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

// Create axios instance with base URL and credentials
const api = axios.create({
  baseURL: 'http://localhost:3500',
  withCredentials: true,
});

// Simple in-memory cache for GET requests
const getCache = new Map<string, any>();
// Override GET to return cached data when available
const originalGet = api.get.bind(api);
// @ts-ignore: override get for caching
api.get = (url: string, config?: AxiosRequestConfig) => {
  const key = url + JSON.stringify(config?.params || {});
  if (getCache.has(key)) {
    return Promise.resolve({ data: getCache.get(key) });
  }
  return originalGet(url, config).then((response) => {
    getCache.set(key, response.data);
    return response;
  });
};

// Clear cached GETs after any mutating request (POST/PUT/DELETE/PATCH) to avoid stale data
api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toLowerCase();
    if (method && method !== 'get') {
      getCache.clear();
    }
    return response;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authAPI = {
  signup: (name: string, email: string, password: string) => 
    api.post('/user/signup', { name, email, password }),
  
  login: (email: string, password: string) => 
    api.post('/user/login', { email, password }),
  
  logout: () => 
    api.post('/user/logout'),
  
  me: () => 
    api.get('/user/me'),
}

// Question API
export const questionAPI = {
  getAll: (filters?: { subject?: string, difficulty?: string, uploader?: string }) => 
    api.get('/question', { params: filters }),
  
  getById: (id: string) => 
    api.get(`/question/${id}`),
  
  search: (query: string, filters?: { subject?: string, difficulty?: string, uploader?: string }) => 
    api.get('/question/search', { params: { q: query, ...filters } }),
  
  create: (data: {
    question: string,
    description?: string,
    subject: string,
    answers: Array<{ key: number, text: string }>,
    correctAnswerKey: number,
    correctAnswerExplanation?: string,
    difficulty: string,
  }) => api.post('/question', data),
  
  update: (id: string, data: {
    description?: string,
    subject?: string,
    answers?: Array<{ key: number, text: string }>,
    correctAnswerKey?: number,
    correctAnswerExplanation?: string,
    difficulty?: string,
  }) => api.put(`/question/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/question/${id}`),
  
  verify: (id: string, verified: boolean = true) => 
    api.put(`/question/${id}/verify`, { verified }),

  // New endpoint to trigger AI mutation
  mutateQuestion: (originalQuestionId: string) =>
    api.post('/question/mutate', { originalQuestionId }),
}

// Voting API
export const votingAPI = {
  upvote: (questionId: string) => 
    api.post(`/voting/${questionId}/upvote`),
  
  downvote: (questionId: string) => 
    api.post(`/voting/${questionId}/downvote`),
  
  unvote: (questionId: string) => 
    api.delete(`/voting/${questionId}`),
  
  getVotes: (questionId: string) => 
    api.get(`/voting/${questionId}`),
}

// Quiz API
export const quizAPI = {
  getAll: () => 
    api.get('/quiz'),
  
  getById: (id: string) => 
    api.get(`/quiz/${id}`),
  
  search: (query: string) => 
    api.get('/quiz/search', { params: { q: query } }),
  
  create: (data: { name: string, questions: string[], isPublic?: boolean }) => 
    api.post('/quiz', data),
  
  update: (id: string, data: { questions?: string[], isPublic?: boolean }) => 
    api.put(`/quiz/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/quiz/${id}`),
  
  addQuestion: (quizId: string, questionId: string) => 
    api.post(`/quiz/${quizId}/questions/${questionId}`),
  
  removeQuestion: (quizId: string, questionId: string) => 
    api.delete(`/quiz/${quizId}/questions/${questionId}`),
}

// Attempt API
export const attemptAPI = {
  getAll: (quizId?: string) => api.get('/attempt', { params: quizId ? { quiz_id: quizId } : {} }),
  getById: (id: string) => api.get(`/attempt/${id}`),
  create: (quizId: string) => api.post('/attempt', { quiz: quizId, answers: [] }),
  submitAnswer: (attemptId: string, questionId: string, answerKey: number) =>
    api.post(`/attempt/${attemptId}/answers/${questionId}`, { answerKey }),
  getAttempt: (attemptId: string) => api.get(`/attempt/${attemptId}`),
};

export const subjectAPI = {
  getAll: () => api.get('/subject'),
  getById: (id: string) => api.get(`/subject/${id}`),
  search: (query: string) => api.get('/subject/search', { params: { q: query } }),
};

export const userAPI = {
  getById: (id: string) => api.get(`/user/${id}`),
  getCurrent: () => api.get('/user/me'),
};

export const leaderboardAPI = {
  getVerified: () => api.get('/leaderboard/verified'),
  getTotalUpvotes: () => api.get('/leaderboard/totalUpvotes'),
};

export default api;