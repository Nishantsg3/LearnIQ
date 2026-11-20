import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  Database,
  Zap,
  Clock,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { FormSkeleton } from '../components/common/Skeleton';
import ConfirmModal from '../components/ConfirmModal';

const ALLOWED_CATEGORIES = ["JAVA", "PYTHON", "ASP.NET", "APTITUDE", "DBMS", "CLOUD"];

const AdminTestEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clockMode, setClockMode] = useState('HOUR');
  const [showClock, setShowClock] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const [initialData, setInitialData] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'JAVA',
    totalQuestions: 10,
    duration: 60,
    testType: 'PRACTICE',
    startTime: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/tests/${id}`);
        const test = res.data;
        const normCategory = (test.category || 'JAVA').toUpperCase();
        const loadedData = {
          title: test.title || '',
          category: ALLOWED_CATEGORIES.includes(normCategory) ? normCategory : 'JAVA',
          totalQuestions: test.questionCount || test.totalQuestions || 0,
          duration: test.durationMinutes || test.duration || 60,
          testType: (test.testType || test.type || 'PRACTICE').toUpperCase(),
          startTime: test.startTime ? new Date(test.startTime).toISOString().slice(0, 16) : ''
        };
        setFormData(loadedData);
        setInitialData(loadedData);
      } catch {
        toast.error('Failed to load test details');
        navigate('/admin/tests/active?type=all');
      } finally {
        setLoading(false);
      }
    };
    fetchTestData();
  }, [id, navigate]);

  // Data Loss Protection: Check if form is dirty
  const isDirty = useMemo(() => {
    if (!initialData) return false;
    return (
      formData.title !== initialData.title ||
      formData.category !== initialData.category ||
      formData.duration !== initialData.duration ||
      formData.startTime !== initialData.startTime ||
      formData.testType !== initialData.testType
    );
  }, [formData, initialData]);

  // Window beforeunload protection
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleBackNavigation = () => {
    if (isDirty) {
      setShowLeaveConfirm(true);
    } else {
      navigate('/admin/tests/active?type=all');
    }
  };

  // Inline Validation
  const validateForm = () => {
    const errs = {};
    const titleTrimmed = (formData.title || '').trim();
    if (!titleTrimmed) {
      errs.title = 'Assessment title is required';
    } else if (titleTrimmed.length < 3) {
      errs.title = 'Assessment title must be at least 3 characters';
    }

    if (!formData.category) {
      errs.category = 'Category is required';
    }

    const durationNum = Number(formData.duration);
    if (!durationNum || isNaN(durationNum) || durationNum <= 0) {
      errs.duration = 'Duration must be a positive number of minutes';
    } else if (durationNum > 360) {
      errs.duration = 'Maximum test duration is 360 minutes (6 hours)';
    }

    if (formData.testType === 'MAIN' && !formData.startTime) {
      errs.startTime = 'Official Exams (MAIN) require a scheduled start date & time window';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const renderCalendarContent = () => {
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthLabel = new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select examination date"
        className="bg-white dark:bg-[#15181e] border border-slate-200 dark:border-[#262a33] p-5 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-150 w-[320px]"
      >
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => {
              if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); }
              else { setCalendarMonth(calendarMonth - 1); }
            }}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-[#1f232b] text-slate-600 dark:text-slate-400 transition cursor-pointer"
            aria-label="Previous month"
          >
            ←
          </button>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{monthLabel}</span>
          <button
            type="button"
            onClick={() => {
              if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); }
              else { setCalendarMonth(calendarMonth + 1); }
            }}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-[#1f232b] text-slate-600 dark:text-slate-400 transition cursor-pointer"
            aria-label="Next month"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} className="text-[10px] font-bold text-teal-600 dark:text-teal-400 text-center">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({length: firstDayOfMonth}).map((_, i) => <div key={`empty-${i}`} className="aspect-square" />)}
          {Array.from({length: daysInMonth}).map((_, i) => {
            const day = i + 1;
            const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const cellDate = new Date(calendarYear, calendarMonth, day);
            const isPast = cellDate < today;
            const isSelected = formData.startTime?.startsWith(dateStr);
            const isToday = cellDate.getTime() === today.getTime();

            return (
              <button
                key={day}
                type="button"
                disabled={isPast}
                onClick={() => {
                  const time = formData.startTime?.split('T')[1] || '10:00';
                  setFormData(prev => ({...prev, startTime: `${dateStr}T${time}`}));
                  if (errors.startTime) setErrors(prev => ({...prev, startTime: null}));
                  setShowCalendar(false);
                }}
                className={`aspect-square flex items-center justify-center rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isPast
                    ? 'opacity-25 cursor-not-allowed text-slate-400 dark:text-slate-600'
                    : isSelected
                      ? 'bg-teal-700 text-white font-bold shadow-sm'
                      : isToday
                        ? 'text-teal-600 dark:text-violet-300 border border-violet-300 dark:border-violet-700 bg-teal-50 dark:bg-teal-950/40 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1f232b]'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#262a33] flex justify-end">
          <button
            type="button"
            onClick={() => setShowCalendar(false)}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-3 py-1 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  const renderClockContent = () => (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Select examination start time"
      className="bg-white dark:bg-[#15181e] border border-slate-200 dark:border-[#262a33] p-6 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-150 w-[320px]"
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-baseline gap-1 bg-slate-50 dark:bg-[#101216] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#262a33]">
          <button
            type="button"
            onClick={() => setClockMode('HOUR')}
            className={`text-xl font-bold transition cursor-pointer ${clockMode === 'HOUR' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`}
          >
            {formData.startTime?.split('T')[1] ? (parseInt(formData.startTime.split('T')[1].split(':')[0]) % 12 || 12).toString().padStart(2, '0') : '10'}
          </button>
          <span className="text-slate-400 font-bold text-lg">:</span>
          <button
            type="button"
            onClick={() => setClockMode('MINUTE')}
            className={`text-xl font-bold transition cursor-pointer ${clockMode === 'MINUTE' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`}
          >
            {formData.startTime?.split('T')[1]?.split(':')[1] || '00'}
          </button>
        </div>

        <div className="flex gap-1 bg-slate-100 dark:bg-[#101216] border border-slate-200 dark:border-[#262a33] rounded-xl p-1">
          {['AM', 'PM'].map(p => {
            const hour = parseInt(formData.startTime?.split('T')[1]?.split(':')[0] || '10');
            const isPM = hour >= 12;
            const active = (p === 'PM' && isPM) || (p === 'AM' && !isPM);
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  const todayStr = new Date().toISOString().slice(0, 10);
                  const [date, time] = (formData.startTime || `${todayStr}T10:00`).split('T');
                  let [h, m] = (time || '10:00').split(':');
                  let hourInt = parseInt(h);
                  if (p === 'PM' && hourInt < 12) hourInt += 12;
                  if (p === 'AM' && hourInt >= 12) hourInt -= 12;
                  setFormData(prev => ({...prev, startTime: `${date}T${hourInt.toString().padStart(2, '0')}:${m}`}));
                  if (errors.startTime) setErrors(prev => ({...prev, startTime: null}));
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  active ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative aspect-square w-full bg-slate-50 dark:bg-[#101216] rounded-full border border-slate-200 dark:border-[#262a33] flex items-center justify-center mb-5">
        <div
          className="absolute w-0.5 bg-violet-500 origin-bottom transition-all duration-300"
          style={{
            height: '38%',
            bottom: '50%',
            left: 'calc(50% - 0.5px)',
            transform: `rotate(${(() => {
              const hour = parseInt(formData.startTime?.split('T')[1]?.split(':')[0] || '10');
              const min = parseInt(formData.startTime?.split('T')[1]?.split(':')[1] || '00');
              const val = clockMode === 'HOUR' ? (hour % 12) : (min / 5);
              return val * 30;
            })()}deg)`
          }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-teal-700 shadow-sm border-2 border-white dark:border-[#15181e]" />
        </div>

        {Array.from({length: 12}).map((_, i) => {
          const val = i === 0 ? (clockMode === 'HOUR' ? 12 : 0) : (clockMode === 'HOUR' ? i : i * 5);
          const angle = (i * 30) - 90;
          const x = 38 * Math.cos(angle * Math.PI / 180);
          const y = 38 * Math.sin(angle * Math.PI / 180);

          const currentVal = clockMode === 'HOUR'
            ? (parseInt(formData.startTime?.split('T')[1]?.split(':')[0] || '10') % 12 || 12)
            : (parseInt(formData.startTime?.split('T')[1]?.split(':')[1] || '00'));
          const active = val === currentVal;

          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                const todayStr = new Date().toISOString().slice(0, 10);
                const [date, time] = (formData.startTime || `${todayStr}T10:00`).split('T');
                let [h, m] = (time || '10:00').split(':');
                if (clockMode === 'HOUR') {
                  const isPM = parseInt(h) >= 12;
                  let finalH = isPM ? (val === 12 ? 12 : val + 12) : (val === 12 ? 0 : val);
                  setFormData(prev => ({...prev, startTime: `${date}T${finalH.toString().padStart(2, '0')}:${m}`}));
                  setTimeout(() => setClockMode('MINUTE'), 250);
                } else {
                  setFormData(prev => ({...prev, startTime: `${date}T${h}:${val.toString().padStart(2, '0')}`}));
                }
                if (errors.startTime) setErrors(prev => ({...prev, startTime: null}));
              }}
              className={`absolute w-7 h-7 flex items-center justify-center text-xs font-bold transition rounded-full z-20 cursor-pointer ${
                active ? 'text-white' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              style={{ left: `${50 + x}%`, top: `${50 + y}%`, transform: 'translate(-50%, -50%)' }}
            >
              {clockMode === 'HOUR' ? val : val.toString().padStart(2, '0')}
            </button>
          );
        })}
        <div className="w-2 h-2 bg-teal-700 rounded-full z-10" />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setFormData(prev => ({...prev, startTime: ''}));
            setShowClock(false);
          }}
          className="btn-secondary flex-1 py-2 text-xs cursor-pointer"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => setShowClock(false)}
          className="btn-primary flex-1 py-2 text-xs cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the validation errors before saving');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        duration: Number(formData.duration),
        durationMinutes: Number(formData.duration),
        testType: formData.testType,
        startTime: formData.testType === 'MAIN' && formData.startTime ? new Date(formData.startTime).toISOString() : null
      };

      // Try canonical /admin/tests/:id endpoint with graceful fallback
      try {
        await api.put(`/admin/tests/${id}`, payload);
      } catch (err) {
        if (err.response?.status === 404 || err.response?.status === 405) {
          await api.put(`/tests/${id}`, payload);
        } else {
          throw err;
        }
      }

      toast.success('Assessment configuration saved successfully');
      setInitialData(formData);
      navigate('/admin/tests/active?type=all');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update assessment';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar animate-in fade-in duration-300 p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto flex flex-col space-y-6">

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#262a33]">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-violet-200/80 dark:border-violet-800/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-xs">
            <FileText size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-400 block">
                Assessment Management
              </span>
              {isDirty && (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.2 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Unsaved Changes</span>
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Edit Assessment Details
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure assessment parameters, discipline category, duration, and scheduled window
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleBackNavigation}
          className="btn-secondary py-2 px-3.5 min-h-[44px] text-xs flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft size={15} />
          <span>Back to Tests</span>
        </button>
      </div>

      {loading ? (
        <FormSkeleton />
      ) : (
        /* FORM CONTAINER */
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: Main details */}
          <div className="lg:col-span-7 bg-white dark:bg-[#15181e] rounded-2xl border border-slate-200/90 dark:border-[#262a33] p-6 sm:p-8 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-[#262a33] flex items-center gap-2">
              <Database size={16} className="text-teal-600 dark:text-teal-400" />
              <span>Assessment Configuration</span>
            </h2>

            {/* Assessment Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Assessment Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({...formData, title: e.target.value});
                  if (errors.title) setErrors({...errors, title: null});
                }}
                className={`input-base min-h-[44px] text-xs ${
                  errors.title ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''
                }`}
                placeholder="e.g. Advanced Java & Spring Boot Proficiency Exam"
                required
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{errors.title}</span>
                </p>
              )}
            </div>

            {/* Category & Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Subject Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    setFormData({...formData, category: e.target.value});
                    if (errors.category) setErrors({...errors, category: null});
                  }}
                  className="input-base min-h-[44px] text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  {ALLOWED_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Assessment Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, testType: 'PRACTICE'})}
                    className={`min-h-[44px] rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                      formData.testType === 'PRACTICE'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-[#101216] border-slate-200 dark:border-[#262a33] text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Practice
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, testType: 'MAIN'})}
                    className={`min-h-[44px] rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                      formData.testType === 'MAIN'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-[#101216] border-slate-200 dark:border-[#262a33] text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Official (MAIN)
                  </button>
                </div>
              </div>
            </div>

            {/* Duration Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Allocated Duration (Minutes) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="360"
                  value={formData.duration}
                  onChange={(e) => {
                    setFormData({...formData, duration: e.target.value});
                    if (errors.duration) setErrors({...errors, duration: null});
                  }}
                  className={`input-base min-h-[44px] text-xs font-mono pr-14 ${
                    errors.duration ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''
                  }`}
                  placeholder="e.g. 60"
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                  mins
                </span>
              </div>
              {errors.duration && (
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{errors.duration}</span>
                </p>
              )}
            </div>

            {/* Schedule Window for Official Exams (MAIN) */}
            {formData.testType === 'MAIN' ? (
              <div className="pt-4 border-t border-slate-100 dark:border-[#262a33] space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Scheduled Examination Window <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Students will only be admitted during the scheduled time window.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCalendar(true)}
                    className="input-base min-h-[44px] text-left flex items-center justify-between cursor-pointer"
                  >
                    <span className={formData.startTime ? 'text-slate-900 dark:text-slate-100 font-semibold' : 'text-slate-400 dark:text-slate-500'}>
                      {formData.startTime?.split('T')[0] || 'Select Date'}
                    </span>
                    <Calendar size={15} className="text-teal-600 dark:text-teal-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowClock(true)}
                    className="input-base min-h-[44px] text-left flex items-center justify-between cursor-pointer"
                  >
                    <span className={formData.startTime ? 'text-slate-900 dark:text-slate-100 font-semibold' : 'text-slate-400 dark:text-slate-500'}>
                      {formData.startTime?.split('T')[1] || 'Select Time'}
                    </span>
                    <Clock size={15} className="text-teal-600 dark:text-teal-400" />
                  </button>
                </div>

                {errors.startTime && (
                  <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>{errors.startTime}</span>
                  </p>
                )}

                {showCalendar && createPortal(
                  <div className="fixed inset-0 z-[100] !m-0 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-black/80 backdrop-blur-md">
                    <div className="relative">
                      {renderCalendarContent()}
                    </div>
                  </div>,
                  document.body
                )}

                {showClock && createPortal(
                  <div className="fixed inset-0 z-[100] !m-0 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-black/80 backdrop-blur-md">
                    <div className="relative">
                      {renderClockContent()}
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            ) : (
              <div className="pt-4 border-t border-slate-100 dark:border-[#262a33] text-xs text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-[#101216] p-3 rounded-xl border border-slate-200/60 dark:border-[#222630]">
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Practice Assessment Mode</p>
                <p>This test has no time window restriction and is available for candidate self-paced practice at any time.</p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Summary & Confirmation */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-[#15181e] rounded-2xl border border-slate-200/90 dark:border-[#262a33] p-6 sm:p-8 shadow-xs space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-[#262a33] flex items-center gap-2">
                <Zap size={16} className="text-teal-600 dark:text-teal-400" />
                <span>Test Parameters Summary</span>
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Attached Questions
                </label>
                <div className="input-base bg-slate-50 dark:bg-[#101216] flex items-center justify-between text-slate-700 dark:text-slate-300 font-mono text-xs">
                  <span className="tabular-nums font-semibold">{formData.totalQuestions} Questions</span>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/tests/${id}/questions`)}
                    className="text-teal-600 dark:text-teal-400 hover:underline text-xs font-sans font-medium cursor-pointer"
                  >
                    Manage Items →
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Proctoring & Rules
                </label>
                <div className="p-3 bg-slate-50 dark:bg-[#101216] rounded-xl border border-slate-200 dark:border-[#262a33] text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Fullscreen Lockdown:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{formData.testType === 'MAIN' ? 'Enforced' : 'Optional'}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Leaderboard Ranking:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{formData.testType === 'MAIN' ? 'Active' : 'Disabled'}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Multiple Attempts:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{formData.testType === 'MAIN' ? 'Single Only' : 'Unlimited'}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary w-full min-h-[44px] py-3 flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Save Assessment Changes</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBackNavigation}
                  className="btn-secondary w-full min-h-[44px] py-2.5 flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* DISCARD UNSAVED CHANGES CONFIRM MODAL */}
      <ConfirmModal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={() => {
          setShowLeaveConfirm(false);
          navigate('/admin/tests/active?type=all');
        }}
        title="Discard Unsaved Changes?"
        message="You have modified the test configuration. If you leave now, your changes will be discarded."
        confirmText="Discard & Leave"
        cancelText="Continue Editing"
      />
    </div>
  );
};

export default AdminTestEdit;
