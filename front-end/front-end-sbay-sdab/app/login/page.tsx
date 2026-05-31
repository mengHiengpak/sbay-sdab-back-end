'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'មានបញ្ហាក្នុងការតភ្ជាប់';
}

export default function LoginPage() {
  const { login, showToast, state } = useApp();
  const { user, isAuthLoading } = state;
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    if (!email || !password) {
      showToast('error', 'Error', 'សូមបំពេញព័ត៌មានទាំងអស់');
      return;
    }
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        showToast('success', 'ជោគជ័យ', 'ចូលគណនីបានជោគជ័យ');
        router.push('/');
      } else {
        showToast('error', 'Error', res.error || 'អ៊ីមែល ឬ ពាក្យសម្ងាត់មិនត្រឹមត្រូវ');
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
          <h1 className="font-serif text-[1.8rem] italic text-text-primary">ចូលគណនី</h1>
          <p className="text-text-secondary text-[0.875rem] mt-1">សូមបញ្ចូលព័ត៌មានគណនីរបស់អ្នក</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-bg-card/80 backdrop-blur-md border border-border rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-[0.8rem] text-text-secondary mb-1.5 font-medium">អ៊ីមែល</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-3.5 py-2.5 bg-bg-input border border-border rounded-xl text-text-primary font-main text-[0.9rem] outline-none transition-all focus:border-accent-violet focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]" />
          </div>
          <div>
            <label className="block text-[0.8rem] text-text-secondary mb-1.5 font-medium">ពាក្យសម្ងាត់</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-bg-input border border-border rounded-xl text-text-primary font-main text-[0.9rem] outline-none transition-all focus:border-accent-violet focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]" />
          </div>
          <div className="flex items-center justify-between text-[0.8rem]">
            <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-accent-violet" />
              ចងចាំគណនី
            </label>
            <Link href="/forgot-password" className="text-accent-violet hover:opacity-80 no-underline transition-opacity">
              ភ្លេចពាក្យសម្ងាត់?
            </Link>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-accent-violet text-white font-semibold text-[0.9rem] rounded-xl border-none cursor-pointer transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'កំពុងចូល...' : 'ចូលគណនី'}
          </button>
          <div className="text-center text-[0.8rem] text-text-secondary pt-2">
            មិនទាន់មានគណនី?{' '}
            <Link href="/register" className="text-accent-violet hover:opacity-80 no-underline transition-opacity font-medium">
              ចុះឈ្មោះ
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
