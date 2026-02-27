
import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Mail, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Plus, 
  Video, 
  MapPin, 
  History,
  Settings,
  Bell,
  Search,
  MoreVertical,
  CalendarDays,
  Lock,
  Globe,
  Eye
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isBefore,
  startOfToday
} from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface Booking {
  id: string;
  title: string;
  clientName: string;
  clientEmail: string;
  date: Date;
  time: string;
  type: 'Video' | 'In-Person' | 'Blocked';
  status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Blocked';
}

export default function BookingSystem() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isPublicView, setIsPublicView] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: '1',
      title: 'Legal Consultation',
      clientName: 'John Doe',
      clientEmail: 'john@example.com',
      date: new Date(),
      time: '10:00 AM',
      type: 'Video',
      status: 'Confirmed'
    },
    {
      id: '2',
      title: 'Personal Time',
      clientName: 'Self',
      clientEmail: '',
      date: new Date(),
      time: '01:00 PM',
      type: 'Blocked',
      status: 'Blocked'
    }
  ]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    title: '',
    clientName: '',
    clientEmail: '',
    time: '09:00 AM',
    type: 'Video' as const
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const onDateClick = (day: Date) => {
    setSelectedDate(day);
  };

  const copyPublicLink = () => {
    const url = window.location.origin + '?tab=booking&view=public';
    navigator.clipboard.writeText(url);
    alert('Public booking link copied to clipboard!');
  };

  const renderHeader = () => {
    return (
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg">
            <CalendarDays size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
              {isPublicView ? 'Client Booking Page' : 'Your Professional Diary'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isPublicView ? (
            <>
              <button 
                onClick={() => setIsPublicView(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                <Eye size={14} /> Preview Public
              </button>
              <button 
                onClick={copyPublicLink}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                <Globe size={14} /> Copy Link
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsPublicView(false)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            >
              <ChevronLeft size={14} /> Back to Diary
            </button>
          )}
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <ChevronLeft size={20} className="text-slate-600" />
            </button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-4 py-2 text-xs font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
              Today
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <ChevronRight size={20} className="text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-4">
        {days.map((day) => (
          <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        {days.map((day, idx) => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());
          const hasBookings = bookings.some(b => isSameDay(b.date, day));
          const dayBookings = bookings.filter(b => isSameDay(b.date, day));
          const isBlocked = dayBookings.some(b => b.type === 'Blocked');

          return (
            <div
              key={idx}
              onClick={() => onDateClick(day)}
              className={`min-h-[120px] p-4 bg-white cursor-pointer transition-all hover:bg-blue-50/30 relative group ${
                !isCurrentMonth ? 'text-slate-300' : 'text-slate-900'
              } ${isBlocked ? 'bg-slate-50/50' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-sm font-black ${
                  isToday ? 'bg-blue-600 text-white w-7 h-7 flex items-center justify-center rounded-lg shadow-lg shadow-blue-200' : 
                  isSelected ? 'text-blue-600' : ''
                }`}>
                  {format(day, 'd')}
                </span>
                {hasBookings && (
                  <div className={`w-2 h-2 rounded-full ${isBlocked ? 'bg-slate-400' : 'bg-blue-600'}`}></div>
                )}
              </div>
              <div className="space-y-1">
                {dayBookings.slice(0, 2).map(b => (
                  <div key={b.id} className={`text-[9px] font-bold px-2 py-1 rounded-md truncate border ${
                    b.type === 'Blocked' 
                      ? 'bg-slate-100 text-slate-500 border-slate-200 italic' 
                      : 'bg-blue-50 text-blue-700 border-blue-100'
                  }`}>
                    {b.time} - {b.title}
                  </div>
                ))}
                {dayBookings.length > 2 && (
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter pl-1">
                    + {dayBookings.length - 2} more
                  </div>
                )}
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedDate(day); setShowBookingModal(true); }}
                className="absolute bottom-2 right-2 p-1.5 bg-slate-900 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <Plus size={14} />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBooking: Booking = {
      id: Math.random().toString(36).substr(2, 9),
      ...bookingForm,
      date: selectedDate,
      status: 'Confirmed'
    };
    setBookings([...bookings, newBooking]);
    setShowBookingModal(false);
    setBookingForm({
      title: '',
      clientName: '',
      clientEmail: '',
      time: '09:00 AM',
      type: 'Video'
    });
  };

  return (
    <div className="py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Calendar */}
          <div className="lg:col-span-8">
            <div className="bg-white p-8 md:p-12 rounded-[56px] border border-slate-100 shadow-2xl">
              {renderHeader()}
              {renderDays()}
              {renderCells()}
            </div>

            {/* Upcoming List for Selected Date */}
            <div className="mt-12 bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {isPublicView ? 'Available Slots' : `Schedule for ${format(selectedDate, 'MMMM do')}`}
                </h3>
                {!isPublicView && (
                  <button 
                    onClick={() => setShowBookingModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    <Plus size={16} /> New Booking
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {bookings.filter(b => isSameDay(b.date, selectedDate)).length > 0 ? (
                  bookings.filter(b => isSameDay(b.date, selectedDate)).map(b => (
                    <div key={b.id} className="group flex items-center justify-between p-6 bg-slate-50 rounded-[32px] border border-slate-100 hover:border-blue-200 hover:bg-white transition-all">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white rounded-2xl flex flex-col items-center justify-center shadow-sm border border-slate-100">
                          <span className="text-xs font-black text-blue-600">{b.time.split(' ')[1]}</span>
                          <span className="text-lg font-black text-slate-900">{b.time.split(' ')[0]}</span>
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-lg">{b.title}</h4>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <User size={12} /> {b.clientName}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {b.type === 'Video' ? <Video size={12} /> : <MapPin size={12} />} {b.type}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="px-4 py-1.5 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                          {b.status}
                        </span>
                        <button className="p-2 text-slate-400 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical size={20} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Clock size={32} className="text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No bookings for this day</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Stats & Quick Actions (Hidden in Public View) */}
          {!isPublicView && (
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-slate-900 p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-2xl font-black tracking-tight mb-2">Weekly Overview</h3>
                  <p className="text-slate-400 text-sm font-medium mb-8">You have {bookings.length} meetings this week.</p>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">Video Calls</span>
                      <span className="font-black">{bookings.filter(b => b.type === 'Video').length}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full w-[65%]"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">In-Person</span>
                      <span className="font-black">{bookings.filter(b => b.type === 'In-Person').length}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[35%]"></div>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
              </div>

              <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl">
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">Quick Settings</h3>
                <div className="space-y-4">
                  <button className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group">
                    <div className="flex items-center gap-4">
                      <Settings size={20} className="text-slate-400 group-hover:text-slate-900" />
                      <span className="text-sm font-black text-slate-900">Availability</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </button>
                  <button className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group">
                    <div className="flex items-center gap-4">
                      <Bell size={20} className="text-slate-400 group-hover:text-slate-900" />
                      <span className="text-sm font-black text-slate-900">Notifications</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </button>
                  <button className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group">
                    <div className="flex items-center gap-4">
                      <History size={20} className="text-slate-400 group-hover:text-slate-900" />
                      <span className="text-sm font-black text-slate-900">Past Bookings</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </button>
                </div>
              </div>
            </div>
          )}
          {isPublicView && (
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-blue-600 p-10 rounded-[48px] text-white shadow-2xl">
                <h3 className="text-2xl font-black tracking-tight mb-4">Book a Session</h3>
                <p className="text-blue-100 text-sm font-medium mb-8">Select a date and time slot to schedule a meeting with us.</p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-blue-700/50 p-4 rounded-2xl">
                    <CheckCircle2 size={20} />
                    <span className="text-xs font-bold">Instant Confirmation</span>
                  </div>
                  <div className="flex items-center gap-4 bg-blue-700/50 p-4 rounded-2xl">
                    <Video size={20} />
                    <span className="text-xs font-bold">Video or In-Person</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBookingModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-xl rounded-[48px] shadow-2xl overflow-hidden"
            >
              <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">New Booking</h3>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
                    For {format(selectedDate, 'MMMM do, yyyy')}
                  </p>
                </div>
                <button 
                  onClick={() => setShowBookingModal(false)}
                  className="p-3 bg-white rounded-2xl shadow-sm hover:bg-slate-100 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleBookingSubmit} className="p-10 space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Meeting Title</label>
                  <input 
                    required
                    type="text" 
                    value={bookingForm.title}
                    onChange={e => setBookingForm({...bookingForm, title: e.target.value})}
                    placeholder="e.g. Legal Consultation"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Name</label>
                    <input 
                      required
                      type="text" 
                      value={bookingForm.clientName}
                      onChange={e => setBookingForm({...bookingForm, clientName: e.target.value})}
                      placeholder="John Doe"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Time Slot</label>
                    <select 
                      value={bookingForm.time}
                      onChange={e => setBookingForm({...bookingForm, time: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold appearance-none"
                    >
                      <option>09:00 AM</option>
                      <option>10:00 AM</option>
                      <option>11:00 AM</option>
                      <option>12:00 PM</option>
                      <option>02:00 PM</option>
                      <option>03:00 PM</option>
                      <option>04:00 PM</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Email</label>
                  <input 
                    required
                    type="email" 
                    value={bookingForm.clientEmail}
                    onChange={e => setBookingForm({...bookingForm, clientEmail: e.target.value})}
                    placeholder="john@example.com"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setBookingForm({...bookingForm, type: 'Video'})}
                    className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-2 ${bookingForm.type === 'Video' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'}`}
                  >
                    <Video size={16} /> Video Call
                  </button>
                  <button 
                    type="button"
                    onClick={() => setBookingForm({...bookingForm, type: 'In-Person'})}
                    className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-2 ${bookingForm.type === 'In-Person' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'}`}
                  >
                    <MapPin size={16} /> In-Person
                  </button>
                  <button 
                    type="button"
                    onClick={() => setBookingForm({...bookingForm, type: 'Blocked'})}
                    className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-2 ${bookingForm.type === 'Blocked' ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-100' : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'}`}
                  >
                    <Lock size={16} /> Block Time
                  </button>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-lg shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
                >
                  Confirm Booking
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function X({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
