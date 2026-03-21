import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── TYPES ────────────────────────────────────────────────────────────────────
export type JobType = 'quick-gig' | 'temporary' | 'permanent' | 'contract';
export type JobStatus = 'open' | 'in-progress' | 'completed' | 'cancelled';
export type ApplicantStatus = 'pending' | 'shortlisted' | 'hired' | 'rejected';
export type WorkerStatus = 'pending' | 'approved' | 'suspended';
export type UserRole = 'admin' | 'recruiter' | 'worker';

export const JOB_CATEGORIES = [
  'Electrician','Plumber','Painter','Carpenter','Mason','Driver',
  'Security Guard','Cleaner','Cashier','Waiter','3D Signage',
  'Graphic Designer','Photographer','Delivery','Errands',
  'Data Entry','Receptionist','Sales Agent','IT Support','Other',
];

export const TYPE_LABELS: Record<JobType, string> = {
  'quick-gig': '⚡ Quick Gig',
  'temporary': '📅 Temporary',
  'permanent': '🏢 Permanent',
  'contract':  '📋 Contract',
};

export const TYPE_COLORS: Record<JobType, string> = {
  'quick-gig': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'temporary': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'permanent': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'contract':  'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

export interface WorkerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  jobTypes: JobType[];          // types they're available for
  location: string;
  bio: string;
  skills: string[];
  hourlyRate: string;
  availability: string;         // e.g. "Available now", "Weekends only"
  shortNotice: boolean;         // available on short notice
  website?: string;
  portfolioUrl?: string;
  portfolioFiles: string[];     // base64 images
  rating: number;
  completedJobs: number;
  status: WorkerStatus;         // pending | approved | suspended
  adminNote?: string;
  adminRating?: number;         // 1-5 stars by admin
  registeredAt: string;
  verified: boolean;
}

export interface Applicant {
  id: string;
  workerId?: string;            // if linked to a worker profile
  name: string;
  phone: string;
  email: string;
  skills: string[];
  rating: number;
  completedJobs: number;
  availability: string;
  note: string;
  status: ApplicantStatus;
  appliedAt: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  type: JobType;
  location: string;
  pay: string;
  duration: string;
  postedBy: string;             // recruiter name
  postedById: string;           // recruiter id/email
  postedAt: string;
  status: JobStatus;
  applicants: Applicant[];
  urgent: boolean;
  skills: string[];
}

export interface SaasUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company?: string;
  phone?: string;
  joinedAt: string;
  active: boolean;
  lastActive: string;
}

// ─── STORE ────────────────────────────────────────────────────────────────────
interface WorkState {
  jobs: Job[];
  workers: WorkerProfile[];
  users: SaasUser[];

  // Job actions
  addJob: (j: Job) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  addApplicant: (jobId: string, app: Applicant) => void;
  updateApplicant: (jobId: string, appId: string, status: ApplicantStatus) => void;

  // Worker actions
  addWorker: (w: WorkerProfile) => void;
  updateWorker: (id: string, updates: Partial<WorkerProfile>) => void;
  deleteWorker: (id: string) => void;
  approveWorker: (id: string) => void;
  suspendWorker: (id: string, note?: string) => void;
  rateWorker: (id: string, rating: number) => void;

  // User actions
  addUser: (u: SaasUser) => void;
  updateUser: (id: string, updates: Partial<SaasUser>) => void;
  removeUser: (id: string) => void;
}

// Seed workers (pre-approved, realistic Kenyan profiles)
const SEED_WORKERS: WorkerProfile[] = [
  {
    id: 'w1', name: 'John Kamau', email: 'john.kamau@example.com', phone: '0712 345 678',
    category: 'Electrician', jobTypes: ['quick-gig','contract'],
    location: 'Nairobi CBD', bio: 'Licensed electrician with 7 years experience. Specialise in residential and commercial wiring, solar installation and fault-finding.',
    skills: ['Wiring','Solar','Fault Diagnosis','Conduit','3-phase'], hourlyRate: 'KES 800/hr',
    availability: 'Available now', shortNotice: true, portfolioFiles: [],
    rating: 4.8, completedJobs: 34, status: 'approved', verified: true,
    registeredAt: new Date(Date.now() - 90*86400000).toISOString(), adminRating: 5,
  },
  {
    id: 'w2', name: 'Grace Wanjiku', email: 'grace.w@example.com', phone: '0723 456 789',
    category: '3D Signage', jobTypes: ['quick-gig','temporary','contract'],
    location: 'Industrial Area, Nairobi', bio: 'Expert in 3D signage fabrication and installation. Serving Nairobi businesses since 2018. LED backlit signs, acrylic, aluminium composite.',
    skills: ['3D Fabrication','Vinyl Wrap','LED Signs','Acrylic','Site Surveys'], hourlyRate: 'KES 1,200/hr',
    availability: 'Available now', shortNotice: true, website: 'https://gracesigns.co.ke', portfolioFiles: [],
    rating: 4.9, completedJobs: 58, status: 'approved', verified: true,
    registeredAt: new Date(Date.now() - 120*86400000).toISOString(), adminRating: 5,
  },
  {
    id: 'w3', name: 'Peter Odhiambo', email: 'peter.o@example.com', phone: '0734 567 890',
    category: 'Driver', jobTypes: ['quick-gig','temporary','permanent'],
    location: 'Westlands, Nairobi', bio: 'Professional driver with PSV and B class license. Available for deliveries, airport transfers, and executive errands.',
    skills: ['PSV License','B Class','Nairobi Routes','Delivery Tracking','Client Handling'], hourlyRate: 'KES 600/hr',
    availability: 'Available tomorrow', shortNotice: false, portfolioFiles: [],
    rating: 4.6, completedJobs: 112, status: 'approved', verified: true,
    registeredAt: new Date(Date.now() - 60*86400000).toISOString(), adminRating: 4,
  },
  {
    id: 'w4', name: 'Mary Njeri', email: 'mary.njeri@example.com', phone: '0745 678 901',
    category: 'Cashier', jobTypes: ['quick-gig','temporary'],
    location: 'Westlands, Nairobi', bio: 'Experienced cashier and shop attendant. Fast and accurate with good customer service skills. M-Pesa and card payments.',
    skills: ['Cash Handling','M-Pesa Till','POS Systems','Stock Counts','Customer Service'], hourlyRate: 'KES 500/hr',
    availability: 'Available now', shortNotice: true, portfolioFiles: [],
    rating: 4.5, completedJobs: 22, status: 'pending', verified: false,
    registeredAt: new Date(Date.now() - 3*86400000).toISOString(),
  },
  {
    id: 'w5', name: 'James Mutua', email: 'james.m@example.com', phone: '0756 789 012',
    category: 'Painter', jobTypes: ['quick-gig','contract'],
    location: 'Kilimani, Nairobi', bio: 'Interior and exterior painter. Provide materials or I source them. Neat finish guaranteed. Epoxy floors and decorative finishes.',
    skills: ['Interior Painting','Exterior','Epoxy Floors','Decorative Finishes','Prep Work'], hourlyRate: 'KES 700/hr',
    availability: 'Available in 2 days', shortNotice: false, portfolioFiles: [],
    rating: 4.7, completedJobs: 41, status: 'approved', verified: true,
    registeredAt: new Date(Date.now() - 45*86400000).toISOString(), adminRating: 4,
  },
  {
    id: 'w6', name: 'Faith Atieno', email: 'faith.a@example.com', phone: '0767 890 123',
    category: 'Cleaner', jobTypes: ['quick-gig','temporary','permanent'],
    location: 'Parklands, Nairobi', bio: 'Reliable cleaner for offices and homes. Own cleaning equipment. References available upon request.',
    skills: ['Office Cleaning','Residential','Deep Clean','Laundry','Equipment Operation'], hourlyRate: 'KES 400/hr',
    availability: 'Available now', shortNotice: true, portfolioFiles: [],
    rating: 4.4, completedJobs: 67, status: 'pending', verified: false,
    registeredAt: new Date(Date.now() - 1*86400000).toISOString(),
  },
];

const SEED_USERS: SaasUser[] = [
  { id: 'u1', name: 'Admin', email: 'admin@tomo.ke', role: 'admin', company: 'Tomo', joinedAt: new Date().toISOString(), active: true, lastActive: new Date().toISOString() },
];

export const useWorkStore = create<WorkState>()(
  persist(
    (set) => ({
      jobs: [],
      workers: SEED_WORKERS,
      users: SEED_USERS,

      addJob: (j) => set(s => ({ jobs: [j, ...s.jobs] })),
      updateJob: (id, u) => set(s => ({ jobs: s.jobs.map(j => j.id === id ? { ...j, ...u } : j) })),
      deleteJob: (id) => set(s => ({ jobs: s.jobs.filter(j => j.id !== id) })),
      addApplicant: (jobId, app) => set(s => ({ jobs: s.jobs.map(j => j.id === jobId ? { ...j, applicants: [...j.applicants, app] } : j) })),
      updateApplicant: (jobId, appId, status) => set(s => ({
        jobs: s.jobs.map(j => j.id === jobId ? {
          ...j,
          applicants: j.applicants.map(a => a.id === appId ? { ...a, status } : a),
          status: status === 'hired' ? 'in-progress' : j.status,
        } : j)
      })),

      addWorker: (w) => set(s => ({ workers: [w, ...s.workers] })),
      updateWorker: (id, u) => set(s => ({ workers: s.workers.map(w => w.id === id ? { ...w, ...u } : w) })),
      deleteWorker: (id) => set(s => ({ workers: s.workers.filter(w => w.id !== id) })),
      approveWorker: (id) => set(s => ({ workers: s.workers.map(w => w.id === id ? { ...w, status: 'approved', verified: true } : w) })),
      suspendWorker: (id, note) => set(s => ({ workers: s.workers.map(w => w.id === id ? { ...w, status: 'suspended', adminNote: note } : w) })),
      rateWorker: (id, rating) => set(s => ({ workers: s.workers.map(w => w.id === id ? { ...w, adminRating: rating } : w) })),

      addUser: (u) => set(s => ({ users: [u, ...s.users] })),
      updateUser: (id, u) => set(s => ({ users: s.users.map(x => x.id === id ? { ...x, ...u } : x) })),
      removeUser: (id) => set(s => ({ users: s.users.filter(u => u.id !== id) })),
    }),
    { name: 'tomo-work-store' }
  )
);
