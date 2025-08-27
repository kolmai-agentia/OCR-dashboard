'use client';

import { useState, useEffect } from 'react';

interface PasswordProtectionProps {
  children: React.ReactNode;
}

const CORRECT_PASSWORD = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || 'admin123';
const STORAGE_KEY = 'dashboard_auth';
const ATTEMPTS_KEY = 'dashboard_attempts';

export default function PasswordProtection({ children }: PasswordProtectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedAuth = sessionStorage.getItem(STORAGE_KEY);
    const storedAttempts = localStorage.getItem(ATTEMPTS_KEY);
    
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
    
    if (storedAttempts) {
      const attemptsData = JSON.parse(storedAttempts);
      const now = Date.now();
      
      if (attemptsData.blockedUntil && now < attemptsData.blockedUntil) {
        setIsBlocked(true);
        setAttempts(attemptsData.attempts);
        setRemainingTime(Math.ceil((attemptsData.blockedUntil - now) / 1000));
      } else {
        setAttempts(attemptsData.attempts || 0);
      }
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isBlocked && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            setIsBlocked(false);
            setError('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBlocked, remainingTime]);

  const calculateBlockTime = (attemptCount: number): number => {
    if (attemptCount < 5) return 0;
    const multiplier = Math.pow(2, Math.floor((attemptCount - 5) / 5));
    return 30 * multiplier * 1000; // 30s, 1m, 2m, 4m, 8m, etc.
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) return;
    
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem(STORAGE_KEY, 'true');
      localStorage.removeItem(ATTEMPTS_KEY);
      setError('');
      setAttempts(0);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPassword('');
      setError('Incorrect password');
      
      const blockTime = calculateBlockTime(newAttempts);
      const attemptsData = {
        attempts: newAttempts,
        blockedUntil: blockTime > 0 ? Date.now() + blockTime : null
      };
      
      localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attemptsData));
      
      if (blockTime > 0) {
        setIsBlocked(true);
        setRemainingTime(Math.ceil(blockTime / 1000));
        setError(`Too many failed attempts. Please wait ${Math.ceil(blockTime / 1000)} seconds.`);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">OCR Dashboard</h1>
        <p className="text-gray-700 text-center mb-6">Enter password to access the dashboard</p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              style={{ WebkitTextSecurity: 'disc' } as React.CSSProperties}
              disabled={isBlocked}
              autoFocus
            />
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {attempts > 0 && !isBlocked && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-700 rounded-md text-sm">
              Failed attempts: {attempts}/5 {attempts >= 5 && `(${Math.floor((attempts - 5) / 5) + 1} timeout periods)`}
            </div>
          )}
          
          {isBlocked && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
              Blocked for: {formatTime(remainingTime)}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isBlocked || !password.trim()}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isBlocked ? `Blocked (${formatTime(remainingTime)})` : 'Access Dashboard'}
          </button>
        </form>
        
        <div className="mt-6 text-xs text-gray-600 text-center">
          After 5 failed attempts, access will be temporarily blocked with increasing timeout periods
        </div>
      </div>
    </div>
  );
}