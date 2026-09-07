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
      iconColor: "text-slate-700 bg-slate-100",
      accentBorder: "hover:border-slate-400",
      activeRing: "ring-2 ring-slate-800 border-slate-800",
      badgeText: "Semua tugas aktif",
      countColor: "text-slate-900",
    },
    {
      label: "To Do",
      count: summary.todo,
      filterKey: "To Do",
      icon: ListTodo,
      iconColor: "text-blue-700 bg-blue-50 border border-blue-100",
      accentBorder: "hover:border-blue-400",
      activeRing: "ring-2 ring-blue-600 border-blue-600",
      badgeText: "Menunggu dikerjakan",
      countColor: "text-blue-900",
    },
    {
      label: "In Progress",
      count: summary.in_progress,
      filterKey: "In Progress",
      icon: Clock,
      iconColor: "text-amber-700 bg-amber-50 border border-amber-100",
      accentBorder: "hover:border-amber-400",
      activeRing: "ring-2 ring-amber-600 border-amber-600",
      badgeText: "Sedang berlangsung",
      countColor: "text-amber-900",
    },
    {
      label: "Done",
      count: summary.done,
      filterKey: "Done",
      icon: CheckCircle2,
      iconColor: "text-emerald-700 bg-emerald-50 border border-emerald-100",
      accentBorder: "hover:border-emerald-400",
      activeRing: "ring-2 ring-emerald-600 border-emerald-600",
      badgeText: "Telah diselesaikan",
      countColor: "text-emerald-900",
    },
    {
      label: "Overdue",
      count: summary.overdue,
      filterKey: "",
      icon: AlertCircle,
      iconColor: "text-rose-700 bg-rose-50 border border-rose-100",
      accentBorder: "hover:border-rose-300",
      activeRing: "ring-2 ring-rose-500 border-rose-500",
      badgeText: "Melewati tenggat waktu",
      countColor: "text-rose-600",
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
            className={`p-5 rounded-2xl border border-slate-200 bg-white shadow-xs transition-all duration-200 ${
              card.accentBorder
            } ${
              card.filterKey
                ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-sm"
                : ""
            } ${isActive ? card.activeRing : ""}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {card.label}
              </span>
              <div className={`p-2 rounded-xl ${card.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <div className={`text-3xl font-extrabold tracking-tight ${card.countColor}`}>
                {card.count}
              </div>
            </div>

            <div className="mt-2 text-xs text-slate-500 truncate font-medium">
              {card.badgeText}
            </div>
          </div>
        );
      })}
    </div>
  );
}
