import React, { useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';

const CodeQuestion = ({ text = '', category = 'Code', className = "" }) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [text]);

  if (!text) return null;

  // Split text by backticks to find code segments
  const parts = text.split(/(`[^`]+`)/g);

  return (
    <div className={`leading-relaxed ${className}`}>
      {parts.map((part, index) => {
        if (part.startsWith('`') && part.endsWith('`')) {
          const code = part.slice(1, -1);
          
          // NEW LOGIC: Only use Snapshot for actual multi-line programs
          const isMultiLine = code.includes('\n');
          
          if (!isMultiLine) {
            return (
              <code key={index} className="mx-1 px-2 py-1 bg-[#7c3aed]/10 border border-[#7c3aed]/20 rounded-lg text-[#a78bfa] font-mono text-[14px] font-black tracking-tight shadow-sm inline-block">
                {code}
              </code>
            );
          }

          return (
            <div key={index} className="my-6 bg-[#0d0d17] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform hover:scale-[1.01] transition-transform duration-300">
              {/* IDE Header Strip */}
              <div className="px-5 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between backdrop-blur-md">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.3)]"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.3)]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#7c3aed]/80 shadow-[0_0_10px_rgba(124,58,237,0.3)]"></div>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-1 h-3 bg-[#7c3aed]/40 rounded-full" />
                   <span className="text-[10px] font-black text-[#a78bfa] uppercase tracking-[0.2em]">{category || 'Source'}</span>
                </div>
              </div>
              {/* Code Content */}
              <div className="p-6 overflow-x-auto custom-scrollbar bg-[#09090f]">
                <pre className="!m-0 !p-0 !bg-transparent !border-0">
                  <code className={`language-${(category || 'javascript').toLowerCase()} !text-sm !font-mono !leading-loose !font-black !text-[#a78bfa]`}>
                    {code}
                  </code>
                </pre>
              </div>
            </div>
          );
        }
        
        // Handle regular text segments
        return (
          <span key={index} className="text-gray-100 font-medium">
            {part}
          </span>
        );
      })}
    </div>
  );
};

export default CodeQuestion;

