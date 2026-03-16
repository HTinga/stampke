
import React, { useState } from 'react';
import { 
  Receipt, 
  CreditCard, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Search, 
  Filter,
  FileText,
  Download,
  Send,
  CheckCircle2,
  Clock,
  Building2,
  TrendingUp,
  PieChart as PieChartIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  AreaChart,
  Area
} from 'recharts';

interface Invoice {
  id: string;
  client: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  category: string;
}

export default function FinanceCenter() {
  const [invoices, setInvoices] = useState<Invoice[]>([
    { id: 'INV-001', client: 'Acme Corp', amount: 125000, date: '2024-03-15', status: 'Paid', category: 'Legal Fees' },
    { id: 'INV-002', client: 'Global Tech', amount: 45000, date: '2024-03-14', status: 'Pending', category: 'Consultation' },
    { id: 'INV-003', client: 'Safari Ltd', amount: 89000, date: '2024-03-10', status: 'Overdue', category: 'Stamp Design' },
  ]);

  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'accounts' | 'payroll'>('overview');

  const stats = [
    { label: 'Total Revenue', value: 'KES 1.2M', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Outstanding', value: 'KES 134K', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Bank Balance', value: 'KES 450K', icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Payroll Due', value: 'KES 280K', icon: CreditCard, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const payrollData = [
    { id: 'PAY-001', name: 'John Doe', role: 'Developer', hours: 160, rate: 1500, status: 'Verified' },
    { id: 'PAY-002', name: 'Jane Smith', role: 'Designer', hours: 152, rate: 1200, status: 'Pending' },
    { id: 'PAY-003', name: 'Mike Ross', role: 'Manager', hours: 168, rate: 2000, status: 'Verified' },
    { id: 'PAY-004', name: 'Sarah Connor', role: 'Operations', hours: 140, rate: 1000, status: 'Flagged' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tighter">Finance & Invoicing</h2>
          <p className="text-slate-500 font-medium">Manage your firm's accounts, invoices, and payroll synchronization.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-slate-900 dark:bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:opacity-90 transition-all">
            <Plus size={18} /> Create Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
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
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[56px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400'}`}
                >
                  Overview
                </button>
                <button 
                  onClick={() => setActiveTab('invoices')}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'invoices' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400'}`}
                >
                  Invoices
                </button>
                <button 
                  onClick={() => setActiveTab('payroll')}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'payroll' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400'}`}
                >
                  Payroll
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                  <Filter size={18} />
                </button>
                <button className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                  <Search size={18} />
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div 
                  key="overview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-[350px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { name: 'Jan', revenue: 4000, expenses: 2400 },
                      { name: 'Feb', revenue: 3000, expenses: 1398 },
                      { name: 'Mar', revenue: 9800, expenses: 2000 },
                      { name: 'Apr', revenue: 3908, expenses: 2780 },
                      { name: 'May', revenue: 4800, expenses: 1890 },
                      { name: 'Jun', revenue: 3800, expenses: 2390 },
                    ]}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {activeTab === 'invoices' && (
                <motion.div 
                  key="invoices"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {invoices.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 hover:border-blue-200 transition-all group">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400">
                          <FileText size={24} />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 dark:text-white">{inv.client}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{inv.id}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">•</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{inv.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="font-black text-slate-900 dark:text-white">KES {inv.amount.toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{inv.date}</p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          inv.status === 'Paid' ? 'bg-green-50 text-green-600' : 
                          inv.status === 'Overdue' ? 'bg-red-50 text-red-600' : 
                          'bg-orange-50 text-orange-600'
                        }`}>
                          {inv.status}
                        </span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm hover:text-blue-600"><Download size={16} /></button>
                          <button className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm hover:text-blue-600"><Send size={16} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'payroll' && (
                <motion.div 
                  key="payroll"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between p-6 bg-blue-600 text-white rounded-[32px] shadow-xl shadow-blue-200 dark:shadow-none">
                    <div>
                      <h4 className="text-lg font-black">Timesheet Verification</h4>
                      <p className="text-blue-100 text-xs font-medium">Verify employee hours before payroll disbursement.</p>
                    </div>
                    <button className="bg-white text-blue-600 px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all">
                      Verify All
                    </button>
                  </div>

                  <div className="space-y-3">
                    {payrollData.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-black text-slate-500">
                            {item.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{item.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-center">
                            <p className="font-black text-sm">{item.hours}h</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">Logged</p>
                          </div>
                          <div className="text-center">
                            <p className="font-black text-sm text-blue-600">KES {(item.hours * item.rate).toLocaleString()}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">Amount</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                            item.status === 'Verified' ? 'bg-emerald-100 text-emerald-600' : 
                            item.status === 'Flagged' ? 'bg-rose-100 text-rose-600' : 
                            'bg-slate-200 text-slate-500'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Accounts Sync Column */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 text-white p-10 rounded-[56px] shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-2xl font-black tracking-tight mb-4">Accounts Sync</h3>
              <p className="text-slate-400 font-medium mb-8">Connected to your M-Pesa Business and Equity Bank accounts.</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-black">M</div>
                    <div>
                      <p className="text-xs font-bold">M-Pesa Business</p>
                      <p className="text-[10px] text-slate-400">Last synced: 2m ago</p>
                    </div>
                  </div>
                  <CheckCircle2 size={16} className="text-emerald-500" />
                </div>
                <div className="flex items-center justify-between p-5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center font-black">E</div>
                    <div>
                      <p className="text-xs font-bold">Equity Bank</p>
                      <p className="text-[10px] text-slate-400">Last synced: 1h ago</p>
                    </div>
                  </div>
                  <CheckCircle2 size={16} className="text-emerald-500" />
                </div>
              </div>
              <button className="w-full mt-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                Sync All Accounts
              </button>
            </div>
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
          </div>

          <div className="bg-white dark:bg-slate-900 p-10 rounded-[56px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-black mb-8">Tax Compliance</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">KRA VAT Filing</span>
                <span className="text-xs font-black text-emerald-600">Up to date</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-full"></div>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Next filing due in 14 days. Automated reports are ready for review.</p>
              <button className="w-full py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">
                Download Tax Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
