import QuestionsList from '../components/questions/QuestionList';

export default function QuestionsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-200">Questions</h1>
      </div>
      
      <QuestionsList />
    </div>
  );
} 