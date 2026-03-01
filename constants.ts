
import { StampShape, StampTemplate, BorderStyle, StampConfig } from './types';

export const TEMPLATES: StampTemplate[] = [
  // THE CARISON SERIES (High Accuracy)
  {
    id: 'carison-01',
    name: 'Carison Limited (The Original)',
    category: 'Business',
    shape: StampShape.OVAL,
    primaryText: 'CARISON LIMITED.',
    innerTopText: 'For Rubber Stamps & Company Seals',
    centerText: '31 MAR 2017',
    innerBottomText: 'Tel: 0722174777',
    secondaryText: 'P.O. Box 15181 - 00400, NAIROBI, KENYA',
    borderColor: '#0000FF',
    secondaryColor: '#FF0000',
    fontFamily: 'Crimson Pro',
    showStars: true,
    showInnerLine: true,
    innerLineOffset: 12,
    wetInk: true
  },
  
  // HELMARC GROUP (High Accuracy)
  {
    id: 'helmarc-01',
    name: 'Helmarc Brands (Rectangle Received)',
    category: 'Financial',
    shape: StampShape.RECTANGLE,
    primaryText: 'HELMARC BRANDS KENYA',
    centerText: 'RECEIVED',
    centerSubText: '27 JULY 2020',
    secondaryText: 'P.O. Box 4417 - 00100 NAIROBI',
    borderColor: '#1e3a8a',
    secondaryColor: '#991b1b',
    fontFamily: 'Inter',
    showInnerLine: true,
    innerLineOffset: 8
  },
  {
    id: 'helmarc-02',
    name: 'Helmarc Brands (Rectangle PAID)',
    category: 'Financial',
    shape: StampShape.RECTANGLE,
    primaryText: 'HELMARC BRANDS KENYA',
    centerText: 'PAID',
    centerSubText: '27 JULY 2020',
    secondaryText: 'P.O. Box 4417 - 00100 NAIROBI',
    borderColor: '#1e3a8a',
    secondaryColor: '#991b1b',
    fontFamily: 'Inter'
  },
  {
    id: 'helmarc-03',
    name: 'Helmarc Brands (Oval Received)',
    category: 'Financial',
    shape: StampShape.OVAL,
    primaryText: 'HELMARC BRANDS KENYA',
    centerText: 'RECEIVED',
    centerSubText: '27 JULY 2020',
    secondaryText: 'P.O. Box 4417 - 00100, NAIROBI',
    borderColor: '#1e3a8a',
    secondaryColor: '#991b1b',
    fontFamily: 'Inter'
  },
  {
    id: 'helmarc-04',
    name: 'Helmarc Brands (Round Received)',
    category: 'Financial',
    shape: StampShape.ROUND,
    primaryText: 'HELMARC BRANDS KENYA',
    centerText: 'RECEIVED',
    centerSubText: '27 JULY 2020',
    secondaryText: 'P.O. Box 4417 - 00100 NAIROBI',
    borderColor: '#1e3a8a',
    secondaryColor: '#991b1b',
    fontFamily: 'Crimson Pro'
  },
  {
    id: 'helmarc-05',
    name: 'Helmarc Mabati (Received)',
    category: 'Business',
    shape: StampShape.RECTANGLE,
    primaryText: 'HELMARC MABATI FACTORY LTD.',
    centerText: 'RECEIVED',
    centerSubText: '02 DEC 2034',
    secondaryText: 'P.O. BOX 5687-00100, NAIROBI',
    borderColor: '#1e3a8a',
    secondaryColor: '#991b1b',
    fontFamily: 'Inter',
    showDateLine: true
  },

  // COASTAMPS SERIES
  {
    id: 'coast-01',
    name: 'Coastamps Kenya Solutions',
    category: 'Business',
    shape: StampShape.OVAL,
    primaryText: 'COASTAMPS KENYA SOLUTIONS',
    centerText: '08 JAN 2021',
    secondaryText: 'P.O. Box 80100 - 80100, MOMBASA',
    borderColor: '#000080',
    secondaryColor: '#FF0000',
    fontFamily: 'Crimson Pro',
    showStars: true
  },

  // LEGAL & ADVOCATES
  {
    id: 'adv-kip-01',
    name: 'Michael Kipchirchir Advocate',
    category: 'Legal',
    shape: StampShape.RECTANGLE,
    primaryText: 'MICHAEL KIPCHIRCHIR',
    centerText: 'ADVOCATE',
    secondaryText: 'P.O. Box 39887 - 00200, NAIROBI',
    borderColor: '#111827',
    fontFamily: 'Crimson Pro'
  },
  {
    id: 'adv-hil-01',
    name: 'H.S. Hillary Advocate',
    category: 'Legal',
    shape: StampShape.ROUND,
    primaryText: 'H.S. HILLARY',
    innerTopText: 'ADVOCATE &',
    innerBottomText: 'COMMISSIONER FOR OATHS',
    secondaryText: 'P.O. BOX 8333 - 00100, NAIROBI',
    borderColor: '#111827',
    fontFamily: 'Crimson Pro'
  },
  {
    id: 'adv-kam-01',
    name: 'Michael Kamau & Assoc.',
    category: 'Legal',
    shape: StampShape.RECTANGLE,
    primaryText: 'MICHAEL KAMAU & ASSOCIATES ADVOCATES',
    centerText: 'RECEIVED',
    centerSubText: '06 JUL 2034',
    secondaryText: 'P.O. Box 87480 - 00100, NAIROBI',
    borderColor: '#1e3a8a',
    secondaryColor: '#991b1b',
    fontFamily: 'Inter',
    showSignatureLine: true
  },

  // AMUSADE & OFFICIAL
  {
    id: 'amu-gaf-01',
    name: 'Amusade GAF Foundation',
    category: 'Official',
    shape: StampShape.ROUND,
    primaryText: 'AMUSADE GAF FOUNDATION',
    centerText: 'RECEIVED',
    centerSubText: 'In Good Condition',
    secondaryText: 'GOODS RECEIVED IN GOOD CONDITION',
    borderColor: '#1e3a8a',
    fontFamily: 'Inter',
    showSignatureLine: true
  },
  {
    id: 'winsome-01',
    name: 'Winsome Spa (Diamond Plaza)',
    category: 'Business',
    shape: StampShape.ROUND,
    primaryText: 'WINSOME SPA ★ OFFICIAL ★',
    centerText: '02 DEC 2034',
    secondaryText: '3rd Parklands, Diamond Plaza II, Nairobi',
    borderColor: '#581c87',
    fontFamily: 'Inter'
  },
  {
    id: 'status-app-red',
    name: 'APPROVED Red Round',
    category: 'Official',
    shape: StampShape.ROUND,
    primaryText: 'APPROVED',
    centerText: '10 MAY 2023',
    secondaryText: 'Thank you for your business',
    borderColor: '#B91C1C',
    fontFamily: 'Inter',
    showSignatureLine: true,
    showStars: true
  },
  {
    id: 'status-app-blue',
    name: 'APPROVED Blue Oval',
    category: 'Official',
    shape: StampShape.OVAL,
    primaryText: 'APPROVED',
    centerText: '10 MAY 2023',
    secondaryText: 'Thank you for your business',
    borderColor: '#1e40af',
    fontFamily: 'Inter',
    showSignatureLine: true,
    showStars: true
  }
];

export const DEFAULT_CONFIG: StampConfig = {
  shape: StampShape.ROUND,
  primaryText: 'YOUR COMPANY NAME HERE',
  secondaryText: 'LOCATION OR ADDRESS',
  innerTopText: '',
  innerBottomText: '',
  centerText: 'OFFICIAL SEAL',
  centerSubText: '',
  fontSize: 22,
  letterSpacing: 2,
  letterStretch: 1,
  borderColor: '#1e3a8a',
  secondaryColor: '#991b1b',
  borderWidth: 3,
  borderOffset: 0,
  borderStyle: BorderStyle.SINGLE,
  rotation: 0,
  width: 600,
  height: 600,
  fontFamily: 'Crimson Pro',
  showSignatureLine: false,
  showDateLine: false,
  showStars: false,
  showInnerLine: false,
  innerLineOffset: 15,
  innerLineWidth: 2,
  distressLevel: 0.1,
  isVintage: false,
  wetInk: false,
  logoUrl: null,
  embeddedSignatureUrl: null,
  showEmbeddedSignature: false,
  customElements: [],
  previewBg: 'default'
};

export const COLORS = [
  { name: 'Onyx Black', value: '#111827' },
  { name: 'Royal Blue', value: '#1e3a8a' },
  { name: 'Pure Blue', value: '#0000FF' },
  { name: 'Crimson Red', value: '#991b1b' },
  { name: 'Standard Red', value: '#FF0000' },
  { name: 'Forest Green', value: '#15803d' },
  { name: 'Deep Purple', value: '#581c87' },
];

export const FONTS = [
  { name: 'Classic Serif', value: 'Crimson Pro' },
  { name: 'Modern Sans', value: 'Inter' },
  { name: 'Industrial Slab', value: 'Courier New' },
  { name: 'Vintage Mono', value: 'monospace' },
];
