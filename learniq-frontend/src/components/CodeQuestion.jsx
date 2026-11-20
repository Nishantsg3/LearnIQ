import React, { useEffect } from 'react';
import Prism from '../utils/prism-setup';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';

const CodeQuestion = ({ text = '', category = 'Code', className = "", textClassName = "text-[#090d16] dark:text-slate-100 font-semibold" }) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [text]);

  if (!text) return null;

  // Split text by code blocks (triple backticks or single backticks)
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g);

  return (
    <div className={`leading-relaxed ${className}`}>
      {parts.map((part, index) => {
        let code = null;
        let isBlock = false;

        if (part.startsWith('```') && part.endsWith('```')) {
          code = part.slice(3, -3);
          const firstLineBreak = code.indexOf('\n');
          if (firstLineBreak !== -1) {
            const firstLine = code.slice(0, firstLineBreak).trim();
            if (/^[a-zA-Z0-9_+#.-]+$/.test(firstLine)) {
              code = code.slice(firstLineBreak + 1);
            }
          }
          isBlock = true;
        } else if (part.startsWith('`') && part.endsWith('`')) {
          code = part.slice(1, -1);
          isBlock = code.includes('\n');
        }

        if (code !== null) {
          if (!isBlock) {
            return (
              <code key={index} className="mx-1 px-2 py-0.5 bg-violet-50/80 dark:bg-violet-950/40 border border-violet-200/80 dark:border-violet-900/40 rounded-md text-violet-700 dark:text-violet-300 font-mono text-[13px] font-semibold shadow-xs inline-block align-baseline">
                {code}
              </code>
            );
          }

          return (
            <div key={index} className="my-5 bg-[#111318] border border-[#262a33] rounded-xl overflow-hidden shadow-lg">
              {/* IDE Header Strip */}
              <div className="px-4 py-2.5 bg-white/5 border-b border-white/10 flex items-center justify-between backdrop-blur-md">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/90"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/90"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/90"></div>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">{category || 'Code'}</span>
                </div>
              </div>
              {/* Code Content */}
              <div className="p-5 overflow-x-auto custom-scrollbar bg-[#111318]">
                <pre className="!m-0 !p-0 !bg-transparent !border-0">
                  <code className={`language-${(category || 'javascript').toLowerCase()} !text-sm !font-mono !leading-relaxed !font-medium !text-slate-100`}>
                    {code}
                  </code>
                </pre>
              </div>
            </div>
          );
        }

        // Handle regular text segments with high contrast dark text
        return (
          <span key={index} className={textClassName}>
            {part}
          </span>
        );
      })}
    </div>
  );
};

export default CodeQuestion;
