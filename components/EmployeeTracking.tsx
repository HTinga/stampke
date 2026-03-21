import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin, QrCode, Users, Clock, CheckCircle2, XCircle, AlertTriangle,
  Plus, Trash2, Eye, Download, Search, Filter, RefreshCw, Wifi,
  Navigation, Shield, Calendar, BarChart2, ChevronDown, X, Check,
  UserPlus, Briefcase, Phone, Mail, Map, Radio, Activity, Zap,
  ChevronRight, Building, Globe, Camera, ScanLine, History,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// ── Types ────────────────────────────────────────────────────────
interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  employeeId: string;
  status: 'active' | 'inactive' | 'on-leave';
  avatar?: string;
  joinDate: string;
  location?: { lat: number; lng: number; name: string; timestamp: string };
  lastSeen?: string;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'check-in' | 'check-out';
  timestamp: string;
  location: { lat: number; lng: number; name: string };
  distance: number;
  verified: boolean;
  method: 'qr' | 'manual' | 'gps';
}

interface Session {
  id: string;
  title: string;
  location: { lat: number; lng: number; name: string };
  date: string;
  time: string;
  radius: number; // meters
  createdBy: string;
  attendees: string[];
  qrExpiry: number; // minutes
  status: 'active' | 'closed';
  createdAt: string;
}

// ── Distance calculation (Haversine formula) ─────────────────────
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (d: number) => d * Math.PI / 180;
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1), Δλ = toRad(lon2 - lon1);
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ── Storage ──────────────────────────────────────────────────────
const DB = 'employee_tracking_v1';
const loadDB = () => { try { return JSON.parse(localStorage.getItem(DB) || '{"employees":[],"attendance":[],"sessions":[]}'); } catch { return { employees: [], attendance: [], sessions: [] }; } };
const saveDB = (d: any) => localStorage.setItem(DB, JSON.stringify(d));

const DEMO_EMPLOYEES: Employee[] = [
  { id: 'e1', name: 'Samuel Mwangi', email: 'samuel@company.ke', phone: '+254701234567', role: 'Field Engineer', department: 'Engineering', employeeId: 'EMP001', status: 'active', joinDate: '2024-01-15' },
  { id: 'e2', name: 'Aisha Ochieng', email: 'aisha@company.ke', phone: '+254702345678', role: 'Sales Executive', department: 'Sales', employeeId: 'EMP002', status: 'active', joinDate: '2024-02-20' },
  { id: 'e3', name: 'Peter Kamau', email: 'peter@company.ke', phone: '+254703456789', role: 'Driver', department: 'Logistics', employeeId: 'EMP003', status: 'active', joinDate: '2023-11-01' },
];

export default function EmployeeTracking() {
  const [tab, setTab] = useState<'dashboard' | 'employees' | 'sessions' | 'attendance' | 'live' | 'scan'>('dashboard');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [search, setSearch] = useState('');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showQR, setShowQR] = useState<Session | null>(null);
  const [showScanQR, setShowScanQR] = useState(false);
  const [scannedSession, setScannedSession] = useState<Session | null>(null);
  const [userLocation, setUserLocation] = useState<GeolocationCoordinates | null>(null);
  const [locationError, setLocationError] = useState('');
  const [checkinStatus, setCheckinStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [checkinMsg, setCheckinMsg] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({ status: 'active', department: 'Engineering' });
  const [newSession, setNewSession] = useState({ title: '', lat: '', lng: '', locationName: '', radius: 50, date: new Date().toISOString().split('T')[0], time: '09:00', qrExpiry: 30 });
  const [scanInput, setScanInput] = useState('');
  const scanRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const db = loadDB();
    setEmployees(db.employees.length ? db.employees : DEMO_EMPLOYEES);
    setAttendance(db.attendance || []);
    setSessions(db.sessions || []);
  }, []);

  const persist = useCallback((emps: Employee[], att: AttendanceRecord[], sess: Session[]) => {
    setEmployees(emps); setAttendance(att); setSessions(sess);
    saveDB({ employees: emps, attendance: att, sessions: sess });
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  // ── Get user location ─────────────────────────────────────────
  const getUserLocation = () => new Promise<GeolocationCoordinates>((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
    navigator.geolocation.getCurrentPosition(p => resolve(p.coords), e => reject(e), { enableHighAccuracy: true, timeout: 10000 });
  });

  // ── Add Employee ──────────────────────────────────────────────
  const addEmployee = () => {
    if (!newEmployee.name || !newEmployee.email) return;
    const emp: Employee = {
      id: Date.now().toString(),
      name: newEmployee.name || '',
      email: newEmployee.email || '',
      phone: newEmployee.phone || '',
      role: newEmployee.role || '',
      department: newEmployee.department || 'General',
      employeeId: `EMP${String(employees.length + 1).padStart(3, '0')}`,
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0],
    };
    const newEmps = [emp, ...employees];
    persist(newEmps, attendance, sessions);
    setNewEmployee({ status: 'active', department: 'Engineering' });
    setShowAddEmployee(false);
    showToast(`${emp.name} added`);
  };

  // ── Create Session ────────────────────────────────────────────
  const createSession = () => {
    if (!newSession.title || !newSession.lat || !newSession.lng) {
      showToast('Fill all required fields', 'error'); return;
    }
    const sess: Session = {
      id: Date.now().toString(),
      title: newSession.title,
      location: { lat: parseFloat(newSession.lat), lng: parseFloat(newSession.lng), name: newSession.locationName || 'Work Location' },
      date: newSession.date,
      time: newSession.time,
      radius: newSession.radius,
      createdBy: 'Manager',
      attendees: [],
      qrExpiry: newSession.qrExpiry,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    const newSessions = [sess, ...sessions];
    persist(employees, attendance, newSessions);
    setShowCreateSession(false);
    setShowQR(sess);
    setNewSession({ title: '', lat: '', lng: '', locationName: '', radius: 50, date: new Date().toISOString().split('T')[0], time: '09:00', qrExpiry: 30 });
    showToast('Session created! QR code ready');
  };

  // ── Use my location for session ───────────────────────────────
  const useMyLocation = async () => {
    try {
      const coords = await getUserLocation();
      setNewSession(s => ({ ...s, lat: coords.latitude.toFixed(6), lng: coords.longitude.toFixed(6), locationName: 'Current Location' }));
      showToast('Location captured');
    } catch { showToast('Location access denied', 'error'); }
  };

  // ── QR Check-in ───────────────────────────────────────────────
  const processQRCheckin = useCallback(async (sessionId: string, employeeId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    const employee = employees.find(e => e.id === employeeId);
    if (!session || !employee) { setCheckinMsg('Invalid QR code'); setCheckinStatus('error'); return; }
    if (session.status === 'closed') { setCheckinMsg('Session is closed'); setCheckinStatus('error'); return; }

    setCheckinStatus('checking');
    setCheckinMsg('Getting your location...');

    try {
      const coords = await getUserLocation();
      const dist = calculateDistance(coords.latitude, coords.longitude, session.location.lat, session.location.lng);
      
      if (dist > session.radius) {
        setCheckinMsg(`You are ${Math.round(dist)}m away. Must be within ${session.radius}m.`);
        setCheckinStatus('error');
        return;
      }

      const record: AttendanceRecord = {
        id: Date.now().toString(),
        employeeId: employee.id,
        employeeName: employee.name,
        type: session.attendees.includes(employee.id) ? 'check-out' : 'check-in',
        timestamp: new Date().toISOString(),
        location: { lat: coords.latitude, lng: coords.longitude, name: session.location.name },
        distance: Math.round(dist),
        verified: true,
        method: 'qr',
      };

      const updatedSessions = sessions.map(s => s.id === session.id
        ? { ...s, attendees: s.attendees.includes(employee.id) ? s.attendees : [...s.attendees, employee.id] }
        : s
      );
      const updatedEmps = employees.map(e => e.id === employee.id
        ? { ...e, location: { lat: coords.latitude, lng: coords.longitude, name: session.location.name, timestamp: new Date().toISOString() }, lastSeen: new Date().toISOString() }
        : e
      );
      const newAtt = [record, ...attendance];
      persist(updatedEmps, newAtt, updatedSessions);
      setCheckinMsg(`✓ ${record.type === 'check-in' ? 'Checked in' : 'Checked out'} successfully! Distance: ${Math.round(dist)}m`);
      setCheckinStatus('success');
    } catch (err: any) {
      setCheckinMsg('Location access required. Please enable GPS.');
      setCheckinStatus('error');
    }
  }, [sessions, employees, attendance, persist]);

  // ── Generate QR data ──────────────────────────────────────────
  const getQRValue = (session: Session, employeeId?: string) => {
    const base = `${window.location.origin}?action=checkin&session=${session.id}`;
    return employeeId ? `${base}&employee=${employeeId}` : base;
  };

  // ── Stats ─────────────────────────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAtt = attendance.filter(a => a.timestamp.startsWith(todayStr));
  const activeEmps = employees.filter(e => e.status === 'active').length;
  const checkedInToday = new Set(todayAtt.filter(a => a.type === 'check-in').map(a => a.employeeId)).size;
  const activeSessions = sessions.filter(s => s.status === 'active').length;

  const filteredEmps = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase())
  );

  const S = {
    dark: { background: '#0a0f1a', minHeight: '100%', fontFamily: "'Segoe UI', system-ui, sans-serif", color: 'white' } as React.CSSProperties,
    card: { background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 } as React.CSSProperties,
    input: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', padding: '9px 12px', width: '100%', fontSize: 13, outline: 'none', fontFamily: 'inherit' } as React.CSSProperties,
    label: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: 'rgba(255,255,255,0.3)', marginBottom: 5, display: 'block' } as React.CSSProperties,
    btn: (accent = false, danger = false, sm = false) => ({
      display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
      padding: sm ? '6px 12px' : '9px 16px', borderRadius: 10, fontWeight: 700, fontSize: sm ? 11 : 13,
      background: danger ? 'rgba(239,68,68,0.15)' : accent ? 'linear-gradient(135deg,#1f6feb,#2d7ff9)' : 'rgba(255,255,255,0.07)',
      color: danger ? '#f87171' : 'white', boxShadow: accent ? '0 4px 16px rgba(31,111,235,0.3)' : 'none',
    } as React.CSSProperties),
  };

  const statusColor = { active: '#22c55e', inactive: '#94a3b8', 'on-leave': '#f59e0b' };

  return (
    <div style={S.dark}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: '#0d1117', border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 12, padding: '10px 20px', color: toast.type === 'success' ? '#22c55e' : '#f87171', fontWeight: 700, fontSize: 13, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {toast.type === 'success' ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 20px', height: 50, gap: 4, flexShrink: 0, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 12, paddingRight: 12, borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#1f6feb,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Navigation size={14} color="white" />
          </div>
          <span style={{ fontWeight: 900, fontSize: 13, color: 'white' }}>Staff Tracker</span>
        </div>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
          { id: 'employees', label: `Employees (${employees.length})`, icon: Users },
          { id: 'sessions', label: `Sessions (${activeSessions})`, icon: QrCode },
          { id: 'attendance', label: 'Attendance', icon: Clock },
          { id: 'live', label: 'Live Map', icon: Map },
          { id: 'scan', label: 'Scan QR', icon: ScanLine },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id as any)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.12s', textTransform: 'uppercase', letterSpacing: '0.04em', background: tab === id ? 'rgba(31,111,235,0.15)' : 'transparent', color: tab === id ? '#58a6ff' : 'rgba(255,255,255,0.4)' }}>
            <Icon size={12} />{label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowCreateSession(true)} style={{ ...S.btn(true, false, true) }}><Plus size={12} /> New Session</button>
        <button onClick={() => setShowAddEmployee(true)} style={{ ...S.btn(false, false, true), marginLeft: 4 }}><UserPlus size={12} /> Add Employee</button>
      </div>

      <div style={{ padding: 20, overflow: 'auto', maxWidth: 1300, margin: '0 auto' }}>

        {/* ═══ DASHBOARD ═══ */}
        {tab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
              {[
                { label: 'Active Employees', val: activeEmps, color: '#22c55e', icon: Users },
                { label: 'Checked In Today', val: checkedInToday, color: '#3b82f6', icon: CheckCircle2 },
                { label: 'Active Sessions', val: activeSessions, color: '#f59e0b', icon: QrCode },
                { label: "Today's Records", val: todayAtt.length, color: '#a855f7', icon: Clock },
                { label: 'Total Attendance', val: attendance.length, color: '#06b6d4', icon: Activity },
              ].map(({ label, val, color, icon: Icon }) => (
                <div key={label} style={{ ...S.card, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={S.label}>{label}</span>
                    <Icon size={14} style={{ color }} />
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 900, color, letterSpacing: '-0.02em' }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Recent attendance */}
            <div style={S.card}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, fontSize: 13, color: 'white' }}>Recent Check-ins / Outs</span>
                <button onClick={() => setTab('attendance')} style={{ ...S.btn(false, false, true) }}>View All <ChevronRight size={11} /></button>
              </div>
              {attendance.slice(0, 8).map((rec, i) => (
                <div key={rec.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: i < 7 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: rec.type === 'check-in' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {rec.type === 'check-in' ? <CheckCircle2 size={14} style={{ color: '#22c55e' }} /> : <XCircle size={14} style={{ color: '#f87171' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: 'white', fontWeight: 700, fontSize: 13, margin: 0 }}>{rec.employeeName}</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0 }}>{rec.location.name} · {rec.distance}m away</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: rec.type === 'check-in' ? '#22c55e' : '#f87171' }}>{rec.type === 'check-in' ? 'IN' : 'OUT'}</span>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>{new Date(rec.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <span style={{ fontSize: 10, background: rec.verified ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: rec.verified ? '#22c55e' : '#f87171', border: `1px solid ${rec.verified ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 6, padding: '2px 6px', fontWeight: 700, flexShrink: 0 }}>
                    {rec.method.toUpperCase()}
                  </span>
                </div>
              ))}
              {attendance.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>No attendance records yet. Create a session and scan QR codes.</div>}
            </div>
          </div>
        )}

        {/* ═══ EMPLOYEES ═══ */}
        {tab === 'employees' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative', maxWidth: 320 }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input style={{ ...S.input, paddingLeft: 32 }} placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button onClick={() => setShowAddEmployee(true)} style={S.btn(true, false, true)}><UserPlus size={12} /> Add Employee</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
              {filteredEmps.map(emp => (
                <div key={emp.id} style={{ ...S.card, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,#1f6feb,#6366f1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, color: 'white', flexShrink: 0 }}>
                      {emp.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: 'white', fontWeight: 800, fontSize: 14, margin: '0 0 2px' }}>{emp.name}</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>{emp.role} · {emp.department}</p>
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor[emp.status], marginTop: 4, flexShrink: 0 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={11} style={{ color: 'rgba(255,255,255,0.3)' }} /><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{emp.email}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={11} style={{ color: 'rgba(255,255,255,0.3)' }} /><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{emp.phone}</span></div>
                    {emp.location && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={11} style={{ color: '#22c55e' }} /><span style={{ color: '#22c55e', fontSize: 11 }}>{emp.location.name}</span></div>}
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '3px 8px', color: 'rgba(255,255,255,0.5)' }}>{emp.employeeId}</span>
                    {emp.lastSeen && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Last: {new Date(emp.lastSeen).toLocaleTimeString()}</span>}
                    <button onClick={() => { const newEmps = employees.filter(e => e.id !== emp.id); persist(newEmps, attendance, sessions); }} style={{ ...S.btn(false, true, true), marginLeft: 'auto', padding: '3px 8px' }}><Trash2 size={11} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ SESSIONS ═══ */}
        {tab === 'sessions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ color: 'white', fontWeight: 900, fontSize: 18, margin: 0 }}>Check-in Sessions</h2>
              <button onClick={() => setShowCreateSession(true)} style={S.btn(true)}><Plus size={14} /> Create Session</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 12 }}>
              {sessions.map(sess => (
                <div key={sess.id} style={{ ...S.card, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>{sess.title}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '3px 8px', background: sess.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.1)', color: sess.status === 'active' ? '#22c55e' : '#94a3b8' }}>{sess.status.toUpperCase()}</span>
                  </div>
                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 6 }}><MapPin size={12} style={{ color: '#58a6ff', flexShrink: 0, marginTop: 1 }} /><span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{sess.location.name}</span></div>
                    <div style={{ display: 'flex', gap: 6 }}><Calendar size={12} style={{ color: '#58a6ff' }} /><span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{sess.date} at {sess.time}</span></div>
                    <div style={{ display: 'flex', gap: 6 }}><Radio size={12} style={{ color: '#f59e0b' }} /><span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Radius: {sess.radius}m · QR expires in {sess.qrExpiry}min</span></div>
                    <div style={{ display: 'flex', gap: 6 }}><Users size={12} style={{ color: '#22c55e' }} /><span style={{ color: '#22c55e', fontSize: 12, fontWeight: 700 }}>{sess.attendees.length} checked in</span></div>
                  </div>
                  <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8 }}>
                    <button onClick={() => setShowQR(sess)} style={{ ...S.btn(true, false, true), flex: 1, justifyContent: 'center' }}><QrCode size={12} /> Show QR</button>
                    <button onClick={() => {
                      const updated = sessions.map(s => s.id === sess.id ? { ...s, status: s.status === 'active' ? 'closed' : 'active' } : s) as Session[];
                      persist(employees, attendance, updated);
                    }} style={{ ...S.btn(false, sess.status === 'active', true), flex: 1, justifyContent: 'center' }}>
                      {sess.status === 'active' ? <><X size={12} /> Close</> : <><Check size={12} /> Reopen</>}
                    </button>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && (
                <div style={{ ...S.card, padding: 48, textAlign: 'center', gridColumn: '1/-1' }}>
                  <QrCode size={40} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 12px' }} />
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>No sessions yet. Create one to generate QR codes for check-in.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ ATTENDANCE ═══ */}
        {tab === 'attendance' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ color: 'white', fontWeight: 900, fontSize: 18, margin: 0 }}>Attendance Records ({attendance.length})</h2>
              <button onClick={() => {
                const csv = ['Employee,Type,Date,Time,Location,Distance,Method,Verified',
                  ...attendance.map(r => `"${r.employeeName}","${r.type}","${r.timestamp.split('T')[0]}","${new Date(r.timestamp).toLocaleTimeString()}","${r.location.name}",${r.distance},"${r.method}",${r.verified}`)
                ].join('\n');
                const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'attendance.csv'; a.click();
              }} style={S.btn(false, false, true)}><Download size={12} /> Export CSV</button>
            </div>
            <div style={S.card}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 140px 60px 60px', gap: 8, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Employee', 'Type', 'Method', 'Time', 'Dist', 'Status'].map(h => (
                  <span key={h} style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)' }}>{h}</span>
                ))}
              </div>
              {attendance.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>No records yet</div>
              ) : attendance.map((rec, i) => (
                <div key={rec.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 140px 60px 60px', gap: 8, padding: '10px 16px', borderBottom: i < attendance.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center' }}>
                  <div>
                    <p style={{ color: 'white', fontWeight: 700, fontSize: 12, margin: 0 }}>{rec.employeeName}</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>{rec.location.name}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: rec.type === 'check-in' ? '#22c55e' : '#f87171' }}>{rec.type === 'check-in' ? '▲ IN' : '▼ OUT'}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.06)', borderRadius: 5, padding: '2px 6px', color: 'rgba(255,255,255,0.5)', width: 'fit-content' }}>{rec.method.toUpperCase()}</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{new Date(rec.timestamp).toLocaleString()}</span>
                  <span style={{ color: '#58a6ff', fontSize: 11, fontWeight: 600 }}>{rec.distance}m</span>
                  <span style={{ fontSize: 10, color: rec.verified ? '#22c55e' : '#f87171', fontWeight: 700 }}>{rec.verified ? '✓ GPS' : '✗'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ LIVE MAP ═══ */}
        {tab === 'live' && (
          <div>
            <h2 style={{ color: 'white', fontWeight: 900, fontSize: 18, marginBottom: 16 }}>Live Employee Locations</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
              {/* Map placeholder with employee pins */}
              <div style={{ ...S.card, overflow: 'hidden', minHeight: 500, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#0d1117,#111827)', opacity: 0.9 }} />
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(31,111,235,0.05) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                  <Map size={48} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: 12 }} />
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>GPS Location Map</p>
                  <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginBottom: 20 }}>Employee locations update when they check in via QR</p>
                  {/* Show employee location blips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 400 }}>
                    {employees.filter(e => e.location).map(emp => (
                      <div key={emp.id} style={{ background: 'rgba(31,111,235,0.15)', border: '1px solid rgba(31,111,235,0.3)', borderRadius: 20, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                        <span style={{ color: 'white', fontSize: 11, fontWeight: 600 }}>{emp.name.split(' ')[0]}</span>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{emp.location!.name}</span>
                      </div>
                    ))}
                    {employees.filter(e => e.location).length === 0 && <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>No live locations. Employees must check in via QR.</p>}
                  </div>
                </div>
              </div>
              {/* Employee status list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={S.label}>Employee Status</p>
                {employees.map(emp => (
                  <div key={emp.id} style={{ ...S.card, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,#1f6feb,#6366f1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white', fontSize: 14, flexShrink: 0 }}>{emp.name.charAt(0)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: 'white', fontWeight: 700, fontSize: 12, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.name}</p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>{emp.location?.name || 'Location unknown'}</p>
                      </div>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: emp.location ? '#22c55e' : '#374151', flexShrink: 0 }} />
                    </div>
                    {emp.lastSeen && <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 6 }}>Last seen: {new Date(emp.lastSeen).toLocaleString()}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ SCAN QR ═══ */}
        {tab === 'scan' && (
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ color: 'white', fontWeight: 900, fontSize: 18, marginBottom: 16 }}>Scan QR Code to Check In</h2>
            <div style={{ ...S.card, padding: 28 }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <ScanLine size={48} style={{ color: '#58a6ff', margin: '0 auto 12px' }} />
                <p style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>QR Code Check-In</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>Paste the QR URL or select your session and employee below</p>
              </div>

              {/* Manual session check-in */}
              <div style={{ marginBottom: 20 }}>
                <label style={S.label}>Select Session</label>
                <select style={S.input} onChange={e => setScannedSession(sessions.find(s => s.id === e.target.value) || null)}>
                  <option value="">-- Choose active session --</option>
                  {sessions.filter(s => s.status === 'active').map(s => <option key={s.id} value={s.id}>{s.title} · {s.date}</option>)}
                </select>
              </div>

              {scannedSession && (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <label style={S.label}>Select Employee</label>
                    <select style={S.input} id="emp-select">
                      <option value="">-- Choose employee --</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.employeeId})</option>)}
                    </select>
                  </div>
                  <div style={{ background: 'rgba(31,111,235,0.08)', border: '1px solid rgba(31,111,235,0.2)', borderRadius: 10, padding: 14, marginBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 6 }}><MapPin size={12} style={{ color: '#58a6ff' }} /><span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{scannedSession.location.name}</span></div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}><Radio size={12} style={{ color: '#f59e0b' }} /><span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Must be within {scannedSession.radius}m</span></div>
                  </div>
                  <button
                    onClick={() => {
                      const sel = (document.getElementById('emp-select') as HTMLSelectElement)?.value;
                      if (!sel) { showToast('Select an employee', 'error'); return; }
                      processQRCheckin(scannedSession.id, sel);
                    }}
                    style={{ ...S.btn(true), width: '100%', justifyContent: 'center', padding: '12px' }}>
                    <Navigation size={15} /> Check In with GPS Verification
                  </button>
                </>
              )}

              {checkinStatus !== 'idle' && (
                <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: checkinStatus === 'success' ? 'rgba(34,197,94,0.1)' : checkinStatus === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(31,111,235,0.1)', border: `1px solid ${checkinStatus === 'success' ? 'rgba(34,197,94,0.3)' : checkinStatus === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(31,111,235,0.3)'}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                  {checkinStatus === 'checking' && <Loader size={14} style={{ color: '#58a6ff' }} />}
                  {checkinStatus === 'success' && <CheckCircle2 size={14} style={{ color: '#22c55e' }} />}
                  {checkinStatus === 'error' && <XCircle size={14} style={{ color: '#f87171' }} />}
                  <span style={{ color: checkinStatus === 'success' ? '#22c55e' : checkinStatus === 'error' ? '#f87171' : '#58a6ff', fontSize: 13, fontWeight: 600 }}>{checkinMsg}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══ QR CODE MODAL ═══ */}
      {showQR && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32, maxWidth: 440, width: '100%', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ color: 'white', fontWeight: 900, fontSize: 16, margin: 0 }}>{showQR.title}</h3>
              <button onClick={() => setShowQR(null)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', borderRadius: 8, padding: '5px 8px', cursor: 'pointer' }}><X size={14} /></button>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              {/* Session-level QR */}
              <div style={{ background: 'white', padding: 16, borderRadius: 12, display: 'inline-block' }}>
                <QRCodeSVG value={getQRValue(showQR)} size={200} />
              </div>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 12 }}>Share this QR with employees to check in</p>
            <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: 'rgba(255,255,255,0.4)', wordBreak: 'break-all' }}>
              {getQRValue(showQR)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
              <button onClick={() => {
                const canvas = document.querySelector('canvas');
                if (canvas) { const a = document.createElement('a'); a.href = canvas.toDataURL(); a.download = `${showQR.title}-qr.png`; a.click(); }
              }} style={{ ...S.btn(false, false, true), justifyContent: 'center' }}><Download size={12} /> Download</button>
              <button onClick={() => setShowQR(null)} style={{ ...S.btn(true, false, true), justifyContent: 'center' }}><Check size={12} /> Done</button>
            </div>
            {/* Per-employee QR codes */}
            {employees.length > 0 && (
              <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                <p style={S.label}>Per-Employee QR Codes</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {employees.slice(0, 6).map(emp => (
                    <div key={emp.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                      <div style={{ background: 'white', padding: 4, borderRadius: 4, display: 'inline-block', marginBottom: 4 }}>
                        <QRCodeSVG value={getQRValue(showQR, emp.id)} size={64} />
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700, margin: 0 }}>{emp.name.split(' ')[0]}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ ADD EMPLOYEE MODAL ═══ */}
      {showAddEmployee && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, maxWidth: 480, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: 'white', fontWeight: 900, fontSize: 16, margin: 0 }}>Add Employee</h3>
              <button onClick={() => setShowAddEmployee(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', borderRadius: 8, padding: '5px 8px', cursor: 'pointer' }}><X size={14} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { key: 'name', label: 'Full Name *', placeholder: 'John Doe' },
                { key: 'email', label: 'Email *', placeholder: 'john@company.ke' },
                { key: 'phone', label: 'Phone', placeholder: '+254700000000' },
                { key: 'role', label: 'Job Role', placeholder: 'Field Officer' },
                { key: 'department', label: 'Department', placeholder: 'Operations' },
              ].map(({ key, label, placeholder }) => (
                <div key={key} style={key === 'name' ? { gridColumn: '1/-1' } : {}}>
                  <label style={S.label}>{label}</label>
                  <input style={S.input} placeholder={placeholder} value={(newEmployee as any)[key] || ''} onChange={e => setNewEmployee(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowAddEmployee(false)} style={{ ...S.btn(), flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button onClick={addEmployee} style={{ ...S.btn(true), flex: 2, justifyContent: 'center' }}><UserPlus size={14} /> Add Employee</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CREATE SESSION MODAL ═══ */}
      {showCreateSession && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, maxWidth: 520, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: 'white', fontWeight: 900, fontSize: 16, margin: 0 }}>Create Check-in Session</h3>
              <button onClick={() => setShowCreateSession(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', borderRadius: 8, padding: '5px 8px', cursor: 'pointer' }}><X size={14} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={S.label}>Session Title *</label><input style={S.input} placeholder="Morning Check-in" value={newSession.title} onChange={e => setNewSession(s => ({ ...s, title: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={S.label}>Date</label><input type="date" style={S.input} value={newSession.date} onChange={e => setNewSession(s => ({ ...s, date: e.target.value }))} /></div>
                <div><label style={S.label}>Time</label><input type="time" style={S.input} value={newSession.time} onChange={e => setNewSession(s => ({ ...s, time: e.target.value }))} /></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <label style={{ ...S.label, margin: 0 }}>Location *</label>
                  <button onClick={useMyLocation} style={{ ...S.btn(false, false, true) }}><Navigation size={11} /> Use My GPS</button>
                </div>
                <input style={S.input} placeholder="Location name" value={newSession.locationName} onChange={e => setNewSession(s => ({ ...s, locationName: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={S.label}>Latitude *</label><input style={S.input} placeholder="e.g. -1.2921" value={newSession.lat} onChange={e => setNewSession(s => ({ ...s, lat: e.target.value }))} /></div>
                <div><label style={S.label}>Longitude *</label><input style={S.input} placeholder="e.g. 36.8219" value={newSession.lng} onChange={e => setNewSession(s => ({ ...s, lng: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={S.label}>Allowed Radius (meters)</label><input type="number" style={S.input} value={newSession.radius} onChange={e => setNewSession(s => ({ ...s, radius: parseInt(e.target.value) || 50 }))} /></div>
                <div><label style={S.label}>QR Expiry (minutes)</label><input type="number" style={S.input} value={newSession.qrExpiry} onChange={e => setNewSession(s => ({ ...s, qrExpiry: parseInt(e.target.value) || 30 }))} /></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowCreateSession(false)} style={{ ...S.btn(), flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button onClick={createSession} style={{ ...S.btn(true), flex: 2, justifyContent: 'center' }}><QrCode size={14} /> Create & Generate QR</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

// Loader component used inline
const Loader = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
);
