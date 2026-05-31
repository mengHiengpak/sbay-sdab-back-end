'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';

export default function ForgotPasswordPage() {
  const { forgotPassword, showToast } = useApp();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) { showToast('error', 'Error', 'សូមបញ្ចូលអ៊ីមែល'); return; }
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      if (res.message || !res.error) {
        setSent(true);
        showToast('success', 'ជោគជ័យ', 'បានផ្ញើតំណកំណត់ពាក្យសម្ងាត់ឡើងវិញ');
      } else {
        showToast('error', 'Error', res.error || 'មិនអាចដំណើរការបានទេ');
      }
    } catch (err: any) {
      showToast('error', 'Error', err.message || 'មានបញ្ហាក្នុងការតភ្ជាប់');
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
                <linearGradient id="lg1" x1="0" y1="0" x2="36" y2="36"><stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient>
                <linearGradient id="lg2" x1="14" y1="12" x2="26" y2="24"><stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#22d3ee" /></linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="font-serif text-[1.8rem] italic text-text-primary">ភ្លេចពាក្យសម្ងាត់</h1>
          <p className="text-text-secondary text-[0.875rem] mt-1">បញ្ចូលអ៊ីមែលដើម្បីកំណត់ពាក្យសម្ងាត់ឡើងវិញ</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-bg-card/80 backdrop-blur-md border border-border rounded-2xl p-6 space-y-4">
          {sent ? (
            <div className="text-center py-4">
              <p className="text-text-primary text-[0.9rem]">បានផ្ញើតំណកំណត់ពាក្យសម្ងាត់ឡើងវិញទៅកាន់</p>
              <p className="text-accent-violet font-medium mt-1 text-[0.9rem]">{email}</p>
              <p className="text-text-muted text-[0.75rem] mt-3">ពិនិត្យ Console សម្រាប់តំណ (សាកល្បង)</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-[0.8rem] text-text-secondary mb-1.5 font-medium">អ៊ីមែល</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3.5 py-2.5 bg-bg-input border border-border rounded-xl text-text-primary font-main text-[0.9rem] outline-none transition-all focus:border-accent-violet focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-accent-violet text-white font-semibold text-[0.9rem] rounded-xl border-none cursor-pointer transition-all hover:opacity-90 disabled:opacity-50">
                {loading ? 'កំពុងដំណើរការ...' : 'ផ្ញើតំណកំណត់ឡើងវិញ'}
              </button>
            </>
          )}
          <div className="text-center text-[0.8rem] text-text-secondary pt-2">
            <Link href="/login" className="text-accent-violet hover:opacity-80 no-underline transition-opacity font-medium">ត្រឡប់ទៅចូលគណនី</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
