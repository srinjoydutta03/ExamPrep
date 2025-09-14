import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Quiz } from '../../types';
import { quizAPI } from '../../services/api';
import QuizCard from './QuizCard';
import { useAuth } from '../../contexts/AuthContext';

export default function QuizzesList() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Fetch quizzes
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Determine API call based on search query
        let response;
        if (searchQuery) {
          response = await quizAPI.search(searchQuery);
        } else {
          response = await quizAPI.getAll();
        }
        
        // Fetch quiz details for each ID
        const quizIds = response.data;
        const quizPromises = quizIds.map((id: string) => 
          quizAPI.getById(id).then(res => res.data)
        );
        
        const quizData = await Promise.all(quizPromises);
        setQuizzes(quizData);
      } catch (err: any) {
        console.error('Failed to fetch quizzes:', err);
        setError('Failed to load quizzes. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizzes();
  }, [searchQuery]);

  return (
    <div>
      <div className="mb-8 bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 animate-fadeIn">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-blue-200 mb-1">Search Quizzes</label>
            <input
              type="text"
              id="search"
              placeholder="Search by quiz name..."
              className="w-full px-3 py-2 bg-gray-700 text-blue-50 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {user?.isAdmin && (
            <div>
              <button
                onClick={() => navigate('/quizzes/new')}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200"
              >
                Create Quiz
              </button>
            </div>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
          {error}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-8">
          <h3 className="text-xl font-medium text-blue-200">No quizzes found</h3>
          <p className="mt-2 text-blue-100">
            {searchQuery 
              ? 'Try adjusting your search query' 
              : 'Quizzes will appear here once they are created by admin'}
          </p>
          {user?.isAdmin && (
            <button
              onClick={() => navigate('/quizzes/new')}
              className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200"
            >
              Create Quiz
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz._id} quiz={quiz} />
          ))}
        </div>
      )}
    </div>
  );
} 