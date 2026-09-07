import React from "react";
import { TaskSummaryResponse } from "@/types/task";
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
} from "lucide-react";

interface SummaryCardsProps {
  summary: TaskSummaryResponse | null;
  onSelectStatusFilter?: (status: string) => void;
  activeStatusFilter?: string;
}

export function SummaryCards({
  summary,
  onSelectStatusFilter,
  activeStatusFilter,
}: SummaryCardsProps) {
  if (!summary) return null;

  const cards = [
    {
      label: "Total Tugas",
      count: summary.total,
      filterKey: "All",
      icon: BarChart3,
      iconColor: "text-slate-600 dark:text-slate-300",
      bgColor: "bg-slate-50 dark:bg-slate-800/60",
      borderColor: "border-slate-200 dark:border-slate-800",
      activeRing: "ring-2 ring-slate-500",
      badgeText: "Semua tugas aktif",
    },
    {
      label: "To Do",
      count: summary.todo,
      filterKey: "To Do",
      icon: ListTodo,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-50/70 dark:bg-blue-950/30",
      borderColor: "border-blue-200 dark:border-blue-900/60",
      activeRing: "ring-2 ring-blue-500",
      badgeText: "Menunggu dikerjakan",
    },
    {
      label: "In Progress",
      count: summary.in_progress,
      filterKey: "In Progress",
      icon: Clock,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-50/70 dark:bg-amber-950/30",
      borderColor: "border-amber-200 dark:border-amber-900/60",
      activeRing: "ring-2 ring-amber-500",
      badgeText: "Sedang berlangsung",
    },
    {
      label: "Done",
      count: summary.done,
      filterKey: "Done",
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-50/70 dark:bg-emerald-950/30",
      borderColor: "border-emerald-200 dark:border-emerald-900/60",
      activeRing: "ring-2 ring-emerald-500",
      badgeText: "Telah selesai",
    },
    {
      label: "Overdue",
      count: summary.overdue,
      filterKey: "", // Overdue is a computed metric
      icon: AlertCircle,
      iconColor: "text-rose-500",
      bgColor: "bg-rose-50/70 dark:bg-rose-950/30",
      borderColor: "border-rose-200 dark:border-rose-900/60",
      activeRing: "ring-2 ring-rose-500",
      badgeText: "Melewati batas waktu",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive =
          card.filterKey && activeStatusFilter === card.filterKey;

        return (
          <div
            key={card.label}
            onClick={() => {
              if (card.filterKey && onSelectStatusFilter) {
                onSelectStatusFilter(card.filterKey);
              }
            }}
            className={`p-5 rounded-2xl border transition-all duration-200 ${
              card.bgColor
            } ${card.borderColor} ${
              card.filterKey ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md" : ""
            } ${isActive ? card.activeRing : ""}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {card.label}
              </span>
              <div
                className={`p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-xs ${card.iconColor}`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {card.count}
              </div>
            </div>

            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 truncate">
              {card.badgeText}
            </div>
          </div>
        );
      })}
    </div>
  );
}
