import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Quiz, Question } from '../../types';
import { quizAPI, questionAPI } from '../../services/api';

interface QuizFormData {
  name: string;
  questions: string[];
  isPublic: boolean;
}

interface NewQuestionData {
  question: string;
  description: string;
  subject: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  answers: { key: number; text: string }[];
  correctAnswerKey: number;
  correctAnswerExplanation: string;
}

const initialNewQuestion: NewQuestionData = {
  question: '',
  description: '',
  subject: '',
  difficulty: 'MEDIUM',
  answers: [
    { key: 1, text: '' },
    { key: 2, text: '' },
    { key: 3, text: '' },
    { key: 4, text: '' }
  ],
  correctAnswerKey: 1,
  correctAnswerExplanation: ''
};

export default function QuizForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState<QuizFormData>({
    name: '',
    questions: [],
    isPublic: false
  });
  
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [creationMode, setCreationMode] = useState<'select' | 'create'>('select');
  const [newQuestion, setNewQuestion] = useState<NewQuestionData>(initialNewQuestion);
  const [newQuestionErrors, setNewQuestionErrors] = useState<Record<string, string>>({});
  const [createdQuestions, setCreatedQuestions] = useState<Question[]>([]);
  
  const navigate = useNavigate();
  
  // Fetch available verified questions and quiz data if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch verified questions
        const questionResponse = await questionAPI.getAll({ verified: "true" });
        const questionIds = questionResponse.data;
        
        // Fetch question details
        const questionPromises = questionIds.map((id: string) => 
          questionAPI.getById(id).then(res => res.data)
        );
        
        const questionData = await Promise.all(questionPromises);
        setAvailableQuestions(questionData);
        
        // If editing, fetch quiz data
        if (isEditing && id) {
          const quizResponse = await quizAPI.getById(id);
          const quiz = quizResponse.data;
          
          setFormData({
            name: quiz.name,
            questions: Array.isArray(quiz.questions) 
              ? quiz.questions.map(q => typeof q === 'string' ? q : q._id)
              : [],
            isPublic: quiz.isPublic
          });
        }
        
        // Fetch subjects for question creation
        try {
          const subjectsResponse = await fetch('http://localhost:3500/subject');
          const subjectsData = await subjectsResponse.json();
          setSubjects(subjectsData.map((subject: any) => subject.name));
        } catch (err) {
          console.error('Failed to fetch subjects:', err);
          setSubjects(['Computer Science', 'Mathematics', 'General Knowledge']);
        }
      } catch (err: any) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load questions. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, isEditing]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleQuestionToggle = (questionId: string) => {
    setFormData(prev => {
      if (prev.questions.includes(questionId)) {
        // Remove the question
        return {
          ...prev,
          questions: prev.questions.filter(id => id !== questionId)
        };
      } else {
        // Add the question
        return {
          ...prev,
          questions: [...prev.questions, questionId]
        };
      }
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      if (isEditing) {
        // Update existing quiz
        await quizAPI.update(id!, {
          questions: formData.questions,
          isPublic: formData.isPublic
        });
      } else {
        // Create new quiz
        await quizAPI.create({
          name: formData.name,
          questions: formData.questions,
          isPublic: formData.isPublic
        });
      }
      
      setSubmitSuccess(true);
      
      // Navigate after a short delay
      setTimeout(() => {
        navigate('/quizzes');
      }, 1500);
    } catch (err: any) {
      console.error('Failed to submit quiz:', err);
      
      // Extract error message from response if available
      const errorMessage = err.response?.data || 'Failed to save quiz. Please try again.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };
  
  const validateForm = (): boolean => {
    if (!isEditing && !formData.name.trim()) {
      setError('Quiz name is required');
      return false;
    }
    
    if (formData.questions.length === 0) {
      setError('At least one question must be selected');
      return false;
    }
    
    return true;
  };
  
  // New question form handlers
  const handleNewQuestionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewQuestion(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (newQuestionErrors[name]) {
      setNewQuestionErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };
  
  const handleAnswerChange = (key: number, value: string) => {
    setNewQuestion(prev => ({
      ...prev,
      answers: prev.answers.map(answer => 
        answer.key === key ? { ...answer, text: value } : answer
      )
    }));
    
    // Clear answer errors
    if (newQuestionErrors['answers']) {
      setNewQuestionErrors(prev => {
        const updated = { ...prev };
        delete updated['answers'];
        return updated;
      });
    }
  };
  
  const handleCorrectAnswerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewQuestion(prev => ({
      ...prev,
      correctAnswerKey: parseInt(e.target.value)
    }));
  };
  
  const validateNewQuestion = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!newQuestion.question.trim()) {
      errors.question = 'Question text is required';
    }
    
    if (!newQuestion.subject.trim()) {
      errors.subject = 'Subject is required';
    }
    
    // Check if at least two answers are provided
    const filledAnswers = newQuestion.answers.filter(a => a.text.trim());
    if (filledAnswers.length < 2) {
      errors.answers = 'At least two answer options are required';
    }
    
    // Check if the correct answer has content
    const correctAnswer = newQuestion.answers.find(a => a.key === newQuestion.correctAnswerKey);
    if (!correctAnswer || !correctAnswer.text.trim()) {
      errors.correctAnswerKey = 'The correct answer must have content';
    }
    
    setNewQuestionErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleAddQuestion = async () => {
    if (!validateNewQuestion()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Create the new question
      const questionResponse = await questionAPI.create({
        question: newQuestion.question,
        description: newQuestion.description,
        subject: newQuestion.subject,
        answers: newQuestion.answers.filter(a => a.text.trim()),
        correctAnswerKey: newQuestion.correctAnswerKey,
        correctAnswerExplanation: newQuestion.correctAnswerExplanation,
        difficulty: newQuestion.difficulty,
      });
      
      const createdQuestion = questionResponse.data;
      
      // Verify the question immediately (since we're creating it for our own quiz)
      await questionAPI.verify(createdQuestion._id, true);
      
      // Add to form data
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, createdQuestion._id]
      }));
      
      // Add to created questions list
      setCreatedQuestions(prev => [...prev, createdQuestion]);
      
      // Add to available questions
      setAvailableQuestions(prev => [...prev, createdQuestion]);
      
      // Reset the form
      setNewQuestion(initialNewQuestion);
      
      // Show success message
      setError(null);
      
      // Switch back to select mode
      setCreationMode('select');
    } catch (err: any) {
      console.error('Failed to create question:', err);
      setError('Failed to create question. Please try again.');
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
  
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold mb-6 text-blue-200">
        {isEditing ? 'Edit Quiz' : 'Create New Quiz'}
      </h1>
      
      {submitSuccess ? (
        <div className="bg-green-800 border border-green-700 text-green-100 px-4 py-3 rounded mb-4">
          Quiz {isEditing ? 'updated' : 'created'} successfully!
        </div>
      ) : null}
      
      {error ? (
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : null}
      
      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-blue-200 mb-1">
            Quiz Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            disabled={isEditing}
            className="w-full px-3 py-2 bg-gray-700 text-blue-50 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            required={!isEditing}
          />
          {isEditing && (
            <p className="text-sm text-blue-400 mt-1">
              Quiz name cannot be changed after creation.
            </p>
          )}
        </div>
        
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-blue-600 rounded border-gray-500 bg-gray-700 focus:ring-blue-500 focus:ring-offset-gray-800"
            />
            <span className="ml-2 text-blue-100">Make quiz public</span>
          </label>
          <p className="text-sm text-blue-400 mt-1">
            Public quizzes are visible to all users. Private quizzes are only visible to admins.
          </p>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-blue-200">
              Questions for Quiz *
            </h3>
            
            <div className="flex gap-2 bg-gray-700 rounded-md p-1">
              <button
                type="button"
                onClick={() => setCreationMode('select')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                  creationMode === 'select' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-blue-300 hover:bg-gray-600'
                }`}
              >
                Select Existing
              </button>
              <button
                type="button"
                onClick={() => setCreationMode('create')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                  creationMode === 'create' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-blue-300 hover:bg-gray-600'
                }`}
              >
                Create New
              </button>
            </div>
          </div>
          
          {creationMode === 'select' ? (
            // Selection mode
            <>
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600 max-h-96 overflow-y-auto">
                {createdQuestions.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-md font-semibold mb-2 text-green-300">Newly Created Questions</h4>
                    <div className="space-y-3">
                      {createdQuestions.map(question => (
                        <div 
                          key={question._id} 
                          className="p-3 rounded border bg-green-800/20 border-green-700 cursor-pointer transition-colors duration-200"
                          onClick={() => handleQuestionToggle(question._id)}
                        >
                          <div className="flex gap-2">
                            <input
                              type="checkbox"
                              checked={formData.questions.includes(question._id)}
                              onChange={() => handleQuestionToggle(question._id)}
                              className="h-5 w-5 mt-0.5 text-blue-600 rounded border-gray-500 bg-gray-700 focus:ring-blue-500 focus:ring-offset-gray-800"
                              onClick={e => e.stopPropagation()}
                            />
                            <div>
                              <h4 className="font-medium text-green-100">{question.question}</h4>
                              <div className="flex items-center gap-3 mt-1 text-sm">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  question.difficulty === 'EASY' ? 'bg-green-800 text-green-100' :
                                  question.difficulty === 'MEDIUM' ? 'bg-yellow-800 text-yellow-100' :
                                  'bg-red-800 text-red-100'
                                }`}>
                                  {question.difficulty}
                                </span>
                                <span className="text-green-300">
                                  {question.answers.length} answers
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {availableQuestions.filter(q => !createdQuestions.some(cq => cq._id === q._id)).length === 0 ? (
                  <p className="text-blue-100">No verified questions available. Please create questions first.</p>
                ) : (
                  <div className="space-y-3">
                    {availableQuestions
                      .filter(q => !createdQuestions.some(cq => cq._id === q._id))
                      .map(question => (
                        <div 
                          key={question._id} 
                          className={`p-3 rounded border ${
                            formData.questions.includes(question._id) 
                              ? 'bg-blue-800/30 border-blue-700' 
                              : 'bg-gray-800 border-gray-700'
                          } hover:bg-gray-700 cursor-pointer transition-colors duration-200`}
                          onClick={() => handleQuestionToggle(question._id)}
                        >
                          <div className="flex gap-2">
                            <input
                              type="checkbox"
                              checked={formData.questions.includes(question._id)}
                              onChange={() => handleQuestionToggle(question._id)}
                              className="h-5 w-5 mt-0.5 text-blue-600 rounded border-gray-500 bg-gray-700 focus:ring-blue-500 focus:ring-offset-gray-800"
                              onClick={e => e.stopPropagation()}
                            />
                            <div>
                              <h4 className="font-medium text-blue-100">{question.question}</h4>
                              <div className="flex items-center gap-3 mt-1 text-sm">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  question.difficulty === 'EASY' ? 'bg-green-800 text-green-100' :
                                  question.difficulty === 'MEDIUM' ? 'bg-yellow-800 text-yellow-100' :
                                  'bg-red-800 text-red-100'
                                }`}>
                                  {question.difficulty}
                                </span>
                                <span className="text-blue-300">
                                  {question.answers.length} answers
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center mt-2 text-sm">
                <span className="text-blue-300">
                  {formData.questions.length} questions selected
                </span>
                
                {formData.questions.length > 0 && (
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, questions: [] }))}
                    className="text-red-400 hover:text-red-300"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            </>
          ) : (
            // Creation mode
            <div className="bg-gray-700 rounded-lg p-5 border border-gray-600">
              <h4 className="text-md font-semibold mb-4 text-blue-300">Create New Question</h4>
              
              <div className="grid gap-4">
                <div>
                  <label htmlFor="question" className="block text-sm font-medium text-blue-200 mb-1">
                    Question Text *
                  </label>
                  <input
                    type="text"
                    id="question"
                    name="question"
                    value={newQuestion.question}
                    onChange={handleNewQuestionChange}
                    className="w-full px-3 py-2 bg-gray-600 text-blue-50 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                  {newQuestionErrors.question && (
                    <p className="text-red-400 text-sm mt-1">{newQuestionErrors.question}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-blue-200 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={newQuestion.description}
                    onChange={handleNewQuestionChange}
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-600 text-blue-50 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-blue-200 mb-1">
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={newQuestion.subject}
                      onChange={handleNewQuestionChange}
                      className="w-full px-3 py-2 bg-gray-600 text-blue-50 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    >
                      <option value="">Select a subject</option>
                      {subjects.map(subject => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                    {newQuestionErrors.subject && (
                      <p className="text-red-400 text-sm mt-1">{newQuestionErrors.subject}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="difficulty" className="block text-sm font-medium text-blue-200 mb-1">
                      Difficulty
                    </label>
                    <select
                      id="difficulty"
                      name="difficulty"
                      value={newQuestion.difficulty}
                      onChange={handleNewQuestionChange}
                      className="w-full px-3 py-2 bg-gray-600 text-blue-50 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Answer Options *
                  </label>
                  <div className="space-y-3">
                    {newQuestion.answers.map(answer => (
                      <div key={answer.key} className="flex items-center">
                        <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">
                          {answer.key}
                        </div>
                        <input
                          type="text"
                          value={answer.text}
                          onChange={(e) => handleAnswerChange(answer.key, e.target.value)}
                          placeholder={`Answer option ${answer.key}`}
                          className="flex-1 px-3 py-2 bg-gray-600 text-blue-50 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        />
                      </div>
                    ))}
                  </div>
                  {newQuestionErrors.answers && (
                    <p className="text-red-400 text-sm mt-1">{newQuestionErrors.answers}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="correctAnswerKey" className="block text-sm font-medium text-blue-200 mb-1">
                    Correct Answer *
                  </label>
                  <select
                    id="correctAnswerKey"
                    name="correctAnswerKey"
                    value={newQuestion.correctAnswerKey}
                    onChange={handleCorrectAnswerChange}
                    className="w-full px-3 py-2 bg-gray-600 text-blue-50 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  >
                    {newQuestion.answers.map(answer => (
                      <option key={answer.key} value={answer.key}>
                        Answer {answer.key}{answer.text ? `: ${answer.text.substring(0, 30)}${answer.text.length > 30 ? '...' : ''}` : ''}
                      </option>
                    ))}
                  </select>
                  {newQuestionErrors.correctAnswerKey && (
                    <p className="text-red-400 text-sm mt-1">{newQuestionErrors.correctAnswerKey}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="correctAnswerExplanation" className="block text-sm font-medium text-blue-200 mb-1">
                    Explanation (Optional)
                  </label>
                  <textarea
                    id="correctAnswerExplanation"
                    name="correctAnswerExplanation"
                    value={newQuestion.correctAnswerExplanation}
                    onChange={handleNewQuestionChange}
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-600 text-blue-50 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="Explain why this is the correct answer"
                  />
                </div>
                
                <div className="flex justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setNewQuestion(initialNewQuestion)}
                    className="bg-gray-600 text-blue-100 py-1.5 px-4 rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200"
                  >
                    Clear Form
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    disabled={submitting}
                    className="bg-green-600 text-white py-1.5 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Adding...' : 'Add Question to Quiz'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/quizzes')}
            className="bg-gray-700 text-blue-100 py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : isEditing ? 'Update Quiz' : 'Create Quiz'}
          </button>
        </div>
      </form>
    </div>
  );
} 