import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const BackToDashboard = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/admin/dashboard")}
      className="shrink-0 h-9 px-4 flex items-center gap-2 bg-white/5 border border-white/10 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap group"
    >
      <ArrowUpRight size={14} className="group-hover:rotate-45 transition-transform shrink-0" />
      <span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
    </button>
  );
};

export default BackToDashboard;
