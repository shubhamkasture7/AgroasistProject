import React, { useState } from 'react';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';

const AuthPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-white shadow-xl border border-gray-100 p-6 sm:p-8">
          {isLoginView ? (
            <LoginPage onSwitch={() => setIsLoginView(false)} />
          ) : (
            <RegisterPage onSwitch={() => setIsLoginView(true)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
