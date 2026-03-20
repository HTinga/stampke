
import React, { useState } from 'react';
import { 
  Receipt, 
  CreditCard, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  X,
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

  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'accounts' | 'payroll' | 'approvals'>('overview');
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [payrollSubTab, setPayrollSubTab] = useState<'disbursement' | 'employees' | 'history'>('disbursement');

  const stats = [
    { label: 'Total Revenue', value: 'KES 1.2M', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Outstanding', value: 'KES 134K', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Bank Balance', value: 'KES 450K', icon: Wallet, color: 'text-[#134589]', bg: 'bg-[#eaf2fc]' },
    { label: 'Payroll Due', value: 'KES 280K', icon: CreditCard, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const pendingApprovals = [
    { id: 'APP-001', employee: 'John Doe', period: 'Mar 1-15', hours: 80, amount: 120000, status: 'Pending' },
    { id: 'APP-002', employee: 'Jane Smith', period: 'Mar 1-15', hours: 76, amount: 91200, status: 'Pending' },
    { id: 'APP-003', employee: 'Mike Ross', period: 'Mar 1-15', hours: 84, amount: 168000, status: 'Pending' },
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
          <p className="text-[#365874] font-medium">Manage your firm's accounts, invoices, and payroll synchronization.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-[#041628] dark:bg-[#134589] text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:opacity-90 transition-all">
            <Plus size={18} /> Create Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-[#041628] p-8 rounded-[40px] border border-[#eaf2fc] dark:border-[#0e3a72] shadow-sm">
            <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-6`}>
              <stat.icon size={24} />
            </div>
            <p className="text-[10px] font-black uppercase text-[#4d7291] tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-[#041628] p-10 rounded-[56px] border border-[#eaf2fc] dark:border-[#0e3a72] shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-2 bg-[#f0f6ff] dark:bg-[#062040] p-1.5 rounded-2xl">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-[#0a2d5a] shadow-sm text-[#134589]' : 'text-[#4d7291]'}`}
                >
                  Overview
                </button>
                <button 
                  onClick={() => setActiveTab('invoices')}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'invoices' ? 'bg-white dark:bg-[#0a2d5a] shadow-sm text-[#134589]' : 'text-[#4d7291]'}`}
                >
                  Invoices
                </button>
                <button 
                  onClick={() => setActiveTab('payroll')}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'payroll' ? 'bg-white dark:bg-[#0a2d5a] shadow-sm text-[#134589]' : 'text-[#4d7291]'}`}
                >
                  Payroll
                </button>
                <button 
                  onClick={() => setActiveTab('approvals')}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'approvals' ? 'bg-white dark:bg-[#0a2d5a] shadow-sm text-[#134589]' : 'text-[#4d7291]'}`}
                >
                  Approvals
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-3 bg-[#f0f6ff] dark:bg-[#062040] rounded-xl text-[#4d7291] hover:text-[#041628] transition-all">
                  <Filter size={18} />
                </button>
                <button className="p-3 bg-[#f0f6ff] dark:bg-[#062040] rounded-xl text-[#4d7291] hover:text-[#041628] transition-all">
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
                    <div key={inv.id} className="flex items-center justify-between p-6 bg-[#f0f6ff] dark:bg-[#062040] rounded-3xl border border-[#eaf2fc] dark:border-[#134589] hover:border-[#aaccf2] transition-all group">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white dark:bg-[#041628] rounded-2xl flex items-center justify-center text-[#4d7291]">
                          <FileText size={24} />
                        </div>
                        <div>
                          <h4 className="font-black text-[#041628] dark:text-white">{inv.client}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-bold text-[#4d7291] uppercase tracking-widest">{inv.id}</span>
                            <span className="text-[10px] font-bold text-[#4d7291] uppercase tracking-widest">•</span>
                            <span className="text-[10px] font-bold text-[#4d7291] uppercase tracking-widest">{inv.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="font-black text-[#041628] dark:text-white">KES {inv.amount.toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-[#4d7291] uppercase tracking-widest">{inv.date}</p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          inv.status === 'Paid' ? 'bg-green-50 text-green-600' : 
                          inv.status === 'Overdue' ? 'bg-red-50 text-red-600' : 
                          'bg-orange-50 text-orange-600'
                        }`}>
                          {inv.status}
                        </span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button className="p-2 bg-white dark:bg-[#041628] rounded-xl shadow-sm hover:text-[#134589]"><Download size={16} /></button>
                          <button className="p-2 bg-white dark:bg-[#041628] rounded-xl shadow-sm hover:text-[#134589]"><Send size={16} /></button>
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
                  <div className="flex items-center gap-2 bg-[#eaf2fc] dark:bg-[#062040] p-1 rounded-xl w-fit">
                    <button 
                      onClick={() => setPayrollSubTab('disbursement')}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${payrollSubTab === 'disbursement' ? 'bg-white dark:bg-[#041628] text-[#134589] shadow-sm' : 'text-[#365874]'}`}
                    >
                      Disbursement
                    </button>
                    <button 
                      onClick={() => setPayrollSubTab('employees')}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${payrollSubTab === 'employees' ? 'bg-white dark:bg-[#041628] text-[#134589] shadow-sm' : 'text-[#365874]'}`}
                    >
                      Employee Info
                    </button>
                    <button 
                      onClick={() => setPayrollSubTab('history')}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${payrollSubTab === 'history' ? 'bg-white dark:bg-[#041628] text-[#134589] shadow-sm' : 'text-[#365874]'}`}
                    >
                      Payment History
                    </button>
                  </div>

                  {payrollSubTab === 'disbursement' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-6 bg-[#134589] text-white rounded-[32px] shadow-xl shadow-[#aaccf2] dark:shadow-none">
                        <div>
                          <h4 className="text-lg font-black">Timesheet Verification</h4>
                          <p className="text-blue-100 text-xs font-medium">Verify employee hours before payroll disbursement.</p>
                        </div>
                        <button className="bg-white text-[#134589] px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#eaf2fc] transition-all">
                          Verify All
                        </button>
                      </div>

                      <div className="space-y-3">
                        {payrollData.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-5 bg-[#f0f6ff] dark:bg-[#062040] rounded-3xl border border-[#eaf2fc] dark:border-[#134589]">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-[#c5d8ef] dark:bg-[#0a2d5a] flex items-center justify-center font-black text-[#365874]">
                                {item.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-sm">{item.name}</p>
                                <p className="text-[10px] text-[#4d7291] font-bold uppercase">{item.role}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-8">
                              <div className="text-center">
                                <p className="font-black text-sm">{item.hours}h</p>
                                <p className="text-[8px] font-bold text-[#4d7291] uppercase">Logged</p>
                              </div>
                              <div className="text-center">
                                <p className="font-black text-sm text-[#134589]">KES {(item.hours * item.rate).toLocaleString()}</p>
                                <p className="text-[8px] font-bold text-[#4d7291] uppercase">Amount</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                item.status === 'Verified' ? 'bg-emerald-100 text-emerald-700' : 
                                item.status === 'Flagged' ? 'bg-rose-100 text-rose-700' : 
                                'bg-[#c5d8ef] text-[#365874]'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button className="w-full py-5 bg-[#041628] text-white rounded-[32px] font-black text-lg hover:bg-[#062040] shadow-xl transition-all">
                        Process Bulk Payroll (KES 2.4M)
                      </button>
                    </div>
                  )}

                  {payrollSubTab === 'employees' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xl font-black tracking-tight">Employee Records</h4>
                        <button 
                          onClick={() => setShowEmployeeForm(true)}
                          className="bg-[#134589] text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#0e3a72] transition-all"
                        >
                          <Plus size={16} /> Add Employee
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { name: 'John Kamau', role: 'Senior Advocate', email: 'john@sahihi.ke', bank: 'Equity Bank', account: '...4567' },
                          { name: 'Sarah Wambui', role: 'Operations Lead', email: 'sarah@sahihi.ke', bank: 'KCB Bank', account: '...8901' },
                        ].map((emp, i) => (
                          <div key={i} className="p-6 bg-white dark:bg-[#041628] rounded-[32px] border border-[#eaf2fc] dark:border-[#0e3a72] shadow-sm">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-12 h-12 rounded-2xl bg-[#eaf2fc] text-[#134589] flex items-center justify-center font-black text-lg">{emp.name[0]}</div>
                              <div>
                                <h5 className="font-black text-sm">{emp.name}</h5>
                                <p className="text-[10px] font-black uppercase text-[#4d7291]">{emp.role}</p>
                              </div>
                            </div>
                            <div className="space-y-2 text-[10px] font-black uppercase text-[#365874]">
                              <div className="flex justify-between"><span>Email</span><span className="text-[#041628] dark:text-white lowercase">{emp.email}</span></div>
                              <div className="flex justify-between"><span>Bank</span><span className="text-[#041628] dark:text-white">{emp.bank}</span></div>
                              <div className="flex justify-between"><span>Account</span><span className="text-[#041628] dark:text-white">{emp.account}</span></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {payrollSubTab === 'history' && (
                    <div className="space-y-4">
                      <h4 className="text-xl font-black tracking-tight mb-4">Past Disbursements</h4>
                      {[
                        { period: 'February 2024', amount: '2,450,000', date: 'Feb 28, 2024', status: 'Completed' },
                        { period: 'January 2024', amount: '2,380,000', date: 'Jan 31, 2024', status: 'Completed' },
                      ].map((h, i) => (
                        <div key={i} className="flex items-center justify-between p-6 bg-[#f0f6ff] dark:bg-[#062040] rounded-3xl border border-[#eaf2fc] dark:border-[#134589]">
                          <div>
                            <p className="font-bold text-sm">{h.period}</p>
                            <p className="text-[10px] text-[#4d7291] font-bold uppercase">Disbursed on {h.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-sm">KES {h.amount}</p>
                            <span className="text-[8px] font-black uppercase text-emerald-600">{h.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
              {activeTab === 'approvals' && (
                <motion.div 
                  key="approvals"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-black tracking-tight">Managerial Time Approvals</h4>
                    <span className="text-[10px] font-black uppercase bg-orange-100 text-orange-700 px-3 py-1 rounded-full">{pendingApprovals.length} Pending</span>
                  </div>
                  <div className="space-y-4">
                    {pendingApprovals.map(app => (
                      <div key={app.id} className="p-6 bg-[#f0f6ff] dark:bg-[#062040] rounded-3xl border border-[#eaf2fc] dark:border-[#134589] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#134589] text-white flex items-center justify-center font-black">{app.employee.charAt(0)}</div>
                          <div>
                            <p className="text-sm font-bold">{app.employee}</p>
                            <p className="text-[10px] font-black uppercase text-[#4d7291] tracking-widest">{app.period} • {app.hours} hrs</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-[#041628] dark:text-white">KES {app.amount.toLocaleString()}</p>
                          <div className="flex gap-2 mt-2">
                            <button className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all">Approve</button>
                            <button className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all">Reject</button>
                          </div>
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
          <div className="bg-[#041628] text-white p-10 rounded-[56px] shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-2xl font-black tracking-tight mb-4">Accounts Sync</h3>
              <p className="text-[#4d7291] font-medium mb-8">Connected to your M-Pesa Business and Equity Bank accounts.</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-black">M</div>
                    <div>
                      <p className="text-xs font-bold">M-Pesa Business</p>
                      <p className="text-[10px] text-[#4d7291]">Last synced: 2m ago</p>
                    </div>
                  </div>
                  <CheckCircle2 size={16} className="text-emerald-500" />
                </div>
                <div className="flex items-center justify-between p-5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#eaf2fc]0 rounded-xl flex items-center justify-center font-black">E</div>
                    <div>
                      <p className="text-xs font-bold">Equity Bank</p>
                      <p className="text-[10px] text-[#4d7291]">Last synced: 1h ago</p>
                    </div>
                  </div>
                  <CheckCircle2 size={16} className="text-emerald-500" />
                </div>
              </div>
              <button className="w-full mt-8 py-4 bg-[#134589] hover:bg-[#0e3a72] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                Sync All Accounts
              </button>
            </div>
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#134589]/10 rounded-full blur-3xl" />
          </div>

          <div className="bg-white dark:bg-[#041628] p-10 rounded-[56px] border border-[#eaf2fc] dark:border-[#0e3a72] shadow-sm">
            <h3 className="text-xl font-black mb-8">Tax Compliance</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-[#4d7291]">KRA VAT Filing</span>
                <span className="text-xs font-black text-emerald-600">Up to date</span>
              </div>
              <div className="w-full bg-[#eaf2fc] dark:bg-[#062040] h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-full"></div>
              </div>
              <p className="text-[10px] text-[#365874] font-medium">Next filing due in 14 days. Automated reports are ready for review.</p>
              <button className="w-full py-4 bg-[#f0f6ff] dark:bg-[#062040] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#eaf2fc] transition-all">
                Download Tax Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Form Modal */}
      <AnimatePresence>
        {showEmployeeForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEmployeeForm(false)}
              className="absolute inset-0 bg-[#041628]/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#041628] rounded-[48px] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-3xl font-black tracking-tighter">Add New Employee</h3>
                  <button onClick={() => setShowEmployeeForm(false)} className="p-2 hover:bg-[#eaf2fc] dark:hover:bg-[#062040] rounded-xl transition-all">
                    <X size={24} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-[#4d7291] tracking-widest">Full Name</label>
                    <input type="text" className="w-full p-4 bg-[#f0f6ff] dark:bg-[#062040] rounded-2xl border border-[#eaf2fc] dark:border-[#134589] font-bold text-sm outline-none focus:border-[#134589] transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-[#4d7291] tracking-widest">Role / Designation</label>
                    <input type="text" className="w-full p-4 bg-[#f0f6ff] dark:bg-[#062040] rounded-2xl border border-[#eaf2fc] dark:border-[#134589] font-bold text-sm outline-none focus:border-[#134589] transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-[#4d7291] tracking-widest">Email Address</label>
                    <input type="email" className="w-full p-4 bg-[#f0f6ff] dark:bg-[#062040] rounded-2xl border border-[#eaf2fc] dark:border-[#134589] font-bold text-sm outline-none focus:border-[#134589] transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-[#4d7291] tracking-widest">Phone Number</label>
                    <input type="tel" className="w-full p-4 bg-[#f0f6ff] dark:bg-[#062040] rounded-2xl border border-[#eaf2fc] dark:border-[#134589] font-bold text-sm outline-none focus:border-[#134589] transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-[#4d7291] tracking-widest">Bank Name</label>
                    <input type="text" className="w-full p-4 bg-[#f0f6ff] dark:bg-[#062040] rounded-2xl border border-[#eaf2fc] dark:border-[#134589] font-bold text-sm outline-none focus:border-[#134589] transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-[#4d7291] tracking-widest">Account Number</label>
                    <input type="text" className="w-full p-4 bg-[#f0f6ff] dark:bg-[#062040] rounded-2xl border border-[#eaf2fc] dark:border-[#134589] font-bold text-sm outline-none focus:border-[#134589] transition-all" />
                  </div>
                </div>
                <div className="mt-10 flex gap-4">
                  <button className="flex-1 bg-[#134589] text-white py-4 rounded-2xl font-black text-sm hover:bg-[#0e3a72] transition-all">Save Employee Record</button>
                  <button onClick={() => setShowEmployeeForm(false)} className="px-8 py-4 bg-[#eaf2fc] dark:bg-[#062040] text-[#224260] dark:text-[#7ab3e8] rounded-2xl font-black text-sm hover:bg-[#c5d8ef] transition-all">Cancel</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
