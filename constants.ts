
import { StampShape, StampTemplate, BorderStyle, StampConfig, BlogPost, BusinessTemplate, UserAccount, SubscriptionTier } from './types';

export const TRANSLATIONS: Record<string, any> = {
  en: {
    home: "Home",
    templates: "Templates",
    bulk: "Bulk",
    resources: "Resources",
    pricing: "Pricing",
    profile: "Profile",
    signIn: "Sign In",
    signOut: "Sign Out",
    slogan: "Official Kenyan Stamps.",
    aiDigitize: "AI Digitize",
    browse: "Browse Templates",
    download: "Download",
    motto: "Official Kenya Engine",
    admin: "Admin Console",
    editStamp: "Edit Stamp",
    saveStamp: "Save Design",
    footerLegal: "Legal Documentation",
    footerPrivacy: "Privacy Policy",
    footerTerms: "Terms of Service"
  },
  sw: {
    home: "Mwanzo",
    templates: "Violezo",
    bulk: "Gonga Nyingi",
    resources: "Rasilimali",
    pricing: "Bei",
    profile: "Wasifu",
    signIn: "Ingia",
    signOut: "Toka",
    slogan: "Mihuri Rasmi ya Kenya.",
    aiDigitize: "AI Dijitali",
    browse: "Vinjari Violezo",
    download: "Pakua",
    motto: "Injini Rasmi ya Kenya",
    admin: "Usimamizi",
    editStamp: "Rekebisha Muhuri",
    saveStamp: "Hifadhi",
    footerLegal: "Nyaraka za Kisheria",
    footerPrivacy: "Sera ya Faragha",
    footerTerms: "Masharti ya Huduma"
  }
};

export const MOCK_USERS: UserAccount[] = [
  { id: '1', email: 'admin@freestamps.ke', role: 'ADMIN', tier: SubscriptionTier.BUSINESS, expiryDate: '2025-12-31', status: 'ACTIVE', joinedDate: '2023-01-01' },
  { id: '2', whatsapp: '+254712345678', role: 'USER', tier: SubscriptionTier.PRO, expiryDate: '2024-06-15', status: 'ACTIVE', joinedDate: '2024-02-01' },
];

export const TEMPLATES: StampTemplate[] = [
  {
    id: 'carison-oval-01',
    name: 'Carison Limited (Official)',
    category: 'Business',
    shape: StampShape.OVAL,
    primaryText: 'CARISON LIMITED.',
    innerTopText: 'For Rubber Stamps & Company Seals',
    centerText: '31 MAR 2017',
    centerSubText: 'Tel: 0722174777',
    secondaryText: 'P.O. Box 15181 - 00400, NAIROBI, KENYA',
    borderColor: '#0000FF',
    secondaryColor: '#FF0000',
    fontFamily: 'Crimson Pro',
    showStars: true,
    isPremium: true
  },
  {
    id: 'helmarc-rect-01',
    name: 'Helmarc Brands (Received)',
    category: 'Business',
    shape: StampShape.RECTANGLE,
    primaryText: 'HELMARC BRANDS KENYA',
    centerText: 'RECEIVED',
    centerSubText: '27 JULY 2020',
    secondaryText: 'P.O. Box 4417 - 00100 NAIROBI',
    borderColor: '#1e3a8a',
    secondaryColor: '#991b1b',
    fontFamily: 'Crimson Pro',
    isPremium: true
  },
  {
    id: 'coastamps-oval-01',
    name: 'Coastamps Kenya Solutions',
    category: 'Business',
    shape: StampShape.OVAL,
    primaryText: 'COASTAMPS KENYA SOLUTIONS',
    centerText: '08 JAN 2021',
    secondaryText: 'P.O. Box 80100 - 80100, MOMBASA',
    borderColor: '#000080',
    secondaryColor: '#FF0000',
    fontFamily: 'Crimson Pro',
    showStars: true,
    isPremium: true
  },
  {
    id: 'advocate-michael-01',
    name: 'Michael Kipchirchir Advocate',
    category: 'Legal',
    shape: StampShape.RECTANGLE,
    primaryText: 'MICHAEL KIPCHIRCHIR',
    centerText: 'ADVOCATE',
    centerSubText: 'P.O. Box 70687 - 00200',
    secondaryText: 'NAIROBI',
    borderColor: '#111827',
    fontFamily: 'Crimson Pro',
    isPremium: true
  },
  {
    id: 'helmarc-rect-paid',
    name: 'Helmarc Brands (Paid)',
    category: 'Business',
    shape: StampShape.RECTANGLE,
    primaryText: 'HELMARC BRANDS KENYA',
    centerText: 'PAID',
    centerSubText: '27 JULY 2020',
    secondaryText: 'P.O. Box 4417 - 00100 NAIROBI',
    borderColor: '#1e3a8a',
    secondaryColor: '#991b1b',
    fontFamily: 'Crimson Pro',
    isPremium: true
  },
  {
    id: 'approved-round-blue',
    name: 'Approved Round (Blue)',
    category: 'Official',
    shape: StampShape.ROUND,
    primaryText: 'APPROVED OFFICIAL',
    centerText: 'APPROVED',
    centerSubText: '10 MAY 2023',
    secondaryText: 'Thank you for your business',
    borderColor: '#1e3a8a',
    secondaryColor: '#1e3a8a',
    fontFamily: 'Inter',
    showDateLine: true,
    isPremium: false
  },
  {
    id: 'lsk-round-01',
    name: 'H.S. Hillary Advocate',
    category: 'Legal',
    shape: StampShape.ROUND,
    primaryText: 'H.S. HILLARY',
    innerTopText: 'ADVOCATE & COMMISSIONER',
    innerBottomText: 'FOR OATHS',
    centerText: 'NAIROBI',
    secondaryText: 'P.O. BOX 15551, NAIROBI',
    borderColor: '#1e3a8a',
    fontFamily: 'Crimson Pro',
    showStars: true,
    isPremium: true
  },
  {
    id: 'confidential-red-rect',
    name: 'Confidential Rect',
    category: 'Official',
    shape: StampShape.RECTANGLE,
    primaryText: '',
    centerText: 'CONFIDENTIAL',
    secondaryText: '',
    borderColor: '#991b1b',
    fontFamily: 'Inter',
    isPremium: false
  }
];

export const DEFAULT_CONFIG: StampConfig = {
  shape: StampShape.ROUND,
  primaryText: 'COMPANY NAME',
  secondaryText: 'LOCATION / ADDRESS',
  innerTopText: '',
  innerBottomText: '',
  centerText: 'OFFICIAL STAMP',
  centerSubText: '',
  fontSize: 22,
  letterSpacing: 2,
  borderColor: '#1e3a8a',
  secondaryColor: '#991b1b',
  borderWidth: 3,
  borderStyle: BorderStyle.SINGLE,
  rotation: 0,
  width: 600,
  height: 600,
  fontFamily: 'Crimson Pro',
  showSignatureLine: false,
  showDateLine: false,
  showStars: false,
  distressLevel: 0.1,
  isVintage: false,
  logoUrl: null,
  signatureUrl: null,
  includeCertificate: false
};

export const COLORS = [
  { name: 'Onyx Black', value: '#111827' },
  { name: 'Royal Blue', value: '#1e3a8a' },
  { name: 'Pure Blue', value: '#0000FF' },
  { name: 'Crimson Red', value: '#991b1b' },
  { name: 'Standard Red', value: '#FF0000' },
  { name: 'Forest Green', value: '#15803d' },
];

export const FONTS = [
  { name: 'Classic Serif', value: 'Crimson Pro' },
  { name: 'Modern Sans', value: 'Inter' },
  { name: 'Industrial Slab', value: 'Courier New' },
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'b1',
    title: 'Legal Stamping Standards in Kenya',
    slug: 'administrative-stamping-kenya-legal',
    date: 'March 24, 2024',
    category: 'Legal',
    location: 'Nairobi',
    excerpt: 'Deep dive into official rubber stamp requirements for Advocates and businesses.',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800',
    content: `Official rubber stamps are the backbone of administrative trust in Kenya...`
  }
];

export const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  { id: 'inv-01', name: 'Invoice (KRA Ready)', type: 'Invoice', description: 'Standard tax invoice layout.', downloadUrl: '#' },
  { id: 'let-01', name: 'Advocate Letterhead', type: 'Letterhead', description: 'Official judicial format.', downloadUrl: '#' }
];
