import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  
  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gray-800 text-white rounded-xl overflow-hidden shadow-xl mb-12 animate-fadeIn">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl mb-6 bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 text-transparent">
                ExamPrep
              </h1>
              <p className="text-xl lg:text-2xl text-blue-100">
                Crowd-sourced competitive exam questions to help you prepare for your next exam
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/questions" className="btn bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-lg transition-all duration-300 hover:scale-105">
                  Browse Questions
                </Link>
                <Link to="/quizzes" className="btn border border-blue-400 text-blue-100 hover:bg-gray-700 hover:shadow-lg transition-all duration-300 hover:scale-105">
                  Take Quizzes
                </Link>
              </div>
            </div>
            <div className="mt-10 lg:mt-0 flex justify-center transition-transform duration-500 hover:scale-105">
              <img 
                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
                alt="Student studying"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-12">
        <h2 className="text-3xl font-bold text-center mb-12 text-blue-200">How It Works</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <div className="text-blue-400 text-4xl font-bold mb-4">01</div>
            <h3 className="text-xl font-semibold mb-2 text-blue-200">Create & Contribute</h3>
            <p className="text-blue-100">
              Share your knowledge by contributing questions. Help others while reinforcing your own understanding.
            </p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <div className="text-blue-400 text-4xl font-bold mb-4">02</div>
            <h3 className="text-xl font-semibold mb-2 text-blue-200">Practice & Learn</h3>
            <p className="text-blue-100">
              Access a growing library of questions categorized by subject and difficulty. Practice at your own pace.
            </p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <div className="text-blue-400 text-4xl font-bold mb-4">03</div>
            <h3 className="text-xl font-semibold mb-2 text-blue-200">Take Quizzes</h3>
            <p className="text-blue-100">
              Test your knowledge with curated quizzes, get instant feedback, and track your progress over time.
            </p>
          </div>
        </div>
      </div>
      
      {/* Call to Action */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-8 text-center mt-12 shadow-lg">
        <h2 className="text-2xl font-bold text-blue-200 mb-4">Ready to Get Started?</h2>
        <p className="text-blue-100 mb-6">
          {user 
            ? "Continue your learning journey with more questions and quizzes." 
            : "Join our community of learners today!"}
        </p>
        
        {user ? (
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/questions/new" className="btn bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 hover:scale-105">
              Add Question
            </Link>
            <Link to="/quizzes" className="btn bg-gray-700 text-blue-100 hover:bg-gray-600 transition-all duration-300 hover:scale-105">
              Take Quiz
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/signup" className="btn bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 hover:scale-105">
              Sign Up
            </Link>
            <Link to="/login" className="btn bg-gray-700 text-blue-100 hover:bg-gray-600 transition-all duration-300 hover:scale-105">
              Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 