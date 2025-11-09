
import React, { useState } from 'react';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';

const AuthPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            {isLoginView ? 'Welcome to AgroAssist' : 'Create your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLoginView ? 'Please sign in to continue' : 'And start managing your farm'}
          </p>
        </div>
        
        {isLoginView ? <LoginPage /> : <RegisterPage />}
        
        <p className="mt-6 text-center text-sm">
          {isLoginView ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            onClick={() => setIsLoginView(!isLoginView)} 
            className="font-medium text-green-600 hover:text-green-500"
          >
            {isLoginView ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
