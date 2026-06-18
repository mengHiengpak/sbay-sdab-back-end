'use client';

import { useState, useEffect } from 'react';
import API from '@/lib/api';
import { useApp } from '@/context/AppContext';

export default function CookiesPage() {
  const { showToast, state, navigateTo } = useApp();
  const [cookies, setCookies] = useState('');
  const [hasCookies, setHasCookies] = useState(false);
  const [saving, setSaving] = useState(false);

  const isLoggedIn = !!state.user;

  useEffect(() => {
    if (!isLoggedIn) return;
    API.get('/download/cookies-status', true).then(res => {
      if (res.success && (res.data as any)?.hasCookies) setHasCookies(true);
    }).catch(() => {});
  }, [isLoggedIn]);

  const handleSave = async () => {
    if (!cookies.trim()) return;
    setSaving(true);
    try {
      const res = await API.post('/download/cookies', { cookies }, true);
      if (res.success) {
        setHasCookies(true);
        showToast('success', 'Cookies Saved', 'YouTube downloads will now use your cookies');
        setCookies('');
      } else {
        showToast('error', 'Error', (res.error as string) || 'Failed to save cookies');
      }
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    }
    setSaving(false);
  };

  const handleClear = async () => {
    try {
      const res = await API.post('/download/cookies', { cookies: '' }, true);
      if (res.success) {
        setHasCookies(false);
        showToast('success', 'Cookies Cleared', '');
      }
    } catch {}
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <h1 className="font-serif text-[2rem] italic text-text-primary leading-[1.2] mb-6">YouTube Cookies</h1>

      <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <h2 className="text-[1.1rem] font-semibold text-text-primary mb-3">Why this is needed</h2>
        <p className="text-text-secondary text-[0.9rem] leading-relaxed mb-4">
          YouTube blocks downloads from server IPs. To bypass this, paste your YouTube cookies below.
          This is a <strong>one-time setup</strong> — once saved, all future downloads will use them.
        </p>

        <div className="bg-bg-primary border border-border rounded-xl p-4 mb-4">
          <h3 className="text-[0.9rem] font-semibold text-text-primary mb-2">How to get your cookies:</h3>
          <ol className="text-text-secondary text-[0.85rem] space-y-2 list-decimal list-inside">
            <li>Install <a href="https://chrome.google.com/webstore/detail/get-cookiestxt/bgaddhkoddajcdgocldbbfleckgcbcid" target="_blank" rel="noopener noreferrer" className="text-accent-violet underline">Get cookies.txt</a> extension in Chrome</li>
            <li>Go to <strong>youtube.com</strong> and make sure you're logged in</li>
            <li>Click the extension icon → <strong>Export</strong> (as Netscape format)</li>
            <li>Copy the entire exported text and paste it below</li>
          </ol>
        </div>

        {hasCookies && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
            <span className="text-green-400 text-[0.85rem]">✅ Cookies are set</span>
            <button onClick={handleClear} className="text-red-400 text-[0.8rem] cursor-pointer hover:text-red-300 bg-none border-none">Clear</button>
          </div>
        )}

        {!isLoggedIn ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-4 text-center">
            <p className="text-amber-400 text-[0.85rem]">Please sign in before setting cookies</p>
            <button onClick={() => navigateTo('login')}
              className="mt-2 px-4 py-1.5 bg-accent-violet text-white rounded-lg text-[0.8rem] font-medium cursor-pointer border-none hover:opacity-90">
              Sign In
            </button>
          </div>
        ) : (
          <>
            <textarea value={cookies} onChange={(e) => setCookies(e.target.value)}
              placeholder="Paste your YouTube cookies.txt here..."
              className="w-full h-48 px-4 py-3 bg-bg-input border border-border rounded-xl text-text-primary font-mono text-[0.8rem] outline-none transition-all resize-y focus:border-accent-violet mb-4"
            />

            <button onClick={handleSave} disabled={saving || !cookies.trim()}
              className="px-6 py-2.5 bg-accent-violet text-white rounded-xl text-[0.9rem] font-medium cursor-pointer transition-all border-none hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
              {saving ? 'Saving...' : 'Save Cookies'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}