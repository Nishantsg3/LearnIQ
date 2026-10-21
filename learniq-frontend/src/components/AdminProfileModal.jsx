import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Save, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminProfileModalContent = ({ user, updateUser, onClose }) => {
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState(user?.avatar || null);

  const modalRef = useRef(null);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const timer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus?.();
    };
  }, [onClose]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate slight delay for premium feel
    await new Promise(resolve => setTimeout(resolve, 800));

    updateUser({
      name,
      avatar: previewImage
    });

    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Card - Apple Sheet Material & Spring Motion (§12, §4) */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-profile-title"
        className="relative z-[110] bg-[#101017]/95 backdrop-blur-2xl border border-white/12 rounded-[1.75rem] w-full max-w-md overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_32px_80px_rgba(0,0,0,0.85)] transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] animate-in zoom-in-95"
      >
        {/* Subtle Light Catch Top Edge */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

        {/* Header */}
        <div className="p-6 border-b border-white/[0.08] flex items-center justify-between">
          <h2 id="admin-profile-title" className="text-sm font-semibold text-white tracking-tight">Identity Profile</h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close profile modal"
            className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-22 h-22 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-violet-500/50 shadow-md">
                {previewImage ? (
                  <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="text-white/30" size={36} />
                )}

                <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-xs">
                  <Camera className="text-white" size={22} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center border-2 border-[#101017] shadow-sm">
                <Camera size={11} className="text-white" />
              </div>
            </div>
            <p className="text-[11px] font-medium text-white/60 tracking-normal mt-3">Profile Photo</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-white/70 tracking-wider uppercase ml-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm placeholder:text-white/40 outline-none focus:border-violet-500/60 focus:bg-white/[0.07] transition-all duration-150"
                placeholder="Your Name"
                required
              />
            </div>
          </div>

          {/* Actions */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 flex items-center justify-center gap-2.5 text-white font-semibold text-sm tracking-tight transition-all active:scale-[0.98] shadow-lg shadow-violet-600/25 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const AdminProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  if (!isOpen) return null;
  return <AdminProfileModalContent user={user} updateUser={updateUser} onClose={onClose} />;
};

export default AdminProfileModal;
