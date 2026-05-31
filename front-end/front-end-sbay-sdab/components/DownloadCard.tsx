'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function DownloadCard() {
  const { analyzeUrl, startDownload, state, dispatch } = useApp();
  const { currentVideoInfo, selectedFormat } = state;
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    await analyzeUrl(url.trim());
    setLoading(false);
  };

  return (
    <div className="bg-bg-card/80 backdrop-blur-md border border-border rounded-2xl p-5 mb-7">
      <h2 className="text-[1rem] font-semibold text-text-primary mb-3">ទាញ់យក Video/Music</h2>
      <div className="flex gap-2">
        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          placeholder="បិទភ្ជាប់ URL (YouTube, Facebook, TikTok...)"
          className="flex-1 px-3.5 py-2.5 bg-bg-input border border-border rounded-xl text-text-primary font-main text-[0.9rem] outline-none transition-all focus:border-accent-violet focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]" />
        <button onClick={handleAnalyze} disabled={loading}
          className="px-5 py-2.5 bg-accent-violet text-white font-medium text-[0.85rem] rounded-xl border-none cursor-pointer transition-all hover:opacity-90 disabled:opacity-50 whitespace-nowrap">
          {loading ? 'កំពុងពិនិត្យ...' : 'ពិនិត្យ'}
        </button>
      </div>

      {currentVideoInfo && (
        <div className="mt-4 pt-4 border-t border-border animate-fade-in">
          <div className="flex gap-4 max-md:flex-col">
            {(currentVideoInfo.thumbnail as string) && (
              <img src={currentVideoInfo.thumbnail as string} alt="" className="w-40 h-24 object-cover rounded-xl shrink-0 max-md:w-full max-md:h-auto" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-[0.95rem] text-text-primary font-medium truncate">{currentVideoInfo.title as string}</h3>
              <p className="text-[0.75rem] text-text-muted mt-0.5">{currentVideoInfo.author as string || 'Unknown'}</p>
              <div className="flex gap-2 mt-3">
                {selectedFormat && (
                  <div className="flex items-center gap-2">
                    <select onChange={(e) => dispatch?.({ type: 'SET_SELECTED_FORMAT', payload: (currentVideoInfo.formats as any[])?.find((f: any) => f.id === e.target.value) || selectedFormat })}
                      className="px-3 py-1.5 bg-bg-input border border-border rounded-lg text-text-primary text-[0.8rem] outline-none">
                      {(currentVideoInfo.formats as any[])?.map((fmt: any) => (
                        <option key={fmt.id} value={fmt.id}>{fmt.quality} - {fmt.ext}</option>
                      ))}
                    </select>
                    <button onClick={startDownload}
                      className="px-4 py-1.5 bg-accent-green text-white text-[0.8rem] font-medium rounded-lg border-none cursor-pointer hover:opacity-90 transition-all whitespace-nowrap">
                      ទាញ់យក
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
