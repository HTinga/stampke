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
  borderColor: string;
  secondaryColor: string;
  borderWidth: number;
  borderStyle: BorderStyle;
  rotation: number;
  width: number;
  height: number;
  fontFamily: string;
  showSignatureLine: boolean;
  showDateLine: boolean;
  showStars: boolean;
  distressLevel: number;
  isVintage: boolean;
  logoUrl: string | null;
}

export type StampPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'custom';

export interface BulkDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  pages: number;
  previewUrl?: string;
}