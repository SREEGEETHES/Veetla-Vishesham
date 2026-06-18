import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle, Circle, Trophy, Plus, Trash, Filter, User } from "lucide-react";
import { Task, User as UserType } from "../types";

const API = "";

export default function TasksView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<UserType[]>([]);
  const [filter, setFilter] = useState<'all' | 'mine' | 'pending' | 'completed'>('all');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAssigneeId, setNewAssigneeId] = useState<number>(0);
  const [newDueDate, setNewDueDate] = useState("");
  const [newPoints, setNewPoints] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("familyos_token") || "";

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/members", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
        if (data.length > 0 && newAssigneeId === 0) {
          setNewAssigneeId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch members", err);
    }
  }, [token, newAssigneeId]);

  useEffect(() => {
    fetchTasks();
    fetchMembers();
  }, [fetchTasks, fetchMembers]);

  const getCurrentUserId = (): number => {
    const stored = localStorage.getItem("familyos_user");
    if (stored) {
      try {
        const user = JSON.parse(stored) as UserType;
        return user.id;
      } catch {
        return 0;
      }
    }
    return 0;
  };

  const currentUserId = getCurrentUserId();

  const totalPoints = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.points, 0);

  const filteredTasks = tasks.filter(task => {
    if (filter === 'mine') return task.assignee_id === currentUserId;
    if (filter === 'pending') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const dateA = new Date(a.due_date).getTime();
    const dateB = new Date(b.due_date).getTime();
    return dateA - dateB;
  });

  const handleToggleTask = async (task: Task) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: !task.completed }),
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
      }
    } catch (err) {
      console.error("Failed to toggle task", err);
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setTasks(prev => prev.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          assignee_id: newAssigneeId,
          due_date: newDueDate,
          points: newPoints,
          completed: false,
        }),
      });
      if (res.ok) {
        setNewTitle("");
        setNewDescription("");
        setNewPoints(10);
        setShowAddForm(false);
        fetchTasks();
      }
    } catch (err) {
      console.error("Failed to add task", err);
    } finally {
      setSubmitting(false);
    }
  };

  const getAssigneeName = (assigneeId: number) => {
    const member = members.find(m => m.id === assigneeId);
    return member?.name || `User ${assigneeId}`;
  };

  return (
    <div className="space-y-6 pt-2 pb-12 px-4 max-w-lg mx-auto text-left" id="tasksView">
      {/* Scoreboard Card */}
      <div className="bg-gradient-to-r from-[#ffdcc2] to-[#bde9ff] rounded-2xl p-4 flex justify-between items-center shadow-xs">
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Family Scoreboard</p>
          <h4 className="font-sans font-extrabold text-[#8e4e08] text-2xl mt-0.5">{totalPoints} Points</h4>
          <p className="text-xs text-slate-500 mt-1">Completed duties earn family reward points!</p>
        </div>
        <Trophy className="w-12 h-12 text-[#dc8e47] opacity-80" />
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-100 rounded-xl p-1 shadow-inner">
        {(['all', 'mine', 'pending', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg text-[11px] font-sans font-bold transition-all cursor-pointer ${
              filter === f ? 'bg-[#dc8e47] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#dc8e47] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sortedTasks.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-2xl border border-slate-100 text-slate-400 text-xs">
          No tasks match this filter. Add one below!
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map(task => (
            <div
              key={task.id}
              className={`bg-white rounded-xl p-4 border border-slate-100 shadow-xs flex items-start gap-3 transition-all ${task.completed ? 'bg-slate-50/70 opacity-75' : ''}`}
            >
              <button onClick={() => handleToggleTask(task)} className="flex-shrink-0 mt-0.5 cursor-pointer">
                {task.completed ? (
                  <CheckCircle className="w-6 h-6 text-[#dc8e47] fill-[#ffdcc2]/50" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-300" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <h4 className={`font-sans font-bold text-sm text-slate-800 ${task.completed ? 'line-through text-slate-400' : ''}`}>
                  {task.title}
                </h4>
                {task.description && (
                  <p className="text-[11px] text-slate-400 mt-0.5">{task.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-[10px] bg-orange-50 text-[#8e4e08] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {task.assignee_name || getAssigneeName(task.assignee_id)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Due: {task.due_date}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${task.completed ? 'bg-slate-100 text-slate-400' : 'bg-orange-50 text-[#8e4e08]'}`}>
                    +{task.points} pts
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-slate-100 transition cursor-pointer flex-shrink-0"
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Button / Form */}
      {showAddForm ? (
        <form onSubmit={handleAddTask} className="bg-white rounded-2xl p-5 border border-[#d8c2b3]/20 shadow-xs space-y-3">
          <h3 className="font-sans font-bold text-slate-800 text-base">Add New Task</h3>

          <div>
            <input
              type="text"
              placeholder="Task title (e.g. Walk the dog, Clean garage...)"
              required
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full bg-[#fdfaf7] border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:ring-1 focus:ring-[#dc8e47]"
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Description (optional)"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              className="w-full bg-[#fdfaf7] border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-sans outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assignee</label>
              <select
                value={newAssigneeId}
                onChange={e => setNewAssigneeId(Number(e.target.value))}
                className="w-full bg-[#fdfaf7] border border-slate-200 rounded-xl px-2 py-2 text-xs font-sans outline-none"
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Points</label>
              <input
                type="number"
                min="5"
                max="100"
                value={newPoints}
                onChange={e => setNewPoints(Number(e.target.value))}
                className="w-full bg-[#fdfaf7] border border-slate-200 rounded-xl px-2 py-2 text-xs font-sans outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Due Date</label>
            <input
              type="date"
              required
              value={newDueDate}
              onChange={e => setNewDueDate(e.target.value)}
              className="w-full bg-[#fdfaf7] border border-slate-200 rounded-xl px-3 py-2 text-xs font-sans outline-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#dc8e47] hover:bg-[#8e4e08] text-white py-2.5 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Plus className="w-4 h-4" /> Add Task</>
              )}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-3 rounded-xl bg-[#8e4e08] hover:bg-[#dc8e47] text-white font-sans font-bold text-sm transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1"
        >
          <Plus className="w-4 h-4" /> Create New Task
        </button>
      )}
    </div>
  );
}