import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, Save, User, ShieldCheck, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminProfileModalContent = ({ user, updateUser, onClose, onSave }) => {
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState(user?.avatar || null);

  const modalRef = useRef(null);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus();
      }
    };
  }, [onClose]);

  const [saveError, setSaveError] = useState('');

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = 256;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');

          // Center crop to square
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
          try {
            // Compressed webp ~20-30KB
            const dataUrl = canvas.toDataURL('image/webp', 0.82);
            resolve(dataUrl);
          } catch {
            // Fallback to jpeg ~25-35KB
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve(dataUrl);
          }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setSaveError('');
      try {
        const compressed = await compressImage(file);
        setPreviewImage(compressed);
      } catch (err) {
        console.error('Failed to compress avatar image:', err);
        setSaveError('Failed to process image. Please try another image file.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError('');

    try {
      if (typeof updateUser === 'function') {
        await updateUser({
          name,
          avatar: previewImage
        });
      }

      if (typeof onSave === 'function') {
        onSave({ name, avatar: previewImage });
      }
      onClose();
    } catch (err) {
      setSaveError(err.response?.data?.message || err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="fixed inset-0 z-[100] !m-0 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-40 !m-0 bg-slate-950/70 dark:bg-black/80 backdrop-blur-md transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-profile-title"
        aria-describedby="admin-profile-desc"
        className="relative z-50 bg-white dark:bg-[#1a1f2b] border border-slate-200/90 dark:border-[#232936] text-slate-900 dark:text-slate-100 rounded-2xl w-full max-w-md max-h-[90dvh] overflow-y-auto shadow-2xl animate-apple-modal"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-[#232936] flex items-center justify-between">
          <div>
            <h2 id="admin-profile-title" className="text-lg font-serif font-bold text-slate-900 dark:text-slate-100">
              {isAdmin ? 'Faculty Profile' : 'Candidate Profile'}
            </h2>
            <p id="admin-profile-desc" className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {isAdmin ? 'Manage your faculty credentials and avatar' : 'Manage your candidate identity and avatar'}
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close profile modal"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-[#252a34] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className={`w-20 h-20 rounded-2xl bg-slate-100 dark:bg-[#151921] border border-slate-200 dark:border-[#2b3240] flex items-center justify-center overflow-hidden transition-all shadow-xs ${isAdmin ? 'group-hover:border-violet-500/50' : 'group-hover:border-indigo-500/50'}`}>
                {previewImage ? (
                  <img src={previewImage} alt="Profile preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="text-slate-400" size={32} />
                )}

                <label className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                  <Camera className="text-white" size={20} />
                  <span className="sr-only">Upload profile picture</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-[#1c2027] text-white shadow-xs ${isAdmin ? 'bg-violet-600' : 'bg-indigo-600'}`}>
                <Camera size={11} aria-hidden="true" />
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">
              {isAdmin ? 'Faculty Portrait' : 'Scholar Portrait'}
            </p>
          </div>

          {/* Identity Metadata Box */}
          <div className="rounded-xl p-3 bg-slate-50 dark:bg-[#151921] border border-slate-200/80 dark:border-[#2b3240] text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
                <ShieldCheck size={12} className={isAdmin ? "text-violet-600 dark:text-violet-400" : "text-indigo-600 dark:text-indigo-400"} />
                Role
              </span>
              <span className={`font-mono text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                isAdmin
                  ? 'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/40'
                  : 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/40'
              }`}>
                {isAdmin ? 'ADMINISTRATOR' : 'CANDIDATE'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-[#2b3240]">
              <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
                <Mail size={12} className="text-slate-400" />
                Registered Email
              </span>
              <span className="font-mono text-[11px] text-slate-900 dark:text-slate-100 truncate max-w-[200px]" title={user?.email || '—'}>
                {user?.email || '—'}
              </span>
            </div>
          </div>

          {/* Form Fields */}
          <div>
            <label htmlFor="admin-display-name" className="block text-xs font-mono font-semibold uppercase tracking-wider text-academy-ink-secondary mb-2">
              Display Name
            </label>
            <input
              id="admin-display-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-base text-xs font-medium min-h-[44px] px-3.5 py-2.5 w-full"
              placeholder="Your Full Name"
              required
            />
          </div>

          {saveError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {saveError}
            </div>
          )}

          {/* Actions */}
          <button
            type="submit"
            disabled={isSaving}
            className={`w-full min-h-[44px] py-2.5 px-4 rounded-xl text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 cursor-pointer disabled:opacity-60 apple-shimmer-btn active:scale-[0.96] ${
              isAdmin
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 focus-visible:ring-violet-500 shadow-violet-500/25'
                : 'bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 focus-visible:ring-indigo-500 shadow-indigo-500/25'
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save size={15} aria-hidden="true" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const AdminProfileModal = ({ isOpen, onClose, user: propUser, onSave }) => {
  const { user: authUser, updateUser } = useAuth();
  const activeUser = propUser || authUser;
  if (!isOpen || typeof document === 'undefined') return null;
  return createPortal(
    <AdminProfileModalContent
      user={activeUser}
      updateUser={updateUser}
      onClose={onClose}
      onSave={onSave}
    />,
    document.body
  );
};

export default AdminProfileModal;
