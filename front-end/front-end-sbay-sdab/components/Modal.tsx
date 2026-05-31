'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

export default function Modal() {
  const { state, closeModal } = useApp();
  const { modal } = state;
  const [name, setName] = useState('');

  useEffect(() => {
    if (modal) {
      setName('');
      setTimeout(() => document.getElementById('pl-name')?.focus(), 100);
    }
  }, [modal]);

  if (!modal) return null;

  const handleSubmit = () => {
    modal.onSubmit?.(name);
  };

  return (
    <div className="fixed inset-0 z-500 flex items-center justify-center p-4" onClick={closeModal}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-bg-card border border-border rounded-2xl shadow-card w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
        <h2 className="text-[1.1rem] font-semibold text-text-primary mb-4">{modal.title}</h2>
        <div dangerouslySetInnerHTML={{ __html: modal.body }} />
        <div className="flex justify-end gap-2 mt-5">
          {modal.buttons.map((btn, i) => (
            <button key={i} onClick={() => { if (btn.action === 'close') closeModal(); if (btn.action === 'submit') handleSubmit(); }}
              className={`px-4 py-2 rounded-xl text-[0.85rem] font-medium cursor-pointer transition-all border-none ${btn.class === 'btn-primary' ? 'bg-accent-violet text-white hover:opacity-90' : 'bg-surface text-text-secondary hover:text-text-primary'}`}>
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
