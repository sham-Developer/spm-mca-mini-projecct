import React from 'react';

/**
 * Universal High-Contrast Skeleton Component
 * Built for non-OLED, TN, and low-contrast LCD screens
 */
export function Skeleton({ className = '', variant = 'rect', ...props }) {
  const baseClasses = 'animate-pulse bg-slate-300 border border-slate-400/60 rounded-md';
  const variantClasses = {
    text: 'h-4 w-full rounded',
    circle: 'rounded-full',
    rect: 'rounded-xl',
    card: 'rounded-2xl border-2 border-slate-400 bg-slate-100 p-6 shadow-md'
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant] || ''} ${className}`}
      {...props}
    />
  );
}

/**
 * Metric Card Skeleton (for Executive Overview / KPI grids)
 */
export function MetricCardSkeleton() {
  return (
    <div className="bg-white border-2 border-slate-400 rounded-2xl p-5 shadow-sm space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-300 rounded w-28"></div>
        <div className="w-9 h-9 bg-slate-200 border border-slate-300 rounded-xl"></div>
      </div>
      <div className="flex items-baseline justify-between pt-2">
        <div className="h-8 bg-slate-300 rounded w-24"></div>
        <div className="h-5 bg-slate-200 border border-slate-300 rounded-full w-20"></div>
      </div>
    </div>
  );
}

/**
 * Table Rows Skeleton (for HR Directory, Clients, Tasks tables)
 */
export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="bg-white border-2 border-slate-400 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 border-b-2 border-slate-300 bg-slate-200/80 flex items-center justify-between">
        <div className="h-5 bg-slate-300 rounded w-40 animate-pulse"></div>
        <div className="h-8 bg-slate-300 rounded-lg w-32 animate-pulse"></div>
      </div>
      <div className="divide-y-2 divide-slate-200 p-2">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex items-center gap-4 p-3.5 animate-pulse bg-slate-50/50">
            <div className="w-9 h-9 rounded-full bg-slate-300 border border-slate-400 shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-300 rounded w-1/3"></div>
              <div className="h-3.5 bg-slate-200 rounded w-1/4"></div>
            </div>
            {Array.from({ length: cols - 1 }).map((_, cIdx) => (
              <div key={cIdx} className="hidden md:block h-4 bg-slate-200 rounded w-20"></div>
            ))}
            <div className="w-18 h-7 bg-slate-300 border border-slate-400 rounded-lg shrink-0"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Kanban Column Skeleton (for Client Pipeline / Project Boards)
 */
export function KanbanSkeleton({ columns = 4 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="bg-slate-200/90 border-2 border-slate-400 rounded-2xl p-3.5 space-y-3 animate-pulse">
          <div className="flex items-center justify-between pb-2 border-b-2 border-slate-300">
            <div className="h-4.5 bg-slate-300 rounded w-28"></div>
            <div className="w-6 h-6 bg-slate-300 rounded-full border border-slate-400"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((card) => (
              <div key={card} className="bg-white border-2 border-slate-300 rounded-xl p-4 space-y-2.5 shadow-sm">
                <div className="h-4 bg-slate-300 rounded w-3/4"></div>
                <div className="h-3.5 bg-slate-200 rounded w-1/2"></div>
                <div className="pt-2 flex justify-between items-center">
                  <div className="h-3.5 bg-slate-200 rounded w-16"></div>
                  <div className="h-5 bg-slate-300 rounded-full w-14"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Skeleton;

