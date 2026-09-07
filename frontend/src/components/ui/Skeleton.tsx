import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-100 ${className}`}
    />
  );
}

export function SummaryCardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

export function TableRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} className="border-b border-slate-100">
          <td className="p-4">
            <Skeleton className="h-4 w-40 mb-1.5" />
            <Skeleton className="h-3 w-56" />
          </td>
          <td className="p-4">
            <Skeleton className="h-6 w-20 rounded-full" />
          </td>
          <td className="p-4">
            <Skeleton className="h-6 w-16 rounded-full" />
          </td>
          <td className="p-4">
            <Skeleton className="h-4 w-24" />
          </td>
          <td className="p-4">
            <Skeleton className="h-4 w-28" />
          </td>
          <td className="p-4 text-right">
            <div className="flex justify-end gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

export function GridCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div>
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
