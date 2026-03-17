
import { create } from 'zustand';

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
  setQuery: (query: string) => void;
  setResults: (results: any[]) => void;
  nextResult: () => void;
  prevResult: () => void;
  clearSearch: () => void;
  getCurrentResult: () => any;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  results: [],
  currentResultIndex: -1,
  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results, currentResultIndex: results.length > 0 ? 0 : -1 }),
  nextResult: () => set((state) => ({
    currentResultIndex: state.results.length > 0 ? (state.currentResultIndex + 1) % state.results.length : -1
  })),
  prevResult: () => set((state) => ({
    currentResultIndex: state.results.length > 0 ? (state.currentResultIndex - 1 + state.results.length) % state.results.length : -1
  })),
  clearSearch: () => set({ query: '', results: [], currentResultIndex: -1 }),
  getCurrentResult: () => {
    const { results, currentResultIndex } = get();
    return currentResultIndex >= 0 ? { ...results[currentResultIndex], index: currentResultIndex } : null;
  },
}));

// Annotation Store
export type AnnotationTool = 'select' | 'text' | 'image' | 'drawing' | 'highlight' | 'stamp' | 'signature' | 'shape' | 'eraser';

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
}));

// Form Store
interface FormState {
  fields: any[];
  isFormPDF: boolean;
  isDirty: boolean;
  setFields: (fields: any[]) => void;
  setIsFormPDF: (isFormPDF: boolean) => void;
  setIsDirty: (isDirty: boolean) => void;
  resetToOriginal: () => void;
  clearForm: () => void;
}

export const useFormStore = create<FormState>((set) => ({
  fields: [],
  isFormPDF: false,
  isDirty: false,
  setFields: (fields) => set({ fields, isDirty: true }),
  setIsFormPDF: (isFormPDF) => set({ isFormPDF }),
  setIsDirty: (isDirty) => set({ isDirty }),
  resetToOriginal: () => set({ isDirty: false }),
  clearForm: () => set({ fields: [], isFormPDF: false, isDirty: false }),
}));

// Editing Store
export type EditingMode = 'none' | 'text' | 'image' | 'redact';

interface EditingState {
  mode: EditingMode;
  redactions: any[];
  setMode: (mode: EditingMode) => void;
  markRedactionApplied: (id: string) => void;
  hasChanges: () => boolean;
}

export const useEditingStore = create<EditingState>((set, get) => ({
  mode: 'none',
  redactions: [],
  setMode: (mode) => set({ mode }),
  markRedactionApplied: (id) => set((state) => ({
    redactions: state.redactions.map(r => r.id === id ? { ...r, applied: true } : r)
  })),
  hasChanges: () => get().redactions.length > 0 || get().mode !== 'none',
}));

// History Store
interface DocumentSnapshot {
  data: Uint8Array;
  fileName: string;
  actionName: string;
}

interface HistoryState {
  undoStack: DocumentSnapshot[];
  redoStack: DocumentSnapshot[];
  originalDocument: { data: Uint8Array, fileName: string } | null;
  undoRedoInProgress: boolean;
  pushState: (data: Uint8Array, fileName: string, actionName: string) => void;
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
  pushState: (data, fileName, actionName) => set((state) => ({
    undoStack: [...state.undoStack, { data, fileName, actionName }],
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
