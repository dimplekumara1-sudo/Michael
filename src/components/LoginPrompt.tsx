import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, UserPlus, X } from 'lucide-react';

interface LoginPromptProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'like' | 'comment';
  title?: string;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({ 
  isOpen, 
  onClose, 
  action,
  title = "Login Required"
}) => {
  if (!isOpen) return null;

  const actionText = action === 'like' ? 'like posts' : 'comment on posts';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Please log in to {actionText} and interact with our latest work.
          </p>
          <p className="text-sm text-gray-500">
            Join our community to engage with our photography and stay updated with our latest projects!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/login"
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            onClick={onClose}
          >
            <LogIn className="h-4 w-4 mr-2" />
            Log In
          </Link>
          <Link
            to="/register"
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
            onClick={onClose}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Sign Up
          </Link>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Continue browsing without account
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPrompt;