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

  // Dynamic calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const [formData, setFormData] = useState({
    title: '',
    category: 'Java',
    totalQuestions: 10,
    duration: 10,
    testType: 'PRACTICE',
    startTime: ''
  });


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
      } catch {
        toast.error('Failed to load assessment data');
        navigate('/admin/tests/active');
      } finally {
        setLoading(false);
      }
    };
    fetchTestData();
  }, [id, navigate]);

  useEffect(() => {
    if (!showCalendar && !showClock) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowCalendar(false);
        setShowClock(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCalendar, showClock]);

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
      navigate('/admin/tests/active');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Synchronization failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
      <p className="text-xs font-medium text-white/60 tracking-wider">Loading assessment data...</p>
    </div>
  );

  const isMain = formData.testType === 'MAIN';

  return (
    <div className="animate-in fade-in duration-500 overflow-y-auto lg:overflow-visible lg:h-[calc(100vh-100px)] p-4 sm:p-6 lg:px-16 flex flex-col custom-scrollbar">
        {/* HEADER: TITLE + NAVIGATION */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div style={{ width: 4, height: 20, background: '#7c3aed', borderRadius: 4 }} />
              <h1 className="text-2xl font-bold tracking-tight text-white">Edit Test</h1>
            </div>
            <p className="text-xs text-white/60 ml-4 font-normal tracking-normal">Update assessment details, timing, and schedule settings</p>
          </div>
          <BackToDashboard />
        </div>

        {/* CORE CONFIGURATION ZONE */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col lg:grid lg:grid-cols-[1.2fr_1fr] gap-5 mb-3" style={{ minHeight: 0 }}>

          {/* LEFT TRACK: CONFIGURATION */}
          <div
            className="apple-card rounded-2xl p-5 sm:p-6 flex flex-col gap-4 relative overflow-visible"
            style={{
                background: 'rgba(18, 18, 26, 0.72)',
                boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.08), 0 20px 50px rgba(0,0,0,0.4)'
            }}
          >
            {/* Subtle top accent sheen */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent pointer-events-none" />

            <div className="flex-1 pr-1">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Database size={15} className="text-violet-400" />
                  <h3 className="text-xs font-semibold text-white/90 uppercase tracking-wider">Test Details</h3>
                </div>

                <div className="group">
                  <label className="text-[11px] font-semibold text-white/70 tracking-wide mb-1.5 block ml-1">Assessment Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Java Mock Assessment"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 placeholder:text-white/40 font-medium tracking-normal transition-all hover:bg-white/[0.06] hover:border-white/[0.12]"
                  />
                  <p className="text-[10px] text-white/40 mt-1.5 ml-1 tracking-normal font-normal">Enter a unique test name</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="text-[11px] font-semibold text-white/70 tracking-wide mb-1.5 block ml-1">Category</label>
                    <div className="relative group/select">
                      <div className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-xs text-white/70 font-medium flex items-center justify-between">
                         <span>{formData.category}</span>
                         <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-md text-white/60 font-semibold uppercase tracking-wider">Locked</span>
                      </div>
                    </div>
                  </div>
                  <div className="group">
                    <label className="text-[11px] font-semibold text-white/70 tracking-wide mb-1.5 block ml-1">Test Mode</label>
                    <div className="relative group/select">
                      <div className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-xs text-white/70 font-medium flex items-center justify-between">
                         <span>{formData.testType === 'MAIN' ? 'Main Test' : 'Practice Test'}</span>
                         <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-md text-white/60 font-semibold uppercase tracking-wider">Locked</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border transition-all duration-300 ${formData.testType === 'MAIN' ? 'bg-amber-500/[0.06] border-amber-500/20' : 'bg-violet-500/[0.06] border-violet-500/20'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-2 rounded-xl ${formData.testType === 'MAIN' ? 'bg-amber-500/20 text-amber-400' : 'bg-violet-500/20 text-violet-400'}`}>
                      {formData.testType === 'MAIN' ? <Zap size={14} /> : <Database size={14} />}
                    </div>
                    <div>
                      <h4 className={`text-xs font-semibold mb-0.5 ${formData.testType === 'MAIN' ? 'text-amber-400' : 'text-violet-400'}`}>
                        {formData.testType === 'MAIN' ? 'Restricted Access' : 'Open Practice'}
                      </h4>
                      <p className="text-[11px] font-normal text-white/70 leading-relaxed">
                        {formData.testType === 'MAIN'
                          ? 'Single attempt only. Time-window enforced and results verified.'
                          : 'Students can attempt this test multiple times for self-paced learning.'}
                      </p>
                    </div>
                  </div>
                </div>

                {isMain && (
                  <div className="pt-4 border-t border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar size={13} className="text-violet-400" />
                      <h3 className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">Scheduled Window</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative group">
                          <label className="text-[10px] font-semibold text-white/60 tracking-wide mb-1.5 block ml-1">Start Date</label>
                          <button
                            type="button"
                            onClick={() => setShowCalendar(!showCalendar)}
                            className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white flex items-center justify-between hover:border-violet-500/50 hover:bg-white/[0.06] transition-all active:scale-[0.99]"
                          >
                            <span className={formData.startTime?.split('T')[0] ? 'text-white font-medium' : 'text-white/40'}>
                              {formData.startTime?.split('T')[0] ? new Date(formData.startTime.split('T')[0]).toLocaleDateString('en-GB') : 'DD / MM / YYYY'}
                            </span>
                            <Calendar size={13} className="text-violet-400" />
                          </button>

                          {showCalendar && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setShowCalendar(false)} />
                              <div role="dialog" aria-modal="true" aria-label="Select date" className="apple-dialog absolute bottom-full left-0 mb-2 p-4 rounded-2xl shadow-2xl z-50 animate-in zoom-in-95 duration-150 w-[300px]">
                                {/* Month/Year Navigation */}
                                <div className="flex items-center justify-between mb-3 px-1">
                                  <button type="button" onClick={() => {
                                    if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); }
                                    else { setCalendarMonth(calendarMonth - 1); }
                                  }} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all active:scale-95">
                                    ←
                                  </button>
                                  <span className="text-xs font-semibold text-white/90 tracking-wide">
                                    {new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                  </span>
                                  <button type="button" onClick={() => {
                                    if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); }
                                    else { setCalendarMonth(calendarMonth + 1); }
                                  }} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all active:scale-95">
                                    →
                                  </button>
                                </div>
                                <div className="grid grid-cols-7 gap-1 mb-1">
                                  {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} className="text-[10px] font-semibold text-violet-400/80 text-center">{d}</div>)}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                  {Array.from({length: new Date(calendarYear, calendarMonth, 1).getDay()}).map((_, i) => <div key={`empty-${i}`} className="aspect-square" />)}
                                  {Array.from({length: new Date(calendarYear, calendarMonth + 1, 0).getDate()}).map((_, i) => {
                                    const day = i + 1;
                                    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const cellDate = new Date(calendarYear, calendarMonth, day);
                                    const todayDate = new Date(); todayDate.setHours(0,0,0,0);
                                    const isPast = cellDate < todayDate;
                                    const isSelected = formData.startTime?.startsWith(dateStr);
                                    return (
                                      <button
                                        key={day}
                                        type="button"
                                        disabled={isPast}
                                        onClick={() => {
                                          const time = formData.startTime?.split('T')[1] || '12:00';
                                          setFormData({...formData, startTime: `${dateStr}T${time}`});
                                          setShowCalendar(false);
                                        }}
                                        className={`aspect-square flex items-center justify-center rounded-lg text-[11px] font-semibold transition-all active:scale-95 ${
                                          isPast ? 'opacity-20 cursor-not-allowed text-white/20'
                                          : isSelected ? 'bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]'
                                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                                        }`}
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
                            <label className="text-[10px] font-semibold text-white/60 tracking-wide mb-1.5 block ml-1">Start Time</label>
                            <button
                              type="button"
                              onClick={() => setShowClock(!showClock)}
                              className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white flex items-center justify-between hover:border-violet-500/50 hover:bg-white/[0.06] transition-all active:scale-[0.99]"
                            >
                              <span className={formData.startTime?.split('T')[1] ? 'text-white font-medium' : 'text-white/40'}>
                                {formData.startTime?.split('T')[1] ? (() => {
                                  const [h, m] = formData.startTime.split('T')[1].split(':');
                                  const hour = parseInt(h);
                                  const h12 = hour % 12 || 12;
                                  return `${h12.toString().padStart(2, '0')} : ${m} ${hour >= 12 ? 'PM' : 'AM'}`;
                                })() : 'HH : MM'}
                              </span>
                              <Clock size={13} className="text-violet-400" />
                            </button>

                          {showClock && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setShowClock(false)} />
                              <div role="dialog" aria-modal="true" aria-label="Select time" className="apple-dialog absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-5 rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.9)] z-50 animate-in zoom-in-95 duration-150 w-[310px]">
                                 <div className="flex items-center justify-between gap-2 mb-4">
                                      <div className="flex items-baseline gap-1 bg-white/[0.04] px-3.5 py-1.5 rounded-xl border border-white/[0.08]">
                                        <button
                                          type="button"
                                          onClick={() => setClockMode('HOUR')}
                                          className={`text-xl font-bold transition-all active:scale-95 ${clockMode === 'HOUR' ? 'text-violet-400' : 'text-white/60 hover:text-white/80'}`}
                                        >
                                          {formData.startTime?.split('T')[1] ? (parseInt(formData.startTime.split('T')[1].split(':')[0]) % 12 || 12).toString().padStart(2, '0') : '12'}
                                        </button>
                                        <span className="text-white/40 font-bold text-lg">:</span>
                                        <button
                                          type="button"
                                          onClick={() => setClockMode('MINUTE')}
                                          className={`text-xl font-bold transition-all active:scale-95 ${clockMode === 'MINUTE' ? 'text-violet-400' : 'text-white/60 hover:text-white/80'}`}
                                        >
                                          {formData.startTime?.split('T')[1]?.split(':')[1] || '00'}
                                        </button>
                                      </div>

                                      <div className="flex gap-1 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1">
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
                                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-95 ${active ? 'bg-violet-600 text-white shadow-sm' : 'text-white/60 hover:text-white'}`}
                                            >
                                              {p}
                                            </button>
                                          );
                                        })}
                                      </div>
                                  </div>

                                  <div className="relative aspect-square w-full bg-white/[0.02] rounded-full border border-white/[0.06] flex items-center justify-center mb-5">
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
                                            className={`absolute w-7 h-7 flex items-center justify-center text-[11px] font-bold transition-all rounded-full z-20 active:scale-95 ${active ? 'text-white' : 'text-white/60 hover:text-white'}`}
                                            style={{ left: `${50 + x}%`, top: `${50 + y}%`, transform: 'translate(-50%, -50%)' }}
                                          >
                                            {clockMode === 'HOUR' ? val : val.toString().padStart(2, '0')}
                                          </button>
                                        );
                                      })}
                                      <div className="w-2 h-2 bg-violet-500 rounded-full z-10" />
                                  </div>

                                  <div className="flex gap-2.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFormData({...formData, startTime: ''});
                                          setShowClock(false);
                                        }}
                                        className="btn-secondary flex-1 py-2 rounded-xl text-xs font-semibold"
                                      >
                                        Clear
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setShowClock(false)}
                                        className="btn-primary flex-1 py-2 rounded-xl text-xs font-semibold"
                                      >
                                        Done
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
            <div
              className="apple-card rounded-2xl p-5 sm:p-6 flex-1 flex flex-col overflow-visible"
              style={{
                  background: 'rgba(18, 18, 26, 0.72)',
                  boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.08), 0 20px 50px rgba(0,0,0,0.4)'
              }}
            >
              <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={15} className="text-violet-400" />
                  <h3 className="text-xs font-semibold text-white/90 uppercase tracking-wider">Test Settings</h3>
                </div>

                <div className="group">
                  <label className="text-[11px] font-semibold text-white/70 tracking-wide mb-1.5 block ml-1">Number of Questions</label>
                  <div className="relative group/select">
                    <div className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-xs text-white/70 font-medium flex items-center justify-between">
                         <span className="tabular-nums">{formData.totalQuestions} Questions</span>
                         <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-md text-white/60 font-semibold uppercase tracking-wider">Locked</span>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label className="text-[11px] font-semibold text-white/70 tracking-wide mb-1.5 block ml-1">Test Duration</label>
                  <div className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-xs text-white/70 font-medium flex items-center justify-between">
                         <span className="tabular-nums">{formData.duration} Minutes</span>
                         <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-md text-white/60 font-semibold uppercase tracking-wider">Locked</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 space-y-3">
                  <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-2.5">
                      Test Summary
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/60">Type</span>
                        <span className="text-violet-400 font-semibold">{formData.testType === 'MAIN' ? 'Main Assessment' : 'Practice Test'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/60">Subject</span>
                        <span className="text-white font-medium">{formData.category}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/60">Questions</span>
                        <span className="text-white font-medium tabular-nums">{formData.totalQuestions}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/60">Duration</span>
                        <span className="text-white font-medium tabular-nums">{formData.duration} MIN</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3.5 rounded-full bg-white text-black font-semibold text-xs tracking-wide shadow-lg hover:bg-white/90 active:scale-[0.98] transition-[transform,background-color] duration-120 disabled:opacity-50 mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
                  >
                    {saving ? 'Saving Changes...' : 'Save Changes'}
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
