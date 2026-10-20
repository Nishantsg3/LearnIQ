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
      
      {/* Modal Content */}
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        className="relative w-full max-w-md bg-[#0d0d12] border border-white/10 rounded-[2rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header Glow */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
        
        <div className="p-8">
          {/* Close Icon */}
          <button 
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          >
            <X size={18} />
          </button>

          {/* Icon Section */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-rose-500/10 rounded-full border border-rose-500/20 text-rose-500">
              <AlertTriangle size={32} />
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center space-y-3 mb-8">
            <h2 id="confirm-modal-title" className="text-xl font-black text-white uppercase tracking-[0.1em] italic">
              {title || "Confirm Action"}
            </h2>
            <p id="confirm-modal-description" className="text-xs font-semibold text-white/70 leading-relaxed max-w-sm mx-auto">
              {message}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              ref={cancelBtnRef}
              onClick={onClose}
              className="btn-secondary flex-1 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="btn-danger flex-[2] py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
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
