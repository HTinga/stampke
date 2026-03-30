
import React, { useState } from 'react';
import { 
  Bell, 
  Clock, 
  Calendar, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  Check,
  X,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: 'Low' | 'Medium' | 'High';
  completed: boolean;
  category: string;
}

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: '1',
      title: 'Renew Professional Indemnity Insurance',
      description: 'Check with Jubilee Insurance for the best rates.',
      dueDate: new Date(2024, 3, 20, 10, 0),
      priority: 'High',
      completed: false,
      category: 'Legal'
    },
    {
      id: '2',
      title: 'Submit VAT Returns',
      description: 'KRA iTax portal submission.',
      dueDate: new Date(2024, 3, 19, 17, 0),
      priority: 'High',
      completed: false,
      category: 'Finance'
    },
    {
      id: '3',
      title: 'Client Meeting: Acme Corp',
      description: 'Discuss the new contract terms.',
      dueDate: new Date(2024, 3, 16, 14, 0),
      priority: 'Medium',
      completed: true,
      category: 'Appointments'
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
    category: 'General'
  });

  const toggleComplete = (id: string) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const deleteReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const addReminder = (e: React.FormEvent) => {
    e.preventDefault();
    const reminder: Reminder = {
      id: Math.random().toString(36).substr(2, 9),
      ...newReminder,
      dueDate: new Date(),
      completed: false
    };
    setReminders([reminder, ...reminders]);
    setShowAddModal(false);
    setNewReminder({ title: '', description: '', priority: 'Medium', category: 'General' });
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-4xl font-black tracking-tighter">Reminders</h2>
          <p className="text-[#8b949e] font-medium">Never miss a deadline or an important task.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-[#1f6feb] text-white px-8 py-4 rounded-3xl font-black text-sm flex items-center gap-2 hover:bg-[#30363d] transition-all shadow-xl shadow-[#c5d8ef]"
        >
          <Plus size={20} /> Add Reminder
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-[#161b22] dark:bg-[#161b22] p-8 rounded-[40px] border border-[#21262d] dark:border-[#30363d] shadow-sm">
          <div className="bg-red-50 text-red-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
            <AlertCircle size={24} />
          </div>
          <p className="text-[10px] font-black uppercase text-[#8b949e] tracking-widest mb-1">Urgent</p>
          <p className="text-3xl font-black tracking-tighter">{reminders.filter(r => r.priority === 'High' && !r.completed).length}</p>
        </div>
        <div className="bg-[#161b22] dark:bg-[#161b22] p-8 rounded-[40px] border border-[#21262d] dark:border-[#30363d] shadow-sm">
          <div className="bg-[#21262d] text-[#58a6ff] w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
            <Clock size={24} />
          </div>
          <p className="text-[10px] font-black uppercase text-[#8b949e] tracking-widest mb-1">Pending</p>
          <p className="text-3xl font-black tracking-tighter">{reminders.filter(r => !r.completed).length}</p>
        </div>
        <div className="bg-[#161b22] dark:bg-[#161b22] p-8 rounded-[40px] border border-[#21262d] dark:border-[#30363d] shadow-sm">
          <div className="bg-emerald-50 text-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
            <CheckCircle2 size={24} />
          </div>
          <p className="text-[10px] font-black uppercase text-[#8b949e] tracking-widest mb-1">Completed</p>
          <p className="text-3xl font-black tracking-tighter">{reminders.filter(r => r.completed).length}</p>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {reminders.map((reminder) => (
            <motion.div
              layout
              key={reminder.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`group flex items-center justify-between p-8 rounded-[40px] border transition-all ${
                reminder.completed 
                  ? 'bg-[#0d1117]/50 dark:bg-[#21262d]/20 border-[#21262d] dark:border-[#30363d] opacity-60' 
                  : 'bg-[#161b22] dark:bg-[#161b22] border-[#21262d] dark:border-[#30363d] hover:border-[#aaccf2] hover:shadow-xl'
              }`}
            >
              <div className="flex items-center gap-8 flex-1">
                <button 
                  onClick={() => toggleComplete(reminder.id)}
                  className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all ${
                    reminder.completed 
                      ? 'bg-emerald-500 border-emerald-500 text-white' 
                      : 'border-[#30363d] dark:border-[#58a6ff] hover:border-[#1a5cad]'
                  }`}
                >
                  {reminder.completed && <Check size={20} />}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className={`text-xl font-black tracking-tight ${reminder.completed ? 'line-through text-[#8b949e]' : 'text-white dark:text-white'}`}>
                      {reminder.title}
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      reminder.priority === 'High' ? 'bg-red-50 text-red-600' : 
                      reminder.priority === 'Medium' ? 'bg-[#21262d] text-[#58a6ff]' : 'bg-[#0d1117] text-[#8b949e]'
                    }`}>
                      {reminder.priority}
                    </span>
                  </div>
                  <p className="text-sm text-[#8b949e] dark:text-[#8b949e] font-medium">{reminder.description}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-[#8b949e] uppercase tracking-widest">
                      <Calendar size={12} /> {format(reminder.dueDate, 'MMM do, yyyy')}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-[#8b949e] uppercase tracking-widest">
                      <Clock size={12} /> {format(reminder.dueDate, 'h:mm a')}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-[#58a6ff] bg-[#21262d] dark:bg-[#21262d] px-2 py-0.5 rounded-lg uppercase tracking-widest">
                      <Tag size={10} /> {reminder.category}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button className="p-3 hover:bg-[#21262d] dark:hover:bg-[#21262d] rounded-2xl text-[#8b949e] hover:text-white transition-all">
                  <MoreVertical size={20} />
                </button>
                <button 
                  onClick={() => deleteReminder(reminder.id)}
                  className="p-3 hover:bg-red-50 text-[#8b949e] hover:text-red-600 rounded-2xl transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-[#161b22]/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-[#161b22] dark:bg-[#161b22] w-full max-w-lg rounded-[48px] shadow-2xl border border-[#21262d] dark:border-[#30363d] p-12 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-3xl font-black tracking-tighter">New Reminder</h3>
                <button onClick={() => setShowAddModal(false)} className="p-3 bg-[#0d1117] dark:bg-[#21262d] rounded-2xl text-[#8b949e] hover:text-white transition-all">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={addReminder} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest ml-1">Title</label>
                  <input 
                    required
                    type="text" 
                    value={newReminder.title}
                    onChange={e => setNewReminder({...newReminder, title: e.target.value})}
                    placeholder="e.g. Renew License"
                    className="w-full bg-[#0d1117] dark:bg-[#21262d] border border-[#21262d] dark:border-[#30363d] rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-[#1f6feb]/10 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest ml-1">Description</label>
                  <textarea 
                    value={newReminder.description}
                    onChange={e => setNewReminder({...newReminder, description: e.target.value})}
                    placeholder="Add details..."
                    className="w-full bg-[#0d1117] dark:bg-[#21262d] border border-[#21262d] dark:border-[#30363d] rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-[#1f6feb]/10 font-bold min-h-[120px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest ml-1">Priority</label>
                    <select 
                      value={newReminder.priority}
                      onChange={e => setNewReminder({...newReminder, priority: e.target.value as any})}
                      className="w-full bg-[#0d1117] dark:bg-[#21262d] border border-[#21262d] dark:border-[#30363d] rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-[#1f6feb]/10 font-bold appearance-none"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest ml-1">Category</label>
                    <input 
                      type="text" 
                      value={newReminder.category}
                      onChange={e => setNewReminder({...newReminder, category: e.target.value})}
                      placeholder="General"
                      className="w-full bg-[#0d1117] dark:bg-[#21262d] border border-[#21262d] dark:border-[#30363d] rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-[#1f6feb]/10 font-bold"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-[#161b22] dark:bg-[#1f6feb] text-white py-6 rounded-3xl font-black text-xl shadow-2xl shadow-slate-200 dark:shadow-none hover:scale-105 transition-all"
                >
                  Create Reminder
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
