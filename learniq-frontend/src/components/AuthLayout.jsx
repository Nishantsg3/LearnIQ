import React from 'react';

const AuthLayout = ({ children, headline, tagline }) => {
  return (
    <div className="min-h-screen flex text-slate-50">
      {/* Left Pane - Branding (55%) */}
      <div className="hidden lg:flex w-[55%] bg-black flex-col justify-center p-20 relative overflow-hidden">
        <div className="absolute top-10 left-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-xl">L</span>
          </div>
          <span className="text-2xl font-black tracking-tight">LearnIQ</span>
        </div>
        
        <div className="max-w-md">
          <h1 className="text-6xl font-black leading-tight tracking-tighter mb-6">
            {headline || "Conduct smarter aptitude tests."}
          </h1>
          <p className="text-xl text-slate-400 font-medium leading-relaxed">
            {tagline || "The modern platform for assessment and technical evaluation."}
          </p>
        </div>
        
        {/* Subtle decorative element (not flashy) */}
        <div className="absolute bottom-10 left-10 text-[10px] uppercase font-bold tracking-[0.5em] text-slate-600">
          Professional Assessment Suite © 2024
        </div>
      </div>

      {/* Right Pane - Form (45%) */}
      <div className="flex-1 bg-[#0f172a] flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
           {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
