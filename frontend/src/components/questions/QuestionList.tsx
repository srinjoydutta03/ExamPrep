import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Question, Subject, Difficulty } from '../../types';
import { questionAPI, votingAPI, subjectAPI } from '../../services/api';
import QuestionCard from './QuestionCard';
import { useAuth } from '../../contexts/AuthContext';

interface QuestionsListProps {
  showFilters?: boolean;
}

export default function QuestionsList({ showFilters = true }: QuestionsListProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Fetch subjects for filter dropdown
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await subjectAPI.getAll();
        setSubjects(response.data);
      } catch (err) {
        console.error('Failed to fetch subjects:', err);
      }
    };
    
    fetchSubjects();
  }, []);
  
  // Fetch questions based on filters
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Create filters object
        const filters: { subject?: string, difficulty?: string } = {};
        if (selectedSubject) filters.subject = selectedSubject;
        if (selectedDifficulty) filters.difficulty = selectedDifficulty;
        
        // Determine API call based on search query
        let response;
        if (searchQuery) {
          response = await questionAPI.search(searchQuery, filters);
        } else {
          response = await questionAPI.getAll(filters);
        }
        
        // Fetch question details for each ID
        const questionIds = response.data;
        const questionPromises = questionIds.map((id: string) => 
          questionAPI.getById(id).then(res => res.data)
        );
        
        const questionData = await Promise.all(questionPromises);
        setQuestions(questionData);
      } catch (err: any) {
        console.error('Failed to fetch questions:', err);
        setError('Failed to load questions. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestions();
  }, [selectedSubject, selectedDifficulty, searchQuery]);
  
  // Handle voting
  const handleUpvote = async (questionId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      await votingAPI.upvote(questionId);
      // Refresh the question
      const response = await questionAPI.getById(questionId);
      const updatedQuestion = response.data;
      
      setQuestions(prevQuestions => 
        prevQuestions.map(q => q._id === questionId ? updatedQuestion : q)
      );
    } catch (err) {
      console.error('Failed to upvote:', err);
    }
  };
  
  const handleDownvote = async (questionId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      await votingAPI.downvote(questionId);
      // Refresh the question
      const response = await questionAPI.getById(questionId);
      const updatedQuestion = response.data;
      
      setQuestions(prevQuestions => 
        prevQuestions.map(q => q._id === questionId ? updatedQuestion : q)
      );
    } catch (err) {
      console.error('Failed to downvote:', err);
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    setSelectedSubject('');
    setSelectedDifficulty('');
    setSearchQuery('');
  };

  return (
    <div>
      {showFilters && (
        <div className="mb-8 bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 animate-fadeIn">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-blue-200 mb-1">Search</label>
              <input
                type="text"
                id="search"
                placeholder="Search questions..."
                className="w-full px-3 py-2 bg-gray-700 text-blue-50 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="w-full md:w-1/4">
              <label htmlFor="subject" className="block text-sm font-medium text-blue-200 mb-1">Subject</label>
              <select
                id="subject"
                className="w-full px-3 py-2 bg-gray-700 text-blue-50 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="w-full md:w-1/4">
              <label htmlFor="difficulty" className="block text-sm font-medium text-blue-200 mb-1">Difficulty</label>
              <select
                id="difficulty"
                className="w-full px-3 py-2 bg-gray-700 text-blue-50 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
              >
                <option value="">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="bg-gray-700 text-blue-100 py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
          {error}
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-8">
          <h3 className="text-xl font-medium text-blue-200">No questions found</h3>
          <p className="mt-2 text-blue-100">Try adjusting your filters or add a new question</p>
          {user && (
            <button
              onClick={() => navigate('/questions/new')}
              className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200"
            >
              Add Question
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {questions.map((question) => (
            <QuestionCard
              key={question._id}
              question={question}
              onUpvote={handleUpvote}
              onDownvote={handleDownvote}
            />
          ))}
        </div>
      )}
      
      {user && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => navigate('/questions/new')}
            className="bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all duration-300 hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
} 