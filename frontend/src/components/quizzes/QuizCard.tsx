import { Link, useNavigate } from 'react-router-dom';
import { Quiz } from '../../types';

interface QuizCardProps {
  quiz: Quiz;
}

export default function QuizCard({ quiz }: QuizCardProps) {
  const questionsCount = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
  const navigate = useNavigate();
  
  const handleTakeQuiz = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/quizzes/${quiz._id}/attempt`);
  };
  
  return (
    <Link to={`/quizzes/${quiz._id}`} className="block">
      <div className="bg-gray-800 rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-700">
        <h3 className="text-lg font-semibold mb-2 text-blue-200">{quiz.name}</h3>
        
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-blue-300">
            {questionsCount} {questionsCount === 1 ? 'question' : 'questions'}
          </div>
          
          <div className="flex items-center space-x-1">
            {quiz.isPublic ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-800 text-green-100">
                <svg className="mr-1 h-3 w-3 text-green-300" fill="currentColor" viewBox="0 0 8 8">
                  <circle cx="4" cy="4" r="3" />
                </svg>
                Public
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-200">
                <svg className="mr-1 h-3 w-3 text-gray-400" fill="currentColor" viewBox="0 0 8 8">
                  <circle cx="4" cy="4" r="3" />
                </svg>
                Private
              </span>
            )}
          </div>
        </div>
        
        <div className="mt-4 inline-flex">
          <button 
            onClick={handleTakeQuiz}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-all duration-200 text-sm"
          >
            Take Quiz
          </button>
        </div>
      </div>
    </Link>
  );
} 