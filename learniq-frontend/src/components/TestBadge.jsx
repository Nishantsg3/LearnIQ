import React from 'react';
import { Zap, Flame } from 'lucide-react';

const TestBadge = ({ type, className = "" }) => {
  const isMain = type?.toUpperCase() === 'MAIN';

  if (isMain) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-600 to-rose-600 text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(225,29,72,0.3)] border border-white/10 ${className}`}>
        <Flame size={12} className="animate-pulse" />
        <span>Main assessment</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-white/20 ${className}`}>
      <Zap size={12} className="text-emerald-200" />
      <span>Practice mode</span>
    </div>
  );
};

export default TestBadge;
