
import React, { useState } from 'react';
import { 
  ListTodo, 
  BarChart3, 
  Clock, 
  PenTool, 
  ClipboardList, 
  Zap, 
  Users,
  Plus,
  Search,
  MoreVertical,
  Calendar,
  CheckCircle2,
  Clock3,
  MessageSquare,
  Filter,
  ArrowRight,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  LayoutDashboard,
  Building2,
  ShieldCheck,
  UserCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Stage, Layer, Line as KonvaLine, Rect, Circle } from 'react-konva';

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee: string;
  dueDate: string;
  timeSpent: number; // in seconds
}

interface WorkspaceSuiteProps {
  activeTab: string;
}

const WorkspaceSuite: React.FC<WorkspaceSuiteProps> = ({ activeTab }) => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'KRA Tax Returns - Q1', status: 'done', priority: 'high', assignee: 'John', dueDate: '2024-03-20', timeSpent: 3600 },
    { id: '2', title: 'M-Pesa Business API Integration', status: 'in-progress', priority: 'high', assignee: 'Jane', dueDate: '2024-03-25', timeSpent: 7200 },
    { id: '3', title: 'Nairobi Office Lease Renewal', status: 'todo', priority: 'medium', assignee: 'Mike', dueDate: '2024-04-01', timeSpent: 0 },
    { id: '4', title: 'County Government Permit Filing', status: 'todo', priority: 'low', assignee: 'Sarah', dueDate: '2024-03-15', timeSpent: 0 },
  ]);

  const [timerActive, setTimerActive] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'supervisor' | 'staff'>('admin');

  // Company Structure Data
  const companyStaff = [
    { id: 'ceo', name: 'Dr. Kamau Njoroge', role: 'CEO', dept: 'Executive', email: 'ceo@sme.co.ke' },
    { id: 'chairman', name: 'Hon. Sarah Wambui', role: 'Chairman', dept: 'Board', email: 'sarah@sme.co.ke' },
    { id: 'hr', name: 'Jane Muthoni', role: 'HR Manager', dept: 'Human Resources', email: 'jane@sme.co.ke' },
    { id: 'secretary', name: 'Alice Atieno', role: 'Company Secretary', dept: 'Legal', email: 'alice@sme.co.ke' },
    { id: 'supervisor', name: 'John Doe', role: 'Operations Supervisor', dept: 'Operations', email: 'john@sme.co.ke' },
  ];

  // Persistence
  React.useEffect(() => {
    const savedTasks = localStorage.getItem('sme_workspace_tasks');
    if (savedTasks) setTasks(JSON.parse(savedTasks));
  }, []);

  React.useEffect(() => {
    localStorage.setItem('sme_workspace_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Whiteboard state
  const [lines, setLines] = useState<any[]>([]);
  const isDrawing = React.useRef(false);

  // Gantt Chart Data
  const ganttData = tasks.map(t => ({
    name: t.title,
    start: new Date(t.dueDate).getTime() - (Math.random() * 5 * 24 * 60 * 60 * 1000),
    end: new Date(t.dueDate).getTime(),
    status: t.status
  }));

  const renderTasks = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-black tracking-tighter">Tasks & Projects</h2>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 transition-all">
          <Plus size={18} /> New Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['todo', 'in-progress', 'done'].map(status => (
          <div key={status} className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center justify-between">
              {status.replace('-', ' ')}
              <span className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-500">
                {tasks.filter(t => t.status === status).length}
              </span>
            </h3>
            <div className="space-y-4">
              {tasks.filter(t => t.status === status).map(task => (
                <motion.div 
                  key={task.id}
                  layoutId={task.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                      task.priority === 'high' ? 'bg-red-100 text-red-600' : 
                      task.priority === 'medium' ? 'bg-orange-100 text-orange-600' : 
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {task.priority}
                    </span>
                    <button className="text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4">{task.title}</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-black text-white">
                        {task.assignee[0]}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                      <Calendar size={12} />
                      {task.dueDate}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGantt = () => (
    <div className="space-y-8">
      <h2 className="text-4xl font-black tracking-tighter">Gantt Timeline</h2>
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-12 gap-4 mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="col-span-3 text-[10px] font-black uppercase text-slate-400">Task Name</div>
            <div className="col-span-9 grid grid-cols-7 gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d} className="text-center text-[10px] font-black uppercase text-slate-400">{d}</div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            {tasks.map((task, i) => (
              <div key={task.id} className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-3 font-bold text-sm truncate">{task.title}</div>
                <div className="col-span-9 relative h-8 bg-slate-50 dark:bg-slate-800/50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${30 + (i * 15)}%` }}
                    className={`absolute h-full rounded-full ${
                      task.status === 'done' ? 'bg-emerald-500' : 
                      task.status === 'in-progress' ? 'bg-blue-500' : 
                      'bg-slate-300'
                    }`}
                    style={{ left: `${i * 10}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTime = () => (
    <div className="space-y-8">
      <h2 className="text-4xl font-black tracking-tighter">Time Tracking</h2>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Active Timer</h3>
            <div className="text-6xl font-black tracking-tighter mb-8 tabular-nums">
              {format(new Date(elapsedTime * 1000), 'mm:ss')}
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setTimerActive(!timerActive)}
                className={`flex-1 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${timerActive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {timerActive ? <><Pause size={18} /> Stop</> : <><Play size={18} /> Start</>}
              </button>
              <button 
                onClick={() => setElapsedTime(0)}
                className="p-4 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-all"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Recent Logs</h3>
            <div className="space-y-4">
              {tasks.filter(t => t.timeSpent > 0).map(task => (
                <div key={task.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <div>
                    <p className="font-bold text-sm">{task.title}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{task.assignee}</p>
                  </div>
                  <span className="font-black text-blue-600">{Math.round(task.timeSpent / 60)}m</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">Weekly Productivity</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { day: 'Mon', hours: 4.5 },
                { day: 'Tue', hours: 6.2 },
                { day: 'Wed', hours: 5.8 },
                { day: 'Thu', hours: 7.1 },
                { day: 'Fri', hours: 4.9 },
                { day: 'Sat', hours: 2.3 },
                { day: 'Sun', hours: 1.5 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="hours" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tighter">Workspace Overview</h2>
          <p className="text-slate-500 font-medium">Welcome back! Here is what is happening in your SME today.</p>
        </div>
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 px-6 py-3 rounded-2xl border border-emerald-100 dark:border-emerald-800">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">KRA Compliance: Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Tasks', value: tasks.length, icon: ListTodo, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Hours Logged', value: '124h', icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Active Projects', value: '6', icon: BarChart3, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Team Members', value: '12', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-6`}>
              <stat.icon size={24} />
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-10 rounded-[56px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-black mb-8">Project Velocity</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { name: 'Week 1', value: 40 },
                { name: 'Week 2', value: 30 },
                { name: 'Week 3', value: 60 },
                { name: 'Week 4', value: 45 },
                { name: 'Week 5', value: 70 },
                { name: 'Week 6', value: 55 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={4} dot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="lg:col-span-4 bg-slate-900 text-white p-10 rounded-[56px] shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-4">M-Pesa Business</h3>
            <p className="text-slate-400 font-medium mb-8">Direct integration for payroll and vendor payments.</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                <span className="text-xs font-bold">Balance</span>
                <span className="text-xl font-black">KES 450,000</span>
              </div>
              <button className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-sm transition-all">
                Disburse Payroll
              </button>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );

  const renderWhiteboard = () => (
    <div className="h-full flex flex-col space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-black tracking-tighter">Whiteboard</h2>
        <div className="flex gap-2">
          <button onClick={() => setLines([])} className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl hover:bg-slate-200 transition-all">
            <RotateCcw size={18} />
          </button>
        </div>
      </div>
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 overflow-hidden relative min-h-[600px]">
        <Stage
          width={1200}
          height={800}
          onMouseDown={(e) => {
            isDrawing.current = true;
            const pos = e.target.getStage()?.getPointerPosition();
            setLines([...lines, { points: [pos?.x, pos?.y] }]);
          }}
          onMouseMove={(e) => {
            if (!isDrawing.current) return;
            const stage = e.target.getStage();
            const point = stage?.getPointerPosition();
            let lastLine = lines[lines.length - 1];
            lastLine.points = lastLine.points.concat([point?.x, point?.y]);
            lines.splice(lines.length - 1, 1, lastLine);
            setLines(lines.concat());
          }}
          onMouseUp={() => {
            isDrawing.current = false;
          }}
        >
          <Layer>
            {lines.map((line, i) => (
              <KonvaLine
                key={i}
                points={line.points}
                stroke="#2563eb"
                strokeWidth={5}
                tension={0.5}
                lineCap="round"
                globalCompositeOperation="source-over"
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );

  const renderForms = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-black tracking-tighter">Forms & Surveys</h2>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 transition-all">
          <Plus size={18} /> Create Form
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Customer Feedback', responses: 124, status: 'active' },
          { title: 'Employee Onboarding', responses: 12, status: 'active' },
          { title: 'Stamp Request Form', responses: 89, status: 'draft' },
        ].map((form, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl text-blue-600"><ClipboardList size={24} /></div>
              <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${form.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                {form.status}
              </span>
            </div>
            <h4 className="text-xl font-black mb-2">{form.title}</h4>
            <p className="text-slate-400 font-bold text-sm mb-6">{form.responses} Responses collected</p>
            <button className="w-full py-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-black text-xs uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white transition-all">
              View Results
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAutomation = () => (
    <div className="space-y-8">
      <h2 className="text-4xl font-black tracking-tighter">Automation Hub</h2>
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[56px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4 mb-10">
          <div className="bg-orange-500 text-white p-4 rounded-3xl shadow-lg shadow-orange-200"><Zap size={32} /></div>
          <div>
            <h3 className="text-2xl font-black">Active Workflows</h3>
            <p className="text-slate-400 font-bold">Automate repetitive tasks across your workspace.</p>
          </div>
        </div>
        <div className="space-y-4">
          {[
            { trigger: 'When Task is Done', action: 'Send Email to Client', status: true },
            { trigger: 'When Form is Submitted', action: 'Create New Task', status: true },
            { trigger: 'Every Monday at 9AM', action: 'Generate Weekly Report', status: false },
          ].map((rule, i) => (
            <div key={i} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase text-slate-400">Trigger</span>
                  <span className="font-bold text-sm">{rule.trigger}</span>
                </div>
                <ArrowRight size={16} className="text-slate-300" />
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase text-slate-400">Action</span>
                  <span className="font-bold text-sm">{rule.action}</span>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${rule.status ? 'bg-blue-600' : 'bg-slate-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-all ${rule.status ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWorkload = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-black tracking-tighter">Team Workload</h2>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
          <span className="text-[10px] font-black uppercase px-3 text-slate-400">View Mode:</span>
          <button className="px-4 py-2 bg-white dark:bg-slate-700 rounded-lg text-[10px] font-black uppercase shadow-sm">Capacity</button>
          <button className="px-4 py-2 text-slate-400 text-[10px] font-black uppercase">Timeline</button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {['John', 'Jane', 'Mike', 'Sarah'].map(name => (
          <div key={name} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-100 dark:shadow-none">
                {name.charAt(0)}
              </div>
              <div>
                <h4 className="font-black">{name}</h4>
                <p className="text-[10px] text-slate-400 font-black uppercase">Team Lead</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-black uppercase">
                  <span className="text-slate-400">Capacity</span>
                  <span className="text-blue-600">85%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-800">
                <div className="text-center">
                  <p className="text-xl font-black">12</p>
                  <p className="text-[8px] font-black uppercase text-slate-400">Tasks</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black">34h</p>
                  <p className="text-[8px] font-black uppercase text-slate-400">Logged</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCompany = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-black tracking-tighter">Company Structure</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <ShieldCheck size={16} className="text-emerald-600" />
            <select 
              value={currentUserRole}
              onChange={(e) => setCurrentUserRole(e.target.value as any)}
              className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer"
            >
              <option value="admin">Admin View</option>
              <option value="supervisor">Supervisor View</option>
              <option value="staff">Staff View</option>
            </select>
          </div>
          <button className="bg-slate-900 dark:bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:opacity-90 transition-all">
            <Plus size={18} /> Add Staff
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companyStaff.map(staff => (
          <div key={staff.id} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-all duration-500" />
            <div className="flex items-center gap-6 mb-8 relative z-10">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-inner">
                <UserCircle size={32} />
              </div>
              <div>
                <h4 className="text-lg font-black tracking-tight">{staff.name}</h4>
                <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">{staff.role}</p>
              </div>
            </div>
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between text-[10px] font-black uppercase">
                <span className="text-slate-400">Department</span>
                <span className="text-slate-900 dark:text-white">{staff.dept}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase">
                <span className="text-slate-400">Email</span>
                <span className="text-slate-900 dark:text-white lowercase">{staff.email}</span>
              </div>
              <div className="pt-6 flex gap-2">
                <button className="flex-1 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-all">Profile</button>
                <button className="flex-1 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-all">Message</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {currentUserRole === 'admin' && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-8 rounded-[40px] border border-emerald-100 dark:border-emerald-800/50">
          <div className="flex items-center gap-4 mb-4">
            <ShieldCheck className="text-emerald-600" size={24} />
            <h3 className="text-xl font-black tracking-tight text-emerald-900 dark:text-emerald-400">Admin Controls Active</h3>
          </div>
          <p className="text-sm text-emerald-800 dark:text-emerald-500 font-medium mb-6">As an administrator, you can manage roles, permissions, and company-wide settings for your SME.</p>
          <div className="flex flex-wrap gap-3">
            <button className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all">Manage Permissions</button>
            <button className="px-6 py-3 bg-white dark:bg-slate-900 text-emerald-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 transition-all">Audit Logs</button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-8">
      {/* Workspace View Switcher */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 self-start shadow-sm">
        {[
          { id: 'home', label: 'Overview', icon: LayoutDashboard },
          { id: 'tasks', label: 'Tasks', icon: ListTodo },
          { id: 'gantt', label: 'Gantt', icon: BarChart3 },
          { id: 'time', label: 'Time', icon: Clock },
          { id: 'whiteboard', label: 'Board', icon: PenTool },
          { id: 'forms', label: 'Forms', icon: ClipboardList },
          { id: 'automation', label: 'Zap', icon: Zap },
          { id: 'workload', label: 'Team', icon: Users },
          { id: 'company', label: 'Company', icon: Building2 },
        ].map((view) => (
          <button
            key={view.id}
            onClick={() => {
              // Internal navigation handled by activeTab prop from parent
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              (activeTab === view.id || (activeTab === 'workspace-dashboard' && view.id === 'home')) 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <view.icon size={14} />
            <span className="hidden md:inline">{view.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1">
        {activeTab === 'home' && renderDashboard()}
        {activeTab === 'tasks' && renderTasks()}
        {activeTab === 'gantt' && renderGantt()}
        {activeTab === 'time' && renderTime()}
        {activeTab === 'whiteboard' && renderWhiteboard()}
        {activeTab === 'forms' && renderForms()}
        {activeTab === 'automation' && renderAutomation()}
        {activeTab === 'workload' && renderWorkload()}
        {activeTab === 'company' && renderCompany()}
      </div>
    </div>
  );
};

export default WorkspaceSuite;
