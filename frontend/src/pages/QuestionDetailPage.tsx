import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { questionAPI, votingAPI } from '../services/api';
import { Question, Answer } from '../types';
import { useAuth } from '../contexts/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer';

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        const response = await questionAPI.getById(id!);
        setQuestion(response.data);
      } catch (err: any) {
        console.error('Failed to fetch question:', err);
        setError('Failed to load question. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestion();
  }, [id]);
  
  const handleUpvote = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      await votingAPI.upvote(id!);
      const response = await questionAPI.getById(id!);
      setQuestion(response.data);
    } catch (err) {
      console.error('Failed to upvote:', err);
    }
  };
  
  const handleDownvote = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      await votingAPI.downvote(id!);
      const response = await questionAPI.getById(id!);
      setQuestion(response.data);
    } catch (err) {
      console.error('Failed to downvote:', err);
    }
  };
  
  const handleVerify = async () => {
    if (!user?.isAdmin) return;
    
    try {
      await questionAPI.verify(id!);
      const response = await questionAPI.getById(id!);
      setQuestion(response.data);
    } catch (err) {
      console.error('Failed to verify question:', err);
    }
  };
  
  const handleEdit = () => {
    navigate(`/questions/${id}/edit`);
  };
  
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    
    try {
      await questionAPI.delete(id!);
      navigate('/questions');
    } catch (err) {
      console.error('Failed to delete question:', err);
    }
  };
  
  // Define background colors for the different difficulty levels
  const difficultyBgColor = {
    EASY: 'bg-green-800',
    MEDIUM: 'bg-yellow-800',
    HARD: 'bg-red-800',
  };
  
  // Define text colors for the different difficulty levels
  const difficultyTextColor = {
    EASY: 'text-green-100',
    MEDIUM: 'text-yellow-100',
    HARD: 'text-red-100',
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error || !question) {
    return (
      <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
        {error || 'Question not found'}
      </div>
    );
  }
  
  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/questions" className="text-blue-400 hover:text-blue-300 flex items-center transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Questions
            </Link>
            
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${difficultyBgColor[question.difficulty]} ${difficultyTextColor[question.difficulty]}`}>
              {question.difficulty}
            </span>
            
            {!question.verified && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-800 text-amber-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Awaiting verification
              </span>
            )}
          </div>
          
          <h1 className="text-3xl font-bold mb-1 text-blue-200">{question.question}</h1>
          
          <div className="text-sm text-blue-300 mb-3">
            Subject: {typeof question.subject === 'string' 
              ? 'Loading...' 
              : question.subject.name}
          </div>
          
          {question.description && (
            <div className="text-blue-100 mb-6">
              <MarkdownRenderer>{question.description}</MarkdownRenderer>
            </div>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleUpvote}
              className={`flex items-center space-x-1 ${question.upvoted ? 'text-green-400' : 'text-blue-200 hover:text-green-400'} transition-colors duration-200`}
              aria-label="Upvote"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
              <span>{question.upvoteCount || 0}</span>
            </button>
            
            <button 
              onClick={handleDownvote}
              className={`flex items-center space-x-1 ${question.downvoted ? 'text-red-400' : 'text-blue-200 hover:text-red-400'} transition-colors duration-200`}
              aria-label="Downvote"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
              <span>{question.downvoteCount || 0}</span>
            </button>
          </div>
          
          {/* Admin or question uploader can edit/delete */}
          {(user?.isAdmin || (user && (typeof question.uploader === 'string' 
            ? question.uploader === user._id 
            : question.uploader._id === user._id))) && (
            <div className="flex space-x-2">
              <button 
                onClick={handleEdit}
                className="bg-gray-700 text-blue-100 px-3 py-1 rounded hover:bg-gray-600 transition-colors duration-200 text-sm"
              >
                Edit
              </button>
              <button 
                onClick={handleDelete}
                className="bg-red-800 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors duration-200 text-sm"
              >
                Delete
              </button>
            </div>
          )}
          
          {/* Admin can verify question */}
          {user?.isAdmin && !question.verified && (
            <button 
              onClick={handleVerify}
              className="bg-green-700 text-white hover:bg-green-600 text-sm px-3 py-1 rounded transition-colors duration-200"
            >
              Verify Question
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-blue-200">Answer Options</h2>
        <div className="grid gap-4">
          {question.answers.map((answer: Answer) => (
            <div 
              key={answer.key}
              className={`p-4 rounded-lg border ${answer.key === question.correctAnswerKey 
                ? 'bg-green-900 border-green-700 text-green-100' 
                : 'bg-gray-800 border-gray-700 text-blue-100'}`}
            >
              <div className="flex items-start">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 ${answer.key === question.correctAnswerKey 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-600 text-gray-200'}`}
                >
                  {answer.key}
                </div>
                <div>
                  <div className={`${answer.key === question.correctAnswerKey ? 'font-medium' : ''}`}>
                    <MarkdownRenderer>{answer.text}</MarkdownRenderer>
                  </div>
                  
                  {answer.key === question.correctAnswerKey && question.correctAnswerExplanation && (
                    <div className="mt-2 text-sm text-green-300 bg-green-800 p-3 rounded border border-green-600">
                      <p className="font-medium mb-1">Explanation:</p>
                      <div>
                        <MarkdownRenderer>{question.correctAnswerExplanation}</MarkdownRenderer>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 