import { create } from 'zustand';
import { StampConfig } from './types';
import { DEFAULT_CONFIG } from './constants';

// UI Store
export type ZoomMode = 'manual' | 'fit-page' | 'fit-width';
export type ViewMode = 'single' | 'continuous' | 'two-page';

interface UIState {
  sidebarOpen: boolean;
  searchOpen: boolean;
  zoom: number;
  zoomMode: ZoomMode;
  viewMode: ViewMode;
  toggleSidebar: () => void;
  toggleSearch: () => void;
  setZoom: (zoom: number) => void;
  setZoomMode: (mode: ZoomMode) => void;
  setViewMode: (mode: ViewMode) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  searchOpen: false,
  zoom: 1.0,
  zoomMode: 'manual',
  viewMode: 'single',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
  setZoom: (zoom) => set({ zoom, zoomMode: 'manual' }),
  setZoomMode: (zoomMode) => set({ zoomMode }),
  setViewMode: (viewMode) => set({ viewMode }),
}));

// Search Store
interface SearchState {
  query: string;
  results: any[];
  currentResultIndex: number;
  isSearching: boolean;
  options: { caseSensitive: boolean; wholeWord: boolean };
  setQuery: (query: string) => void;
  setResults: (results: any[]) => void;
  setIsSearching: (isSearching: boolean) => void;
  setOptions: (options: Partial<{ caseSensitive: boolean; wholeWord: boolean }>) => void;
  nextResult: () => void;
  previousResult: () => void;
  clearSearch: () => void;
  getCurrentResult: () => any;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  results: [],
  currentResultIndex: -1,
  isSearching: false,
  options: { caseSensitive: false, wholeWord: false },
  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results, currentResultIndex: results.length > 0 ? 0 : -1 }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setOptions: (options) => set((state) => ({ options: { ...state.options, ...options } })),
  nextResult: () => set((state) => ({
    currentResultIndex: state.results.length > 0 ? (state.currentResultIndex + 1) % state.results.length : -1
  })),
  previousResult: () => set((state) => ({
    currentResultIndex: state.results.length > 0 ? (state.currentResultIndex - 1 + state.results.length) % state.results.length : -1
  })),
  clearSearch: () => set({ query: '', results: [], currentResultIndex: -1, isSearching: false }),
  getCurrentResult: () => {
    const { results, currentResultIndex } = get();
    return currentResultIndex >= 0 ? { ...results[currentResultIndex], index: currentResultIndex } : null;
  },
}));

// Annotation Store
export type AnnotationTool = 'select' | 'text' | 'image' | 'drawing' | 'highlight' | 'stamp' | 'signature' | 'shape' | 'eraser' | 'ink' | 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'pan';

export interface Annotation {
  id: string;
  type: AnnotationTool;
  page: number;
  x: number;
  y: number;
  content?: string;
  [key: string]: any;
}

interface ToolSettings {
  color: string;
  opacity: number;
  strokeWidth: number;
  fontSize: number;
}

interface AnnotationState {
  annotations: Record<string, Annotation>;
  addAnnotation: (annotation: Annotation) => void;
  deleteAnnotation: (id: string) => void;
  removeAnnotation: (id: string) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  currentTool: AnnotationTool;
  setCurrentTool: (tool: AnnotationTool) => void;
  toolSettings: ToolSettings;
  setToolSettings: (settings: Partial<ToolSettings>) => void;
  customStamps: { id: string; name: string; data: string }[];
  addCustomStamp: (name: string, data: string) => void;
  selectedAnnotationId: string | null;
  selectAnnotation: (id: string | null) => void;
  getAllAnnotations: () => Annotation[];
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  annotations: {},
  addAnnotation: (annotation) => set((state) => ({
    annotations: { ...state.annotations, [annotation.id]: annotation }
  })),
  deleteAnnotation: (id) => set((state) => {
    const { [id]: _, ...rest } = state.annotations;
    return { annotations: rest };
  }),
  removeAnnotation: (id) => set((state) => {
    const { [id]: _, ...rest } = state.annotations;
    return { annotations: rest };
  }),
  updateAnnotation: (id, updates) => set((state) => ({
    annotations: {
      ...state.annotations,
      [id]: { ...state.annotations[id], ...updates }
    }
  })),
  currentTool: 'select',
  setCurrentTool: (tool) => set({ currentTool: tool }),
  toolSettings: {
    color: '#000000',
    opacity: 1,
    strokeWidth: 2,
    fontSize: 12,
  },
  setToolSettings: (settings) => set((state) => ({
    toolSettings: { ...state.toolSettings, ...settings }
  })),
  customStamps: [],
  addCustomStamp: (name, data) => set((state) => ({
    customStamps: [...state.customStamps, { id: Math.random().toString(36).substr(2, 9), name, data }]
  })),
  selectedAnnotationId: null,
  selectAnnotation: (id) => set({ selectedAnnotationId: id }),
  getAllAnnotations: () => Object.values(get().annotations),
}));

// Annotation History Store
interface HistoryEntry {
  type: 'add' | 'update' | 'delete';
  annotation: Annotation;
  previousState?: Annotation;
}

interface AnnotationHistoryState {
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  undo: () => HistoryEntry | null;
  redo: () => HistoryEntry | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
  push: (entry: HistoryEntry) => void;
  recordUpdate: (annotation: Annotation, previousState: Annotation) => void;
  recordDelete: (annotation: Annotation) => void;
}

export const useAnnotationHistoryStore = create<AnnotationHistoryState>((set, get) => ({
  undoStack: [],
  redoStack: [],
  undo: () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return null;
    const entry = undoStack[undoStack.length - 1];
    set((state) => ({
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, entry]
    }));
    return entry;
  },
  redo: () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return null;
    const entry = redoStack[redoStack.length - 1];
    set((state) => ({
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, entry]
    }));
    return entry;
  },
  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,
  clear: () => set({ undoStack: [], redoStack: [] }),
  push: (entry) => set((state) => ({
    undoStack: [...state.undoStack, entry],
    redoStack: []
  })),
  recordUpdate: (annotation, previousState) => set((state) => ({
    undoStack: [...state.undoStack, { type: 'update', annotation, previousState }],
    redoStack: []
  })),
  recordDelete: (annotation) => set((state) => ({
    undoStack: [...state.undoStack, { type: 'delete', annotation }],
    redoStack: []
  })),
}));

// Form Store
interface FormState {
  fields: any[];
  isFormPDF: boolean;
  isDirty: boolean;
  activeFieldId: string | null;
  setFields: (fields: any[]) => void;
  setIsFormPDF: (isFormPDF: boolean) => void;
  setIsDirty: (isDirty: boolean) => void;
  setFieldValue: (id: string, value: any) => void;
  setActiveField: (id: string | null) => void;
  resetToOriginal: () => void;
  clearForm: () => void;
}

export const useFormStore = create<FormState>((set) => ({
  fields: [],
  isFormPDF: false,
  isDirty: false,
  activeFieldId: null,
  setFields: (fields) => set({ fields, isDirty: true }),
  setIsFormPDF: (isFormPDF) => set({ isFormPDF }),
  setIsDirty: (isDirty) => set({ isDirty }),
  setFieldValue: (id, value) => set((state) => ({
    fields: state.fields.map(f => f.name === id ? { ...f, value } : f),
    isDirty: true
  })),
  setActiveField: (id) => set({ activeFieldId: id }),
  resetToOriginal: () => set({ isDirty: false }),
  clearForm: () => set({ fields: [], isFormPDF: false, isDirty: false }),
}));

// Editing Store
export type EditingMode = 'none' | 'text' | 'image' | 'redact';

import { TextBlock, TextEditOperation, PDFImage, RedactionArea } from './editing/types';

// ...

interface EditingState {
  mode: EditingMode;
  redactions: RedactionArea[];
  images: Map<number, PDFImage[]>;
  textBlocks: Map<number, TextBlock[]>;
  selectedImageId: string | null;
  selectedBlockId: string | null;
  setMode: (mode: EditingMode) => void;
  markRedactionApplied: (id: string) => void;
  hasChanges: () => boolean;
  setImages: (pageNumber: number, images: PDFImage[]) => void;
  selectImage: (id: string | null) => void;
  addImageEdit: (edit: any) => void;
  addRedaction: (redaction: RedactionArea) => void;
  removeRedaction: (id: string) => void;
  setTextBlocks: (pageNumber: number, blocks: TextBlock[]) => void;
  selectBlock: (id: string | null) => void;
  addTextEdit: (edit: TextEditOperation) => void;
}

export const useEditingStore = create<EditingState>((set, get) => ({
  mode: 'none',
  redactions: [],
  images: new Map(),
  textBlocks: new Map(),
  selectedImageId: null,
  selectedBlockId: null,
  setMode: (mode) => set({ mode }),
  markRedactionApplied: (id) => set((state) => ({
    redactions: state.redactions.map(r => r.id === id ? { ...r, applied: true } : r)
  })),
  hasChanges: () => get().redactions.length > 0 || get().mode !== 'none' || get().images.size > 0 || get().textBlocks.size > 0,
  setImages: (pageNumber, images) => set((state) => ({
    images: new Map(state.images).set(pageNumber, images)
  })),
  selectImage: (id) => set({ selectedImageId: id }),
  addImageEdit: (edit) => {}, // Implement if needed
  addRedaction: (redaction) => set((state) => ({ redactions: [...state.redactions, redaction] })),
  removeRedaction: (id) => set((state) => ({ redactions: state.redactions.filter(r => r.id !== id) })),
  setTextBlocks: (pageNumber, blocks) => set((state) => ({
    textBlocks: new Map(state.textBlocks).set(pageNumber, blocks)
  })),
  selectBlock: (id) => set({ selectedBlockId: id }),
  addTextEdit: (edit) => {}, // Implement if needed
}));

// History Store
interface DocumentSnapshot {
  data: Uint8Array;
  fileName: string;
  actionName: string;
  editElements?: any[];
}

interface HistoryState {
  undoStack: DocumentSnapshot[];
  redoStack: DocumentSnapshot[];
  originalDocument: { data: Uint8Array, fileName: string } | null;
  undoRedoInProgress: boolean;
  pushState: (data: Uint8Array, fileName: string, actionName: string, editElements?: any[]) => void;
  undo: () => DocumentSnapshot | null;
  redo: () => DocumentSnapshot | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  getUndoActionName: () => string | null;
  getRedoActionName: () => string | null;
  setOriginalDocument: (data: Uint8Array, fileName: string) => void;
  getOriginalDocument: () => { data: Uint8Array, fileName: string } | null;
  setUndoRedoInProgress: (inProgress: boolean) => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  undoStack: [],
  redoStack: [],
  originalDocument: null,
  undoRedoInProgress: false,
  pushState: (data, fileName, actionName, editElements) => set((state) => ({
    undoStack: [...state.undoStack, { data, fileName, actionName, editElements }],
    redoStack: []
  })),
  undo: () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return null;
    const entry = undoStack[undoStack.length - 1];
    set((state) => ({
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, entry]
    }));
    return entry;
  },
  redo: () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return null;
    const entry = redoStack[redoStack.length - 1];
    set((state) => ({
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, entry]
    }));
    return entry;
  },
  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,
  clearHistory: () => set({ undoStack: [], redoStack: [] }),
  getUndoActionName: () => {
    const { undoStack } = get();
    return undoStack.length > 0 ? undoStack[undoStack.length - 1].actionName : null;
  },
  getRedoActionName: () => {
    const { redoStack } = get();
    return redoStack.length > 0 ? redoStack[redoStack.length - 1].actionName : null;
  },
  setOriginalDocument: (data, fileName) => set({ originalDocument: { data, fileName } }),
  getOriginalDocument: () => get().originalDocument,
  setUndoRedoInProgress: (undoRedoInProgress) => set({ undoRedoInProgress }),
}));

import { persist, createJSONStorage } from 'zustand/middleware';

interface StampState {
  config: StampConfig;
  customTemplates: { id: string; name: string; config: StampConfig }[];
  history: StampConfig[];
  redoStack: StampConfig[];
  setConfig: (updates: Partial<StampConfig> | ((prev: StampConfig) => Partial<StampConfig>)) => void;
  undo: () => void;
  redo: () => void;
  addCustomTemplate: (name: string, config: StampConfig) => void;
  removeCustomTemplate: (id: string) => void;
  clearHistory: () => void;
  fetchTemplates: () => Promise<void>;
  saveTemplateRemote: (name: string, config: StampConfig, svgPreview?: string, templateType?: 'completed' | 'sample') => Promise<void>;
  logAudit: (action: string, details: string) => Promise<void>;
}

export const useStampStore = create<StampState>()(
  persist(
    (set, get) => ({
      config: DEFAULT_CONFIG,
      customTemplates: [],
      history: [],
      redoStack: [],
      setConfig: (updates) => {
        const state = get();
        const nextConfig = typeof updates === 'function' ? updates(state.config) : updates;
        const newConfig = { ...state.config, ...nextConfig };
        
        // Don't record history if only superficial things changed (optional optimization)
        set({
          config: newConfig,
          history: [...state.history, state.config].slice(-50),
          redoStack: []
        });
      },
      undo: () => {
        const state = get();
        if (state.history.length === 0) return;
        const prev = state.history[state.history.length - 1];
        set({
          config: prev,
          history: state.history.slice(0, -1),
          redoStack: [state.config, ...state.redoStack]
        });
      },
      redo: () => {
        const state = get();
        if (state.redoStack.length === 0) return;
        const next = state.redoStack[0];
        set({
          config: next,
          history: [...state.history, state.config],
          redoStack: state.redoStack.slice(1)
        });
      },
      addCustomTemplate: (name, config) => set((state) => ({
        customTemplates: [...state.customTemplates, { id: Math.random().toString(36).substr(2, 9), name, config }]
      })),
      removeCustomTemplate: async (id) => {
        const state = get();
        set({ customTemplates: state.customTemplates.filter(t => t.id !== id) });
        
        // Sync with backend if logged in
        const token = localStorage.getItem('tomo_token');
        if (token && id.length > 10) { // Assume remote IDs are longer than random short IDs
          try {
            const apiUrl = (import.meta as any).env?.VITE_API_URL || '';
            await fetch(`${apiUrl}/api/template/delete/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (e) { console.error("Failed to delete remote template", e); }
        }
      },
      clearHistory: () => set({ history: [], redoStack: [] }),

      fetchTemplates: async () => {
        const token = localStorage.getItem('tomo_token');
        if (!token) return;
        try {
          const apiUrl = (import.meta as any).env?.VITE_API_URL || '';
          const res = await fetch(`${apiUrl}/api/template/list`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            set({ customTemplates: data.result.map((t: any) => ({
              id: t._id,
              name: t.name,
              templateType: t.templateType,
              config: t.config
            })) });
          }
        } catch (e) { console.error("Failed to fetch templates", e); }
      },

      saveTemplateRemote: async (name, config, svgPreview, templateType) => {
        const token = localStorage.getItem('tomo_token');
        if (!token) return;
        try {
          const apiUrl = (import.meta as any).env?.VITE_API_URL || '';
          const res = await fetch(`${apiUrl}/api/template/create`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ name, config, svgPreview, templateType })
          });
          const data = await res.json();
          if (data.success) {
            const state = get();
            const newT = { 
              id: data.result._id, 
              name: data.result.name, 
              templateType: data.result.templateType,
              config: data.result.config 
            };
            set({ customTemplates: [newT, ...state.customTemplates] });
            
            // Log to audit trail
            await state.logAudit('Template Saved', `Saved template: ${name}`);
          }
        } catch (e) { console.error("Failed to save remote template", e); }
      },

      logAudit: async (action, details) => {
        const token = localStorage.getItem('tomo_token');
        if (!token) return;
        try {
           const apiUrl = (import.meta as any).env?.VITE_API_URL || '';
           await fetch(`${apiUrl}/api/audit/create`, {
             method: 'POST',
             headers: { 
               'Content-Type': 'application/json',
               Authorization: `Bearer ${token}` 
             },
             body: JSON.stringify({ action, details })
           });
        } catch (e) { console.error("Failed to log audit action", e); }
      }
    }),
    {
      name: 'stamp-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        config: state.config,
        customTemplates: state.customTemplates
      }),
    }
  )
);
