'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { showToast } = useApp();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [reset, setReset] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { showToast('error', 'Error', 'Passwords do not match'); return; }
    if (password.length < 6) { showToast('error', 'Error', 'Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const { default: API } = await import('@/lib/api');
      const res = await API.resetPassword(token, password);
      if (res.message || !res.error) {
        setReset(true);
        showToast('success', 'Success', 'Password has been reset');
      } else {
        showToast('error', 'Error', (res.error as string) || 'Could not reset password');
      }
    } catch (err: any) {
      showToast('error', 'Error', err.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  if (reset) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="font-serif text-[1.8rem] italic text-text-primary mb-4">Password has been reset</h1>
          <p className="text-text-secondary text-[0.9rem] mb-6">You can now sign in with your new password</p>
          <Link href="/login" className="inline-block px-6 py-2.5 bg-accent-violet text-white font-semibold text-[0.9rem] rounded-xl no-underline hover:opacity-90 transition-all">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-[1.8rem] italic text-text-primary">Reset Password</h1>
          <p className="text-text-secondary text-[0.875rem] mt-1">Enter your new password</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-bg-card/80 backdrop-blur-md border border-border rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-[0.8rem] text-text-secondary mb-1.5 font-medium">New Password</label>
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
            className="w-full py-2.5 bg-accent-violet text-white font-semibold text-[0.9rem] rounded-xl border-none cursor-pointer transition-all hover:opacity-90 disabled:opacity-50">
            {loading ? 'Processing...' : 'Reset'}
          </button>
          <div className="text-center text-[0.8rem] text-text-secondary pt-2">
            <Link href="/login" className="text-accent-violet hover:opacity-80 no-underline transition-opacity font-medium">Back to Sign In</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-accent-violet border-t-transparent rounded-full animate-spin" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
