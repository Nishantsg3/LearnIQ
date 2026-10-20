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
      
      {/* Modal Card */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-profile-title"
        className="relative z-[110] bg-[#111118] border border-white/5 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 id="admin-profile-title" className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Identity Synchronization</h2>
          <button 
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close profile modal"
            className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-[#7c3aed]/50 shadow-2xl">
                {previewImage ? (
                  <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="text-white/20" size={40} />
                )}
                
                <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="text-white" size={24} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#7c3aed] flex items-center justify-center border-2 border-[#111118]">
                <Camera size={12} className="text-white" />
              </div>
            </div>
            <p className="text-[9px] font-black text-[#9ca3af] uppercase tracking-widest mt-4">Update Profile Avatar</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-[#9ca3af] uppercase tracking-[0.2em] ml-1">Universal Display Name</label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-6 py-3 bg-[#0a0a0f] border border-white/5 rounded-full text-white text-xs placeholder:text-white/50 outline-none focus:border-[#7c3aed]/50 transition-all duration-200"
                placeholder="Identity Reference"
                required
              />
            </div>
          </div>

          {/* Actions */}
          <button 
            type="submit"
            disabled={isSaving}
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
            className="w-full py-4 rounded-full flex items-center justify-center gap-3 text-white font-black uppercase text-[11px] tracking-[0.3em] transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Synchronizing...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Confirm Changes</span>
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
