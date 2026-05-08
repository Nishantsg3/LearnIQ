import { useState, useEffect } from 'react';
import { 
  FileText, 
  Database, 
  Zap,
  Clock,
  Calendar,
  ChevronDown,
  LayoutDashboard,
  Loader2
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import BackToDashboard from '../components/admin/BackToDashboard';

const AdminTestEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clockMode, setClockMode] = useState('HOUR'); // 'HOUR' or 'MINUTE'
  const [showClock, setShowClock] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Java',
    totalQuestions: 10,
    duration: 10,
    testType: 'PRACTICE',
    startTime: ''
  });

  const categories = ["Java", "Python", "ASP.NET", "Aptitude", "DBMS", "Cloud"];

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/tests/${id}`);
        const test = res.data;
        setFormData({
          title: test.title,
          category: test.category,
          totalQuestions: test.questionCount,
          duration: test.durationMinutes,
          testType: test.testType,
          startTime: test.startTime ? test.startTime.slice(0, 16) : ''
        });
      } catch (err) {
        toast.error('Failed to load assessment data');
        navigate('/admin/tests');
      } finally {
        setLoading(false);
      }
    };
    fetchTestData();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Strict Rule Enforcement
    if (formData.testType === 'PRACTICE' && parseInt(formData.totalQuestions) !== parseInt(formData.duration)) {
      toast.error('SCHEMA VIOLATION: Duration must equal Question Count for Practice tests.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        category: formData.category,
        duration: parseInt(formData.duration),
        startTime: formData.testType === 'MAIN' ? formData.startTime : null
      };

      await api.put(`/tests/${id}`, payload);
      toast.success('Test updated successfully');
      navigate('/admin/tests');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Synchronization failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Loader2 className="w-12 h-12 text-[#7c3aed] animate-spin" />
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Loading Test Data...</p>
    </div>
  );

  const isMain = formData.testType === 'MAIN';

  return (
    <div className="animate-in fade-in duration-500" style={{ padding: '0.5rem 4rem', height: 'calc(100vh - 100px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* HEADER: TITLE + NAVIGATION */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-0.5">
              <div style={{ width: 4, height: 18, background: '#7c3aed', borderRadius: 4 }} />
              <h1 className="text-xl font-black text-white uppercase tracking-[0.2em] italic">Edit Test</h1>
            </div>
            <p className="text-[10px] text-white/30 ml-4 uppercase tracking-[0.3em] font-black">Update test details and settings</p>
          </div>
          <BackToDashboard />
        </div>

        {/* CORE CONFIGURATION ZONE */}
        <form onSubmit={handleSubmit} className="flex-1 grid grid-cols-[1.2fr_1fr] gap-4 mb-3" style={{ minHeight: 0 }}>
          
          {/* LEFT TRACK: CONFIGURATION */}
          <div 
            className="rounded-2xl border border-white/5 p-5 flex flex-col gap-4 relative"
            style={{ 
                background: 'rgba(15,15,20,0.4)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }}
          >
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/5 blur-[100px] pointer-events-none" />

            <div className="flex-1 pr-1">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Database size={14} className="text-violet-500" />
                  <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Test Details</h3>
                </div>

                <div className="group">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block ml-1 group-hover:text-violet-400/60 transition-colors">Assessment Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. JAVA INFRASTRUCTURE 2024"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[11px] text-white focus:outline-none focus:border-violet-500/50 placeholder:text-white/10 font-bold tracking-widest transition-all hover:bg-white/[0.07]"
                  />
                  <p className="text-[8px] text-white/10 mt-1.5 ml-1 uppercase tracking-widest font-black italic">Enter a unique test name</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block ml-1 group-hover:text-violet-400/60 transition-colors">Category</label>
                    <div className="relative group/select">
                      <div className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[11px] text-white/40 font-bold tracking-widest flex items-center justify-between">
                         <span>{formData.category}</span>
                         <span className="text-[8px] bg-white/5 px-2 py-0.5 rounded text-white/20 border border-white/5">LOCKED</span>
                      </div>
                    </div>
                  </div>
                  <div className="group">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block ml-1 group-hover:text-violet-400/60 transition-colors">Test Mode</label>
                    <div className="relative group/select">
                      <div className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[11px] text-white/40 font-bold tracking-widest flex items-center justify-between">
                         <span>{formData.testType} MODE</span>
                         <span className="text-[8px] bg-white/5 px-2 py-0.5 rounded text-white/20 border border-white/5">LOCKED</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border transition-all duration-500 ${formData.testType === 'MAIN' ? 'bg-orange-500/5 border-orange-500/20' : 'bg-violet-500/5 border-violet-500/20'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1.5 rounded-lg ${formData.testType === 'MAIN' ? 'bg-orange-500/20' : 'bg-violet-500/20'}`}>
                      {formData.testType === 'MAIN' ? <Zap size={14} className="text-orange-400" /> : <Database size={14} className="text-violet-400" />}
                    </div>
                    <div>
                      <h4 className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${formData.testType === 'MAIN' ? 'text-orange-400' : 'text-violet-400'}`}>
                        {formData.testType === 'MAIN' ? 'Restricted Access' : 'Open Access'}
                      </h4>
                      <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                        {formData.testType === 'MAIN' 
                          ? 'Single attempt only. Results locked after submission.' 
                          : 'Students can attempt this test multiple times.'}
                      </p>
                    </div>
                  </div>
                </div>

                {isMain && (
                  <div className="pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar size={12} className="text-violet-500" />
                      <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Scheduling</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative group">
                          <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1.5 block ml-1">Calendar</label>
                          <button 
                            type="button"
                            onClick={() => setShowCalendar(!showCalendar)}
                            className="w-full px-4 py-2.5 bg-[#1a1a24] border border-violet-500/20 rounded-xl text-[11px] text-white flex items-center justify-between hover:border-violet-500/60 transition-all"
                          >
                            <span className={formData.startTime?.split('T')[0] ? 'text-white' : 'text-white/20'}>
                              {formData.startTime?.split('T')[0] ? new Date(formData.startTime.split('T')[0]).toLocaleDateString('en-GB') : 'DD / MM / YYYY'}
                            </span>
                            <Calendar size={12} className="text-violet-400" />
                          </button>
                          
                          {showCalendar && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setShowCalendar(false)} />
                              <div className="absolute bottom-full left-0 mb-2 p-3 bg-[#0f0f14] border border-white/5 rounded-2xl shadow-2xl z-50 animate-in zoom-in-95 duration-200 w-56">
                                <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 text-center">May 2026</div>
                                <div className="grid grid-cols-7 gap-1 mb-1">
                                  {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-[8px] font-black text-violet-500/40 text-center">{d}</div>)}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                  {Array.from({length: 5}).map((_, i) => <div key={`empty-${i}`} className="aspect-square" />)}
                                  {Array.from({length: 31}).map((_, i) => {
                                    const day = i + 1;
                                    const isSelected = formData.startTime?.split('T')[0]?.endsWith(`-${day.toString().padStart(2, '0')}`);
                                    return (
                                      <button
                                        key={day}
                                        type="button"
                                        onClick={() => {
                                          const time = formData.startTime?.split('T')[1] || '12:00';
                                          setFormData({...formData, startTime: `2026-05-${day.toString().padStart(2, '0')}T${time}`});
                                          setShowCalendar(false);
                                        }}
                                        className={`aspect-square flex items-center justify-center rounded-lg text-[9px] font-bold transition-all ${isSelected ? 'bg-violet-500 text-white shadow-[0_0_10px_rgba(124,58,237,0.4)]' : 'text-white/30 hover:bg-white/5 hover:text-white'}`}
                                      >
                                        {day}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="relative group">
                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1.5 block ml-1">Clock</label>
                            <button 
                              type="button"
                              onClick={() => setShowClock(!showClock)}
                              className="w-full px-4 py-2.5 bg-[#1a1a24] border border-violet-500/20 rounded-xl text-[11px] text-white flex items-center justify-between hover:border-violet-500/60 transition-all"
                            >
                              <span className={formData.startTime?.split('T')[1] ? 'text-white' : 'text-white/20'}>
                                {formData.startTime?.split('T')[1] ? (() => {
                                  const [h, m] = formData.startTime.split('T')[1].split(':');
                                  const hour = parseInt(h);
                                  const h12 = hour % 12 || 12;
                                  return `${h12.toString().padStart(2, '0')} : ${m} ${hour >= 12 ? 'PM' : 'AM'}`;
                                })() : 'HH : MM'}
                              </span>
                              <Clock size={12} className="text-violet-400" />
                            </button>
                          
                          {showClock && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setShowClock(false)} />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-5 bg-[#0a0a0f] border border-white/10 rounded-[2rem] shadow-[0_30px_100px_rgba(0,0,0,0.9)] z-50 animate-in zoom-in-95 duration-300 w-[240px]">
                                 <div className="flex items-center justify-between gap-2 mb-4">
                                      <div className="flex items-baseline gap-1 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                                        <button 
                                          type="button"
                                          onClick={() => setClockMode('HOUR')}
                                          className={`text-xl font-black transition-all ${clockMode === 'HOUR' ? 'text-violet-400' : 'text-white/20 hover:text-white/40'}`}
                                        >
                                          {formData.startTime?.split('T')[1] ? (parseInt(formData.startTime.split('T')[1].split(':')[0]) % 12 || 12).toString().padStart(2, '0') : '12'}
                                        </button>
                                        <span className="text-white/10 font-black text-lg">:</span>
                                        <button 
                                          type="button"
                                          onClick={() => setClockMode('MINUTE')}
                                          className={`text-xl font-black transition-all ${clockMode === 'MINUTE' ? 'text-violet-400' : 'text-white/20 hover:text-white/40'}`}
                                        >
                                          {formData.startTime?.split('T')[1]?.split(':')[1] || '00'}
                                        </button>
                                      </div>

                                      <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
                                        {['AM', 'PM'].map(p => {
                                          const hour = parseInt(formData.startTime?.split('T')[1]?.split(':')[0] || '12');
                                          const isPM = hour >= 12;
                                          const active = (p === 'PM' && isPM) || (p === 'AM' && !isPM);
                                          return (
                                            <button
                                              key={p}
                                              type="button"
                                              onClick={() => {
                                                const [date, time] = (formData.startTime || '2026-05-01T12:00').split('T');
                                                let [h, m] = time.split(':');
                                                let hourInt = parseInt(h);
                                                if (p === 'PM' && hourInt < 12) hourInt += 12;
                                                if (p === 'AM' && hourInt >= 12) hourInt -= 12;
                                                setFormData({...formData, startTime: `${date}T${hourInt.toString().padStart(2, '0')}:${m}`});
                                              }}
                                              className={`px-2 py-0.5 rounded-md text-[8px] font-black transition-all ${active ? 'bg-violet-600 text-white shadow-lg' : 'text-white/20 hover:text-white/40'}`}
                                            >
                                              {p}
                                            </button>
                                          );
                                        })}
                                      </div>
                                  </div>

                                  <div className="relative aspect-square w-full bg-white/[0.02] rounded-full border border-white/5 flex items-center justify-center mb-5">
                                      <div 
                                        className="absolute w-0.5 bg-violet-500 origin-bottom transition-all duration-300"
                                        style={{ 
                                          height: '38%', 
                                          bottom: '50%',
                                          left: 'calc(50% - 0.5px)',
                                          transform: `rotate(${(() => {
                                              const hour = parseInt(formData.startTime?.split('T')[1]?.split(':')[0] || '12');
                                              const min = parseInt(formData.startTime?.split('T')[1]?.split(':')[1] || '00');
                                              const val = clockMode === 'HOUR' ? (hour % 12) : (min / 5);
                                              return val * 30;
                                          })()}deg)` 
                                        }}
                                      >
                                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-violet-600 shadow-[0_0_15px_rgba(124,58,237,0.5)] border-2 border-violet-400/50" />
                                      </div>

                                      {Array.from({length: 12}).map((_, i) => {
                                        const val = i === 0 ? (clockMode === 'HOUR' ? 12 : 0) : (clockMode === 'HOUR' ? i : i * 5);
                                        const angle = (i * 30) - 90;
                                        const x = 40 * Math.cos(angle * Math.PI / 180);
                                        const y = 40 * Math.sin(angle * Math.PI / 180);
                                        
                                        const currentVal = clockMode === 'HOUR' 
                                          ? (parseInt(formData.startTime?.split('T')[1]?.split(':')[0] || '12') % 12 || 12)
                                          : (parseInt(formData.startTime?.split('T')[1]?.split(':')[1] || '00'));
                                        const active = val === currentVal;

                                        return (
                                          <button
                                            key={i}
                                            type="button"
                                            onClick={() => {
                                              const [date, time] = (formData.startTime || '2026-05-01T12:00').split('T');
                                              let [h, m] = time.split(':');
                                              if (clockMode === 'HOUR') {
                                                  const isPM = parseInt(h) >= 12;
                                                  let finalH = isPM ? (val === 12 ? 12 : val + 12) : (val === 12 ? 0 : val);
                                                  setFormData({...formData, startTime: `${date}T${finalH.toString().padStart(2, '0')}:${m}`});
                                                  setTimeout(() => setClockMode('MINUTE'), 300);
                                              } else {
                                                  setFormData({...formData, startTime: `${date}T${h}:${val.toString().padStart(2, '0')}`});
                                              }
                                            }}
                                            className={`absolute w-7 h-7 flex items-center justify-center text-[10px] font-black transition-all rounded-full z-20 ${active ? 'text-white' : 'text-white/20 hover:text-white'}`}
                                            style={{ left: `${50 + x}%`, top: `${50 + y}%`, transform: 'translate(-50%, -50%)' }}
                                          >
                                            {clockMode === 'HOUR' ? val : val.toString().padStart(2, '0')}
                                          </button>
                                        );
                                      })}
                                      <div className="w-1.5 h-1.5 bg-violet-500 rounded-full z-10" />
                                  </div>

                                  <div className="flex gap-2">
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          setFormData({...formData, startTime: ''});
                                          setShowClock(false);
                                        }}
                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/40 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all"
                                      >
                                        Clear
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => setShowClock(false)}
                                        className="flex-1 py-2 bg-white text-black rounded-xl text-[8px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
                                      >
                                        Finalize
                                      </button>
                                  </div>
                              </div>
                            </>
                          )}
                        </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div className="p-5 rounded-3xl border border-white/5 bg-[#0f0f14]/40 backdrop-blur-xl flex-1 flex flex-col overflow-hidden">
              <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={14} className="text-violet-500" />
                  <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Test Settings</h3>
                </div>

                <div className="group">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block ml-1 group-hover:text-violet-400/60 transition-colors">Number of Questions</label>
                  <div className="relative group/select">
                    <div className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[11px] text-white/40 font-bold tracking-widest flex items-center justify-between">
                         <span>{formData.totalQuestions} Questions</span>
                         <span className="text-[8px] bg-white/5 px-2 py-0.5 rounded text-white/20 border border-white/5">LOCKED</span>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block ml-1 group-hover:text-violet-400/60 transition-colors">Test Duration</label>
                  <div className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[11px] text-white/40 font-bold tracking-widest flex items-center justify-between">
                         <span>{formData.duration} Minutes</span>
                         <span className="text-[8px] bg-white/5 px-2 py-1 rounded text-white/20 border border-white/5">LOCKED</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 space-y-3">
                  <div className="p-4 rounded-xl border border-white/5 bg-black/40 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] mb-2.5">
                      Test Summary
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-white/30 uppercase tracking-widest">Type</span>
                        <span className="text-violet-400 tracking-widest uppercase">{formData.testType}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-white/30 uppercase tracking-widest">Subject</span>
                        <span className="text-white/80 tracking-widest uppercase">{formData.category}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-white/30 uppercase tracking-widest">Questions</span>
                        <span className="text-white/80 tracking-widest uppercase">{formData.totalQuestions}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-white/30 uppercase tracking-widest">Duration</span>
                        <span className="text-white/80 tracking-widest uppercase">{formData.duration} MIN</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={saving} 
                    className="w-full h-11 bg-white text-black rounded-xl font-black uppercase text-[11px] tracking-[0.4em] transition-all hover:bg-violet-50 hover:shadow-[0_0_30px_rgba(124,58,237,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden group"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
    </div>
  );
};

export default AdminTestEdit;
