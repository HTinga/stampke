
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

export enum SubscriptionTier {
  FREE = 'FREE',
  PRO = 'PRO',
  BUSINESS = 'BUSINESS'
}

export type UserRole = 'USER' | 'ADMIN';

export interface UserAccount {
  id: string;
  email?: string;
  whatsapp?: string;
  role: UserRole;
  tier: SubscriptionTier;
  expiryDate: string | null;
  status: 'ACTIVE' | 'DEACTIVATED';
  joinedDate: string;
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
  isPremium?: boolean;
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
  signatureUrl: string | null;
  includeCertificate: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: 'Legal' | 'Business' | 'Tutorial' | 'Kenya Trends' | 'Official';
  location?: string;
  date: string;
  image: string;
}

export interface BusinessTemplate {
  id: string;
  name: string;
  type: 'Invoice' | 'Letterhead' | 'Contract';
  description: string;
  downloadUrl: string;
}
