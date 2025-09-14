import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (!user.isAdmin) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || !user.isAdmin) return null;

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto bg-gray-800 rounded-lg border border-gray-700 p-6">
      <h1 className="text-3xl font-semibold text-blue-200 mb-4">Admin Dashboard</h1>
      <p className="text-blue-50 mb-6">Welcome, {user.name}! Use the options below to manage the platform.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/questions"
          className="bg-blue-600 text-white py-3 px-4 rounded-md text-center hover:bg-blue-700 transition-colors duration-200"
        >
          Manage Questions
        </Link>
        <Link
          to="/quizzes"
          className="bg-blue-600 text-white py-3 px-4 rounded-md text-center hover:bg-blue-700 transition-colors duration-200"
        >
          Manage Quizzes
        </Link>
        <Link
          to="/leaderboard"
          className="bg-blue-600 text-white py-3 px-4 rounded-md text-center hover:bg-blue-700 transition-colors duration-200"
        >
          View Leaderboard
        </Link>
        <Link
          to="/questions/new"
          className="bg-green-600 text-white py-3 px-4 rounded-md text-center hover:bg-green-700 transition-colors duration-200"
        >
          Add New Question
        </Link>
        <Link
          to="/quizzes/new"
          className="bg-green-600 text-white py-3 px-4 rounded-md text-center hover:bg-green-700 transition-colors duration-200"
        >
          Create New Quiz
        </Link>
      </div>
    </div>
  );
} 