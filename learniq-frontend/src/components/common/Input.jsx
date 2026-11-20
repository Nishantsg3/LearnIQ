import React, { useId } from 'react';

/**
 * LearnIQ Standard Text Input Component
 * Features high-contrast dark/light focus rings, accessible label & error bindings,
 * leading icon support, and subtle shadow depth.
 */
export const Input = React.forwardRef(({
  label,
  error,
  hint,
  icon: Icon,
  rightElement,
  size = 'md',
  className = '',
  id: explicitId,
  disabled = false,
  required = false,
  type = 'text',
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = explicitId || generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const sizeClasses = {
    sm: 'py-1.5 text-xs rounded-lg',
    md: 'py-2.5 text-sm rounded-xl'
  }[size] || 'py-2.5 text-sm rounded-xl';

  const paddingClasses = Icon
    ? (rightElement ? 'pl-10 pr-10' : 'pl-10 pr-4')
    : (rightElement ? 'pl-4 pr-10' : 'px-4');

  const borderClasses = error
    ? 'border-rose-400 dark:border-rose-600 focus:border-rose-600 dark:focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15'
    : 'border-slate-300 dark:border-[#2b303c] focus:border-violet-600 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/15 hover:border-slate-400 dark:hover:border-[#3d4454]';

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-tight"
        >
          {label}
          {required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500" aria-hidden="true">
            <Icon size={size === 'sm' ? 14 : 16} />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : (hint ? hintId : undefined)}
          className={`w-full bg-white dark:bg-[#111318] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border shadow-2xs outline-none transition-all duration-150 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:cursor-not-allowed ${sizeClasses} ${paddingClasses} ${borderClasses} ${className}`}
          {...props}
        />

        {rightElement && (
          <div className="absolute right-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[11px] text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
