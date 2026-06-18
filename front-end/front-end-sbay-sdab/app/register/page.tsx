'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Connection error';
}

export default function RegisterPage() {
  const { register, showToast, state } = useApp();
  const { user, isAuthLoading } = state;
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && user) {
      router.push('/');
    }
  }, [user, isAuthLoading, router]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent-violet border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      showToast('error', 'Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      showToast('error', 'Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      showToast('error', 'Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await register(username, email, password);
      if (res.success) {
        showToast('success', 'Success', 'Account registered successfully');
        router.push('/');
      } else {
        showToast('error', 'Error', res.error || 'Could not register');
      }
    } catch (err: unknown) {
      showToast('error', 'Error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4">
            <svg viewBox="0 0 36 36" fill="none" className="w-full h-full">
              <circle cx="18" cy="18" r="17" stroke="url(#lg1)" strokeWidth="2" />
              <path d="M14 12l12 6-12 6V12z" fill="url(#lg2)" />
              <defs>
                <linearGradient id="lg1" x1="0" y1="0" x2="36" y2="36">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="lg2" x1="14" y1="12" x2="26" y2="24">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="font-serif text-[1.8rem] italic text-text-primary">Sign Up</h1>
          <p className="text-text-secondary text-[0.875rem] mt-1">Create a new account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-bg-card/80 backdrop-blur-md border border-border rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-[0.8rem] text-text-secondary mb-1.5 font-medium">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="yourname"
              className="w-full px-3.5 py-2.5 bg-bg-input border border-border rounded-xl text-text-primary font-main text-[0.9rem] outline-none transition-all focus:border-accent-violet focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]" />
          </div>
          <div>
            <label className="block text-[0.8rem] text-text-secondary mb-1.5 font-medium">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-3.5 py-2.5 bg-bg-input border border-border rounded-xl text-text-primary font-main text-[0.9rem] outline-none transition-all focus:border-accent-violet focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]" />
          </div>
          <div>
            <label className="block text-[0.8rem] text-text-secondary mb-1.5 font-medium">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-bg-input border border-border rounded-xl text-text-primary font-main text-[0.9rem] outline-none transition-all focus:border-accent-violet focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]" />
          </div>
          <div>
            <label className="block text-[0.8rem] text-text-secondary mb-1.5 font-medium">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-bg-input border border-border rounded-xl text-text-primary font-main text-[0.9rem] outline-none transition-all focus:border-accent-violet focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-accent-violet text-white font-semibold text-[0.9rem] rounded-xl border-none cursor-pointer transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>

          <div className="text-center text-[0.8rem] text-text-secondary pt-2">
            Already have an account?{' '}
            <Link href="/login" className="text-accent-violet hover:opacity-80 no-underline transition-opacity font-medium">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
