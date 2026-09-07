import React from "react";
import { TaskPriority, TaskStatus } from "@/types/task";
import { Clock, CheckCircle, Flame, AlertTriangle, Sparkles, AlertOctagon } from "lucide-react";

interface StatusBadgeProps {
  status: TaskStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-semibold";

  if (status === "Done") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${sizeClasses}`}
      >
        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
        Done
      </span>
    );
  }

  if (status === "In Progress") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 ${sizeClasses}`}
      >
        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
        In Progress
      </span>
    );
  }

  // To Do
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 ${sizeClasses}`}
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
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-semibold";

  if (priority === "High") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 ${sizeClasses}`}
      >
        <Flame className="w-3.5 h-3.5 text-rose-600" />
        High
      </span>
    );
  }

  if (priority === "Medium") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200/80 ${sizeClasses}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
        Medium
      </span>
    );
  }

  // Low
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}
    >
      <Sparkles className="w-3.5 h-3.5 text-slate-500" />
      Low
    </span>
  );
}

export function OverdueBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-xs font-bold">
      <AlertOctagon className="w-3 h-3 text-rose-600" />
      Overdue
    </span>
  );
}
