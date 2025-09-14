import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';

// Lazy load pages and forms for better performance
const HomePage = lazy(() => import('./pages/Homepage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const QuestionsPage = lazy(() => import('./pages/QuestionsPage'));
const QuestionDetailPage = lazy(() => import('./pages/QuestionDetailPage'));
const QuestionForm = lazy(() => import('./components/questions/QuestionForm'));
const QuizzesPage = lazy(() => import('./pages/QuizzesPage'));
const QuizDetailPage = lazy(() => import('./pages/QuizDetailPage'));
const QuizAttemptPage = lazy(() => import('./pages/QuizAttemptPage'));
const QuizForm = lazy(() => import('./components/quizzes/QuizForm'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
import ProtectedRoute from './components/auth/ProtectedRoute';

// Not Found Page
const NotFoundPage = () => (
  <div className="text-center py-20 animate-fadeIn">
    <h1 className="text-6xl font-bold text-blue-500 mb-4">404</h1>
    <h2 className="text-2xl font-semibold mb-4 text-blue-200">Page Not Found</h2>
    <p className="text-blue-100 mb-8">The page you are looking for doesn't exist or has been moved.</p>
    <a href="/" className="btn bg-blue-600 text-white hover:bg-blue-700 transition-transform hover:scale-105">Go to Home</a>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/questions" element={<QuestionsPage />} />
              <Route path="/questions/:id" element={<QuestionDetailPage />} />
              <Route path="/quizzes" element={<QuizzesPage />} />
              <Route path="/quizzes/:id" element={<QuizDetailPage />} />
              
              {/* Protected routes (require authentication) */}
              <Route
                path="/questions/new"
                element={
                  <ProtectedRoute>
                    <QuestionForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/questions/:id/edit"
                element={
                  <ProtectedRoute>
                    <QuestionForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quizzes/new"
                element={
                  <ProtectedRoute requireAdmin>
                    <QuizForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quizzes/:id/edit"
                element={
                  <ProtectedRoute requireAdmin>
                    <QuizForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quizzes/:id/attempt"
                element={
                  <ProtectedRoute>
                    <QuizAttemptPage />
                  </ProtectedRoute>
                }
              />
              
              {/* Leaderboard route */}
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              
              {/* User profile route */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              
              {/* Admin dashboard route */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              
              {/* 404 route */}
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
