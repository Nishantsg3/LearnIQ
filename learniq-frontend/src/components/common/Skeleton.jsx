import React from 'react';

/**
 * Base Skeleton Primitive
 * Purely visual placeholder element. Defaulted to aria-hidden="true" to prevent
 * screen-reader announcement floods on individual shapes and lines.
 * Respects prefers-reduced-motion via existing global CSS.
 */
export const Skeleton = ({
  className = '',
  variant = 'rectangular', // 'rectangular' | 'circular' | 'text'
  ariaHidden = true,
  ariaLabel,
  ...props
}) => {
  const variantStyles = {
    rectangular: 'rounded-xl',
    circular: 'rounded-full',
    text: 'rounded-md h-4'
  }[variant] || 'rounded-xl';

  const isAccessible = !ariaHidden && Boolean(ariaLabel);

  return (
    <div
      aria-hidden={isAccessible ? undefined : 'true'}
      role={isAccessible ? 'status' : undefined}
      aria-label={isAccessible ? ariaLabel : undefined}
      className={`animate-pulse motion-reduce:animate-none bg-slate-200/80 dark:bg-[#202530] transition-colors ${variantStyles} ${className}`}
      {...props}
    >
      {isAccessible && <span className="sr-only">{ariaLabel}</span>}
    </div>
  );
};

/**
 * SkeletonRegion
 * Wraps an entire loading region with a SINGLE semantic live-region announcement,
 * preventing assistive technology from announcing dozens of nested loading blocks.
 */
export const SkeletonRegion = ({
  ariaLabel = 'Loading content...',
  className = '',
  children,
  ...props
}) => (
  <div
    role="status"
    aria-live="polite"
    aria-busy="true"
    aria-label={ariaLabel}
    className={className}
    {...props}
  >
    <span className="sr-only">{ariaLabel}</span>
    {children}
  </div>
);

/**
 * MetricTileSkeleton
 * Matches telemetry / stat tiles in AdminDashboard, StudentDashboard, ProgressPage, and AdminAnalytics.
 */
export const MetricTileSkeleton = ({
  className = '',
  announce = false,
  ariaLabel = 'Loading metric...'
}) => (
  <div
    aria-hidden={announce ? undefined : 'true'}
    role={announce ? 'status' : undefined}
    aria-label={announce ? ariaLabel : undefined}
    className={`bg-white dark:bg-[#15181e] rounded-xl border border-slate-200/90 dark:border-[#262a33] p-4 sm:p-5 shadow-xs flex flex-col justify-between ${className}`}
  >
    <div>
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="w-3.5 h-3.5 rounded-sm" />
      </div>
      <Skeleton className="h-7 w-16 mb-2" />
      <Skeleton className="h-3.5 w-24" />
    </div>
    <Skeleton className="h-3 w-32 mt-3" />
    {announce && <span className="sr-only">{ariaLabel}</span>}
  </div>
);

/**
 * CardSkeleton
 * Matches assessment & report cards in PracticePage, MainTestsPage, AdminTestList, AdminReportList, AdminTestHistory.
 */
export const CardSkeleton = ({
  className = '',
  announce = false,
  ariaLabel = 'Loading assessment card...'
}) => (
  <div
    aria-hidden={announce ? undefined : 'true'}
    role={announce ? 'status' : undefined}
    aria-label={announce ? ariaLabel : undefined}
    className={`bg-white dark:bg-[#15181e] rounded-2xl border border-slate-200/90 dark:border-[#262a33] p-5 shadow-xs flex flex-col justify-between space-y-4 ${className}`}
  >
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-20 rounded-md" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>
      <Skeleton className="h-5 w-4/5 rounded-md" />
      <div className="space-y-1.5 pt-1">
        <Skeleton className="h-3.5 w-full rounded" />
        <Skeleton className="h-3.5 w-3/4 rounded" />
      </div>
    </div>

    <div className="pt-3 border-t border-slate-100 dark:border-[#262a33] flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-14 rounded" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>
      <Skeleton className="h-8 w-24 rounded-xl" />
    </div>
    {announce && <span className="sr-only">{ariaLabel}</span>}
  </div>
);

/**
 * TableSkeleton
 * Matches tabular views in AdminStudents, ResultsPage, AdminTestLeaderboard, QuestionManager.
 * Emits a single accessible announcement for the entire table.
 */
export const TableSkeleton = ({
  rows = 5,
  columns = 5,
  className = '',
  showHeader = true,
  ariaLabel = 'Loading table records...'
}) => (
  <div
    role="status"
    aria-live="polite"
    aria-busy="true"
    aria-label={ariaLabel}
    className={`bg-white dark:bg-[#15181e] rounded-2xl border border-slate-200/90 dark:border-[#262a33] shadow-xs overflow-hidden flex flex-col ${className}`}
  >
    <span className="sr-only">{ariaLabel}</span>
    <div className="overflow-x-auto" aria-hidden="true">
      <table className="w-full text-left border-collapse text-xs">
        {showHeader && (
          <thead className="bg-slate-50 dark:bg-[#1a1d24] border-b border-slate-200 dark:border-[#262a33]">
            <tr>
              {Array.from({ length: columns }).map((_, colIdx) => (
                <th key={colIdx} className="px-6 py-3.5">
                  <Skeleton className="h-3.5 w-20 rounded" />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {Array.from({ length: columns }).map((_, colIdx) => (
                <td key={colIdx} className="px-6 py-4">
                  {colIdx === 0 ? (
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-3.5 w-28 rounded" />
                        <Skeleton className="h-2.5 w-16 rounded" />
                      </div>
                    </div>
                  ) : (
                    <Skeleton className="h-3.5 w-20 rounded" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/**
 * ChartSkeleton
 * Matches histogram & telemetry charts in AdminAnalytics and ProgressPage.
 * Emits a single accessible announcement for the entire visualization.
 */
export const ChartSkeleton = ({
  className = '',
  height = 'h-52',
  ariaLabel = 'Loading analytics visualization...'
}) => (
  <div
    role="status"
    aria-live="polite"
    aria-busy="true"
    aria-label={ariaLabel}
    className={`bg-white dark:bg-[#15181e] rounded-2xl border border-slate-200/90 dark:border-[#262a33] p-6 shadow-xs flex flex-col justify-between ${className}`}
  >
    <span className="sr-only">{ariaLabel}</span>
    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#262a33] mb-4" aria-hidden="true">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-36 rounded" />
        <Skeleton className="h-3 w-48 rounded" />
      </div>
      <Skeleton className="h-7 w-20 rounded-lg" />
    </div>

    {/* Pulsing bars to simulate distribution */}
    <div className={`flex items-end justify-between gap-2 sm:gap-4 px-2 ${height}`} aria-hidden="true">
      {[35, 60, 45, 80, 95, 70, 50, 85, 40, 65].map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
          <Skeleton
            className="w-full rounded-t-md"
            style={{ height: `${h}%` }}
          />
          <Skeleton className="h-2.5 w-6 rounded" />
        </div>
      ))}
    </div>
  </div>
);

/**
 * ExamCockpitSkeleton
 * Matches full-screen test cockpit in StudentTest, TestAttempt, and TestReview.
 * Emits a single accessible announcement for the examination screen.
 */
export const ExamCockpitSkeleton = ({
  className = '',
  ariaLabel = 'Loading examination cockpit...'
}) => (
  <div
    role="status"
    aria-live="polite"
    aria-busy="true"
    aria-label={ariaLabel}
    className={`h-screen bg-[#f9f9f7] dark:bg-[#0e1015] flex flex-col overflow-hidden ${className}`}
  >
    <span className="sr-only">{ariaLabel}</span>
    {/* Exam Header */}
    <header className="flex items-center justify-between px-4 md:px-6 py-3 bg-white dark:bg-[#15181e] border-b border-slate-200 dark:border-[#262a33] shrink-0" aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-16 rounded-xl" />
        <Skeleton className="h-6 w-32 rounded-lg" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-24 rounded-xl" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </header>

    {/* Main Body */}
    <div className="flex-1 flex overflow-hidden p-4 sm:p-6 gap-6 max-w-7xl mx-auto w-full" aria-hidden="true">
      {/* Question Pane (Left) */}
      <div className="flex-1 bg-white dark:bg-[#15181e] rounded-2xl border border-slate-200/90 dark:border-[#262a33] p-6 sm:p-8 flex flex-col justify-between shadow-xs">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>

          <div className="space-y-2.5">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-11/12 rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
          </div>

          {/* Options */}
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((opt) => (
              <div
                key={opt}
                className="p-4 rounded-xl border border-slate-200/80 dark:border-[#262a33] flex items-center gap-3"
              >
                <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                <Skeleton className="h-4 w-3/4 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Nav */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-[#262a33]">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Palette Pane (Right) */}
      <div className="hidden lg:flex w-72 bg-white dark:bg-[#15181e] rounded-2xl border border-slate-200/90 dark:border-[#262a33] p-6 flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-[#262a33]">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-12 rounded" />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 15 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  </div>
);

/**
 * FormSkeleton
 * Matches edit forms in AdminTestEdit.
 * Emits a single accessible announcement for the entire form.
 */
export const FormSkeleton = ({
  className = '',
  ariaLabel = 'Loading form fields...'
}) => (
  <div
    role="status"
    aria-live="polite"
    aria-busy="true"
    aria-label={ariaLabel}
    className={`bg-white dark:bg-[#15181e] rounded-2xl border border-slate-200/90 dark:border-[#262a33] p-6 sm:p-8 shadow-xs space-y-6 ${className}`}
  >
    <span className="sr-only">{ariaLabel}</span>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-24 rounded" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-24 rounded" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-20 rounded" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-28 rounded" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>

    <div className="space-y-2" aria-hidden="true">
      <Skeleton className="h-3.5 w-32 rounded" />
      <Skeleton className="h-28 w-full rounded-xl" />
    </div>

    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#262a33]" aria-hidden="true">
      <Skeleton className="h-9 w-20 rounded-xl" />
      <Skeleton className="h-9 w-28 rounded-xl" />
    </div>
  </div>
);

export default Skeleton;
