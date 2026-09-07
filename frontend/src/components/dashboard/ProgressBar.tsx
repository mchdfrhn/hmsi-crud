import React from "react";
import { TaskSummaryResponse } from "@/types/task";

interface ProgressBarProps {
  summary: TaskSummaryResponse | null;
}

export function ProgressBar({ summary }: ProgressBarProps) {
  if (!summary || summary.total === 0) {
    return null;
  }

  const donePercent = Math.round((summary.done / summary.total) * 100);
  const inProgressPercent = Math.round(
    (summary.in_progress / summary.total) * 100
  );
  const todoPercent = Math.max(0, 100 - donePercent - inProgressPercent);

  return (
    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            Progres Penyelesaian Keseluruhan
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {summary.done} dari {summary.total} tugas selesai ({donePercent}%)
          </p>
        </div>
        <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
          {donePercent}%
        </span>
      </div>

      {/* Multi-segment Progress Bar */}
      <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
        <div
          style={{ width: `${donePercent}%` }}
          className="bg-emerald-500 transition-all duration-500"
          title={`Selesai: ${donePercent}%`}
        />
        <div
          style={{ width: `${inProgressPercent}%` }}
          className="bg-amber-500 transition-all duration-500"
          title={`In Progress: ${inProgressPercent}%`}
        />
        <div
          style={{ width: `${todoPercent}%` }}
          className="bg-blue-500/80 transition-all duration-500"
          title={`To Do: ${todoPercent}%`}
        />
      </div>

      {/* Legends */}
      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Done ({summary.done})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>In Progress ({summary.in_progress})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span>To Do ({summary.todo})</span>
        </div>
        {summary.overdue > 0 && (
          <div className="flex items-center gap-1.5 ml-auto text-rose-500 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>Overdue ({summary.overdue})</span>
          </div>
        )}
      </div>
    </div>
  );
}
