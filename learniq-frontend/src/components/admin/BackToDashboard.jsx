import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const BackToDashboard = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/admin/dashboard")}
      className="flex items-center gap-2 px-8 py-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all text-slate-400 hover:text-white group shrink-0 shadow-sm"
    >
      <ArrowUpRight size={14} className="group-hover:rotate-45 transition-transform" />
      <span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
    </button>
  );
};

export default BackToDashboard;
