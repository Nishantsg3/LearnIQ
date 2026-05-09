import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const BackToDashboard = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/admin/dashboard")}
      className="btn-secondary group"
    >
      <ArrowUpRight size={14} className="group-hover:rotate-45 transition-transform" />
      <span>Dashboard</span>
    </button>
  );
};

export default BackToDashboard;
