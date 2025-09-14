import { Link } from 'react-router-dom';
import React, { memo } from 'react';
import { Question, Difficulty } from '../../types';
import MarkdownRenderer from '../MarkdownRenderer';

interface QuestionCardProps {
  question: Question;
  showVoting?: boolean;
  onUpvote?: (id: string) => void;
  onDownvote?: (id: string) => void;
}

// Badge for difficulty level
const DifficultyBadge = ({ difficulty }: { difficulty: Difficulty }) => {
  const colors = {
    EASY: 'bg-green-800 text-green-100',
    MEDIUM: 'bg-yellow-800 text-yellow-100',
    HARD: 'bg-red-800 text-red-100',
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[difficulty]}`}>
      {difficulty}
    </span>
  );
};

function QuestionCard({ 
  question, 
  showVoting = true,
  onUpvote,
  onDownvote
}: QuestionCardProps) {
  const handleUpvote = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onUpvote) onUpvote(question._id);
  };
  
  const handleDownvote = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onDownvote) onDownvote(question._id);
  };
  
  return (
    <Link to={`/questions/${question._id}`} className="block">
      <div className="bg-gray-800 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow border border-gray-700">
        <div className="flex justify-between">
          <div className="text-lg font-semibold mb-2 text-blue-200">
            <MarkdownRenderer>{question.question}</MarkdownRenderer>
          </div>
          <DifficultyBadge difficulty={question.difficulty} />
          {question.generatedFrom && (
            <span className="ml-2 inline-block bg-indigo-700 text-indigo-100 text-xs px-2 py-0.5 rounded-full">
              AI Generated
            </span>
          )}
        </div>
        
        {question.description && (
          <div className="text-blue-100 text-sm mb-3">
            <MarkdownRenderer>
              {question.description.length > 100
                ? `${question.description.substring(0, 100)}...`
                : question.description}
            </MarkdownRenderer>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-blue-300">
            Subject: {typeof question.subject === 'string' 
              ? 'Loading...' 
              : question.subject.name}
          </div>
          
          {showVoting && (
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleUpvote}
                className={`flex items-center space-x-1 ${question.upvoted ? 'text-green-400' : 'text-blue-200 hover:text-green-400'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span>{question.upvoteCount || 0}</span>
              </button>
              
              <button 
                onClick={handleDownvote}
                className={`flex items-center space-x-1 ${question.downvoted ? 'text-red-400' : 'text-blue-200 hover:text-red-400'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{question.downvoteCount || 0}</span>
              </button>
            </div>
          )}
        </div>
        
        {!question.verified && (
          <div className="mt-2 text-xs text-amber-400 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Awaiting verification
          </div>
        )}
      </div>
    </Link>
  );
}

export default memo(QuestionCard); 