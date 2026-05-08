import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Mail,
  Hash,
  Loader2,
  ShieldCheck,
  ShieldX,
  Info,
  RotateCw,
  Award,
  BookOpen,
  Zap,
  BarChart3,
  X,
  Database,
  Calendar
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import BackToDashboard from '../components/admin/BackToDashboard';
import ConfirmModal from '../components/ConfirmModal';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/students');
      const userList = Array.isArray(res.data) ? res.data : (res.data.users || []);
      setStudents(userList);
    } catch (err) {
      toast.error('Failed to load student directory');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students
      .filter(s =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, searchTerm]);

  const getGradient = (name) => {
    const gradients = [
      'from-violet-600 to-indigo-600',
      'from-emerald-600 to-teal-600',
      'from-rose-600 to-pink-600',
      'from-amber-600 to-orange-600',
      'from-blue-600 to-cyan-600'
    ];
    const index = (name?.charCodeAt(0) || 0) % gradients.length;
    return gradients[index];
  };

  const formatDate = (student) => {
    // 1. Prioritize real database timestamps
    const fields = ['createdAt', 'created_at', 'joinedAt', 'registrationDate', 'date', 'updatedAt'];
    for (const f of fields) {
      if (student[f]) {
        const d = new Date(student[f]);
        if (!isNaN(d.getTime())) return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }
    
    // 2. Derive from MongoDB ObjectId (This is the underlying "True" creation date)
    if (student.id && student.id.length === 24 && /^[0-9a-fA-F]+$/.test(student.id)) {
      const timestamp = parseInt(student.id.substring(0, 8), 16) * 1000;
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    return "Sync Pending";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Synchronizing Registry...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pr-2 custom-scrollbar p-10">
      <div className="animate-in fade-in duration-700 space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
          <div className="space-y-1">
            <h1 className="text-xl font-black text-white uppercase tracking-[0.2em]">Student Directory</h1>
            <p className="text-white/20 text-[9px] font-bold uppercase tracking-[0.3em]">Governance & User Access</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={fetchStudents}
              className="px-5 py-4 bg-white/5 hover:bg-white/10 text-white/40 border border-white/10 rounded-2xl transition-all group shrink-0"
              title="Refresh Directory"
            >
              <RotateCw size={14} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
            </button>
            <div className="relative group hidden lg:block">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-violet-500 transition-colors" />
              <input
                type="text"
                placeholder="SEARCH REGISTRY..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#0f0f14] border border-white/5 rounded-2xl pl-10 pr-4 py-4 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-violet-500/30 transition-all w-64 placeholder:text-white/5"
              />
            </div>
            <BackToDashboard />
          </div>
        </div>

        {/* Stats Quickbar - DETERMINISTIC ONLY */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="px-6 py-5 bg-[#0a0a0f] border border-white/5 rounded-2xl flex items-center gap-5 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Users size={18} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Total Students</p>
              <p className="text-lg font-black text-white tabular-nums tracking-tighter mt-0.5">{students.length}</p>
            </div>
          </div>
        </div>

        {/* Main Table Container */}
        <div className="bg-[#0a0a0f] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-black/20 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Identity</th>
                  <th className="px-6 py-4 text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Email Address</th>
                  <th className="px-6 py-4 text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Role</th>
                  <th className="px-6 py-4 text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Registration</th>
                  <th className="px-6 py-4 text-[9px] font-black text-white/30 uppercase tracking-[0.2em] text-center">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                  <tr key={student.id} className="group hover:bg-white/[0.01] transition-all duration-300">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getGradient(student.name)} flex items-center justify-center text-sm font-black text-white shadow-lg group-hover:scale-105 transition-transform`}>
                          {student.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-white uppercase tracking-widest">{student.name}</span>
                          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-0.5">Candidate Signature</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-black text-white/40 group-hover:text-white/60 transition-colors lowercase tracking-wider">{student.email}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={10} className="text-violet-500/50" />
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                          Student
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-black text-white/20 tabular-nums tracking-widest">
                        {formatDate(student)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="p-2.5 bg-white/5 text-white/20 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        title="View Profile"
                      >
                        <Info size={14} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-32 text-center">
                      <div className="flex flex-col items-center justify-center space-y-6 opacity-10">
                        <Users size={40} strokeWidth={1} />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white">No profiles match selection</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* STUDENT PROFILE MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedStudent(null)} />
          <div className="relative w-full max-w-xl bg-[#0a0a0f] border border-white/10 rounded-[2.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className={`h-32 bg-gradient-to-br ${getGradient(selectedStudent.name)} relative`}>
              <button
                onClick={() => setSelectedStudent(null)}
                className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all"
              >
                <X size={16} />
              </button>
              <div className="absolute -bottom-10 left-10 p-1 bg-[#0a0a0f] rounded-3xl">
                <div className={`w-20 h-20 rounded-[1.25rem] bg-gradient-to-br ${getGradient(selectedStudent.name)} flex items-center justify-center text-3xl font-black text-white shadow-2xl`}>
                  {selectedStudent.name?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            <div className="pt-16 pb-8 px-10">
              <div className="flex items-start justify-between mb-8">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{selectedStudent.name}</h2>
                </div>
                <div className="px-4 py-1.5 rounded-full border bg-emerald-500/10 border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest">
                  Account Active
                </div>
              </div>

              {/* Bio List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <Mail size={14} className="text-white/20" />
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Email Identity</span>
                  </div>
                  <span className="text-[11px] font-bold text-white/80">{selectedStudent.email}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <Calendar size={14} className="text-white/20" />
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Registration Date</span>
                  </div>
                  <span className="text-[11px] font-bold text-white/80">
                    {formatDate(selectedStudent)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={14} className="text-white/20" />
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Access Privilege</span>
                  </div>
                  <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest">Standard Student</span>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white/40 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Close Profile
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-[2] py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
                >
                  Delete Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          try {
            await api.delete(`/admin/students/${selectedStudent.id}`);
            toast.success('Student account purged');
            setSelectedStudent(null);
            fetchStudents();
          } catch (err) {
            toast.error(err.response?.data?.message || 'Deletion failed');
          }
        }}
        title="Delete Profile?"
        message={`Are you sure you want to PERMANENTLY DELETE ${selectedStudent?.name}? This will also erase all their test attempts and history.`}
        confirmText="Purge Account"
      />
    </div>
  );
};

export default AdminStudents;
