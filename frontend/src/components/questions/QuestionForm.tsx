import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QuestionFormData, Subject, Answer, Difficulty } from '../../types';
import { questionAPI, subjectAPI } from '../../services/api';
import MarkdownRenderer from '../MarkdownRenderer';

const DIFFICULTY_LEVELS: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

export default function QuestionForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState<QuestionFormData>({
    question: '',
    description: '',
    subject: '',
    answers: [
      { key: 1, text: '' },
      { key: 2, text: '' },
      { key: 3, text: '' },
      { key: 4, text: '' }
    ],
    correctAnswerKey: 1,
    correctAnswerExplanation: '',
    difficulty: 'MEDIUM',
  });
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const navigate = useNavigate();
  
  // Fetch subjects for dropdown
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await subjectAPI.getAll();
        setSubjects(response.data);
        
        // Set default subject if available
        if (response.data.length > 0 && !formData.subject) {
          setFormData(prev => ({
            ...prev,
            subject: response.data[0]._id
          }));
        }
      } catch (err) {
        console.error('Failed to fetch subjects:', err);
      }
    };
    
    fetchSubjects();
  }, []);
  
  // Fetch question data if editing
  useEffect(() => {
    if (isEditing) {
      const fetchQuestion = async () => {
        try {
          setLoading(true);
          const response = await questionAPI.getById(id);
          const questionData = response.data;
          
          setFormData({
            question: questionData.question,
            description: questionData.description || '',
            subject: typeof questionData.subject === 'string' 
              ? questionData.subject 
              : questionData.subject._id,
            answers: questionData.answers,
            correctAnswerKey: questionData.correctAnswerKey,
            correctAnswerExplanation: questionData.correctAnswerExplanation || '',
            difficulty: questionData.difficulty,
          });
        } catch (err) {
          console.error('Failed to fetch question:', err);
          setError('Failed to load question data. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchQuestion();
    }
  }, [id, isEditing]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAnswerChange = (index: number, value: string) => {
    setFormData(prev => {
      const newAnswers = [...prev.answers];
      newAnswers[index] = { ...newAnswers[index], text: value };
      return { ...prev, answers: newAnswers };
    });
  };
  
  const handleCorrectAnswerChange = (key: number) => {
    setFormData(prev => ({
      ...prev,
      correctAnswerKey: key
    }));
  };
  
  const addAnswerOption = () => {
    setFormData(prev => {
      const newKey = Math.max(...prev.answers.map(a => a.key)) + 1;
      return {
        ...prev,
        answers: [...prev.answers, { key: newKey, text: '' }]
      };
    });
  };
  
  const removeAnswerOption = (key: number) => {
    setFormData(prev => {
      const newAnswers = prev.answers.filter(a => a.key !== key);
      
      // If we're removing the correct answer, set a new correct answer
      let newCorrectKey = prev.correctAnswerKey;
      if (prev.correctAnswerKey === key && newAnswers.length > 0) {
        newCorrectKey = newAnswers[0].key;
      }
      
      return {
        ...prev,
        answers: newAnswers,
        correctAnswerKey: newCorrectKey
      };
    });
  };
  
  const validateForm = (): boolean => {
    if (!formData.question.trim()) {
      setError('Question is required');
      return false;
    }
    
    if (!formData.subject) {
      setError('Subject is required');
      return false;
    }
    
    if (formData.answers.length < 2) {
      setError('At least two answer options are required');
      return false;
    }
    
    if (formData.answers.some(a => !a.text.trim())) {
      setError('All answer options must have text');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      if (isEditing) {
        // Update existing question
        await questionAPI.update(id, {
          description: formData.description,
          subject: formData.subject,
          answers: formData.answers,
          correctAnswerKey: formData.correctAnswerKey,
          correctAnswerExplanation: formData.correctAnswerExplanation,
          difficulty: formData.difficulty,
        });
      } else {
        // Create new question
        await questionAPI.create(formData);
      }
      
      setSubmitSuccess(true);
      setTimeout(() => {
        navigate('/questions');
      }, 1500);
    } catch (err: any) {
      console.error('Failed to submit question:', err);
      setError(err.response?.data || 'Failed to submit question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h2 className="text-2xl font-bold mb-6 text-blue-200">
        {isEditing ? 'Edit Question' : 'Add New Question'}
      </h2>
      
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {submitSuccess && (
        <div className="bg-green-800 border border-green-700 text-green-100 px-4 py-3 rounded mb-4">
          Question {isEditing ? 'updated' : 'created'} successfully! Redirecting...
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="mb-4">
          <label htmlFor="question" className="block text-sm font-medium text-blue-200 mb-1">Question Text *</label>
          <input
            type="text"
            id="question"
            name="question"
            className="w-full px-3 py-2 bg-gray-700 text-blue-50 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            value={formData.question}
            onChange={handleInputChange}
            required
            disabled={isEditing} // Cannot edit question text when editing
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-blue-200 mb-1">Description</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 text-blue-50 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            value={formData.description}
            onChange={handleInputChange}
          />
        </div>
        
        {/* Live preview of description with LaTeX rendering */}
        {formData.description && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-blue-200 mb-1">Description Preview</label>
            <div className="bg-gray-700 text-blue-50 p-3 rounded border border-gray-600">
              <MarkdownRenderer>{formData.description}</MarkdownRenderer>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-blue-200 mb-1">Subject *</label>
            <select
              id="subject"
              name="subject"
              className="w-full px-3 py-2 bg-gray-700 text-blue-50 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              value={formData.subject}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a subject</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-blue-200 mb-1">Difficulty Level</label>
            <select
              id="difficulty"
              name="difficulty"
              className="w-full px-3 py-2 bg-gray-700 text-blue-50 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              value={formData.difficulty}
              onChange={handleInputChange}
            >
              {DIFFICULTY_LEVELS.map(level => (
                <option key={level} value={level}>
                  {level.charAt(0) + level.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-blue-200">Answer Options *</label>
            
            <button 
              type="button" 
              onClick={addAnswerOption}
              className="text-sm bg-blue-600 text-white py-1 px-2 rounded hover:bg-blue-700 transition-colors duration-200"
            >
              Add Option
            </button>
          </div>
          
          <div className="space-y-3">
            {formData.answers.map((answer, index) => (
              <div key={answer.key} className="flex items-center">
                <div className={`flex items-center justify-center h-8 w-8 rounded-full mr-3 ${answer.key === formData.correctAnswerKey ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-200'}`}>
                  {answer.key}
                </div>
                
                <input
                  type="text"
                  value={answer.text}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 text-blue-50 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  placeholder={`Answer option ${answer.key}`}
                  required
                />
                
                <div className="flex space-x-2 ml-2">
                  <button
                    type="button"
                    onClick={() => handleCorrectAnswerChange(answer.key)}
                    className={`px-2 py-1 rounded text-xs ${
                      answer.key === formData.correctAnswerKey 
                        ? 'bg-green-700 text-white' 
                        : 'bg-gray-600 text-blue-100 hover:bg-gray-500'
                    } transition-colors duration-200`}
                  >
                    {answer.key === formData.correctAnswerKey ? 'Correct' : 'Set Correct'}
                  </button>
                  
                  {formData.answers.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeAnswerOption(answer.key)}
                      className="px-2 py-1 bg-red-700 text-white rounded text-xs hover:bg-red-600 transition-colors duration-200"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <label htmlFor="correctAnswerExplanation" className="block text-sm font-medium text-blue-200 mb-1">
            Explanation for Correct Answer
          </label>
          <textarea
            id="correctAnswerExplanation"
            name="correctAnswerExplanation"
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 text-blue-50 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            value={formData.correctAnswerExplanation}
            onChange={handleInputChange}
            placeholder="Explain why this is the correct answer"
          />
        </div>
        
        {/* Live preview of explanation with LaTeX rendering */}
        {formData.correctAnswerExplanation && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-blue-200 mb-1">Explanation Preview</label>
            <div className="bg-gray-700 text-green-100 p-3 rounded border border-gray-600">
              <MarkdownRenderer>{formData.correctAnswerExplanation}</MarkdownRenderer>
            </div>
          </div>
        )}
        
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/questions')}
            className="bg-gray-700 text-blue-100 py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : isEditing ? 'Update Question' : 'Create Question'}
          </button>
        </div>
      </form>
    </div>
  );
} 