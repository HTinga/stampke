
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
    footerTerms: "Terms of Service",
    searchPlaceholder: "Search templates (e.g. Carison, Helmarc, Advocate)...",
    freeToEdit: "Free to Design, Pay to Download",
    highResHint: "All templates are unlocked for editing. High-res vector export starts at KES 650.",
    individual: "Individual",
    professional: "Professional",
    business: "Business / Cafe",
    payAsYouGo: "Pay As You Go",
    upgrade: "Upgrade",
    goUnlimited: "Go Unlimited",
    signOverlay: "Sign Overlay",
    authCert: "Auth Cert",
    categories: {
      All: "All",
      Legal: "Legal",
      Official: "Official",
      Business: "Business",
      Financial: "Financial"
    },
    legalPage: {
      title: "Legal & Regulatory Framework",
      subtitle: "Ensuring administrative trust and compliance under Kenyan law.",
      contactTitle: "Get in Touch",
      email: "us@freestampske.com",
      phone: "+254 710 588 758",
      sections: {
        legal: {
          title: "Legal Authority",
          content: "FreeStamps KE operates as a digital administrative tool under JijiTechy Solutions. Our digital stamps are designed to comply with the Business Laws (Amendment) Act 2020 of Kenya, which recognizes electronic signatures and seals. While we provide high-fidelity templates, users are responsible for ensuring the legitimate use of corporate and professional identities."
        },
        privacy: {
          title: "Privacy & Data Sovereignty",
          content: "We adhere strictly to the Kenya Data Protection Act 2019. Your uploaded images for AI digitization are processed transiently and are not stored permanently unless you save them to your profile. We do not sell your personal data. All payment processing is handled via secure M-Pesa STK or Stripe gateways without storing your credit card details on our servers."
        },
        terms: {
          title: "Terms of Service",
          content: "1. Usage: You are granted a license to create and customize stamps. 2. Payments: High-resolution downloads are charged at KES 650 per file unless on a subscription plan. 3. Refunds: Due to the digital nature of our assets, all sales are final. 4. Prohibited Acts: Forgery, unauthorized creation of government seals, and fraudulent representation will lead to immediate account termination and reporting to authorities."
        }
      }
    }
  },
  sw: {
    home: "Mwanzo",
    templates: "Violezo",
    bulk: "Nyingi",
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
    footerTerms: "Masharti ya Huduma",
    searchPlaceholder: "Tafuta violezo (k.m. Carison, Helmarc, Advocate)...",
    freeToEdit: "Bure kurekebisha, Lipia kupakua",
    highResHint: "Violezo vyote viko wazi kurekebisha. Kupakua huanza kwa KES 650.",
    individual: "Binafsi",
    professional: "Mtaalam",
    business: "Biashara / Cafe",
    payAsYouGo: "Lipia Unapotumia",
    upgrade: "Boresha",
    goUnlimited: "Pata Zote",
    signOverlay: "Sahihi",
    authCert: "Cheti",
    categories: {
      All: "Zote",
      Legal: "Kisheria",
      Official: "Rasmi",
      Business: "Biashara",
      Financial: "Kifedha"
    },
    legalPage: {
      title: "Mwongozo wa Kisheria na Udhibiti",
      subtitle: "Kuhakikisha uaminifu wa kiutawala na kufuata sheria za Kenya.",
      contactTitle: "Wasiliana Nasi",
      email: "us@freestampske.com",
      phone: "+254 710 588 758",
      sections: {
        legal: {
          title: "Mamlaka ya Kisheria",
          content: "FreeStamps KE inafanya kazi kama zana ya kidijitali chini ya JijiTechy Solutions. Mihuri yetu imetengenezwa kulingana na Sheria ya Marekebisho ya Sheria za Biashara ya 2020 ya Kenya, inayotambua sahihi na mihuri ya kielektroniki. Ingawa tunatoa violezo vya hali ya juu, watumiaji wana jukumu la kuhakikisha matumizi halali."
        },
        privacy: {
          title: "Faragha na Uhuru wa Data",
          content: "Tunafuata kikamilifu Sheria ya Ulinzi wa Data ya Kenya ya 2019. Picha unazopakia kwa ajili ya AI huchakatwa kwa muda na hazihifadhiwi isipokuwa ukiweka kwenye wasifu wako. Hatuzi data yako kwa mtu yeyote. Malipo yote hufanywa kupitia njia salama za M-Pesa STK au Stripe bila kuhifadhi siri za kadi yako."
        },
        terms: {
          title: "Masharti ya Huduma",
          content: "1. Matumizi: Unapewa ruhusa ya kutengeneza mihuri. 2. Malipo: Kupakua picha ya hali ya juu hugharimu KES 650 isipokuwa uwe kwenye mpango wa mwezi. 3. Marejesho: Kwa sababu ya hali ya bidhaa za kidijitali, malipo hayatarudishwa. 4. Marufuku: Kughushi, kutengeneza mihuri ya serikali bila idhini, na utambulisho wa uwongo utasababisha kufungiwa kwa akaunti."
        }
      }
    }
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
