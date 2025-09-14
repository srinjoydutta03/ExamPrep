import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Quiz, Question, AttemptAnswer } from '../types';
import { quizAPI, questionAPI, attemptAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer';

export default function QuizAttemptPage() {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptCompleted, setAttemptCompleted] = useState(false);
  const [score, setScore] = useState<{
    correctCount: number;
    incorrectCount: number;
    total: number;
  } | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  // Fetch quiz and questions
  useEffect(() => {
    const fetchQuizAndQuestions = async () => {
      try {
        setLoading(true);
        
        // Fetch quiz
        const quizResponse = await quizAPI.getById(id!);
        const quizData = quizResponse.data;
        setQuiz(quizData);
        
        // Fetch questions
        const questionIds = Array.isArray(quizData.questions) 
          ? quizData.questions.map((q: string | Question) => typeof q === 'string' ? q : q._id)
          : [];
          
        const questionPromises = questionIds.map((questionId: string) => 
          questionAPI.getById(questionId).then(res => res.data)
        );
        
        const questionData = await Promise.all(questionPromises);
        setQuestions(questionData);
        
        // Create a new attempt
        if (user) {
          const attemptResponse = await attemptAPI.create(id!);
          setAttemptId(attemptResponse.data._id);
        }
      } catch (err: any) {
        console.error('Failed to fetch quiz data:', err);
        setError('Failed to load quiz. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchQuizAndQuestions();
    }
  }, [id, user]);
  
  const handleAnswerSelect = (questionId: string, answerKey: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: answerKey
    });
  };
  
  const handleNextQuestion = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const selectedAnswer = selectedAnswers[currentQuestion._id];
    
    if (selectedAnswer === undefined) {
      alert('Please select an answer to continue.');
      return;
    }
    
    try {
      // Submit answer for the current question
      if (attemptId) {
        await attemptAPI.submitAnswer(attemptId, currentQuestion._id,selectedAnswer);
      }
      
      // Move to next question or complete the quiz
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        await handleCompleteAttempt();
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
      setError('Failed to submit answer. Please try again.');
    }
  };
  
  const handleCompleteAttempt = async () => {
    try {
      setSubmitting(true);
      
      // Complete the attempt
      if (attemptId) {
        const response = await attemptAPI.getById(attemptId);
        const attemptData = response.data;
        
        setScore({
          correctCount: attemptData.numCorrect || 0,
          incorrectCount: attemptData.numIncorrect || 0,
          total: questions.length
        });
        
        setAttemptCompleted(true);
      }
    } catch (err) {
      console.error('Failed to complete attempt:', err);
      setError('Failed to complete the quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
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

  // If quiz is completed, show results
  if (attemptCompleted && score) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 shadow-xl animate-fadeIn">
        <h1 className="text-3xl font-bold mb-6 text-blue-200 text-center">Quiz Completed!</h1>
        
        <div className="bg-gray-700 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">Your Score</h2>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-green-800 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-100">{score.correctCount}</div>
              <div className="text-green-200">Correct</div>
            </div>
            
            <div className="bg-red-800 rounded-lg p-4">
              <div className="text-3xl font-bold text-red-100">{score.incorrectCount}</div>
              <div className="text-red-200">Incorrect</div>
            </div>
            
            <div className="bg-blue-800 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-100">
                {Math.round((score.correctCount / score.total) * 100)}%
              </div>
              <div className="text-blue-200">Score</div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center space-x-4">
          <Link 
            to="/quizzes"
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            Return to Quizzes
          </Link>
        </div>
      </div>
    );
  }

  // Display current question
  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-200">{quiz.name}</h1>
        <div className="text-blue-300">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </div>
      
      {currentQuestion && (
        <>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-blue-100">{currentQuestion.question}</h2>
            {currentQuestion.description && (
              <p className="text-blue-200 mb-4">{currentQuestion.description}</p>
            )}
          </div>
          
          <div className="space-y-3 mb-8">
            {currentQuestion.answers.map((answer, index) => (
              <div 
                key={`${currentQuestion._id}-answer-${answer.key}`}
                className={`p-4 rounded-lg border border-gray-700 cursor-pointer transition-colors duration-200 ${
                  selectedAnswers[currentQuestion._id] === answer.key
                    ? 'bg-blue-700 border-blue-500'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                onClick={() => handleAnswerSelect(currentQuestion._id, answer.key)}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                    selectedAnswers[currentQuestion._id] === answer.key
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-600 text-gray-300'
                  }`}>
                    {answer.key}
                  </div>
                  <div className="text-blue-50">{answer.text}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={() => navigate('/quizzes')}
              className="bg-gray-700 text-blue-100 py-2 px-4 rounded-md hover:bg-gray-600 transition-colors duration-200"
            >
              Quit Quiz
            </button>
            
            <button
              onClick={handleNextQuestion}
              disabled={submitting}
              className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
          </div>
        </>
      )}
    </div>
  );
} 