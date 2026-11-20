import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * LearnIQ Standard Select Component
 * Features custom chevron indicator, adequate right padding, dark/light contrast options,
 * and accessible label & error handling.
 */
export const Select = React.forwardRef(({
  label,
  error,
  hint,
  options = [],
  placeholder,
  icon: Icon,
  size = 'md',
  className = '',
  id: explicitId,
  disabled = false,
  required = false,
  value,
  onChange,
  children,
  ...props
}, ref) => {
  const generatedId = useId();
  const selectId = explicitId || generatedId;
  const errorId = `${selectId}-error`;
  const hintId = `${selectId}-hint`;

  const sizeClasses = {
    sm: 'h-9 py-1 text-xs rounded-lg',
    md: 'h-11 py-2 text-sm rounded-xl'
  }[size] || 'h-11 py-2 text-sm rounded-xl';

  const paddingLeft = Icon ? 'pl-10' : 'pl-3.5';

  const borderClasses = error
    ? 'border-rose-400 dark:border-rose-600 focus:border-rose-600 dark:focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15'
    : 'border-slate-300 dark:border-[#2b303c] focus:border-violet-600 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/15 hover:border-slate-400 dark:hover:border-[#3d4454]';

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-tight"
        >
          {label}
          {required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative flex items-center group">
        {Icon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500" aria-hidden="true">
            <Icon size={size === 'sm' ? 14 : 16} />
          </div>
        )}

        <select
          ref={ref}
          id={selectId}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : (hint ? hintId : undefined)}
          className={`w-full bg-white dark:bg-[#111318] text-slate-900 dark:text-slate-100 border shadow-2xs outline-none transition-all duration-150 cursor-pointer appearance-none pr-10 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:cursor-not-allowed ${sizeClasses} ${paddingLeft} ${borderClasses} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-slate-400 dark:text-slate-500 dark:bg-[#1c2027]">
              {placeholder}
            </option>
          )}

          {options && options.length > 0 ? (
            options.map((opt) => {
              if (typeof opt === 'object' && opt !== null) {
                return (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    className="dark:bg-[#1c2027] text-slate-900 dark:text-slate-100"
                  >
                    {opt.label || opt.value}
                  </option>
                );
              }
              return (
                <option key={opt} value={opt} className="dark:bg-[#1c2027] text-slate-900 dark:text-slate-100">
                  {opt}
                </option>
              );
            })
          ) : (
            children
          )}
        </select>

        {/* Custom Chevron Indicator */}
        <div className="absolute right-3.5 flex items-center pointer-events-none text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-200 transition-colors" aria-hidden="true">
          <ChevronDown size={size === 'sm' ? 14 : 16} />
        </div>
      </div>

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

Select.displayName = 'Select';
export default Select;
