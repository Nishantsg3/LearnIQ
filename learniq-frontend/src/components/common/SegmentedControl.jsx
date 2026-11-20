import React from 'react';

/**
 * LearnIQ Segmented Control Component
 * High-craft tab/segmented toggle with keyboard navigation, active pill elevation,
 * and high-contrast dark/light theme fidelity.
 */
export const SegmentedControl = ({
  options = [],
  value,
  onChange,
  size = 'md',
  className = '',
  ariaLabel = 'View switcher',
  disabled = false
}) => {
  const handleKeyDown = (e, index) => {
    if (disabled || !options.length) return;
    let nextIndex = index;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % options.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + options.length) % options.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = options.length - 1;
    }

    if (nextIndex !== index && options[nextIndex]) {
      onChange(options[nextIndex].value);
    }
  };

  const sizeClasses = {
    sm: 'p-0.5 text-xs rounded-lg',
    md: 'p-1 text-xs rounded-xl'
  }[size] || 'p-1 text-xs rounded-xl';

  const itemSizeClasses = {
    sm: 'px-2.5 py-1 text-[11px] rounded-md',
    md: 'px-3.5 py-1.5 text-xs rounded-lg'
  }[size] || 'px-3.5 py-1.5 text-xs rounded-lg';

  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`inline-flex items-center bg-slate-100 dark:bg-[#111318] border border-slate-200/80 dark:border-[#262a33] gap-0.5 select-none ${sizeClasses} ${className}`}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled || option.disabled}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => !disabled && !option.disabled && onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`inline-flex items-center justify-center gap-1.5 font-semibold transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${itemSizeClasses} ${
              isSelected
                ? 'bg-white dark:bg-[#1c2027] text-slate-900 dark:text-white shadow-2xs font-bold border border-slate-200/60 dark:border-[#323846]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
            }`}
          >
            {Icon && <Icon size={iconSize} className="shrink-0" aria-hidden="true" />}
            <span>{option.label}</span>
            {option.badge !== undefined && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                isSelected
                  ? 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'
                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedControl;
