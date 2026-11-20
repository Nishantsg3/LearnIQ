import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  Database,
  Zap,
  Clock,
  Calendar,
  ChevronDown,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Award,
  MinusCircle,
  Sparkles,
  Shield,
  Lock,
  Layers,
  Check,
  Send,
  Sliders
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';

const CATEGORIES = ["Java", "Python", "ASP.NET", "Aptitude", "DBMS", "Cloud"];
const QUESTION_PRESETS = [5, 10, 15, 20, 25, 30, 40, 50];
const DURATION_PRESETS = [10, 15, 30, 45, 60, 90, 120];
const MARKS_OPTIONS = [1, 2, 4];
const PENALTY_OPTIONS = [
  { value: 0, label: 'None (0.00)' },
  { value: 0.25, label: '-0.25 (1/4 mark)' },
  { value: 0.50, label: '-0.50 (1/2 mark)' },
  { value: 1.00, label: '-1.00 (Full mark)' }
];

const INITIAL_FORM_STATE = {
  title: '',
  category: 'Java',
  totalQuestions: 10,
  duration: 15,
  testType: 'PRACTICE',
  startTime: '',
  marksPerQuestion: 1,
  negativeMarking: 0
};

const AdminTestMaker = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [clockMode, setClockMode] = useState('HOUR');
  const [showClock, setShowClock] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPenaltyDropdown, setShowPenaltyDropdown] = useState(false);
  const [useNativeDatePicker, setUseNativeDatePicker] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [mobileTab, setMobileTab] = useState('editor'); // 'editor' | 'specs'

  const penaltyDropdownRef = useRef(null);

  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [touched, setTouched] = useState({
    title: false,
    startTime: false,
    totalQuestions: false,
    duration: false
  });

  // Track category availability from question bank
  const [categoryCounts, setCategoryCounts] = useState({});
  const [, setLoadingCounts] = useState(false);
  const [existingTests, setExistingTests] = useState([]);

  // Ref to track if form was submitted to prevent beforeunload
  const isSubmittedRef = useRef(false);

  // Initial state ref to compare dirty state
  const initialDataRef = useRef(INITIAL_FORM_STATE);

  // Fetch available questions count by category
  useEffect(() => {
    let isMounted = true;
    const fetchCountsAndTests = async () => {
      setLoadingCounts(true);
      try {
        const [countsRes, testsRes] = await Promise.all([
          api.get('/questions/category-counts').catch(() => null),
          api.get('/tests').catch(() => ({ data: [] }))
        ]);

        if (isMounted && testsRes && Array.isArray(testsRes.data)) {
          setExistingTests(testsRes.data);
        }

        if (isMounted && countsRes && countsRes.data && typeof countsRes.data === 'object') {
          const normalized = {};
          Object.entries(countsRes.data).forEach(([key, val]) => {
            normalized[key.toUpperCase()] = typeof val === 'number' ? val : Number(val) || 0;
          });
          setCategoryCounts(normalized);
        } else {
          const fallbackRes = await api.get('/questions/bank').catch(() => null);
          if (isMounted && fallbackRes && Array.isArray(fallbackRes.data)) {
            const counts = {};
            fallbackRes.data.forEach(q => {
              const cat = (q.category || q.tag || 'UNCATEGORIZED').toUpperCase();
              counts[cat] = (counts[cat] || 0) + 1;
            });
            setCategoryCounts(counts);
          }
        }
      } catch {
        // Graceful fallback
      } finally {
        if (isMounted) setLoadingCounts(false);
      }
    };

    fetchCountsAndTests();
    return () => { isMounted = false; };
  }, []);

  // Compute dirty form state
  const isDirty = useMemo(() => {
    return (
      formData.title !== initialDataRef.current.title ||
      formData.category !== initialDataRef.current.category ||
      formData.totalQuestions !== initialDataRef.current.totalQuestions ||
      formData.duration !== initialDataRef.current.duration ||
      formData.testType !== initialDataRef.current.testType ||
      formData.startTime !== initialDataRef.current.startTime ||
      formData.marksPerQuestion !== initialDataRef.current.marksPerQuestion ||
      formData.negativeMarking !== initialDataRef.current.negativeMarking
    );
  }, [formData]);

  // Window beforeunload listener to prevent accidental data loss
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty && !isSubmittedRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // Click-outside listener to safely dismiss custom select menus
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (penaltyDropdownRef.current && !penaltyDropdownRef.current.contains(e.target)) {
        setShowPenaltyDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  // Handle back / navigation request with unsaved changes safeguard
  const handleRequestExit = useCallback(() => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      navigate('/admin/dashboard');
    }
  }, [isDirty, navigate]);

  // Available questions for currently selected category
  const activeCategoryUpper = (formData.category || '').toUpperCase();
  const availableQuestions = categoryCounts[activeCategoryUpper] ?? null;

  // Validation logic
  const validationErrors = useMemo(() => {
    const errors = {};

    // 1. Title validation
    const trimmedTitle = formData.title.trim();
    if (!trimmedTitle) {
      errors.title = 'Assessment title is required.';
    } else if (trimmedTitle.length < 3) {
      errors.title = 'Assessment title must be at least 3 characters.';
    } else {
      const duplicate = existingTests.find(t =>
        (t.title || '').trim().toLowerCase() === trimmedTitle.toLowerCase()
      );
      if (duplicate) {
        errors.title = `An assessment named "${trimmedTitle}" already exists (${duplicate.status || duplicate.testType || 'recorded'}). Please choose a unique name.`;
      }
    }

    // 2. Category validation
    if (!formData.category || !CATEGORIES.includes(formData.category)) {
      errors.category = 'Please select a valid subject category.';
    }

    // 3. Question Count & Duration validation
    if (formData.testType === 'MAIN') {
      if (availableQuestions !== null && availableQuestions < 50) {
        errors.totalQuestions = `Official exams require 50 questions, but only ${availableQuestions} exist in the ${formData.category} bank.`;
      }
    } else {
      const count = Number(formData.totalQuestions);
      if (!count || isNaN(count) || count < 5 || count > 50) {
        errors.totalQuestions = 'Question count must be between 5 and 50 questions.';
      } else if (availableQuestions !== null && count > availableQuestions) {
        errors.totalQuestions = `Only ${availableQuestions} question${availableQuestions === 1 ? '' : 's'} available in ${formData.category} bank (requested ${count}).`;
      }

      const dur = Number(formData.duration);
      if (!dur || isNaN(dur) || dur < 5 || dur > 180) {
        errors.duration = 'Allocated duration must be between 5 and 180 minutes.';
      }
    }

    // 4. Start Time validation (Mandatory for MAIN, must be strictly in the future)
    if (formData.testType === 'MAIN') {
      if (!formData.startTime) {
        errors.startTime = 'Scheduled start time is mandatory for main examinations.';
      } else {
        const selectedDate = new Date(formData.startTime);
        const now = new Date();
        if (isNaN(selectedDate.getTime())) {
          errors.startTime = 'Please specify a valid start date and time.';
        } else if (selectedDate <= now) {
          errors.startTime = 'Scheduled start time must be in the future (rejects past or current dates).';
        } else if (selectedDate.getTime() - now.getTime() < 3 * 60 * 1000) {
          errors.startTime = 'Start time must be scheduled at least 3 minutes ahead of current time.';
        }
      }
    }

    return errors;
  }, [formData, availableQuestions, existingTests]);

  const isValid = Object.keys(validationErrors).length === 0;

  // Sequential Step Validation Gates
  const _validateStepQuietly = useCallback((stepNum) => {
    if (stepNum === 1) {
      return !validationErrors.title && !validationErrors.category;
    }
    if (stepNum === 2) {
      return Boolean(formData.testType);
    }
    if (stepNum === 3) {
      return !validationErrors.totalQuestions && !validationErrors.duration && !validationErrors.startTime;
    }
    return true;
  }, [validationErrors, formData.testType]);

  const validateStep = useCallback((stepNum) => {
    if (stepNum === 1) {
      if (validationErrors.title) {
        setTouched(prev => ({ ...prev, title: true }));
        toast.error(validationErrors.title);
        return false;
      }
      if (validationErrors.category) {
        toast.error(validationErrors.category);
        return false;
      }
      return true;
    }
    if (stepNum === 2) {
      if (!formData.testType) {
        toast.error('Please select an assessment protocol.');
        return false;
      }
      return true;
    }
    if (stepNum === 3) {
      if (validationErrors.totalQuestions) {
        setTouched(prev => ({ ...prev, totalQuestions: true }));
        toast.error(validationErrors.totalQuestions);
        return false;
      }
      if (validationErrors.duration) {
        setTouched(prev => ({ ...prev, duration: true }));
        toast.error(validationErrors.duration);
        return false;
      }
      if (validationErrors.startTime) {
        setTouched(prev => ({ ...prev, startTime: true }));
        toast.error(validationErrors.startTime);
        return false;
      }
      return true;
    }
    return true;
  }, [validationErrors, formData.testType]);

  const isStepAccessible = useCallback((targetStep) => {
    // Progressive disclosure lock: steps ahead of activeStep remain strictly locked
    // On Step 1: 2, 3, 4 locked. On Step 2: 3, 4 locked. On Step 3: 4 locked.
    return targetStep <= activeStep;
  }, [activeStep]);

  // Dynamic scoring preview calculations
  const totalMarks = useMemo(() => {
    const qCount = formData.testType === 'MAIN' ? 50 : (Number(formData.totalQuestions) || 0);
    const mPerQ = Number(formData.marksPerQuestion) || 1;
    return qCount * mPerQ;
  }, [formData.testType, formData.totalQuestions, formData.marksPerQuestion]);

  const passingMarks = useMemo(() => {
    return Math.ceil(totalMarks * 0.40); // 40% minimum passing mark standard
  }, [totalMarks]);

  const penaltyImpact = useMemo(() => {
    const penalty = Number(formData.negativeMarking) || 0;
    const marks = Number(formData.marksPerQuestion) || 1;
    if (penalty === 0) {
      return { text: 'No penalty applied for incorrect attempts.', severity: 'neutral', percent: 0 };
    }
    const percent = Math.round((penalty / marks) * 100);
    return {
      text: `-${penalty} marks per incorrect attempt (${percent}% of question value).`,
      severity: percent >= 50 ? 'warning' : 'info',
      percent
    };
  }, [formData.negativeMarking, formData.marksPerQuestion]);

  // Minimum date string for native picker (YYYY-MM-DDTHH:mm format, 5 min future)
  const minDateTimeString = useMemo(() => {
    const d = new Date(Date.now() + 5 * 60 * 1000);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }, []);

  // Keyboard Escape listener for calendar/clock overlays
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

  // Auto-sync duration helper
  const handleAutoSyncDuration = (factor = 1.5) => {
    const computed = Math.min(180, Math.max(5, Math.ceil(formData.totalQuestions * factor)));
    setFormData(prev => ({ ...prev, duration: computed }));
    setTouched(prev => ({ ...prev, duration: true }));
  };

  // Switch assessment type
  const handleTypeSelect = (type) => {
    setFormData(prev => {
      const next = { ...prev, testType: type };
      if (type === 'PRACTICE') {
        next.startTime = '';
      } else if (type === 'MAIN') {
        // Enforce mandatory 50 questions / 60 minutes for official exams
        next.totalQuestions = 50;
        next.duration = 60;
        if (!next.startTime) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(10, 0, 0, 0);
          const iso = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          next.startTime = iso;
        }
      }
      return next;
    });
  };

  // Calendar renderer with accessible keyboard & dialog controls
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
        aria-label="Select Examination Date"
        className="bg-white dark:bg-[#15181e] border border-slate-200 dark:border-[#262a33] p-5 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-150 w-[320px]"
      >
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => {
              if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); }
              else { setCalendarMonth(calendarMonth - 1); }
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#202530] text-slate-600 dark:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-academy-accent transition cursor-pointer"
          >
            ←
          </button>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{monthLabel}</span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => {
              if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); }
              else { setCalendarMonth(calendarMonth + 1); }
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#202530] text-slate-600 dark:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-academy-accent transition cursor-pointer"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} className="text-[10px] font-bold text-violet-600 dark:text-violet-400 text-center">{d}</div>
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
                aria-label={`${monthLabel} ${day}${isSelected ? ', selected' : ''}${isPast ? ', past date unavailable' : ''}`}
                onClick={() => {
                  const time = formData.startTime?.split('T')[1] || '10:00';
                  setFormData(prev => ({ ...prev, startTime: `${dateStr}T${time}` }));
                  setTouched(prev => ({ ...prev, startTime: true }));
                  setShowCalendar(false);
                }}
                className={`aspect-square flex items-center justify-center rounded-lg text-xs font-semibold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-academy-accent ${
                  isPast
                    ? 'opacity-25 cursor-not-allowed text-slate-400 dark:text-slate-600'
                    : isSelected
                      ? 'bg-violet-600 text-white font-bold shadow-xs'
                      : isToday
                        ? 'text-violet-600 dark:text-violet-300 border border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/40 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#202530]'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#20242c] flex justify-between">
          <button
            type="button"
            onClick={() => setShowCalendar(false)}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-academy-accent rounded px-2 py-1"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              const dateStr = tomorrow.toISOString().split('T')[0];
              const time = formData.startTime?.split('T')[1] || '10:00';
              setFormData(prev => ({ ...prev, startTime: `${dateStr}T${time}` }));
              setTouched(prev => ({ ...prev, startTime: true }));
              setShowCalendar(false);
            }}
            className="text-xs text-violet-600 dark:text-violet-400 font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-academy-accent rounded px-2 py-1"
          >
            Pick Tomorrow
          </button>
        </div>
      </div>
    );
  };

  // Clock renderer with accessible controls
  const renderClockContent = () => (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Select Examination Start Time"
      className="bg-white dark:bg-[#15181e] border border-slate-200 dark:border-[#262a33] p-6 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-150 w-[320px]"
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-baseline gap-1 bg-slate-50 dark:bg-[#111317] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#262a33]">
          <button
            type="button"
            aria-label="Set Hour"
            onClick={() => setClockMode('HOUR')}
            className={`text-xl font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-academy-accent rounded px-1 ${
              clockMode === 'HOUR' ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {formData.startTime?.split('T')[1] ? (parseInt(formData.startTime.split('T')[1].split(':')[0]) % 12 || 12).toString().padStart(2, '0') : '10'}
          </button>
          <span className="text-slate-400 font-bold text-lg">:</span>
          <button
            type="button"
            aria-label="Set Minute"
            onClick={() => setClockMode('MINUTE')}
            className={`text-xl font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-academy-accent rounded px-1 ${
              clockMode === 'MINUTE' ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {formData.startTime?.split('T')[1]?.split(':')[1] || '00'}
          </button>
        </div>

        <div className="flex gap-1 bg-slate-100 dark:bg-[#1c2027] border border-slate-200 dark:border-[#262a33] rounded-xl p-1">
          {['AM', 'PM'].map(p => {
            const hour = parseInt(formData.startTime?.split('T')[1]?.split(':')[0] || '10');
            const isPM = hour >= 12;
            const active = (p === 'PM' && isPM) || (p === 'AM' && !isPM);
            return (
              <button
                key={p}
                type="button"
                aria-label={`Select ${p}`}
                onClick={() => {
                  const [date] = (formData.startTime || `${new Date().toISOString().split('T')[0]}T10:00`).split('T');
                  const time = formData.startTime?.split('T')[1] || '10:00';
                  const [, m] = time.split(':');
                  let hourInt = parseInt(time.split(':')[0]);
                  if (p === 'PM' && hourInt < 12) hourInt += 12;
                  if (p === 'AM' && hourInt >= 12) hourInt -= 12;
                  setFormData(prev => ({
                    ...prev,
                    startTime: `${date}T${hourInt.toString().padStart(2, '0')}:${m}`
                  }));
                  setTouched(prev => ({ ...prev, startTime: true }));
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-academy-accent ${
                  active ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative aspect-square w-full bg-slate-50 dark:bg-[#111317] rounded-full border border-slate-200 dark:border-[#262a33] flex items-center justify-center mb-5">
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
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-violet-600 shadow-xs border-2 border-white dark:border-[#15181e]" />
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
              aria-label={`${clockMode === 'HOUR' ? 'Hour ' + val : 'Minute ' + val}`}
              onClick={() => {
                const [date] = (formData.startTime || `${new Date().toISOString().split('T')[0]}T10:00`).split('T');
                const time = formData.startTime?.split('T')[1] || '10:00';
                const [h, m] = time.split(':');
                if (clockMode === 'HOUR') {
                  const isPM = parseInt(h) >= 12;
                  const finalH = isPM ? (val === 12 ? 12 : val + 12) : (val === 12 ? 0 : val);
                  setFormData(prev => ({ ...prev, startTime: `${date}T${finalH.toString().padStart(2, '0')}:${m}` }));
                  setTouched(prev => ({ ...prev, startTime: true }));
                  setTimeout(() => setClockMode('MINUTE'), 200);
                } else {
                  setFormData(prev => ({ ...prev, startTime: `${date}T${h}:${val.toString().padStart(2, '0')}` }));
                  setTouched(prev => ({ ...prev, startTime: true }));
                }
              }}
              className={`absolute w-7 h-7 flex items-center justify-center text-xs font-bold transition rounded-full z-20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-academy-accent ${
                active ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              style={{ left: `${50 + x}%`, top: `${50 + y}%`, transform: 'translate(-50%, -50%)' }}
            >
              {clockMode === 'HOUR' ? val : val.toString().padStart(2, '0')}
            </button>
          );
        })}
        <div className="w-2 h-2 bg-violet-600 rounded-full z-10" />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            const date = formData.startTime?.split('T')[0] || new Date().toISOString().split('T')[0];
            setFormData(prev => ({ ...prev, startTime: `${date}T10:00` }));
            setShowClock(false);
          }}
          className="btn-secondary flex-1 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-academy-accent"
        >
          Reset (10:00)
        </button>
        <button
          type="button"
          onClick={() => setShowClock(false)}
          className="btn-primary flex-1 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-academy-accent"
        >
          Confirm Time
        </button>
      </div>
    </div>
  );

  // Form submission handler
  const handlePublish = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setTouched({
      title: true,
      startTime: true,
      totalQuestions: true,
      duration: true
    });

    if (activeStep !== 4) {
      return toast.error(`Please complete all 4 wizard stages. You must review Step 4 before publishing.`);
    }

    if (!isValid) {
      const firstError = Object.values(validationErrors)[0];
      return toast.error(firstError || 'Please correct the highlighted errors before publishing.');
    }

    setSaving(true);
    try {
      const formattedStartTime = formData.testType === 'MAIN' && formData.startTime
        ? new Date(formData.startTime).toISOString()
        : null;

      const finalTotalQuestions = formData.testType === 'MAIN' ? 50 : Number(formData.totalQuestions);
      const finalDuration = formData.testType === 'MAIN' ? 60 : Number(formData.duration);

      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        questionCount: finalTotalQuestions,
        totalQuestions: finalTotalQuestions,
        durationMinutes: finalDuration,
        duration: finalDuration,
        testType: formData.testType,
        marksPerQuestion: Number(formData.marksPerQuestion),
        totalMarks: Number(totalMarks),
        negativeMarking: Number(formData.negativeMarking),
        startTime: formattedStartTime,
        active: true
      };

      try {
        await api.post('/tests', payload);
      } catch (postErr) {
        if (postErr.response?.status === 404) {
          await api.post('/admin/tests', payload);
        } else {
          throw postErr;
        }
      }

      isSubmittedRef.current = true;
      toast.success('Assessment created successfully');
      navigate('/admin/tests/active?type=all');
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to create assessment';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full max-h-full overflow-hidden p-3 sm:p-4 lg:p-5 max-w-7xl mx-auto flex flex-col space-y-2.5 animate-in fade-in duration-200">

      {/* ── MASTHEAD ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-200 dark:border-[#262a33] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-900/50 text-violet-700 dark:text-violet-300 flex items-center justify-center shadow-xs">
            <FileText size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400 block">
                Assessment Authoring Studio
              </span>
              {isDirty && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                  Unsaved Draft
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-serif font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Create New Assessment
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRequestExit}
          className="px-3.5 py-2 min-h-[44px] rounded-xl bg-white dark:bg-[#15181e] border-2 border-slate-300 dark:border-white/20 hover:border-violet-500 dark:hover:border-violet-400 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c2027] hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
        >
          <ArrowLeft size={14} />
          <span>Exit to Dashboard</span>
        </button>
      </div>

      {/* ── MOBILE/TABLET SEGMENTED VIEW SWITCH (< lg) ────────────────── */}
      <div className="lg:hidden flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#15181e] border-2 border-slate-300 dark:border-white/20 shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab('editor')}
          className={`flex-1 min-h-[40px] py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mobileTab === 'editor'
              ? 'bg-violet-600 text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sliders size={14} />
          <span>Step Editor ({activeStep}/4)</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('specs')}
          className={`flex-1 min-h-[40px] py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mobileTab === 'specs'
              ? 'bg-violet-600 text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles size={14} />
          <span>Live Spec Sheet</span>
        </button>
      </div>

      {/* ── 2-COLUMN STUDIO LAYOUT ────────────────────────────────────────── */}
      <form onSubmit={(e) => e.preventDefault()} noValidate className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch overflow-hidden">

        {/* ── LEFT 8 COLS: AUTHORING WORKBENCH ────────────────────────────── */}
        <div className={`lg:col-span-8 flex-col h-full min-h-0 overflow-hidden space-y-2 ${mobileTab === 'editor' ? 'flex' : 'hidden lg:flex'}`}>

          {/* Step Progress Tabs (Progressive Disclosure - 100vh Fit) */}
          <div className="shrink-0 flex bg-slate-100 dark:bg-[#15181e] p-1.5 rounded-2xl border-2 border-slate-300 dark:border-white/20 gap-1.5 overflow-x-auto no-scrollbar shadow-xs">
            {[
              { num: 1, label: 'Identity & Subject' },
              { num: 2, label: 'Protocol & Mode' },
              { num: 3, label: 'Timebox & Quota' },
              { num: 4, label: 'Marking & Scoring' }
            ].map(step => {
              const accessible = isStepAccessible(step.num);
              return (
                <button
                  key={step.num}
                  type="button"
                  disabled={!accessible}
                  onClick={() => {
                    if (accessible) {
                      setActiveStep(step.num);
                    } else {
                      validateStep(activeStep);
                    }
                  }}
                  className={`flex-1 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
                    !accessible
                      ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-600'
                      : activeStep === step.num
                        ? 'bg-white dark:bg-[#202530] text-violet-700 dark:text-violet-300 shadow-sm border-2 border-violet-500 dark:border-violet-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-[#1a202c] cursor-pointer'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full text-[10px] font-mono font-bold flex items-center justify-center ${
                    activeStep === step.num
                      ? 'bg-violet-600 text-white'
                      : accessible
                        ? 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {step.num}
                  </span>
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>

          {/* STEP 1: Assessment Identity & Curriculum Track */}
          {activeStep === 1 && (
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-white dark:bg-[#15181e] rounded-xl border border-slate-200/90 dark:border-[#262a33] p-4 sm:p-5 shadow-xs space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#20242c]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[11px] font-mono font-bold flex items-center justify-center">1</span>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Identity & Subject Curriculum
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Step 1 of 4</span>
              </div>

            {/* Assessment Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="test-title" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Assessment Title <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                  {formData.title.length} chars (min 3)
                </span>
              </div>
              <input
                id="test-title"
                type="text"
                placeholder="e.g. Master's Qualifying Examination: Advanced Algorithms & Data Structures"
                value={formData.title}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, title: e.target.value }));
                  if (!touched.title) setTouched(prev => ({ ...prev, title: true }));
                }}
                onBlur={() => setTouched(prev => ({ ...prev, title: true }))}
                aria-invalid={touched.title && !!validationErrors.title}
                aria-describedby={touched.title && validationErrors.title ? "title-error" : undefined}
                className={`input-base ${
                  touched.title && validationErrors.title
                    ? 'border-rose-400 dark:border-rose-600 focus:border-rose-500'
                    : 'focus-visible:ring-2 focus-visible:ring-academy-accent'
                }`}
              />
              {touched.title && validationErrors.title && (
                <p id="title-error" role="alert" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 animate-in fade-in duration-150">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{validationErrors.title}</span>
                </p>
              )}
            </div>

            {/* Subject Track & Question Bank Availability Gauge */}
            <div>
              <label id="category-label" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Curriculum Discipline <span className="text-rose-500">*</span>
              </label>

              {/* Discipline Selection Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map(cat => {
                  const isSelected = formData.category === cat;
                  const catCount = categoryCounts[cat.toUpperCase()] ?? 0;
                  const isSufficientForMain = catCount >= 50;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[64px] ${
                        isSelected
                          ? 'border-violet-600 bg-violet-50/70 dark:bg-violet-950/30 text-violet-900 dark:text-violet-100 shadow-2xs ring-1 ring-violet-600'
                          : 'border-slate-200 dark:border-[#262a33] bg-slate-50/50 dark:bg-[#111317] hover:border-slate-300 dark:hover:border-[#383f4d] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold">{cat}</span>
                        {isSelected && <Check size={14} className="text-violet-600 dark:text-violet-400 shrink-0" />}
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono mt-1 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                        <span className="text-slate-500 dark:text-slate-400">Inventory:</span>
                        <span className={`font-bold tabular-nums ${isSufficientForMain ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {catCount} Qs
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Category Capacity Callout */}
              <div className="mt-3 p-3 bg-slate-50 dark:bg-[#111317] border border-slate-200 dark:border-[#262a33] rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Database size={14} className="text-violet-600 dark:text-violet-400 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400">
                    Active Question Repository: <strong className="text-slate-900 dark:text-slate-100">{formData.category}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                    {availableQuestions ?? '...'} questions catalogued
                  </span>
                  {availableQuestions !== null && (
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      availableQuestions >= 50
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                    }`}>
                      {availableQuestions >= 50 ? 'Exam Standard Ready (50+)' : `Requires ${50 - availableQuestions} more for MAIN`}
                    </span>
                  )}
                </div>
              </div>

              {/* Step 1 Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-[#20242c] flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep(1)) setActiveStep(2);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-violet-700 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-violet-500/25 border border-violet-400/30 hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <span>Continue to Protocol & Mode</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          </div>
        )}

          {/* STEP 2: Protocol & Examination Type */}
          {activeStep === 2 && (
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-white dark:bg-[#15181e] rounded-xl border border-slate-200/90 dark:border-[#262a33] p-4 sm:p-5 shadow-xs space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#20242c]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[11px] font-mono font-bold flex items-center justify-center">2</span>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Assessment Protocol & Mode
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Step 2 of 4</span>
              </div>

            {/* Visual Protocol Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: PRACTICE STUDIO */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleTypeSelect('PRACTICE')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTypeSelect('PRACTICE'); } }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  formData.testType === 'PRACTICE'
                    ? 'border-violet-600 bg-violet-50/60 dark:bg-violet-950/30 text-violet-950 dark:text-violet-100 ring-2 ring-violet-600/30 shadow-xs'
                    : 'border-slate-200 dark:border-[#262a33] bg-white dark:bg-[#15181e] hover:border-slate-300 dark:hover:border-[#383f4d]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 flex items-center justify-center">
                      <Zap size={18} />
                    </div>
                    {formData.testType === 'PRACTICE' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-violet-600 text-white">
                        <Check size={11} /> SELECTED
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400">SELECT</span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                    Practice Test Module
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                    Self-paced diagnostic drills. Candidate can take immediately upon publication with customizable question counts and durations.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-[#262a33] flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <span>Attempts: Unlimited</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Immediate Review</span>
                </div>
              </div>

              {/* Option B: MAIN PROCTORED EXAM */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleTypeSelect('MAIN')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTypeSelect('MAIN'); } }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  formData.testType === 'MAIN'
                    ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100 ring-2 ring-amber-600/30 shadow-xs'
                    : 'border-slate-200 dark:border-[#262a33] bg-white dark:bg-[#15181e] hover:border-slate-300 dark:hover:border-[#383f4d]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                      <Shield size={18} />
                    </div>
                    {formData.testType === 'MAIN' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-600 text-white">
                        <Check size={11} /> SELECTED
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400">SELECT</span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
                    <span>Main Exam</span>
                    <Lock size={12} className="text-amber-600 dark:text-amber-400" />
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                    Institutional proctored examination. Enforces mandatory standard: <strong>Fixed 50 Questions</strong> and <strong>Fixed 60 Minutes</strong>. Requires a future start window.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-[#262a33] flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <span>Single Monitored Sitting</span>
                  <span className="text-amber-700 dark:text-amber-400 font-semibold">Official Senate Record</span>
                </div>
              </div>
            </div>

            {/* Step 2 Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-[#20242c] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-4 py-2 min-h-[40px] rounded-xl border border-slate-200 dark:border-[#262a33] hover:bg-slate-50 dark:hover:bg-[#1c2027] text-slate-700 dark:text-slate-300 font-semibold text-xs transition cursor-pointer"
              >
                &larr; Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (validateStep(2)) setActiveStep(3);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-violet-700 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-violet-500/25 border border-violet-400/30 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <span>Continue to Timebox & Quota</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Timebox & Delivery Parameters */}
        {activeStep === 3 && (
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-white dark:bg-[#15181e] rounded-xl border border-slate-200/90 dark:border-[#262a33] p-4 sm:p-5 shadow-xs space-y-3.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#20242c]">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[11px] font-mono font-bold flex items-center justify-center">3</span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Scope, Volume & Delivery Timebox
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Step 3 of 4</span>
            </div>

            {formData.testType === 'MAIN' ? (
              /* Locked Standard for MAIN */
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                    <Lock size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Senate Invariant Specification (Locked)
                    </span>
                  </div>
                  <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed font-normal">
                    Per institutional academic guidelines, official proctored examinations are locked to <strong>50 questions</strong> and <strong>60 minutes duration</strong>. Manual volume overrides are prevented.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-[#111317] border border-slate-200 dark:border-[#262a33] rounded-xl text-center">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1 font-semibold">
                      Required Questions
                    </span>
                    <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                      50
                    </span>
                    <span className="text-[11px] text-amber-700 dark:text-amber-400 block mt-1 font-medium">
                      Locked Standard
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-[#111317] border border-slate-200 dark:border-[#262a33] rounded-xl text-center">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1 font-semibold">
                      Allocated Window
                    </span>
                    <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                      60m
                    </span>
                    <span className="text-[11px] text-amber-700 dark:text-amber-400 block mt-1 font-medium">
                      1 Hour Timed
                    </span>
                  </div>
                </div>

                {/* Scheduled Start Window Picker */}
                <div className="pt-3 border-t border-slate-100 dark:border-[#20242c] space-y-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="scheduled-datetime" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Scheduled Examination Window <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setUseNativeDatePicker(!useNativeDatePicker)}
                      className="text-[11px] text-violet-600 dark:text-violet-400 hover:underline font-medium cursor-pointer"
                    >
                      {useNativeDatePicker ? 'Use Interactive Clock/Calendar' : 'Use Direct Date Input'}
                    </button>
                  </div>

                  {useNativeDatePicker ? (
                    <div>
                      <input
                        id="scheduled-datetime"
                        type="datetime-local"
                        min={minDateTimeString}
                        value={formData.startTime}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, startTime: e.target.value }));
                          setTouched(prev => ({ ...prev, startTime: true }));
                        }}
                        onBlur={() => setTouched(prev => ({ ...prev, startTime: true }))}
                        aria-invalid={touched.startTime && !!validationErrors.startTime}
                        aria-describedby={touched.startTime && validationErrors.startTime ? "start-time-error" : undefined}
                        className={`input-base ${
                          touched.startTime && validationErrors.startTime
                            ? 'border-rose-400 dark:border-rose-600 focus:border-rose-500'
                            : 'focus-visible:ring-2 focus-visible:ring-academy-accent'
                        }`}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        aria-label="Select Date for Examination"
                        onClick={() => setShowCalendar(true)}
                        className="input-base text-left flex items-center justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-academy-accent"
                      >
                        <span className={formData.startTime ? 'text-slate-900 dark:text-slate-100 font-semibold' : 'text-slate-400 dark:text-slate-500'}>
                          {formData.startTime ? formData.startTime.split('T')[0] : 'Select Date'}
                        </span>
                        <Calendar size={14} className="text-violet-600 dark:text-violet-400" />
                      </button>
                      <button
                        type="button"
                        aria-label="Select Time for Examination"
                        onClick={() => setShowClock(true)}
                        className="input-base text-left flex items-center justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-academy-accent"
                      >
                        <span className={formData.startTime ? 'text-slate-900 dark:text-slate-100 font-semibold' : 'text-slate-400 dark:text-slate-500'}>
                          {formData.startTime?.split('T')[1] ? `${formData.startTime.split('T')[1]} (Local)` : 'Select Time'}
                        </span>
                        <Clock size={14} className="text-violet-600 dark:text-violet-400" />
                      </button>
                    </div>
                  )}

                  {touched.startTime && validationErrors.startTime && (
                    <p id="start-time-error" role="alert" className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 animate-in fade-in duration-150">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{validationErrors.startTime}</span>
                    </p>
                  )}

                  {/* Calendar Modal */}
                  {showCalendar && createPortal(
                    <div
                      className="fixed inset-0 z-[100] !m-0 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-black/80 backdrop-blur-md"
                      onClick={(e) => { if (e.target === e.currentTarget) setShowCalendar(false); }}
                    >
                      <div className="relative">
                        {renderCalendarContent()}
                      </div>
                    </div>,
                    document.body
                  )}

                  {/* Clock Modal */}
                  {showClock && createPortal(
                    <div
                      className="fixed inset-0 z-[100] !m-0 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-black/80 backdrop-blur-md"
                      onClick={(e) => { if (e.target === e.currentTarget) setShowClock(false); }}
                    >
                      <div className="relative">
                        {renderClockContent()}
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
              </div>
            ) : (
              /* Configurable Scope for PRACTICE */
              <div className="space-y-5">
                {/* Question Count Chips */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Number of Questions (Pool size) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs font-bold font-mono text-violet-700 dark:text-violet-400">
                      {formData.totalQuestions} Questions
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                    {QUESTION_PRESETS.map(n => {
                      const isExceeding = availableQuestions !== null && n > availableQuestions;
                      const isSelected = Number(formData.totalQuestions) === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          disabled={isExceeding}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, totalQuestions: n }));
                            setTouched(prev => ({ ...prev, totalQuestions: true }));
                          }}
                          className={`min-h-[40px] px-2 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                            isExceeding
                              ? 'opacity-30 cursor-not-allowed bg-slate-100 dark:bg-[#1a1e26] text-slate-400'
                              : isSelected
                                ? 'bg-violet-600 text-white font-bold shadow-xs'
                                : 'bg-slate-50 dark:bg-[#111317] border border-slate-200 dark:border-[#262a33] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c2027]'
                          }`}
                        >
                          {n} Qs
                        </button>
                      );
                    })}
                  </div>

                  {touched.totalQuestions && validationErrors.totalQuestions && (
                    <p id="qcount-error" role="alert" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 animate-in fade-in duration-150">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{validationErrors.totalQuestions}</span>
                    </p>
                  )}
                </div>

                {/* Duration Chips */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Allocated Duration <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAutoSyncDuration(1.5)}
                        className="text-[11px] text-violet-600 dark:text-violet-400 hover:underline font-medium cursor-pointer"
                        title="Compute duration based on 1.5 minutes per question"
                      >
                        Auto-sync (1.5m/q)
                      </button>
                      <span className="text-xs font-bold font-mono text-violet-700 dark:text-violet-400">
                        {formData.duration} Mins
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {DURATION_PRESETS.map(d => {
                      const isSelected = Number(formData.duration) === d;
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, duration: d }));
                            setTouched(prev => ({ ...prev, duration: true }));
                          }}
                          className={`min-h-[40px] px-2 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                            isSelected
                              ? 'bg-violet-600 text-white font-bold shadow-xs'
                              : 'bg-slate-50 dark:bg-[#111317] border border-slate-200 dark:border-[#262a33] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c2027]'
                          }`}
                        >
                          {d}m
                        </button>
                      );
                    })}
                  </div>

                  {touched.duration && validationErrors.duration && (
                    <p id="duration-error" role="alert" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 animate-in fade-in duration-150">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{validationErrors.duration}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3 Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-[#20242c] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="px-4 py-2 min-h-[40px] rounded-xl border border-slate-200 dark:border-[#262a33] hover:bg-slate-50 dark:hover:bg-[#1c2027] text-slate-700 dark:text-slate-300 font-semibold text-xs transition cursor-pointer"
              >
                &larr; Back
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (validateStep(3)) setActiveStep(4);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-violet-700 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-violet-500/25 border border-violet-400/30 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <span>Continue to Scoring Matrix</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Marking & Scoring Configuration */}
        {activeStep === 4 && (
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-white dark:bg-[#15181e] rounded-xl border border-slate-200/90 dark:border-[#262a33] p-4 sm:p-5 shadow-xs space-y-3.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#20242c]">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[11px] font-mono font-bold flex items-center justify-center">4</span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Marking Scheme & Negative Penalty
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Step 4 of 4</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Marks per Question */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Marks per Correct Answer
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {MARKS_OPTIONS.map(m => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={formData.marksPerQuestion === m}
                      onClick={() => setFormData(prev => ({ ...prev, marksPerQuestion: m }))}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        formData.marksPerQuestion === m
                          ? 'bg-violet-600 text-white shadow-xs'
                          : 'bg-slate-50 dark:bg-[#111317] border border-slate-200 dark:border-[#262a33] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c2027]'
                      }`}
                    >
                      <span>+{m}</span>
                      <span className="text-[10px] font-normal opacity-80">mark{m > 1 ? 's' : ''}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Value credited for every correct response
                </p>
              </div>

              {/* Negative Marking Penalty */}
              <div>
                <label id="negative-marking-label" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Negative Marking Penalty
                </label>
                <div className="relative" ref={penaltyDropdownRef}>
                  <button
                    type="button"
                    id="negative-marking-select"
                    aria-haspopup="listbox"
                    aria-expanded={showPenaltyDropdown}
                    aria-labelledby="negative-marking-label"
                    onClick={() => setShowPenaltyDropdown(!showPenaltyDropdown)}
                    className="w-full min-h-[44px] px-3.5 pr-10 rounded-xl bg-white dark:bg-[#151921] border border-slate-200/90 dark:border-[#262a33] text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between hover:border-violet-400 dark:hover:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-600 transition-all shadow-2xs cursor-pointer text-left"
                  >
                    <span>
                      {PENALTY_OPTIONS.find(opt => Number(opt.value) === Number(formData.negativeMarking))?.label || 'None (0.00)'}
                    </span>
                    <ChevronDown size={15} className={`text-slate-400 dark:text-slate-400 transition-transform duration-200 ${showPenaltyDropdown ? 'rotate-180 text-violet-600 dark:text-violet-400' : ''}`} />
                  </button>

                  {showPenaltyDropdown && (
                    <div
                      role="listbox"
                      aria-labelledby="negative-marking-label"
                      className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#151921] border border-slate-200/90 dark:border-[#262a33] rounded-xl shadow-xl dark:shadow-black/70 z-50 overflow-hidden py-1 animate-in fade-in duration-150"
                    >
                      {PENALTY_OPTIONS.map(opt => {
                        const isSelected = Number(formData.negativeMarking) === Number(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, negativeMarking: Number(opt.value) }));
                              setShowPenaltyDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                              isSelected
                                ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-bold'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1c2027]'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <CheckCircle2 size={13} className="text-violet-600 dark:text-violet-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <MinusCircle size={11} className="text-slate-400 shrink-0" />
                  <span>{penaltyImpact.text}</span>
                </p>
              </div>
            </div>

            {/* Step 4 Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-[#20242c] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="px-4 py-2 min-h-[40px] rounded-xl border border-slate-200 dark:border-[#262a33] hover:bg-slate-50 dark:hover:bg-[#1c2027] text-slate-700 dark:text-slate-300 font-semibold text-xs transition cursor-pointer"
              >
                &larr; Back to Timebox
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={saving || !isValid}
                className={`px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md active:scale-[0.98] ${
                  isValid && !saving
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25 border border-emerald-400/30 hover:-translate-y-0.5'
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    <span>Publish Assessment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        </div>

        {/* ── RIGHT 4 COLS: COMPACT LIVE ASSESSMENT SPEC SHEET (LOCKED POSITION & PROGRESSIVE DISCLOSURE) ─────────────── */}
        <div className={`lg:col-span-4 flex-col h-full min-h-0 overflow-hidden ${mobileTab === 'specs' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="h-full flex flex-col justify-between bg-white dark:bg-[#15181e] rounded-2xl border border-slate-300/90 dark:border-white/15 p-4 shadow-xs overflow-hidden">

            {/* Spec Sheet Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-[#20242c] shrink-0 h-9">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-violet-600 dark:text-violet-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Assessment Specs
                </h3>
              </div>
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                activeStep < 2
                  ? 'bg-slate-100 dark:bg-[#1f242e] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10'
                  : formData.testType === 'MAIN'
                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                  : 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/40'
              }`}>
                {activeStep < 2 ? 'Mode Pending (Step 2)' : formData.testType === 'MAIN' ? 'Main Exam' : 'Practice Test'}
              </span>
            </div>

            {/* Spec Matrix - Strictly Locked Geometry & Progressive Disclosure */}
            <div className="space-y-2 text-xs py-1 shrink-0">
              {/* Row 1: Discipline (Configured in Step 1) */}
              <div className="h-6 flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Discipline:</span>
                <strong className="text-slate-900 dark:text-slate-100 font-semibold">{formData.category}</strong>
              </div>

              {/* Row 2: Protocol Mode (Configured in Step 2) */}
              <div className="h-6 flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Protocol Mode:</span>
                {activeStep >= 2 ? (
                  <strong className="text-slate-900 dark:text-slate-100 font-semibold">
                    {formData.testType === 'MAIN' ? 'Official Proctored' : 'Self-Paced Practice'}
                  </strong>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 italic text-[11px] font-mono">Step 2 Pending</span>
                )}
              </div>

              {/* Row 3: Question Count (Configured in Step 3) */}
              <div className="h-6 flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Question Count:</span>
                {activeStep >= 3 ? (
                  <strong className="text-slate-900 dark:text-slate-100 font-mono font-bold tabular-nums">
                    {formData.testType === 'MAIN' ? '50 Qs (Standard)' : `${formData.totalQuestions} Qs`}
                  </strong>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 italic text-[11px] font-mono">Step 3 Pending</span>
                )}
              </div>

              {/* Row 4: Allocated Time (Configured in Step 3) */}
              <div className="h-6 flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Allocated Time:</span>
                {activeStep >= 3 ? (
                  <strong className="text-slate-900 dark:text-slate-100 font-mono font-bold tabular-nums">
                    {formData.testType === 'MAIN' ? '60 Mins (Fixed)' : `${formData.duration} Mins`}
                  </strong>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 italic text-[11px] font-mono">Step 3 Pending</span>
                )}
              </div>

              {/* Row 5: Maximum Marks (Configured in Step 4) */}
              <div className="h-6 flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-[#20242c]">
                <span>Maximum Marks:</span>
                {activeStep >= 4 ? (
                  <strong className="text-violet-700 dark:text-violet-400 font-mono font-bold text-sm tabular-nums">
                    {totalMarks} Marks
                  </strong>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 italic text-[11px] font-mono">Step 4 Pending</span>
                )}
              </div>

              {/* Row 6: Passing Threshold (Configured in Step 4) */}
              <div className="h-6 flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Passing Threshold (40%):</span>
                {activeStep >= 4 ? (
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold tabular-nums">
                    {passingMarks} Marks
                  </strong>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 italic text-[11px] font-mono">Step 4 Pending</span>
                )}
              </div>

              {/* Row 7: Penalty / Negative Marking (Configured in Step 4) */}
              <div className="h-6 flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Penalty:</span>
                {activeStep >= 4 ? (
                  <strong className="text-rose-600 dark:text-rose-400 font-mono font-bold tabular-nums">
                    {formData.negativeMarking > 0 ? `-${formData.negativeMarking} Marks` : 'None (0.00)'}
                  </strong>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 italic text-[11px] font-mono">Step 4 Pending</span>
                )}
              </div>

              {/* Row 8: Launch Window (if MAIN) */}
              {formData.testType === 'MAIN' && (
                <div className="h-6 flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-[#20242c]">
                  <span>Launch Window:</span>
                  {activeStep >= 3 ? (
                    <strong className="text-slate-900 dark:text-slate-100 font-mono text-[11px] truncate max-w-[170px]">
                      {formData.startTime ? new Date(formData.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unscheduled'}
                    </strong>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 italic text-[11px] font-mono">Step 3 Pending</span>
                  )}
                </div>
              )}
            </div>

            {/* Live Readiness Verification Checklist */}
            <div className="p-2.5 bg-slate-50 dark:bg-[#111317] border border-slate-200/90 dark:border-[#262a33] rounded-xl space-y-1 text-xs shrink-0">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5">
                Readiness Verification
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  {formData.title.trim().length >= 3 ? (
                    <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                  )}
                  <span className={formData.title.trim().length >= 3 ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}>
                    Title defined (min 3 chars)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {formData.category ? (
                    <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                  )}
                  <span className={formData.category ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}>
                    Discipline verified ({formData.category})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {!validationErrors.totalQuestions ? (
                    <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle size={12} className="text-amber-500 shrink-0" />
                  )}
                  <span className={!validationErrors.totalQuestions ? 'text-slate-700 dark:text-slate-300' : 'text-amber-600 dark:text-amber-400 font-semibold'}>
                    {formData.testType === 'MAIN' ? 'Repository capacity (50+)' : 'Questions in bounds'}
                  </span>
                </div>
                {formData.testType === 'MAIN' && (
                  <div className="flex items-center gap-1.5">
                    {formData.startTime && !validationErrors.startTime ? (
                      <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                    )}
                    <span className={formData.startTime && !validationErrors.startTime ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}>
                      Future launch window set
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Primary Action Dock */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-[#20242c] shrink-0">
              {activeStep < 4 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (validateStep(activeStep)) {
                      setActiveStep(prev => prev + 1);
                    }
                  }}
                  className="w-full py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 text-white bg-gradient-to-r from-violet-600 via-violet-700 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all cursor-pointer shadow-md shadow-violet-500/25 border border-violet-400/30 active:scale-[0.98]"
                >
                  <span>Proceed to Step {activeStep + 1} →</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={saving || !isValid}
                  className={`w-full py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 text-white transition-all cursor-pointer shadow-md active:scale-[0.98] ${
                    isValid && !saving
                      ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25 border border-emerald-400/30'
                      : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Publishing Assessment...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Publish Assessment</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleRequestExit}
                className="w-full py-1.5 px-3 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1f242e] transition cursor-pointer"
              >
                Cancel & Return
              </button>
            </div>

            {activeStep < 4 ? (
              <p className="text-[10px] text-center text-slate-500 dark:text-slate-400 font-medium">
                Step {activeStep} of 4 • Complete all stages to publish
              </p>
            ) : !isValid ? (
              <p className="text-[10px] text-center text-amber-600 dark:text-amber-400 font-medium">
                Complete required parameters to publish
              </p>
            ) : (
              <p className="text-[10px] text-center text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ Ready to publish assessment
              </p>
            )}
          </div>
        </div>
      </form>

      {/* Confirmation Dialog on Unsaved Exit */}
      <ConfirmModal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={() => {
          setShowExitConfirm(false);
          isSubmittedRef.current = true;
          navigate('/admin/dashboard');
        }}
        title="Discard Unsaved Assessment?"
        message="You have unsaved changes in this assessment configuration. If you leave now, all your inputs will be discarded."
        confirmText="Discard and Leave"
        cancelText="Stay and Edit"
      />
    </div>
  );
};

export default AdminTestMaker;
