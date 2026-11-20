import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Database,
  Plus,
  Trash2,
  Edit3,
  Loader2,
  HelpCircle,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Code2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import api from '../utils/api';
import { Skeleton } from '../components/common/Skeleton';
import toast from 'react-hot-toast';
import BackToDashboard from '../components/admin/BackToDashboard';
import ConfirmModal from '../components/ConfirmModal';

const CATEGORIES = ["ALL", "JAVA", "PYTHON", "ASP.NET", "APTITUDE", "DBMS", "CLOUD"];

// Helper component for rendering code blocks and syntax-formatted text
const QuestionContentRenderer = ({ content }) => {
  const [copied, setCopied] = useState(false);

  if (!content) return null;

  // Check if content has Markdown code fences: ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const hasFencedCode = codeBlockRegex.test(content);

  if (hasFencedCode) {
    const parts = [];
    let lastIndex = 0;
    let match;
    const regex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        });
      }
      parts.push({
        type: 'code',
        lang: match[1] || 'code',
        code: match[2].trimEnd()
      });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex)
      });
    }

    return (
      <div className="space-y-2">
        {parts.map((p, idx) => {
          if (p.type === 'code') {
            return (
              <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 my-2.5 shadow-inner">
                <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 uppercase font-semibold text-violet-400">
                    <Code2 size={13} />
                    <span>{p.lang || 'SNIPPET'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(p.code);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                      toast.success('Snippet copied');
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                    aria-label="Copy snippet code"
                  >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3.5 text-xs font-mono overflow-x-auto leading-relaxed custom-scrollbar">
                  <code>{p.code}</code>
                </pre>
              </div>
            );
          }
          return (
            <p key={idx} className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap font-sans">
              {p.content}
            </p>
          );
        })}
      </div>
    );
  }

  // Check for inline code snippet patterns (e.g. indentation or keywords like class, def, select, public static void)
  const isCodeLike = /^\s*(public\s+class|def\s+|import\s+|class\s+|#include|SELECT\s+|function\s+|System\.out\.println)/m.test(content);

  if (isCodeLike) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 my-2 shadow-inner">
        <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5 uppercase font-semibold text-violet-400">
            <Code2 size={13} />
            <span>CODE SNIPPET</span>
          </span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(content);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
              toast.success('Snippet copied');
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
            aria-label="Copy code snippet"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <pre className="p-3.5 text-xs font-mono overflow-x-auto leading-relaxed custom-scrollbar">
          <code>{content}</code>
        </pre>
      </div>
    );
  }

  return (
    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap font-sans">
      {content}
    </p>
  );
};

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form State & Inline Validation
  const [formData, setFormData] = useState({
    title: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    category: 'JAVA',
    difficulty: 'MEDIUM'
  });
  const [errors, setErrors] = useState({});

  const modalRef = useRef(null);
  const firstInputRef = useRef(null);
  const previousFocusRef = useRef(null);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/questions/bank');
      setQuestions(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to sync question library');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Modal focus trap & ESC handling
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
      previousFocusRef.current = document.activeElement;
      const timer = setTimeout(() => {
        firstInputRef.current?.focus();
      }, 50);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = 'unset';
      };
    } else {
      document.body.style.overflow = 'unset';
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    }
  }, [showModal]);

  useEffect(() => {
    if (!showModal || showDeleteConfirm) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, showDeleteConfirm]);

  // Validation function
  const validateForm = () => {
    const errs = {};
    const stem = (formData.title || '').trim();
    if (!stem) {
      errs.title = 'Question text is required';
    } else if (stem.length < 5) {
      errs.title = 'Question text must be at least 5 characters long';
    }

    if (!formData.optionA.trim()) errs.optionA = 'Option A is required';
    if (!formData.optionB.trim()) errs.optionB = 'Option B is required';
    if (!formData.optionC.trim()) errs.optionC = 'Option C is required';
    if (!formData.optionD.trim()) errs.optionD = 'Option D is required';

    if (!['A', 'B', 'C', 'D'].includes(formData.correctAnswer)) {
      errs.correctAnswer = 'Please designate a valid correct answer key (A, B, C, or D)';
    }

    if (!formData.category) {
      errs.category = 'Category is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openAddModal = () => {
    setFormData({
      title: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      category: selectedCategory !== 'ALL' ? selectedCategory : 'JAVA',
      difficulty: 'MEDIUM'
    });
    setErrors({});
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (q) => {
    setFormData({
      title: q.title || q.questionText || '',
      optionA: q.optionA || '',
      optionB: q.optionB || '',
      optionC: q.optionC || '',
      optionD: q.optionD || '',
      correctAnswer: q.correctAnswer || 'A',
      category: (q.category || q.tag || q.topic || 'JAVA').toUpperCase(),
      difficulty: (q.difficulty || q.difficultyLevel || 'MEDIUM').toUpperCase()
    });
    setErrors({});
    setEditingId(q.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setErrors({});
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please resolve the highlighted form errors');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        questionText: formData.title.trim(),
        optionA: formData.optionA.trim(),
        optionB: formData.optionB.trim(),
        optionC: formData.optionC.trim(),
        optionD: formData.optionD.trim(),
        correctAnswer: formData.correctAnswer,
        category: formData.category.toUpperCase(),
        difficultyLevel: formData.difficulty.toUpperCase(),
        difficulty: formData.difficulty.toUpperCase()
      };

      if (editingId) {
        await api.put(`/questions/bank/${editingId}`, payload);
        toast.success('Question updated successfully');
      } else {
        await api.post('/questions/bank', payload);
        toast.success('Question added to repository');
      }

      closeModal();
      fetchQuestions();
    } catch (err) {
      const msg = err.response?.data?.message || (editingId ? 'Update failed' : 'Failed to create question');
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const deleteQuestion = (id) => {
    setPendingDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await api.delete(`/questions/${pendingDeleteId}`);
      toast.success('Question removed from repository');
      fetchQuestions();
    } catch (err) {
      const msg = err.response?.data?.message || 'Delete operation failed';
      toast.error(msg);
    }
  };

  // Category counts and capacity calculations
  const categoryStats = useMemo(() => {
    const stats = {};
    CATEGORIES.forEach(c => { stats[c] = 0; });
    questions.forEach(q => {
      const cat = (q.category || q.tag || q.topic || "UNCATEGORIZED").toUpperCase();
      stats[cat] = (stats[cat] || 0) + 1;
    });
    stats["ALL"] = questions.length;
    return stats;
  }, [questions]);

  // Deterministic Filtering by Subject Category & Search Query (in Title, Stem, or Options A-D)
  const filteredQuestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return questions.filter(q => {
      const cat = (q.category || q.tag || q.topic || "UNCATEGORIZED").toUpperCase();
      const matchesCategory = selectedCategory === "ALL" || cat === selectedCategory;

      if (!matchesCategory) return false;
      if (!query) return true;

      const titleMatch = (q.title || '').toLowerCase().includes(query);
      const stemMatch = (q.questionText || '').toLowerCase().includes(query);
      const optAMatch = (q.optionA || '').toLowerCase().includes(query);
      const optBMatch = (q.optionB || '').toLowerCase().includes(query);
      const optCMatch = (q.optionC || '').toLowerCase().includes(query);
      const optDMatch = (q.optionD || '').toLowerCase().includes(query);

      return titleMatch || stemMatch || optAMatch || optBMatch || optCMatch || optDMatch;
    });
  }, [questions, selectedCategory, searchQuery]);

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, pageSize]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize));
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-[#262a33]">
        <div>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-400 block mb-0.5">
            Institutional Repository
          </span>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Question Bank
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Centralized inventory of curriculum items (<span className="font-mono font-semibold">{questions.length}</span> total)
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 w-full sm:w-auto self-end">
          <button
            type="button"
            onClick={openAddModal}
            className="min-h-[44px] px-4 rounded-xl bg-gradient-to-r from-violet-600 via-violet-700 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 apple-shimmer-btn active:scale-[0.96] text-white text-xs font-semibold shadow-md shadow-violet-500/25 border border-violet-400/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>New Question</span>
          </button>
          <BackToDashboard />
        </div>
      </div>

      {/* REPOSITORY CAPACITY & EXAM QUOTA TRACKING */}
      <div className="bg-white dark:bg-[#15181e] border border-slate-200/90 dark:border-[#262a33] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/40 text-violet-700 dark:text-violet-300 flex items-center justify-center font-bold shrink-0">
            <Database size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Question Inventory & Exam Quotas
              </h3>
              {selectedCategory !== 'ALL' ? (
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  (categoryStats[selectedCategory] || 0) >= 50
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                }`}>
                  {(categoryStats[selectedCategory] || 0) >= 50 ? 'Official Exam Ready (50+)' : `${50 - (categoryStats[selectedCategory] || 0)} More Needed for Exam`}
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/40">
                  Active Repository
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {selectedCategory !== 'ALL'
                ? `Subject: ${selectedCategory} — ${categoryStats[selectedCategory] || 0} questions catalogued (Official exam standard: 50 questions)`
                : 'Centralized inventory catalogued across 6 institutional subject tracks'}
            </p>
          </div>
        </div>

        <div className="w-full md:max-w-xs space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-slate-500 dark:text-slate-400">
              {selectedCategory !== 'ALL' ? `${selectedCategory} Quota` : 'Total Items in Bank'}
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              {selectedCategory !== 'ALL'
                ? `${categoryStats[selectedCategory] || 0} / 50`
                : `${questions.length}`}
            </span>
          </div>
          {selectedCategory !== 'ALL' ? (
            <div className="w-full bg-slate-100 dark:bg-[#101216] rounded-full h-2.5 overflow-hidden border border-slate-200/60 dark:border-[#262a33]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (categoryStats[selectedCategory] || 0) >= 50
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                    : 'bg-gradient-to-r from-violet-500 to-indigo-500'
                }`}
                style={{
                  width: `${Math.min(100, Math.round(((categoryStats[selectedCategory] || 0) / 50) * 100))}%`
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <span>6 disciplines catalogued</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active Repository</span>
            </div>
          )}
        </div>
      </div>

      {/* CATEGORY FILTER TABS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider px-1">
          <span>Filter by Subject Category</span>
          {selectedCategory !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className="text-rose-600 dark:text-rose-400 hover:underline text-xs normal-case font-medium cursor-pointer"
            >
              Reset to All
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100/90 dark:bg-[#15181e] rounded-2xl border border-slate-300/90 dark:border-white/15">
          {CATEGORIES.map(cat => {
            const count = categoryStats[cat] || 0;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2 hover:-translate-y-0.5 active:scale-[0.98] ${
                  isSelected
                    ? 'bg-white dark:bg-[#202530] text-violet-700 dark:text-violet-300 shadow-xs border border-violet-300 dark:border-violet-700/80 ring-1 ring-violet-500/20'
                    : 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/80 dark:hover:bg-white/5 border border-transparent hover:border-slate-300/80 dark:hover:border-white/10'
                }`}
              >
                <span>{cat === 'ALL' ? 'All Subjects' : cat}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-bold'
                    : 'bg-slate-200/70 dark:bg-[#252b36] text-slate-600 dark:text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SEARCH BAR (Question text or Option content) */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={16} />
        <input
          type="text"
          placeholder="Search by question text or option content (A, B, C, D)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white dark:bg-[#15181e] border border-slate-300/90 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 rounded-xl pl-10 pr-10 min-h-[44px] text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20 shadow-xs transition-all duration-200"
          aria-label="Search questions by text or option choices"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-w-[28px] min-h-[28px] flex items-center justify-center cursor-pointer"
            aria-label="Clear search input"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* QUESTION INVENTORY LIST */}
      <div className="space-y-4">
        {/* COUNTER & PAGE SIZE CONTROLS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium px-1">
          <div>
            {filteredQuestions.length > 0 ? (
              <span>
                Showing <strong className="text-slate-800 dark:text-slate-200 font-mono">{(currentPage - 1) * pageSize + 1}</strong> - <strong className="text-slate-800 dark:text-slate-200 font-mono">{Math.min(currentPage * pageSize, filteredQuestions.length)}</strong> of <strong className="text-slate-800 dark:text-slate-200 font-mono">{filteredQuestions.length}</strong> questions
              </span>
            ) : (
              <span>0 questions found</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] uppercase tracking-wider">Per Page:</span>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#15181e] p-1 rounded-xl border border-slate-200 dark:border-[#262a33]">
              {[10, 20, 50].map(sz => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setPageSize(sz)}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition-all cursor-pointer ${
                    pageSize === sz
                      ? 'bg-white dark:bg-[#202530] text-violet-700 dark:text-violet-300 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* LOADING SKELETONS */}
        {loading ? (
          <div role="status" aria-busy="true" aria-label="Loading question library" className="grid grid-cols-1 gap-4">
            <span className="sr-only">Loading question library...</span>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} aria-hidden="true" className="bg-white dark:bg-[#15181e] border border-slate-200/90 dark:border-[#262a33] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex gap-2.5">
                  <Skeleton className="h-5 w-14 rounded-md" />
                  <Skeleton className="h-5 w-20 rounded-md" />
                </div>
                <Skeleton className="h-5 w-4/5 rounded" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {[1, 2, 3, 4].map((opt) => (
                    <Skeleton key={opt} className="h-9 w-full rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {paginatedQuestions.map((q, index) => {
              const globalIndex = (currentPage - 1) * pageSize + index + 1;

              return (
                <div
                  key={q.id}
                  className={`bg-white dark:bg-[#15181e] border border-slate-200/90 dark:border-[#262a33] rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-lg hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-[#383d4a] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col sm:flex-row items-start justify-between gap-4 animate-apple-row-${(index % 5) + 1}`}
                >
                  <div className="flex-1 pr-2 min-w-0 w-full">
                    {/* Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#101216] px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-[#262a33] font-mono">
                        #{String(globalIndex).padStart(3, '0')}
                      </span>
                      <span className="text-[11px] font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 px-2.5 py-0.5 rounded-md border border-violet-200 dark:border-violet-800/40 uppercase tracking-wider">
                        {q.category || q.tag || q.topic || "UNCATEGORIZED"}
                      </span>
                    </div>

                    {/* Question Content with Code Detection */}
                    <div className="mb-4">
                      <QuestionContentRenderer content={q.title || q.questionText} />
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {['A', 'B', 'C', 'D'].map(opt => {
                        const isCorrect = q.correctAnswer === opt;
                        const optionText = q[`option${opt}`];
                        return (
                          <div
                            key={opt}
                            className={`p-3 rounded-xl text-xs flex items-start gap-2.5 border transition-all ${
                              isCorrect
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/50 text-emerald-950 dark:text-emerald-200 font-medium shadow-xs'
                                : 'bg-slate-50/70 dark:bg-[#101216] border-slate-200/80 dark:border-[#262a33] text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                              isCorrect ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-200 dark:bg-[#1f232b] text-slate-700 dark:text-slate-300'
                            }`}>
                              {opt}
                            </span>
                            <span className="flex-1 break-words leading-relaxed font-sans text-xs">{optionText || '—'}</span>
                            {isCorrect && (
                              <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 ml-auto shrink-0 mt-0.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions (Minimum 44px tap targets) */}
                  <div className="flex sm:flex-col gap-1.5 shrink-0 self-end sm:self-start pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-[#262a33] w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => openEditModal(q)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 bg-slate-50 dark:bg-[#101216] hover:bg-violet-50 dark:hover:bg-violet-950/40 border border-slate-200 dark:border-[#262a33] hover:border-violet-200 dark:hover:border-violet-800/40 rounded-xl transition-all cursor-pointer"
                      title="Edit Question"
                      aria-label={`Edit question #${globalIndex}`}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteQuestion(q.id)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-50 dark:bg-[#101216] hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-[#262a33] hover:border-rose-200 dark:hover:border-rose-800/40 rounded-xl transition-all cursor-pointer"
                      title="Delete Question"
                      aria-label={`Delete question #${globalIndex}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredQuestions.length === 0 && (
              <div className="bg-white dark:bg-[#15181e] border border-dashed border-slate-300 dark:border-[#262a33] rounded-2xl py-16 text-center flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-[#101216] border border-slate-200 dark:border-[#262a33] flex items-center justify-center text-slate-400 mb-3">
                  <HelpCircle size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No questions found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  {searchQuery
                    ? `No items match "${searchQuery}" in category ${selectedCategory}.`
                    : `No questions have been catalogued under category ${selectedCategory} yet.`}
                </p>
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('ALL');
                      setSearchQuery('');
                    }}
                    className="min-h-[40px] px-3.5 rounded-xl border border-slate-200 dark:border-[#262a33] bg-white dark:bg-[#15181e] text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Reset Filters
                  </button>
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="min-h-[40px] px-4 rounded-xl bg-gradient-to-r from-violet-600 via-violet-700 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-violet-500/25 border border-violet-400/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Create Question</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ACCESSIBLE PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <nav aria-label="Question inventory pagination" className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200/80 dark:border-[#262a33]">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Page <span className="font-semibold text-slate-800 dark:text-slate-200">{currentPage}</span> of <span className="font-semibold text-slate-800 dark:text-slate-200">{totalPages}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-[#262a33] bg-white dark:bg-[#15181e] text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#1c2028] transition-all cursor-pointer"
                aria-label="First page"
              >
                <ChevronsLeft size={16} />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-[#262a33] bg-white dark:bg-[#15181e] text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#1c2028] transition-all cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                // Only show nearby pages
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-violet-600 text-white shadow-xs'
                          : 'border border-slate-200 dark:border-[#262a33] bg-white dark:bg-[#15181e] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1c2028]'
                      }`}
                      aria-current={currentPage === pageNum ? 'page' : undefined}
                      aria-label={`Go to page ${pageNum}`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 2 ||
                  pageNum === currentPage + 2
                ) {
                  return <span key={pageNum} className="px-1 text-slate-400 font-mono text-xs">...</span>;
                }
                return null;
              })}

              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-[#262a33] bg-white dark:bg-[#15181e] text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#1c2028] transition-all cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-[#262a33] bg-white dark:bg-[#15181e] text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#1c2028] transition-all cursor-pointer"
                aria-label="Last page"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </nav>
        )}
      </div>

      {/* ADD / EDIT QUESTION MODAL */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] !m-0 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div
            aria-hidden="true"
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/75 backdrop-blur-xs sm:backdrop-blur-sm transition-opacity duration-200"
            onClick={closeModal}
          />

          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="question-modal-title"
            className="relative z-50 bg-white dark:bg-[#15181e] border border-slate-200/90 dark:border-white/10 rounded-2xl w-full max-w-3xl max-h-[92dvh] flex flex-col my-auto overflow-hidden shadow-2xl isolate animate-apple-modal"
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/70 dark:bg-[#111317] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200/80 dark:border-violet-800/40 flex items-center justify-center font-bold">
                  <Database size={18} />
                </div>
                <div>
                  <h2 id="question-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {editingId ? 'Edit Question Record' : 'Add New Question to Library'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Configure question stem, programming code blocks, choices, and answer key
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close dialog"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1f232b] border border-transparent hover:border-slate-300/80 dark:hover:border-white/15 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* LEFT: Question Stem, Category, Difficulty */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Question Stem / Text <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      ref={firstInputRef}
                      value={formData.title}
                      onChange={e => {
                        setFormData({...formData, title: e.target.value});
                        if (errors.title) setErrors({...errors, title: null});
                      }}
                      className={`w-full bg-slate-50 dark:bg-[#101216] border rounded-xl p-3.5 text-xs font-mono font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:bg-white dark:focus:bg-[#15181e] focus:ring-2 transition-all min-h-[160px] resize-none leading-relaxed ${
                        errors.title
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                          : 'border-slate-200 dark:border-[#262a33] focus:border-violet-600 focus:ring-violet-500/20'
                      }`}
                      placeholder={`Enter question or code snippet...\nTips: Use \`\`\`java or \`\`\`python code fences for syntax highlighting.`}
                      aria-invalid={!!errors.title}
                      aria-describedby={errors.title ? "title-error" : undefined}
                    />
                    {errors.title && (
                      <p id="title-error" className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <AlertCircle size={12} />
                        <span>{errors.title}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Subject Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={e => {
                        setFormData({...formData, category: e.target.value});
                        if (errors.category) setErrors({...errors, category: null});
                      }}
                      className="w-full bg-slate-50 dark:bg-[#101216] border border-slate-200 dark:border-[#262a33] rounded-xl px-3.5 min-h-[44px] text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-violet-600 cursor-pointer"
                    >
                      {CATEGORIES.filter(c => c !== "ALL").map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* RIGHT: Answer Options (A - D) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Answer Options A - D <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">Mark correct key below</span>
                  </div>

                  {['A', 'B', 'C', 'D'].map(opt => {
                    const isCorrect = formData.correctAnswer === opt;
                    const optKey = `option${opt}`;
                    const hasError = !!errors[optKey];

                    return (
                      <div key={opt} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 px-1">
                          <span>Option {opt}</span>
                          {isCorrect && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                              <CheckCircle2 size={12} /> Correct Key
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, correctAnswer: opt})}
                            className={`min-w-[36px] min-h-[40px] rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border transition-all cursor-pointer ${
                              isCorrect
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-slate-100 dark:bg-[#1f232b] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#2f3542] hover:border-slate-400'
                            }`}
                            title={`Mark Option ${opt} as correct key`}
                            aria-label={`Mark Option ${opt} as correct answer`}
                          >
                            {opt}
                          </button>
                          <input
                            value={formData[optKey]}
                            onChange={e => {
                              setFormData({...formData, [optKey]: e.target.value});
                              if (errors[optKey]) setErrors({...errors, [optKey]: null});
                            }}
                            className={`w-full rounded-xl px-3.5 min-h-[40px] text-xs font-mono text-slate-900 dark:text-slate-100 outline-none border transition-all ${
                              hasError
                                ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/10'
                                : isCorrect
                                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700/60 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                                  : 'bg-slate-50 dark:bg-[#101216] border-slate-200 dark:border-[#262a33] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-[#15181e] focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20'
                            }`}
                            placeholder={`Enter choice ${opt} text`}
                            aria-invalid={hasError}
                          />
                        </div>
                        {hasError && (
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 pl-11">{errors[optKey]}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CORRECT KEY DESIGNATION & ACTIONS */}
              <div className="pt-5 border-t border-slate-200/80 dark:border-[#262a33] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Designate Correct Key:
                  </span>
                  <div className="flex gap-2">
                    {['A', 'B', 'C', 'D'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFormData({...formData, correctAnswer: opt})}
                        className={`min-w-[44px] min-h-[44px] rounded-xl font-bold text-xs transition-all border cursor-pointer ${
                          formData.correctAnswer === opt
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-[#101216] border-slate-200 dark:border-[#262a33] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f232b]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="min-h-[44px] px-5 rounded-xl border border-slate-300/90 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1f232b] hover:border-slate-400 dark:hover:border-white/30 text-xs font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="min-h-[44px] px-6 rounded-xl bg-gradient-to-r from-violet-600 via-violet-700 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/30 text-white text-xs font-semibold shadow-md shadow-violet-500/25 border border-violet-400/30 flex items-center gap-2 cursor-pointer transition-all duration-200"
                  >
                    {saving && <Loader2 size={15} className="animate-spin" />}
                    <span>{saving ? 'Saving...' : (editingId ? 'Update Question' : 'Save to Library')}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* DELETE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={executeDelete}
        title="Delete Question Record?"
        message="Are you sure you want to permanently delete this question from the question repository? Assessments currently referencing it will not be damaged."
        confirmText="Delete Question"
      />
    </div>
  );
};

export default QuestionBank;
