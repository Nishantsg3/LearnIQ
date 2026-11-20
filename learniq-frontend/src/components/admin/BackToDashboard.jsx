import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BackToDashboard = ({ to = "/admin/dashboard", label = "Dashboard", className = "" }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      aria-label={`Return to ${label}`}
      className={`inline-flex items-center justify-center gap-2 h-[44px] min-h-[44px] max-h-[44px] px-4 rounded-xl bg-white dark:bg-[#151921] border-2 border-slate-300 dark:border-white/20 hover:border-violet-500 dark:hover:border-violet-400 hover:bg-slate-50 dark:hover:bg-[#1f232b] text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 shrink-0 group active:scale-[0.96] apple-tactile-btn cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 ${className}`}
    >
      <ArrowLeft size={14} className="shrink-0 text-slate-400 dark:text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-100 transition-colors duration-150 group-hover:-translate-x-0.5" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
};

export default React.memo(BackToDashboard);
