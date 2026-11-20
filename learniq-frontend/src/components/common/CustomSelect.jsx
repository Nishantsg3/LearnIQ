import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * CustomSelect — Accessible, custom-themed LearnIQ dropdown component.
 * Replaces native OS appearance with cohesive design system styling.
 *
 * Supports:
 * - Keyboard navigation (ArrowUp, ArrowDown, Enter, Space, Escape, Tab)
 * - ARIA listbox & option semantics
 * - Click outside detection
 */
const CustomSelect = ({
  id,
  value,
  onChange,
  options = [],
  icon: Icon,
  placeholder = "Select...",
  className = "",
  ariaLabel
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const listboxRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      const idx = options.findIndex(opt => opt.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const idx = options.findIndex(opt => opt.value === value);
        setHighlightedIndex(idx >= 0 ? idx : 0);
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % options.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + options.length) % options.length);
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (options[highlightedIndex]) {
        onChange(options[highlightedIndex].value);
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || placeholder}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#15181e] border border-slate-300/90 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 hover:-translate-y-0.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center justify-between gap-3 shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0e1015]"
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon size={14} className="text-violet-600 dark:text-violet-400 shrink-0" aria-hidden="true" />}
          <span className="truncate">{selectedOption?.label || placeholder}</span>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <ul
          ref={listboxRef}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={id}
          className="absolute z-50 mt-1.5 w-full min-w-[200px] rounded-xl bg-white dark:bg-[#15181e] border border-slate-300/90 dark:border-white/20 py-1.5 shadow-2xl shadow-slate-900/15 focus:outline-none max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in-80 zoom-in-95 duration-100"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightedIndex;

            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`px-3.5 py-2.5 text-xs sm:text-sm flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                  isHighlighted || isSelected
                    ? 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 font-normal hover:bg-slate-50 dark:hover:bg-[#1c2027]'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check size={14} className="text-violet-600 dark:text-violet-400 shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default CustomSelect;
