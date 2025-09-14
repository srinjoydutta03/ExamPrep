import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="bg-gray-800 text-blue-100 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-blue-400">ExamPrep</span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-6">
              <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 hover:text-blue-300 transition-colors duration-200">
                Home
              </Link>
              <Link to="/questions" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 hover:text-blue-300 transition-colors duration-200">
                Questions
              </Link>
              <Link to="/quizzes" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 hover:text-blue-300 transition-colors duration-200">
                Quizzes
              </Link>
              <Link to="/leaderboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 hover:text-blue-300 transition-colors duration-200">
                Leaderboard
              </Link>
              {user?.isAdmin && (
                <Link to="/admin" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 hover:text-blue-300 transition-colors duration-200">
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="text-sm font-medium text-blue-300 hover:text-blue-200 transition-colors duration-200">
                  {user.name}
                </Link>
                <button 
                  onClick={() => logout()}
                  className="px-3 py-1.5 border border-blue-400 rounded-md text-sm font-medium text-blue-300 hover:bg-blue-900 hover:border-blue-300 transition-all duration-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link to="/login" className="px-3 py-1.5 border border-blue-400 rounded-md text-sm font-medium text-blue-300 hover:bg-blue-900 hover:border-blue-300 transition-all duration-200">
                  Login
                </Link>
                <Link to="/signup" className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
          <div className="flex md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-blue-200 hover:bg-gray-700 hover:text-blue-300 focus:outline-none transition-colors duration-200"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-900">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              className="block px-3 py-2 rounded-md text-base font-medium text-blue-100 hover:bg-gray-800 hover:text-blue-300 transition-colors duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/questions" 
              className="block px-3 py-2 rounded-md text-base font-medium text-blue-100 hover:bg-gray-800 hover:text-blue-300 transition-colors duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              Questions
            </Link>
            <Link 
              to="/quizzes" 
              className="block px-3 py-2 rounded-md text-base font-medium text-blue-100 hover:bg-gray-800 hover:text-blue-300 transition-colors duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              Quizzes
            </Link>
            <Link
              to="/leaderboard"
              className="block px-3 py-2 rounded-md text-base font-medium text-blue-100 hover:bg-gray-800 hover:text-blue-300 transition-colors duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              Leaderboard
            </Link>
            {user?.isAdmin && (
              <Link 
                to="/admin" 
                className="block px-3 py-2 rounded-md text-base font-medium text-blue-100 hover:bg-gray-800 hover:text-blue-300 transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin
              </Link>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-700">
            {user ? (
              <div className="px-5 py-3 space-y-3">
                <Link 
                  to="/profile" 
                  className="block text-base font-medium text-blue-300 hover:text-blue-200 transition-colors duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {user.name}
                </Link>
                <button 
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-blue-100 hover:bg-gray-800 hover:text-blue-300 transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col px-5 py-3 space-y-3">
                <Link 
                  to="/login" 
                  className="block w-full text-center px-3 py-2 border border-blue-400 rounded-md text-base font-medium text-blue-300 hover:bg-blue-900 hover:border-blue-300 transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="block w-full text-center px-3 py-2 bg-blue-600 text-white rounded-md text-base font-medium hover:bg-blue-700 transition-colors duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 