import React, { useId } from 'react';

/**
 * LearnIQ Standard Textarea Component
 * Multi-line input with consistent dark/light styling, focus rings, character count, and accessible error/hint states.
 */
export const Textarea = React.forwardRef(({
  label,
  error,
  hint,
  rows = 4,
  maxLength,
  showCount = false,
  value,
  className = '',
  id: explicitId,
  disabled = false,
  required = false,
  ...props
}, ref) => {
  const generatedId = useId();
  const textareaId = explicitId || generatedId;
  const errorId = `${textareaId}-error`;
  const hintId = `${textareaId}-hint`;

  const borderClasses = error
    ? 'border-rose-400 dark:border-rose-600 focus:border-rose-600 dark:focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15'
    : 'border-slate-300 dark:border-[#2b303c] focus:border-violet-600 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/15 hover:border-slate-400 dark:hover:border-[#3d4454]';

  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-tight"
          >
            {label}
            {required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}

        {showCount && maxLength && (
          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
            {currentLength} / {maxLength}
          </span>
        )}
      </div>

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        maxLength={maxLength}
        value={value}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : (hint ? hintId : undefined)}
        className={`w-full px-4 py-2.5 bg-white dark:bg-[#111318] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border rounded-xl shadow-2xs outline-none transition-all duration-150 text-sm leading-relaxed disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:cursor-not-allowed resize-y ${borderClasses} ${className}`}
        {...props}
      />

      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[11px] text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;
