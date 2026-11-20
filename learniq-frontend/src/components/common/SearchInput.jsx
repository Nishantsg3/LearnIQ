import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * LearnIQ Search Input Component
 * Built-in search icon, optional instant clear button (X), and high-contrast styling.
 */
export const SearchInput = React.forwardRef(({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  size = 'md',
  className = '',
  disabled = false,
  ariaLabel = 'Search',
  ...props
}, ref) => {
  const hasValue = Boolean(value && String(value).length > 0);

  const handleClear = (e) => {
    e.preventDefault();
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
  };

  const sizeClasses = {
    sm: 'py-1.5 text-xs rounded-lg pl-8 pr-7',
    md: 'py-2.5 text-sm rounded-xl pl-10 pr-9'
  }[size] || 'py-2.5 text-sm rounded-xl pl-10 pr-9';

  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <div className={`absolute flex items-center pointer-events-none text-slate-400 dark:text-slate-500 ${size === 'sm' ? 'left-2.5' : 'left-3.5'}`} aria-hidden="true">
        <Search size={iconSize} />
      </div>

      <input
        ref={ref}
        type="search"
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`w-full bg-white dark:bg-[#111318] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-[#2b303c] shadow-2xs outline-none transition-all duration-150 focus:border-violet-600 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/15 hover:border-slate-400 dark:hover:border-[#3d4454] disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses}`}
        {...props}
      />

      {hasValue && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search input"
          className={`absolute flex items-center justify-center rounded-md p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer ${size === 'sm' ? 'right-2' : 'right-2.5'}`}
        >
          <X size={iconSize - 2} />
        </button>
      )}
    </div>
  );
});

SearchInput.displayName = 'SearchInput';
export default SearchInput;
