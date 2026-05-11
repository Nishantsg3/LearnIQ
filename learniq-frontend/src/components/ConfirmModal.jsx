import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm Deletion", cancelText = "Cancel" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-transparent animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      {/* Modal Content */}
      <div 
        className="relative w-full max-w-md bg-[#0d0d12] border border-white/10 rounded-[2rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-300"
      >
        {/* Header Glow */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
        
        <div className="p-8">
          {/* Close Icon */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          {/* Icon Section */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-rose-500/10 rounded-full border border-rose-500/20 text-rose-500">
              <AlertTriangle size={32} />
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center space-y-3 mb-8">
            <h2 className="text-xl font-black text-white uppercase tracking-[0.2em] italic">
              {title || "Confirm Action"}
            </h2>
            <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
              {message}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary flex-1 py-4"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="btn-danger flex-[2] py-4"
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
