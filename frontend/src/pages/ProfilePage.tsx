import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto bg-gray-800 rounded-lg border border-gray-700 p-6">
      <h1 className="text-3xl font-semibold text-blue-200 mb-4">Profile</h1>
      <div className="space-y-2 text-blue-50">
        <div>
          <span className="font-medium text-blue-300">Name: </span>{user.name}
        </div>
        <div>
          <span className="font-medium text-blue-300">Email: </span>{user.email}
        </div>
        <div>
          <span className="font-medium text-blue-300">Role: </span>{user.isAdmin ? 'Admin' : 'User'}
        </div>
      </div>
    </div>
  );
} 