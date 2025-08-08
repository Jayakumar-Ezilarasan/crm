import React, { useMemo } from 'react';
import { Task } from '../../types/models';

export interface TaskManagerProps {
  tasks?: Task[];
  loading?: boolean;
  error?: string;
  onTaskClick?: (task: Task) => void;
}

function getMonthDays(year: number, month: number) {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ tasks = [], loading, error, onTaskClick }) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  const tasksByDay = useMemo(() => {
    const map: { [date: string]: Task[] } = {};
    for (const task of tasks) {
      const day = new Date(task.dueDate).toISOString().slice(0, 10);
      if (!map[day]) map[day] = [];
      map[day].push(task);
    }
    return map;
  }, [tasks]);

  if (loading) return <div role="status" aria-busy="true" className="p-4">Loading...</div>;
  if (error) return <div role="alert" className="p-4 text-red-600">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="grid grid-cols-7 gap-2 bg-white rounded shadow p-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center font-bold text-gray-500">{d}</div>
        ))}
        {days.map((day) => {
          const dayStr = day.toISOString().slice(0, 10);
          return (
            <div
              key={dayStr}
              className="min-h-[80px] border rounded p-1 flex flex-col"
              aria-label={`Day ${day.getDate()}`}
            >
              <div className="text-xs text-gray-400 mb-1">{day.getDate()}</div>
              {tasksByDay[dayStr]?.map((task) => (
                <button
                  key={task.id}
                  className="w-full text-left text-xs bg-blue-100 rounded px-1 py-0.5 mb-1 hover:bg-blue-200 focus:outline-none"
                  aria-label={`Task: ${task.title}`}
                  onClick={() => onTaskClick?.(task)}
                >
                  {task.title}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}; 