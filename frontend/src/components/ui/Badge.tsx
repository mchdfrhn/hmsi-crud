import React from "react";
import { TaskPriority, TaskStatus } from "@/types/task";
import { Clock, CheckCircle, AlertTriangle, Flame, ShieldAlert, Sparkles } from "lucide-react";

interface StatusBadgeProps {
  status: TaskStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-medium";

  if (status === "Done") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 ${sizeClasses}`}
      >
        <CheckCircle className="w-3.5 h-3.5" />
        Done
      </span>
    );
  }

  if (status === "In Progress") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 ${sizeClasses}`}
      >
        <Clock className="w-3.5 h-3.5 animate-pulse" />
        In Progress
      </span>
    );
  }

  // To Do
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 ${sizeClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
      To Do
    </span>
  );
}

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: "sm" | "md";
}

export function PriorityBadge({ priority, size = "md" }: PriorityBadgeProps) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-medium";

  if (priority === "High") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 ${sizeClasses}`}
      >
        <Flame className="w-3.5 h-3.5" />
        High
      </span>
    );
  }

  if (priority === "Medium") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20 ${sizeClasses}`}
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        Medium
      </span>
    );
  }

  // Low
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/20 ${sizeClasses}`}
    >
      <Sparkles className="w-3.5 h-3.5" />
      Low
    </span>
  );
}

export function OverdueBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 px-2 py-0.5 text-xs font-semibold">
      <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
      Overdue
    </span>
  );
}
