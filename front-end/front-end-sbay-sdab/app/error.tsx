'use client';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-16 h-16 text-red-400">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <h2 className="text-text-primary text-[1.3rem] font-semibold">Something went wrong</h2>
      <p className="text-text-muted text-[0.9rem] max-w-md">{error.message || 'An unexpected error occurred'}</p>
      <button onClick={reset}
        className="px-5 py-2 bg-accent-violet text-white rounded-xl text-[0.9rem] font-medium cursor-pointer border-none hover:opacity-90 transition-opacity">
        Try again
      </button>
    </div>
  );
}
