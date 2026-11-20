import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  Search,
  Mail,
  RotateCw,
  ShieldCheck,
  ShieldAlert,
  Info,
  Calendar,
  X,
  Trash2,
  ArrowLeft,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ExternalLink,
  Award,
  FileText,
  Filter
} from 'lucide-react';
import api from '../utils/api';
import { TableSkeleton } from '../components/common/Skeleton';
import CustomSelect from '../components/common/CustomSelect';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import BackToDashboard from '../components/admin/BackToDashboard';
import ConfirmModal from '../components/ConfirmModal';

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name (A → Z)' },
  { value: 'name-desc', label: 'Name (Z → A)' },
  { value: 'createdAt-desc', label: 'Enrolled (Newest First)' },
  { value: 'createdAt-asc', label: 'Enrolled (Oldest First)' },
  { value: 'email-asc', label: 'Email (A → Z)' }
];

const PAGE_SIZE_OPTIONS = [
  { value: 10, label: '10 / page' },
  { value: 25, label: '25 / page' },
  { value: 50, label: '50 / page' }
];

const AdminStudents = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // References for Student Detail Modal accessibility
  const detailModalRef = useRef(null);
  const detailCloseBtnRef = useRef(null);
  const detailTriggerRef = useRef(null);

  // Fetch student directory from backend
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/students');
      const userList = Array.isArray(res.data) ? res.data : (res.data?.users || []);
      setStudents(userList);
    } catch {
      toast.error('Failed to load candidate directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Safe date helper
  const formatDate = (student) => {
    if (!student) return 'Active';
    const fields = ['createdAt', 'created_at', 'joinedAt', 'registrationDate', 'date', 'updatedAt'];
    for (const f of fields) {
      if (student[f]) {
        const d = new Date(student[f]);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        }
      }
    }

    if (student.id && typeof student.id === 'string' && student.id.length === 24 && /^[0-9a-fA-F]+$/.test(student.id)) {
      const timestamp = parseInt(student.id.substring(0, 8), 16) * 1000;
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }

    return 'Active';
  };

  const formatDetailedDate = (student) => {
    if (!student) return 'Active';
    const fields = ['createdAt', 'created_at', 'joinedAt', 'registrationDate', 'date', 'updatedAt'];
    for (const f of fields) {
      if (student[f]) {
        const d = new Date(student[f]);
        if (!isNaN(d.getTime())) {
          return d.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      }
    }
    return formatDate(student);
  };

  // Avatar gradient generator
  const getGradient = (name) => {
    const gradients = [
      'from-violet-600 to-indigo-600',
      'from-emerald-600 to-teal-600',
      'from-rose-600 to-pink-600',
      'from-amber-600 to-orange-600',
      'from-purple-600 to-violet-600',
      'from-blue-600 to-cyan-600'
    ];
    const index = (name?.charCodeAt(0) || 0) % gradients.length;
    return gradients[index];
  };

  // Copy to clipboard helper
  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Copied ${key} to clipboard`);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Sort handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Filtered & Sorted student list
  const filteredAndSortedStudents = useMemo(() => {
    let result = [...students];

    // Search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(query) ||
          s.email?.toLowerCase().includes(query) ||
          String(s.id || '').toLowerCase().includes(query)
      );
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '');
      } else if (sortField === 'email') {
        comparison = (a.email || '').localeCompare(b.email || '');
      } else if (sortField === 'createdAt') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        comparison = timeA - timeB;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [students, searchTerm, sortField, sortDirection]);

  // Pagination calculation
  const totalCandidates = filteredAndSortedStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalCandidates / pageSize));

  // Current page records slice
  const paginatedStudents = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * pageSize;
    return filteredAndSortedStudents.slice(start, start + pageSize);
  }, [filteredAndSortedStudents, currentPage, totalPages, pageSize]);

  // Open candidate details modal with focus management
  const handleOpenDetails = (student, event) => {
    detailTriggerRef.current = event?.currentTarget || document.activeElement;
    setSelectedStudent(student);
  };

  // Close candidate details modal
  const handleCloseDetails = () => {
    setSelectedStudent(null);
  };

  // Accessible Modal focus trap, body scroll lock, and Escape key listener
  useEffect(() => {
    if (!selectedStudent) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      detailCloseBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      // If confirmation modal is open, let ConfirmModal handle keys
      if (studentToDelete) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedStudent(null);
        return;
      }

      if (e.key === 'Tab' && detailModalRef.current) {
        const focusable = detailModalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (detailTriggerRef.current && typeof detailTriggerRef.current.focus === 'function') {
        detailTriggerRef.current.focus();
      }
    };
  }, [selectedStudent, studentToDelete]);

  // Prompt safe deletion action
  const requestDeleteStudent = (student, event) => {
    if (event) event.stopPropagation();
    if (!student) return;

    // Guard against deleting Admin accounts
    if (student.role?.toUpperCase() === 'ADMIN') {
      toast.error('Administrative accounts are protected and cannot be deleted.');
      return;
    }

    setStudentToDelete(student);
  };

  // Execute deletion confirmed via accessible ConfirmModal
  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;

    if (studentToDelete.role?.toUpperCase() === 'ADMIN') {
      toast.error('Cannot delete admin accounts');
      setStudentToDelete(null);
      return;
    }

    try {
      setIsDeleting(true);
      await api.delete(`/admin/students/${studentToDelete.id}`);
      toast.success(`Account for "${studentToDelete.name}" purged successfully`);

      if (selectedStudent?.id === studentToDelete.id) {
        setSelectedStudent(null);
      }
      setStudentToDelete(null);
      await fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete student account');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper for sort indicator in headers
  const renderSortIndicator = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp size={13} className="text-violet-600 dark:text-violet-400" />
    ) : (
      <ChevronDown size={13} className="text-violet-600 dark:text-violet-400" />
    );
  };

  const startIndex = totalCandidates === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalCandidates);

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto flex flex-col space-y-6 animate-in fade-in duration-300 pb-16">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#262a33]">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-950/60 border border-violet-200/80 dark:border-violet-900/50 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-xs shrink-0">
            <Users size={20} aria-hidden="true" />
          </div>
          <div>
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-400 block mb-0.5">
              Candidate Administration
            </span>
            <h1 className="text-xl sm:text-2xl font-serif font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Student Accounts
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
              Manage candidate credentials, verification status, and examination profiles.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full sm:w-auto self-end">
          {/* Consolidated Candidate Count Badge */}
          <div className="px-3.5 py-2 min-h-[44px] bg-white dark:bg-[#15181e] border border-slate-300/90 dark:border-white/15 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs flex items-center gap-2 font-mono tabular-nums">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            <span>{students.length} Registered Candidates</span>
          </div>

          <button
            type="button"
            onClick={fetchStudents}
            disabled={loading}
            aria-label="Refresh candidate directory"
            className="px-3.5 py-2 h-[44px] min-h-[44px] max-h-[44px] min-w-[44px] rounded-xl bg-white dark:bg-[#151921] border-2 border-slate-300 dark:border-white/20 hover:border-violet-500 dark:hover:border-violet-400 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1f232b] active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-md text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
            title="Refresh candidate list"
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
            <span>Refresh</span>
          </button>
          <BackToDashboard />
        </div>
      </div>

      {/* ── FILTER & SEARCH CONTROLS ── */}
      <div className="space-y-4">
        {/* Search Bar & Mobile Sorting Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Fast Search input */}
          <div className="relative flex-1 max-w-lg">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              className="w-full bg-white dark:bg-[#15181e] border border-slate-300/90 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 rounded-xl pl-10 pr-10 min-h-[44px] text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20 shadow-xs transition-all duration-200"
              placeholder="Search candidates by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Search candidate directory"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                aria-label="Clear search query"
                className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Sort & Page Size Controls */}
          <div className="flex items-center gap-2.5">
            {/* Sorting Dropdown for quick access */}
            <div className="w-52">
              <CustomSelect
                id="sort-select"
                value={`${sortField}-${sortDirection}`}
                onChange={(val) => {
                  const [field, dir] = val.split('-');
                  setSortField(field);
                  setSortDirection(dir);
                  setCurrentPage(1);
                }}
                options={SORT_OPTIONS}
                icon={Filter}
                ariaLabel="Sort candidates by"
              />
            </div>

            {/* Page Size Selector */}
            <div className="w-28">
              <CustomSelect
                id="page-size-select"
                value={pageSize}
                onChange={(val) => {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }}
                options={PAGE_SIZE_OPTIONS}
                ariaLabel="Candidates per page"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── CANDIDATE TABLE CARD ── */}
      {loading ? (
        <TableSkeleton rows={6} columns={6} />
      ) : (
        <div className="bg-white dark:bg-[#15181e] rounded-2xl border border-slate-300/90 dark:border-white/15 shadow-sm overflow-hidden flex flex-col">
          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[650px] text-left border-collapse text-xs">
              <caption className="sr-only">LearnIQ Enrolled Candidates Directory</caption>
              <thead className="bg-slate-50 dark:bg-[#1a1d24] border-b border-slate-200 dark:border-[#262a33] font-semibold text-slate-500 dark:text-slate-400">
                <tr>
                  {/* Candidate Column with Sort */}
                  <th scope="col" className="px-6 py-3.5">
                    <button
                      type="button"
                      onClick={() => handleSort('name')}
                      className="group flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
                      aria-sort={sortField === 'name' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      <span>Candidate</span>
                      {renderSortIndicator('name')}
                    </button>
                  </th>

                  {/* Email Column with Sort */}
                  <th scope="col" className="px-6 py-3.5">
                    <button
                      type="button"
                      onClick={() => handleSort('email')}
                      className="group flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
                      aria-sort={sortField === 'email' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      <span>Email</span>
                      {renderSortIndicator('email')}
                    </button>
                  </th>

                  {/* Role Column */}
                  <th scope="col" className="px-6 py-3.5">
                    Role
                  </th>

                  {/* Enrolled Date with Sort */}
                  <th scope="col" className="px-6 py-3.5">
                    <button
                      type="button"
                      onClick={() => handleSort('createdAt')}
                      className="group flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
                      aria-sort={sortField === 'createdAt' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      <span>Enrolled</span>
                      {renderSortIndicator('createdAt')}
                    </button>
                  </th>

                  {/* Actions */}
                  <th scope="col" className="px-6 py-3.5 text-center">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedStudents.length > 0 ? (
                  paginatedStudents.map((student) => {
                    const isAdmin = student.role?.toUpperCase() === 'ADMIN';

                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-[#1f232b] transition-colors"
                      >
                        {/* Candidate Name & Avatar */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getGradient(
                                student.name
                              )} text-white flex items-center justify-center font-extrabold shadow-sm text-sm shrink-0 overflow-hidden`}
                              aria-hidden="true"
                            >
                              {student.avatar ? (
                                <img src={student.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                student.name?.charAt(0).toUpperCase() || 'S'
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 dark:text-slate-100 block leading-tight truncate">
                                {student.name || 'Unnamed Scholar'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: {String(student.id || '').slice(-6) || '—'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[220px]" title={student.email}>
                              {student.email}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(student.email, `Email (${student.email})`)}
                              aria-label={`Copy ${student.email}`}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Copy email address"
                            >
                              {copiedKey === `Email (${student.email})` ? (
                                <Check size={12} className="text-emerald-500" aria-hidden="true" />
                              ) : (
                                <Copy size={12} aria-hidden="true" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              isAdmin
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'
                                : 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-900/50'
                            }`}
                          >
                            <ShieldCheck size={12} aria-hidden="true" />
                            <span>{isAdmin ? 'Administrator' : 'Candidate'}</span>
                          </span>
                        </td>

                        {/* Enrolled Date */}
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                          {formatDate(student)}
                        </td>

                        {/* Actions (44px Accessible Tap Targets) */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* View Details */}
                            <button
                              type="button"
                              onClick={(e) => handleOpenDetails(student, e)}
                              className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl bg-white dark:bg-[#1c2027] border border-slate-300/90 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#252a34] text-xs font-semibold shadow-2xs hover:shadow-sm hover:-translate-y-0.5 inline-flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 active:scale-[0.98]"
                              title={`View full profile of ${student.name}`}
                              aria-label={`View details for ${student.name}`}
                            >
                              <Info size={14} aria-hidden="true" />
                              <span className="hidden sm:inline">Details</span>
                            </button>

                            {/* Delete Action Guarded */}
                            <button
                              type="button"
                              onClick={(e) => requestDeleteStudent(student, e)}
                              disabled={isAdmin}
                              className={`min-h-[44px] min-w-[44px] p-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center transition-all duration-200 cursor-pointer ${
                                isAdmin
                                  ? 'opacity-30 cursor-not-allowed text-slate-400 border border-transparent'
                                  : 'text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-300 dark:hover:border-rose-900/60 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500'
                              }`}
                              title={isAdmin ? 'Administrator accounts cannot be deleted' : `Purge profile of ${student.name}`}
                              aria-label={`Delete student account for ${student.name}`}
                            >
                              <Trash2 size={14} aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center text-slate-400">
                      <Users size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" aria-hidden="true" />
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        No candidate profiles match your criteria.
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                        Try adjusting your search terms or clearing the filter.
                      </p>
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('');
                            setCurrentPage(1);
                          }}
                          className="mt-4 inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-xs font-semibold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 rounded-xl hover:bg-violet-100 transition-colors cursor-pointer"
                        >
                          Clear Search
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (< md) */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedStudents.length > 0 ? (
              paginatedStudents.map((student) => {
                const isAdmin = student.role?.toUpperCase() === 'ADMIN';
                return (
                  <div key={student.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getGradient(
                            student.name
                          )} text-white flex items-center justify-center font-extrabold shadow-sm text-sm shrink-0 overflow-hidden`}
                          aria-hidden="true"
                        >
                          {student.avatar ? (
                            <img src={student.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            student.name?.charAt(0).toUpperCase() || 'S'
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 dark:text-slate-100 block leading-tight truncate">
                            {student.name || 'Unnamed Scholar'}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block mt-0.5">
                            {student.email}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                          isAdmin
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'
                            : 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-900/50'
                        }`}
                      >
                        <ShieldCheck size={11} aria-hidden="true" />
                        <span>{isAdmin ? 'Admin' : 'Candidate'}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
                      <span>ID: #{String(student.id || '').slice(-6) || '—'}</span>
                      <span>Enrolled: {formatDate(student)}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      <button
                        type="button"
                        onClick={(e) => handleOpenDetails(student, e)}
                        className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#1c2027] border border-slate-200 dark:border-white/10 hover:border-slate-300 text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
                        aria-label={`View details for ${student.name}`}
                      >
                        <Info size={14} />
                        <span>View Details</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => requestDeleteStudent(student, e)}
                        disabled={isAdmin}
                        className={`min-h-[40px] min-w-[40px] p-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center active:scale-[0.98] ${
                          isAdmin
                            ? 'opacity-30 cursor-not-allowed text-slate-400 border border-transparent'
                            : 'text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 cursor-pointer'
                        }`}
                        title={isAdmin ? 'Administrator accounts cannot be deleted' : `Purge profile of ${student.name}`}
                        aria-label={`Delete student account for ${student.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400">
                <Users size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No candidates found</p>
              </div>
            )}
          </div>

          {/* ── CLIENT-SIDE PAGINATION FOOTER ── */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-[#262a33] bg-slate-50/50 dark:bg-[#171a21] flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Item Counter */}
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {totalCandidates === 0 ? (
                <span>Showing 0 of 0 candidates</span>
              ) : (
                <span>
                  Showing <strong className="text-slate-900 dark:text-slate-100">{startIndex}</strong>–
                  <strong className="text-slate-900 dark:text-slate-100">{endIndex}</strong> of{' '}
                  <strong className="text-slate-900 dark:text-slate-100">{totalCandidates}</strong> candidates
                </span>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav aria-label="Candidates pagination" className="flex items-center gap-1.5">
                {/* First Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  aria-label="Go to first page"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-[#262a33] bg-white dark:bg-[#1c2027] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#252a34] disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
                >
                  <ChevronsLeft size={15} aria-hidden="true" />
                </button>

                {/* Previous Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Go to previous page"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-[#262a33] bg-white dark:bg-[#1c2027] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#252a34] disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
                >
                  <ChevronLeft size={15} aria-hidden="true" />
                </button>

                {/* Page Status Indicator */}
                <div className="px-3 min-h-[44px] flex items-center justify-center text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                </div>

                {/* Next Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Go to next page"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-[#262a33] bg-white dark:bg-[#1c2027] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#252a34] disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
                >
                  <ChevronRight size={15} aria-hidden="true" />
                </button>

                {/* Last Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  aria-label="Go to last page"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-[#262a33] bg-white dark:bg-[#1c2027] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#252a34] disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
                >
                  <ChevronsRight size={15} aria-hidden="true" />
                </button>
              </nav>
            )}
          </div>
        </div>
      )}

      {/* ── ACCESSIBLE STUDENT DETAIL MODAL ── */}
      {selectedStudent && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] !m-0 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            aria-hidden="true"
            className="fixed inset-0 z-10 !m-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md transition-opacity duration-200 animate-in fade-in"
            onClick={handleCloseDetails}
          />

          {/* Modal Container */}
          <div
            ref={detailModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-detail-title"
            aria-describedby="student-detail-desc"
            className="relative z-50 w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-white dark:bg-[#15181e] border border-slate-200/90 dark:border-[#262a33] rounded-2xl shadow-2xl animate-in zoom-in-95 duration-150"
          >
            {/* Top Gradient Banner */}
            <div
              className={`h-24 bg-gradient-to-r ${getGradient(
                selectedStudent.name
              )} relative p-4 flex items-start justify-end`}
            >
              <button
                ref={detailCloseBtnRef}
                type="button"
                onClick={handleCloseDetails}
                aria-label="Close candidate details dialog"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 bg-black/30 hover:bg-black/50 text-white rounded-xl border border-white/20 hover:border-white/40 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="px-6 pb-6 pt-0 relative">
              {/* Overlapping Avatar */}
              <div className="-mt-10 mb-4 inline-block p-1 bg-white dark:bg-[#15181e] rounded-2xl shadow-md">
                <div
                  className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getGradient(
                    selectedStudent.name
                  )} flex items-center justify-center text-2xl font-black text-white shadow-sm overflow-hidden`}
                  aria-hidden="true"
                >
                  {selectedStudent.avatar ? (
                    <img src={selectedStudent.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    selectedStudent.name?.charAt(0).toUpperCase() || 'S'
                  )}
                </div>
              </div>

              {/* Title Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2
                    id="student-detail-title"
                    className="text-xl font-serif font-extrabold text-slate-900 dark:text-slate-100 tracking-tight"
                  >
                    {selectedStudent.name || 'Candidate Profile'}
                  </h2>
                  <p id="student-detail-desc" className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    Candidate ID: #{selectedStudent.id}
                  </p>
                </div>
              </div>

              {/* Candidate Metadata Breakdown */}
              <div className="space-y-2.5 text-xs">
                {/* Email Item */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#1a1d24] border border-slate-200/70 dark:border-[#262a33] rounded-xl">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Mail size={14} aria-hidden="true" />
                    <span>Email Address</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {selectedStudent.email}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedStudent.email, 'Candidate Email')}
                      aria-label="Copy candidate email"
                      className="p-1 min-w-[32px] min-h-[32px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      {copiedKey === 'Candidate Email' ? (
                        <Check size={13} className="text-emerald-500" aria-hidden="true" />
                      ) : (
                        <Copy size={13} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Role Item */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#1a1d24] border border-slate-200/70 dark:border-[#262a33] rounded-xl">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <ShieldCheck size={14} aria-hidden="true" />
                    <span>Administrative Role</span>
                  </div>
                  <span className="font-mono font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded border border-violet-200 dark:border-violet-900/50">
                    {selectedStudent.role || 'STUDENT'}
                  </span>
                </div>

                {/* Registration Date Item */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#1a1d24] border border-slate-200/70 dark:border-[#262a33] rounded-xl">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Calendar size={14} aria-hidden="true" />
                    <span>Enrollment Timestamp</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {formatDetailedDate(selectedStudent)}
                  </span>
                </div>
              </div>

              {/* ── EXAMINATION STATISTICS & DIRECT NAVIGATION ── */}
              <div className="mt-4 p-4 rounded-xl bg-violet-50/60 dark:bg-[#1c202a] border border-violet-200/60 dark:border-violet-900/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award size={15} className="text-violet-600 dark:text-violet-400" aria-hidden="true" />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
                      Examination Profile & Audit
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-violet-700 dark:text-violet-300">
                    Institutional Records
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Candidate assessment attempts, performance percentiles, and answer evaluations are tracked across active test cycles.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseDetails();
                      navigate('/admin/leaderboard');
                    }}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-[#15181e] border border-violet-300 dark:border-violet-800/60 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-[#252a34] hover:border-violet-400 dark:hover:border-violet-700 hover:-translate-y-0.5 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 active:scale-[0.98]"
                  >
                    <Award size={13} aria-hidden="true" />
                    <span>View Leaderboards</span>
                    <ExternalLink size={12} className="opacity-70" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleCloseDetails();
                      navigate('/admin/tests/history');
                    }}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-[#15181e] border border-slate-300/90 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252a34] hover:border-slate-400 dark:hover:border-white/30 hover:-translate-y-0.5 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 active:scale-[0.98]"
                  >
                    <FileText size={13} aria-hidden="true" />
                    <span>Assessment History</span>
                    <ExternalLink size={12} className="opacity-70" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseDetails}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300/90 dark:border-white/15 bg-white dark:bg-[#1c2027] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252a34] hover:border-slate-400 dark:hover:border-white/30 hover:-translate-y-0.5 text-xs font-semibold transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 active:scale-[0.98]"
                >
                  Close Window
                </button>

                <button
                  type="button"
                  onClick={() => requestDeleteStudent(selectedStudent)}
                  disabled={selectedStudent.role?.toUpperCase() === 'ADMIN'}
                  className={`flex-1 min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 shadow-2xs cursor-pointer ${
                    selectedStudent.role?.toUpperCase() === 'ADMIN'
                      ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                      : 'bg-rose-600 hover:bg-rose-700 hover:-translate-y-0.5 hover:shadow-md hover:shadow-rose-600/25 active:scale-[0.98] text-white border border-rose-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600'
                  }`}
                  title={
                    selectedStudent.role?.toUpperCase() === 'ADMIN'
                      ? 'Administrator accounts cannot be purged'
                      : 'Purge candidate account and cascade examination attempts'
                  }
                >
                  {selectedStudent.role?.toUpperCase() === 'ADMIN' ? (
                    <>
                      <ShieldAlert size={14} aria-hidden="true" />
                      <span>Admin Protected</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} aria-hidden="true" />
                      <span>Purge Candidate Account</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── SAFE DELETION CONFIRMATION DIALOG (role="alertdialog") ── */}
      <ConfirmModal
        isOpen={Boolean(studentToDelete)}
        onClose={() => {
          if (!isDeleting) setStudentToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Purge Candidate Account?"
        message={`Are you sure you want to PERMANENTLY DELETE candidate "${studentToDelete?.name}" (${studentToDelete?.email})?\n\nExplicit Warning: This operation triggers cascade deletion. Deleting this candidate will permanently purge all examination attempts, answers, scored evaluations, and historical academic records from the database. This action cannot be reversed.`}
        confirmText={isDeleting ? 'Purging Account...' : 'Confirm Cascade Purge'}
        cancelText="Cancel"
      />
    </div>
  );
};

export default AdminStudents;
