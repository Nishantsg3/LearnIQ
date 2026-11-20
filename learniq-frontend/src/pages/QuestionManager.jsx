import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Plus,
  Trash2,
  Edit3,
  Database,
  CheckCircle2,
  HelpCircle,
  X,
  FileText,
  Loader2,
  ArrowLeft,
  Clock,
  Shield,
  Zap,
  Code2,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import api from '../utils/api';
import BackToDashboard from '../components/admin/BackToDashboard';
import ConfirmModal from '../components/ConfirmModal';
import { Skeleton } from '../components/common/Skeleton';

// Helper component for rendering code blocks and syntax-formatted text
const QuestionContentRenderer = ({ content }) => {
  const [copied, setCopied] = useState(false);

  if (!content) return null;

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
            <p key={idx} className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
              {p.content}
            </p>
          );
        })}
      </div>
    );
  }

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
    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
      {content}
    </p>
  );
};

const emptyForm = {
  title: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A',
  difficulty: 'MEDIUM'
};

const QuestionManager = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const editorModalRef = useRef(null);
  const firstInputRef = useRef(null);
  const previousFocusRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [testRes, qRes] = await Promise.all([
        api.get(`/tests/${testId}`),
        api.get(`/questions/test/${testId}`)
      ]);
      setTest(testRes.data);
      setQuestions(Array.isArray(qRes.data) ? qRes.data : []);
    } catch {
      toast.error('Failed to load assessment data');
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Focus trap & modal accessibility
  useEffect(() => {
    if (isModalOpen) {
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
    return () => { document.body.style.overflow = 'unset'; };
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen || showDeleteConfirm) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, showDeleteConfirm]);

  const validateForm = () => {
    const errs = {};
    const stem = (form.title || '').trim();
    if (!stem) {
      errs.title = 'Question statement is required';
    } else if (stem.length < 5) {
      errs.title = 'Question statement must be at least 5 characters long';
    }

    if (!form.optionA.trim()) errs.optionA = 'Option A is required';
    if (!form.optionB.trim()) errs.optionB = 'Option B is required';
    if (!form.optionC.trim()) errs.optionC = 'Option C is required';
    if (!form.optionD.trim()) errs.optionD = 'Option D is required';

    if (!['A', 'B', 'C', 'D'].includes(form.correctAnswer)) {
      errs.correctAnswer = 'Select a valid correct answer key';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please resolve the highlighted form errors');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        questionText: form.title.trim(),
        optionA: form.optionA.trim(),
        optionB: form.optionB.trim(),
        optionC: form.optionC.trim(),
        optionD: form.optionD.trim(),
        correctAnswer: form.correctAnswer,
        difficulty: (form.difficulty || 'MEDIUM').toUpperCase(),
        difficultyLevel: (form.difficulty || 'MEDIUM').toUpperCase()
      };

      if (editingId) {
        await api.put(`/questions/${editingId}`, payload);
        toast.success('Question updated successfully');
      } else {
        await api.post(`/questions/test/${testId}`, payload);
        toast.success('Question attached to assessment');
      }
      closeModal();
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Submission failed';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const openModal = (q = null) => {
    if (q) {
      setEditingId(q.id);
      setForm({
        title: q.title || q.questionText || '',
        optionA: q.optionA || '',
        optionB: q.optionB || '',
        optionC: q.optionC || '',
        optionD: q.optionD || '',
        correctAnswer: q.correctAnswer || 'A',
        difficulty: (q.difficulty || q.difficultyLevel || 'MEDIUM').toUpperCase()
      });
    } else {
      setEditingId(null);
      setForm(emptyForm);
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
  };

  const handleDelete = (id) => {
    setPendingDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await api.delete(`/questions/${pendingDeleteId}`);
      toast.success('Question removed from assessment');
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Delete failed';
      toast.error(msg);
    }
  };

  const isMainTest = (test?.testType || test?.type || '').toUpperCase() === 'MAIN';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-[#262a33]">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-2.5 py-0.5 rounded-md border border-teal-200 dark:border-teal-800/40">
              Assessment Item Config
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-medium">
              • {test?.category || 'General'}
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded-md border ${
              isMainTest
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40'
            }`}>
              {isMainTest ? 'MAIN EXAM' : 'PRACTICE'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {test?.title || 'Assessment Questions'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {loading ? 'Retrieving questions attached to this exam module...' : (
              <>Managing <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{questions.length}</span> questions attached to this assessment module</>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/admin/tests/active?type=all')}
            className="min-h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-[#262a33] bg-white dark:bg-[#15181e] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1c2028] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>All Tests</span>
          </button>
          <BackToDashboard />
          <button
            type="button"
            onClick={() => openModal()}
            className="min-h-[44px] px-4 rounded-xl bg-teal-700 hover:bg-teal-800 active:scale-[0.98] text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* TEST OVERVIEW STATS BANNER */}
      {test && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-[#15181e] border border-slate-200/90 dark:border-[#262a33] rounded-2xl p-4 shadow-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Category</span>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{test.category || 'General'}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Duration</span>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 font-mono">
              <Clock size={12} className="text-violet-500" />
              <span>{test.durationMinutes || test.duration || 60} mins</span>
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Items</span>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
              {questions.length} Questions
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Assessment Mode</span>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              {isMainTest ? <Shield size={12} className="text-rose-500" /> : <Zap size={12} className="text-emerald-500" />}
              <span>{isMainTest ? 'Official Proctored' : 'Self-paced Practice'}</span>
            </p>
          </div>
        </div>
      )}

      {/* QUESTION ROSTER LIST */}
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium px-1">
          <span>{loading ? 'Loading questions roster...' : `Attached Questions (${questions.length})`}</span>
          {!loading && (
            <span className="text-teal-600 dark:text-teal-400 font-semibold tabular-nums font-mono">
              Total Weight: {questions.length} pts
            </span>
          )}
        </div>

        {loading ? (
          <div role="status" aria-busy="true" aria-label="Loading test questions" className="space-y-4">
            <span className="sr-only">Loading test questions...</span>
            {[1, 2, 3, 4].map((i) => (
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
          <>
            {questions.map((q, idx) => {
              return (
                <div
                  key={q.id}
                  className="bg-white dark:bg-[#15181e] border border-slate-200/90 dark:border-[#262a33] rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-[#383d4a] transition-all flex flex-col sm:flex-row items-start justify-between gap-4"
                >
                  <div className="flex-1 pr-2 min-w-0 w-full">
                    {/* Item Index */}
                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#101216] px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-[#262a33] font-mono">
                        #{String(idx + 1).padStart(2, '0')}
                      </span>

                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono uppercase">
                        Item ID: {q.id}
                      </span>
                    </div>

                    {/* Question Content with Code Detection */}
                    <div className="mb-4">
                      <QuestionContentRenderer content={q.title || q.questionText} />
                    </div>

                    {/* Options Grid with Correct Answer Indicator */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {['A', 'B', 'C', 'D'].map(opt => {
                        const isCorrect = q.correctAnswer === opt;
                        const optText = q[`option${opt}`];

                        return (
                          <div
                            key={opt}
                            className={`px-3 py-2.5 rounded-xl text-xs flex items-center gap-2.5 border transition-all ${
                              isCorrect
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/50 text-emerald-950 dark:text-emerald-200 font-medium shadow-xs'
                                : 'bg-slate-50/70 dark:bg-[#101216] border-slate-200/80 dark:border-[#262a33] text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-[#1f232b] text-slate-700 dark:text-slate-300'
                            }`}>
                              {opt}
                            </span>
                            <span className="truncate flex-1 font-mono text-[11px]">{optText || '—'}</span>
                            {isCorrect && (
                              <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 ml-auto shrink-0" />
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
                      onClick={() => openModal(q)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-violet-400 bg-slate-50 dark:bg-[#101216] hover:bg-violet-50 dark:hover:bg-violet-950/40 border border-slate-200 dark:border-[#262a33] hover:border-violet-200 dark:hover:border-violet-800/40 rounded-xl transition-all cursor-pointer"
                      title="Edit Question"
                      aria-label={`Edit question #${idx + 1}`}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(q.id)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-50 dark:bg-[#101216] hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-[#262a33] hover:border-rose-200 dark:hover:border-rose-800/40 rounded-xl transition-all cursor-pointer"
                      title="Remove Question"
                      aria-label={`Remove question #${idx + 1}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}

            {questions.length === 0 && (
              <div className="bg-white dark:bg-[#15181e] border border-dashed border-slate-300 dark:border-[#262a33] rounded-2xl py-16 text-center flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-teal-200 dark:border-teal-800/40 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-3">
                  <Database size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No questions added yet</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  This assessment module is currently empty. Add questions to enable students to take this test.
                </p>
                <button
                  type="button"
                  onClick={() => openModal()}
                  className="mt-4 min-h-[44px] px-5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Add First Question</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* QUESTION EDITOR MODAL */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] !m-0 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div
            aria-hidden="true"
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/75 backdrop-blur-xs sm:backdrop-blur-sm transition-opacity duration-200"
            onClick={closeModal}
          />

          <div
            ref={editorModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="question-editor-title"
            className="relative z-50 bg-white dark:bg-[#15181e] border border-slate-200/90 dark:border-white/10 rounded-2xl w-full max-w-2xl max-h-[92dvh] flex flex-col my-auto overflow-hidden shadow-2xl isolate"
          >
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/70 dark:bg-[#111317]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
                  <FileText size={18} />
                </div>
                <div>
                  <h2 id="question-editor-title" className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {editingId ? 'Modify Question' : 'Add Question to Assessment'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Configure question statement, choices, and designated correct answer
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close modal dialog"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1f232b] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Question Statement <span className="text-rose-500">*</span>
                </label>
                <textarea
                  ref={firstInputRef}
                  name="title"
                  value={form.title}
                  onChange={(e) => {
                    setForm(c => ({...c, title: e.target.value}));
                    if (errors.title) setErrors({...errors, title: null});
                  }}
                  className={`w-full bg-slate-50 dark:bg-[#101216] border rounded-xl p-3.5 text-xs font-mono font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:bg-white dark:focus:bg-[#15181e] focus:ring-2 transition-all min-h-[120px] resize-none leading-relaxed ${
                    errors.title
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-[#262a33] focus:border-teal-600 focus:ring-teal-500/20'
                  }`}
                  placeholder="Define question or code snippet... (supports ```lang code blocks)"
                  aria-invalid={!!errors.title}
                />
                {errors.title && (
                  <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>{errors.title}</span>
                  </p>
                )}
              </div>

              {/* Options A - D */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Answer Options <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Click letter to set correct key</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['A', 'B', 'C', 'D'].map(opt => {
                    const isCorrect = form.correctAnswer === opt;
                    const optKey = `option${opt}`;
                    const hasError = !!errors[optKey];

                    return (
                      <div key={opt} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 px-1">
                          <span>Option {opt}</span>
                          {isCorrect && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                              <CheckCircle2 size={12} /> Correct
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setForm(c => ({...c, correctAnswer: opt}))}
                            className={`min-w-[34px] min-h-[38px] rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border transition-all cursor-pointer ${
                              isCorrect
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-slate-100 dark:bg-[#1f232b] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#2f3542]'
                            }`}
                            title={`Designate ${opt} as correct answer`}
                          >
                            {opt}
                          </button>
                          <input
                            value={form[optKey]}
                            onChange={(e) => {
                              setForm(c => ({...c, [optKey]: e.target.value}));
                              if (errors[optKey]) setErrors({...errors, [optKey]: null});
                            }}
                            className={`w-full rounded-xl px-3.5 min-h-[38px] text-xs font-mono text-slate-900 dark:text-slate-100 outline-none border transition-all ${
                              hasError
                                ? 'border-rose-400 bg-rose-50/30'
                                : isCorrect
                                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700/60 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                                  : 'bg-slate-50 dark:bg-[#101216] border-slate-200 dark:border-[#262a33] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-[#15181e] focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20'
                            }`}
                            placeholder={`Enter choice ${opt} text`}
                            aria-invalid={hasError}
                          />
                        </div>
                        {hasError && (
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 pl-10">{errors[optKey]}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Designate Correct Answer Buttons */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Select Correct Answer Key
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setForm(c => ({...c, correctAnswer: opt}))}
                      className={`min-h-[44px] rounded-xl font-bold text-xs transition-all border cursor-pointer ${
                        form.correctAnswer === opt
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-[#101216] border-slate-200 dark:border-[#262a33] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f232b]'
                      }`}
                    >
                      Option {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#262a33]">
                <button
                  type="button"
                  onClick={closeModal}
                  className="min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-[#262a33] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1f232b] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[44px] px-6 rounded-xl bg-teal-700 hover:bg-teal-800 active:scale-[0.98] text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  <span>{saving ? 'Saving...' : editingId ? 'Update Question' : 'Add to Test'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* REMOVE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={executeDelete}
        title="Remove Question?"
        message="Are you sure you want to remove this question from this assessment module? The item will be permanently removed from this test."
        confirmText="Remove Question"
      />
    </div>
  );
};

export default QuestionManager;
