import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Bookmark, Send, X } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm Deletion",
  cancelText = "Cancel",
  confirmVariant = "danger",
  stats = null,
  children = null
}) => {
  const modalRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save triggering element to restore focus on dismiss
    previousFocusRef.current = document.activeElement;

    // Lock background scrolling while dialog is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus Cancel button (safe default for destructive operations)
    const timer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return;
        const focusable = modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      // Restore focus to previous triggering element
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const isPrimary = confirmVariant === 'primary' || confirmVariant === 'submit';
  const isSuccess = confirmVariant === 'success';

  const confirmBtnClasses = isPrimary
    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border border-violet-500/30 focus-visible:ring-violet-500 shadow-skeuo dark:shadow-skeuo-dark'
    : isSuccess
    ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white border border-emerald-500/30 focus-visible:ring-emerald-500 shadow-skeuo dark:shadow-skeuo-dark'
    : 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white border border-rose-500/30 focus-visible:ring-rose-500 shadow-skeuo dark:shadow-skeuo-dark';

  return createPortal(
    <div className="fixed inset-0 z-[100] !m-0 flex items-center justify-center p-4">
      {/* Backdrop: deep tinted backdrop that subordinates background elements */}
      <div
        className="fixed inset-0 z-40 !m-0 bg-slate-900/40 dark:bg-black/75 backdrop-blur-xs sm:backdrop-blur-sm transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card with elevated surface (#ffffff light, #1a1f2b dark) */}
      <div
        ref={modalRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        className="relative z-50 w-full max-w-md max-h-[90dvh] overflow-y-auto bg-white dark:bg-[#1a1f2b] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl animate-apple-modal isolate"
      >
        <div className="p-6 sm:p-7">
          {/* Close Icon */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close confirmation dialog"
            className="absolute top-3.5 right-3.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#202736] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 cursor-pointer"
          >
            <X size={18} aria-hidden="true" />
          </button>

          {/* Icon Section */}
          <div className="flex justify-center mb-4">
            {stats ? (
              <div className="w-12 h-12 bg-violet-50 dark:bg-violet-950/50 rounded-2xl border border-violet-200/80 dark:border-violet-900/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-xs">
                <Send size={22} aria-hidden="true" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/50 rounded-2xl border border-rose-200/80 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
                <AlertTriangle size={24} aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Text Content with WCAG AA compliant text contrast */}
          <div className="text-center space-y-2 mb-5">
            <h2 id="confirm-modal-title" className="text-lg sm:text-xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
              {title || "Confirm Action"}
            </h2>
            <p id="confirm-modal-description" className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
              {message}
            </p>
          </div>

          {/* Optional Test Answer Telemetry Stats Breakdown */}
          {stats && (
            <div className="mb-6 space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center tabular-nums">
                {/* Answered */}
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50">
                  <div className="flex items-center justify-center gap-1 text-emerald-700 dark:text-emerald-400 mb-1">
                    <CheckCircle2 size={13} aria-hidden="true" />
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Answered</span>
                  </div>
                  <span className="text-xl font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    {stats.answered ?? 0}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-mono">
                    of {stats.total ?? 0}
                  </span>
                </div>

                {/* Marked for Review */}
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50">
                  <div className="flex items-center justify-center gap-1 text-amber-700 dark:text-amber-400 mb-1">
                    <Bookmark size={13} aria-hidden="true" />
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Marked</span>
                  </div>
                  <span className="text-xl font-mono font-bold text-amber-700 dark:text-amber-300">
                    {stats.marked ?? 0}
                  </span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-mono">
                    review flag
                  </span>
                </div>

                {/* Unanswered / Skipped */}
                <div className={`p-3 rounded-xl border ${
                  (stats.unanswered ?? 0) > 0
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/50 text-rose-700 dark:text-rose-300'
                    : 'bg-slate-50 dark:bg-[#161b24] border-slate-200 dark:border-[#232936] text-slate-600 dark:text-slate-400'
                }`}>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <AlertTriangle size={13} aria-hidden="true" className={(stats.unanswered ?? 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'} />
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Unanswered</span>
                  </div>
                  <span className={`text-xl font-mono font-bold ${(stats.unanswered ?? 0) > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-700 dark:text-slate-300'}`}>
                    {stats.unanswered ?? 0}
                  </span>
                  <span className="text-[10px] block font-mono opacity-80">
                    remaining
                  </span>
                </div>
              </div>

              {/* Status Notice Banner */}
              {(stats.unanswered ?? 0) > 0 ? (
                <div className="p-2.5 rounded-lg bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300/70 dark:border-amber-800/50 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                  <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
                  <span>You have <strong>{stats.unanswered}</strong> unanswered question(s). You cannot modify responses after submission.</span>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-300/70 dark:border-emerald-800/50 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>All <strong>{stats.total}</strong> questions have been answered. Responses are verified and ready for scoring.</span>
                </div>
              )}
            </div>
          )}

          {children}

          {/* Action Buttons with 44px min touch target and tactile skeuomorphic depth */}
          <div className="flex gap-3">
            <button
              ref={cancelBtnRef}
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-200 dark:border-[#232936] hover:border-slate-400 dark:hover:border-[#323849] bg-white dark:bg-[#13171f] hover:bg-slate-50 dark:hover:bg-[#1c2230] text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 transition-all active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 cursor-pointer flex items-center justify-center shadow-xs dark:shadow-skeuo-dark"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.96] apple-shimmer-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer flex items-center justify-center ${confirmBtnClasses}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
