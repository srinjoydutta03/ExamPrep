import QuizzesList from '../components/quizzes/QuizzesList';

export default function QuizzesPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-200">Quizzes</h1>
      </div>
      
      <QuizzesList />
    </div>
  );
} 