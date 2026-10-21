import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm Deletion", cancelText = "Cancel" }) => {
  const modalRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save triggering element to restore focus on dismiss
    previousFocusRef.current = document.activeElement;

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
      window.removeEventListener('keydown', handleKeyDown);
      // Restore focus to previous triggering element
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Translucent Dimming Backdrop Scrim */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content - Apple Material Sheet (§12) & Spring Timing (§4) */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        className="relative w-full max-w-md bg-[#101017]/95 backdrop-blur-2xl border border-white/12 rounded-[1.75rem] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_32px_80px_rgba(0,0,0,0.85)] overflow-hidden transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] animate-in zoom-in-95"
      >
        {/* Subtle Light Catch Top Edge */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />

        <div className="p-7 sm:p-8">
          {/* Close Icon */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 active:scale-95"
          >
            <X size={18} />
          </button>

          {/* Icon Section */}
          <div className="flex justify-center mb-5">
            <div className="p-3.5 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-400 shadow-sm">
              <AlertTriangle size={28} />
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center space-y-2.5 mb-7">
            <h2 id="confirm-modal-title" className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {title || "Confirm Action"}
            </h2>
            <p id="confirm-modal-description" className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed max-w-sm mx-auto">
              {message}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              ref={cancelBtnRef}
              onClick={onClose}
              className="btn-secondary flex-1 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 active:scale-[0.97]"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="btn-danger flex-[1.4] py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 active:scale-[0.97]"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
