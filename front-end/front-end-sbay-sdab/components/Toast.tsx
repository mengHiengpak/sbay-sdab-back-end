'use client';

import { useApp } from '@/context/AppContext';

export default function ToastContainer() {
  const { state, removeToast } = useApp();
  const { toasts } = state;

  return (
    <div className="fixed bottom-24 right-6 z-[9999] flex flex-col gap-2 max-w-sm max-md:left-6 max-md:right-6 max-md:bottom-20">
      {toasts.map(t => (
        <div key={t.id}
          className="flex items-start gap-3 bg-bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-card p-4 animate-slide-up cursor-pointer"
          onClick={() => removeToast(t.id)}>
          <div className="shrink-0 pt-0.5">
            {t.type === 'success' && <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" className="w-5 h-5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
            {t.type === 'error' && <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>}
            {t.type === 'downloading' && <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" className="w-5 h-5 animate-spin"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[0.85rem] text-text-primary font-medium">{t.title}</p>
            {t.subtitle && <p className="text-[0.75rem] text-text-secondary mt-0.5">{t.subtitle}</p>}
            {t.progress !== undefined && t.type === 'downloading' && (
              <div className="mt-2 h-1 bg-surface rounded-full overflow-hidden">
                <div className="h-full bg-accent-violet rounded-full transition-all duration-300" style={{ width: `${Math.min(t.progress, 100)}%` }} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
