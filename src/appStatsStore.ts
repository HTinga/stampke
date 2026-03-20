import { create } from 'zustand';

export interface AppActivity {
  id: string;
  type: 'stamp_created' | 'stamp_applied' | 'document_signed' | 'pdf_edited' | 'qr_generated' | 'template_used' | 'ai_scan' | 'stamp_downloaded';
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

interface AppStatsState {
  stampsCreated: number;
  stampsDownloaded: number;
  stampsApplied: number;
  documentsSigned: number;
  pdfEdits: number;
  qrCodesGenerated: number;
  templatesUsed: number;
  aiScans: number;
  sessionStartTime: string;
  recentActivity: AppActivity[];

  // Actions
  recordStampCreated: (desc?: string) => void;
  recordStampDownloaded: () => void;
  recordStampApplied: () => void;
  recordDocumentSigned: () => void;
  recordPdfEdit: () => void;
  recordQRGenerated: () => void;
  recordTemplateUsed: (name?: string) => void;
  recordAiScan: () => void;
  clearStats: () => void;
}

const loadStats = () => {
  try {
    const saved = localStorage.getItem('sahihi_app_stats');
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
};

const saveStats = (state: Partial<AppStatsState>) => {
  try {
    const toSave = {
      stampsCreated: state.stampsCreated,
      stampsDownloaded: state.stampsDownloaded,
      stampsApplied: state.stampsApplied,
      documentsSigned: state.documentsSigned,
      pdfEdits: state.pdfEdits,
      qrCodesGenerated: state.qrCodesGenerated,
      templatesUsed: state.templatesUsed,
      aiScans: state.aiScans,
      recentActivity: state.recentActivity,
    };
    localStorage.setItem('sahihi_app_stats', JSON.stringify(toSave));
  } catch {}
};

const createActivity = (
  type: AppActivity['type'],
  description: string,
  icon: string,
  color: string
): AppActivity => ({
  id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  type,
  description,
  timestamp: new Date().toISOString(),
  icon,
  color,
});

const saved = loadStats();

export const useAppStats = create<AppStatsState>((set, get) => ({
  stampsCreated: saved?.stampsCreated ?? 0,
  stampsDownloaded: saved?.stampsDownloaded ?? 0,
  stampsApplied: saved?.stampsApplied ?? 0,
  documentsSigned: saved?.documentsSigned ?? 0,
  pdfEdits: saved?.pdfEdits ?? 0,
  qrCodesGenerated: saved?.qrCodesGenerated ?? 0,
  templatesUsed: saved?.templatesUsed ?? 0,
  aiScans: saved?.aiScans ?? 0,
  sessionStartTime: new Date().toISOString(),
  recentActivity: saved?.recentActivity ?? [],

  recordStampCreated: (desc = 'New stamp designed') => set((state) => {
    const activity = createActivity('stamp_created', desc, 'PenTool', 'text-blue-600 bg-blue-50 dark:bg-blue-900/20');
    const newState = {
      stampsCreated: state.stampsCreated + 1,
      recentActivity: [activity, ...state.recentActivity].slice(0, 20),
    };
    saveStats({ ...state, ...newState });
    return newState;
  }),

  recordStampDownloaded: () => set((state) => {
    const activity = createActivity('stamp_downloaded', 'Stamp exported (SVG/PNG/PDF)', 'Download', 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20');
    const newState = {
      stampsDownloaded: state.stampsDownloaded + 1,
      recentActivity: [activity, ...state.recentActivity].slice(0, 20),
    };
    saveStats({ ...state, ...newState });
    return newState;
  }),

  recordStampApplied: () => set((state) => {
    const activity = createActivity('stamp_applied', 'Stamp applied to PDF', 'FileText', 'text-orange-600 bg-orange-50 dark:bg-orange-900/20');
    const newState = {
      stampsApplied: state.stampsApplied + 1,
      recentActivity: [activity, ...state.recentActivity].slice(0, 20),
    };
    saveStats({ ...state, ...newState });
    return newState;
  }),

  recordDocumentSigned: () => set((state) => {
    const activity = createActivity('document_signed', 'Document signed & sealed', 'CheckCircle2', 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20');
    const newState = {
      documentsSigned: state.documentsSigned + 1,
      recentActivity: [activity, ...state.recentActivity].slice(0, 20),
    };
    saveStats({ ...state, ...newState });
    return newState;
  }),

  recordPdfEdit: () => set((state) => {
    const activity = createActivity('pdf_edited', 'PDF edited & saved', 'Wrench', 'text-purple-600 bg-purple-50 dark:bg-purple-900/20');
    const newState = {
      pdfEdits: state.pdfEdits + 1,
      recentActivity: [activity, ...state.recentActivity].slice(0, 20),
    };
    saveStats({ ...state, ...newState });
    return newState;
  }),

  recordQRGenerated: () => set((state) => {
    const activity = createActivity('qr_generated', 'QR code generated', 'QrCode', 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20');
    const newState = {
      qrCodesGenerated: state.qrCodesGenerated + 1,
      recentActivity: [activity, ...state.recentActivity].slice(0, 20),
    };
    saveStats({ ...state, ...newState });
    return newState;
  }),

  recordTemplateUsed: (name = 'Template') => set((state) => {
    const activity = createActivity('template_used', `${name} template applied`, 'Layers', 'text-slate-600 bg-slate-100 dark:bg-slate-800');
    const newState = {
      templatesUsed: state.templatesUsed + 1,
      recentActivity: [activity, ...state.recentActivity].slice(0, 20),
    };
    saveStats({ ...state, ...newState });
    return newState;
  }),

  recordAiScan: () => set((state) => {
    const activity = createActivity('ai_scan', 'Stamp digitized via AI', 'Camera', 'text-pink-600 bg-pink-50 dark:bg-pink-900/20');
    const newState = {
      aiScans: state.aiScans + 1,
      recentActivity: [activity, ...state.recentActivity].slice(0, 20),
    };
    saveStats({ ...state, ...newState });
    return newState;
  }),

  clearStats: () => {
    localStorage.removeItem('sahihi_app_stats');
    set({
      stampsCreated: 0,
      stampsDownloaded: 0,
      stampsApplied: 0,
      documentsSigned: 0,
      pdfEdits: 0,
      qrCodesGenerated: 0,
      templatesUsed: 0,
      aiScans: 0,
      recentActivity: [],
    });
  },
}));
