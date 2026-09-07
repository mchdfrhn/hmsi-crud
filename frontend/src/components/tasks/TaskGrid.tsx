import React from "react";
import { Task, TaskStatus } from "@/types/task";
import { TaskCard } from "./TaskCard";

interface TaskGridProps {
  tasks: Task[];
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onQuickStatusChange: (task: Task, newStatus: TaskStatus) => void;
}

export function TaskGrid({
  tasks,
  onView,
  onEdit,
  onDelete,
  onQuickStatusChange,
}: TaskGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onQuickStatusChange={onQuickStatusChange}
        />
      ))}
    </div>
  );
}
