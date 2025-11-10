import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import GoogleButton from './ui/GoogleButton';
import { Mail, Lock, Sprout } from 'lucide-react';

type Props = {
  onSwitch?: () => void; // switch to Register
};

const LoginPage: React.FC<Props> = ({ onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (remember) {
        localStorage.setItem('agraassist_remember', '1');
      } else {
        localStorage.removeItem('agraassist_remember');
      }
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'An unknown error occurred.';
      if (!msg.includes('Redirecting to Google sign-in')) {
        setError(msg);
        setIsGoogleLoading(false);
      }
    }
  };

  return (
    <div className="w-full">
      {/* Header icon */}
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-600">
        <Sprout className="h-7 w-7 text-white" />
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-900">
        Welcome Farmer!
      </h1>
      <p className="mt-1 text-center text-gray-500">
        Your intelligent farming assistant
      </p>

      {/* Error */}
      {error && (
        <div className="mt-4 text-sm text-center text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
          {error}
        </div>
      )}

      {/* Form */}
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {/* Email */}
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Mail className="h-4 w-4 text-gray-400" />
            </span>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="farmer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-200 outline-none"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            Password
          </label>
        <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Lock className="h-4 w-4 text-gray-400" />
            </span>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-200 outline-none"
            />
          </div>
        </div>

        {/* Helpers row */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember me
          </label>
          <a href="/forgot-password" className="text-sm font-medium text-green-600 hover:text-green-700">
            Forgot password?
          </a>
        </div>

        {/* Sign In */}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-1 inline-flex w-full items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-white text-base font-semibold shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:opacity-70"
        >
          {isLoading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-sm text-gray-500">Or continue with</span>
        </div>
      </div>

      {/* Google */}
      <GoogleButton onClick={handleGoogleLogin} isLoading={isGoogleLoading}>
        Sign in with Google
      </GoogleButton>

      {/* Footer link */}
      <p className="mt-6 text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <button type="button" onClick={onSwitch} className="font-semibold text-green-600 hover:text-green-700">
          Register now
        </button>
      </p>
    </div>
  );
};

export default LoginPage;
