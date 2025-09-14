import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Quiz, Question, Difficulty, User } from '../types';
import { quizAPI, questionAPI, userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Extended Quiz interface to include optional description
interface QuizWithDescription extends Quiz {
  description?: string;
}

export default function QuizDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<QuizWithDescription | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [creator, setCreator] = useState<User | null>(null);
  const [creatorLoading, setCreatorLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchQuizAndQuestions = async () => {
      try {
        setLoading(true);
        
        // Fetch quiz
        const response = await quizAPI.getById(id!);
        const quizData = response.data;
        setQuiz(quizData);
        
        // Fetch creator details if it's just an ID string
        if (typeof quizData.creator === 'string') {
          try {
            setCreatorLoading(true);
            const creatorResponse = await userAPI.getById(quizData.creator);
            setCreator(creatorResponse.data);
          } catch (err) {
            console.error('Failed to fetch creator details:', err);
            // Don't set error state here as we can still show the quiz
          } finally {
            setCreatorLoading(false);
          }
        } else if (quizData.creator && typeof quizData.creator === 'object') {
          setCreator(quizData.creator as User);
        }
        
        // Fetch full question details to get difficulties
        const questionIds = Array.isArray(quizData.questions) 
          ? quizData.questions.map((q: string | Question) => typeof q === 'string' ? q : q._id)
          : [];
          
        if (questionIds.length > 0) {
          const questionPromises = questionIds.map((questionId: string) => 
            questionAPI.getById(questionId).then(res => res.data)
          );
          
          const questionData = await Promise.all(questionPromises);
          setQuestions(questionData);
        }
      } catch (err: any) {
        console.error('Failed to fetch quiz:', err);
        setError('Failed to load quiz. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizAndQuestions();
  }, [id]);
  
  const handleEdit = () => {
    navigate(`/quizzes/${id}/edit`);
  };
  
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    
    try {
      await quizAPI.delete(id!);
      navigate('/quizzes');
    } catch (err) {
      console.error('Failed to delete quiz:', err);
    }
  };
  
  const handleTakeQuiz = () => {
    navigate(`/quizzes/${id}/attempt`);
  };
  
  const getCreatorDisplay = () => {
    if (creatorLoading) return 'Loading creator...';
    if (creator && creator.name) return creator.name;
    if (typeof quiz?.creator === 'object' && quiz.creator?.name) return quiz.creator.name;
    return 'Admin';
  };
  
  const canEditQuiz = () => {
    if (!user) return false;
    if (user.isAdmin) return true;
    
    // Check if user is the creator
    if (creator && creator._id === user._id) return true;
    if (typeof quiz?.creator === 'object' && quiz?.creator?._id === user._id) return true;
    if (typeof quiz?.creator === 'string' && quiz?.creator === user._id) return true;
    
    return false;
  };
  
  // Handler for AI generation
  const handleGenerateVariations = async () => {
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      setGenerationStatus('No questions in this quiz to generate variations from.');
      return;
    }

    setIsGenerating(true);
    setGenerationStatus('Generating AI variations...');

    const originalQuestionIds = Array.isArray(quiz.questions)
      ? quiz.questions.map((q: string | Question) => typeof q === 'string' ? q : q._id)
      : [];

    const generationPromises = originalQuestionIds.map(originalId =>
      questionAPI.mutateQuestion(originalId)
        .then(response => ({ status: 'fulfilled', value: response.data }))
        .catch(error => ({ status: 'rejected', reason: error }))
    );

    const results = await Promise.allSettled(generationPromises);

    setIsGenerating(false);
    const successfulGenerations = results.filter(r => r.status === 'fulfilled').length;
    const failedGenerations = results.length - successfulGenerations;

    let statusMessage = `Generated ${successfulGenerations} new question variations.`;
    if (failedGenerations > 0) {
      statusMessage += ` Failed for ${failedGenerations} questions. Check console for errors.`;
      results.filter(r => r.status === 'rejected').forEach(r => console.error('AI Generation Failed:', r.reason));
    }
    setGenerationStatus(statusMessage);

    // Show a pop-up alert so the admin can verify immediately
    alert(statusMessage);

    // reload to fetch updated questions with the 'AI Generated' tag
    window.location.reload();
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error || !quiz) {
    return (
      <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
        {error || 'Quiz not found'}
      </div>
    );
  }

  const questionsCount = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
  
  // Calculate difficulty distribution from fetched questions
  const difficultyDistribution = {
    EASY: 0,
    MEDIUM: 0,
    HARD: 0
  };
  
  // Count difficulties from the fetched question details
  questions.forEach(question => {
    if (question.difficulty) {
      difficultyDistribution[question.difficulty]++;
    }
  });
  
  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/quizzes" className="text-blue-400 hover:text-blue-300 flex items-center transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Quizzes
            </Link>
            
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${quiz.isPublic 
              ? 'bg-green-800 text-green-100' 
              : 'bg-gray-700 text-gray-200'}`}>
              {quiz.isPublic ? 'Public' : 'Private'}
            </span>
          </div>
          
          <h1 className="text-3xl font-bold mb-4 text-blue-200">{quiz.name}</h1>
          
          <div className="text-blue-100 mb-6">
            <p><span className="text-blue-300">Number of questions:</span> {questionsCount}</p>
            <p>
              <span className="text-blue-300">Created by:</span> {getCreatorDisplay()}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Admin or creator can edit/delete */}
          {canEditQuiz() && (
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
          
          {/* AI Generate Button (Admin Only) */}
          {canEditQuiz() && (
            <button
              onClick={handleGenerateVariations}
              disabled={isGenerating}
              className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Generate AI Variations'}
            </button>
          )}
        </div>
      </div>
      
      {/* Generation Status Message */}
      {generationStatus && (
        <div className={`mb-4 p-3 rounded border ${generationStatus.includes('Failed') ? 'bg-red-900 border-red-700 text-red-100' : 'bg-green-900 border-green-700 text-green-100'}`}>
          {generationStatus}
        </div>
      )}
      
      {/* Quiz description, if available */}
      {quiz.description && (
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <h2 className="text-xl font-semibold mb-3 text-blue-300">Description</h2>
          <p className="text-blue-100">{quiz.description}</p>
        </div>
      )}
      
      {/* Questions preview (if any) */}
      {questionsCount > 0 ? (
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">Quiz Details</h2>
          <ul className="list-disc list-inside text-blue-100 mb-4 space-y-2">
            <li><span className="text-blue-300">Total questions:</span> {questionsCount}</li>
            <li>
              <span className="text-blue-300">Difficulty:</span> {
                `${difficultyDistribution.EASY} Easy, 
                 ${difficultyDistribution.MEDIUM} Medium, 
                 ${difficultyDistribution.HARD} Hard`
              }
            </li>
            <li><span className="text-blue-300">Estimated time:</span> {questionsCount * 2} minutes</li>
          </ul>
          
          <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-800/30">
            <p className="text-sm text-blue-200 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1 -mt-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              You'll be able to see your score immediately after completing the quiz.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-900/30 rounded-lg p-4 border border-amber-800/30 mb-8">
          <p className="text-amber-200 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            This quiz doesn't have any questions yet.
          </p>
        </div>
      )}
      
      <div className="mt-8 text-center">
        {questionsCount > 0 ? (
          <button
            onClick={handleTakeQuiz}
            className="bg-blue-600 text-white py-3 px-8 rounded-md text-lg font-medium hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Start Quiz
          </button>
        ) : (
          <p className="text-gray-400">You cannot take this quiz until questions are added.</p>
        )}
      </div>
    </div>
  );
} 