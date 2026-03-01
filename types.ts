export enum StampShape {
  ROUND = 'ROUND',
  OVAL = 'OVAL',
  RECTANGLE = 'RECTANGLE',
  SQUARE = 'SQUARE'
}

export enum BorderStyle {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  DOTTED = 'DOTTED',
  DASHED = 'DASHED'
}

export interface StampTemplate {
  id: string;
  name: string;
  category: 'Business' | 'Official' | 'Legal' | 'Financial';
  shape: StampShape;
  primaryText: string;
  secondaryText?: string;
  innerTopText?: string;
  innerBottomText?: string;
  centerText?: string;
  centerSubText?: string;
  borderColor: string;
  secondaryColor?: string;
  fontFamily: string;
  showSignatureLine?: boolean;
  showDateLine?: boolean;
  showStars?: boolean;
  logoUrl?: string;
  showInnerLine?: boolean;
  innerLineOffset?: number;
  wetInk?: boolean;
}

export interface StampConfig {
  shape: StampShape;
  primaryText: string;
  secondaryText: string;
  innerTopText: string;
  innerBottomText: string;
  centerText: string;
  centerSubText: string;
  fontSize: number;
  letterSpacing: number;
  letterStretch: number;
  borderColor: string;
  secondaryColor: string;
  borderWidth: number;
  borderOffset: number;
  borderStyle: BorderStyle;
  rotation: number;
  width: number;
  height: number;
  fontFamily: string;
  showSignatureLine: boolean;
  showDateLine: boolean;
  showStars: boolean;
  showInnerLine: boolean;
  innerLineOffset: number;
  innerLineWidth: number;
  distressLevel: number;
  isVintage: boolean;
  wetInk: boolean;
  logoUrl: string | null;
  embeddedSignatureUrl: string | null;
  showEmbeddedSignature: boolean;
  customElements: CustomElement[];
  previewBg: 'default' | 'transparent' | 'white' | 'paper';
}

export interface CustomElement {
  id: string;
  type: 'image' | 'text';
  x: number;
  y: number;
  content: string;
  width?: number;
  height?: number;
  rotation?: number;
  scale?: number;
  isBlackAndWhite?: boolean;
  contrast?: number;
}

export type StampPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'custom';

export interface BulkDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  pages: number;
  previewUrl?: string;
  pagePreviews?: string[];
}

// Digital Signature Types
export type FieldType = 'signature' | 'stamp' | 'date' | 'text' | 'initials';

export interface SignField {
  id: string;
  type: FieldType;
  x: number; // percentage
  y: number; // percentage
  width?: number; // percentage of page width
  height?: number; // percentage of page height
  page: number;
  signerId: string;
  value?: string;
  isCompleted?: boolean;
}

export interface SignerInfo {
  id: string;
  name: string;
  email: string;
  role: 'signer' | 'approver' | 'viewer';
  order: number;
  status: 'pending' | 'viewed' | 'signed' | 'declined';
  lastActivity?: string;
  ip?: string;
}

export interface Envelope {
  id: string;
  title: string;
  status: 'draft' | 'sent' | 'completed' | 'voided';
  createdAt: string;
  updatedAt: string;
  documents: BulkDocument[];
  signers: SignerInfo[];
  fields: SignField[];
  auditLog: AuditEntry[];
  requiresPayment?: boolean;
  paymentAmount?: number;
  paymentStatus?: 'unpaid' | 'paid';
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  ip: string;
  details: string;
}