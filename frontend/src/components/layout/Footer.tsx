import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 text-blue-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-300">ExamPrep</h3>
            <p className="text-blue-100 text-sm">
              A platform for crowd-sourced competitive exam questions. Practice, contribute, and excel in your exams.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-300">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-blue-100 hover:text-blue-300 transition-colors duration-200">Home</Link>
              </li>
              <li>
                <Link to="/questions" className="text-blue-100 hover:text-blue-300 transition-colors duration-200">Questions</Link>
              </li>
              <li>
                <Link to="/quizzes" className="text-blue-100 hover:text-blue-300 transition-colors duration-200">Quizzes</Link>
              </li>
              <li>
                <Link to="/profile" className="text-blue-100 hover:text-blue-300 transition-colors duration-200">Profile</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-300">Contact</h3>
            <p className="text-blue-100 text-sm mb-2">
              Have questions or feedback? Reach out to us.
            </p>
            <a 
              href="mailto:support@examprep.com" 
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200"
            >
              support@examprep.com
            </a>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-700 text-center text-sm text-blue-200">
          © {currentYear} ExamPrep. All rights reserved.
        </div>
      </div>
    </footer>
  );
} 