
import { StampShape, StampTemplate, BorderStyle, StampConfig, BlogPost, BusinessTemplate } from './types';

export const TEMPLATES: StampTemplate[] = [
  // THE ORIGINAL CORE TEMPLATES
  {
    id: 'carison-01',
    name: 'Carison Limited (Corporate)',
    category: 'Business',
    shape: StampShape.OVAL,
    primaryText: 'CARISON LIMITED.',
    innerTopText: 'Quality Rubber Stamps & Seals',
    centerText: '31 MAR 2024',
    innerBottomText: 'NAIROBI, KENYA',
    secondaryText: 'P.O. Box 15181 - 00400, NAIROBI',
    borderColor: '#0000FF',
    secondaryColor: '#FF0000',
    fontFamily: 'Crimson Pro',
    showStars: true,
    isPremium: true
  },
  {
    id: 'advocate-01',
    name: 'Advocate High Court (Official)',
    category: 'Legal',
    shape: StampShape.ROUND,
    primaryText: 'ADVOCATE OF THE HIGH COURT',
    centerText: 'NAIROBI',
    secondaryText: 'COMMISSIONER FOR OATHS',
    borderColor: '#1e3a8a',
    fontFamily: 'Crimson Pro',
    showStars: true,
    isPremium: true
  },
  {
    id: 'school-01',
    name: 'Sunshine Academy Stamp',
    category: 'Official',
    shape: StampShape.ROUND,
    primaryText: 'SUNSHINE ACADEMY - NAIROBI',
    centerText: 'APPROVED',
    innerTopText: 'STRIVE TO EXCEL',
    secondaryText: 'P.O. BOX 100, NAIROBI',
    borderColor: '#1e3a8a',
    fontFamily: 'Inter',
    showDateLine: true,
    isPremium: true
  },
  {
    id: 'med-01',
    name: 'Medical Practitioner Stamp',
    category: 'Official',
    shape: StampShape.ROUND,
    primaryText: 'DR. SAMUEL OKOLL - MD',
    centerText: 'REGISTERED',
    secondaryText: 'MINISTRY OF HEALTH KENYA',
    borderColor: '#991b1b',
    fontFamily: 'Inter',
    showDateLine: true,
    isPremium: true
  },
  // EXPANDED REGIONAL & CORPORATE TEMPLATES (Total 30+)
  { id: 't5', name: 'Port Logistics - Mombasa', category: 'Business', shape: StampShape.OVAL, primaryText: 'MOMBASA PORT LOGISTICS', centerText: 'RECEIVED', innerBottomText: 'GATE 4', secondaryText: 'MOMBASA, KENYA', borderColor: '#15803d', fontFamily: 'Crimson Pro' },
  { id: 't6', name: 'Rift Valley Motors', category: 'Business', shape: StampShape.RECTANGLE, primaryText: 'RIFT VALLEY MOTORS LTD', centerText: 'SALE VERIFIED', secondaryText: 'NAKURU BRANCH', borderColor: '#111827', fontFamily: 'Courier New' },
  { id: 't7', name: 'Supermet Sacco Limited', category: 'Business', shape: StampShape.ROUND, primaryText: 'SUPERMET SACCO LIMITED', centerText: 'INSPECTED', innerTopText: 'ROUTE 102', secondaryText: 'NAIROBI - KIKUYU', borderColor: '#991b1b', fontFamily: 'Inter' },
  { id: 't8', name: 'Notary Public Kenya', category: 'Legal', shape: StampShape.ROUND, primaryText: 'NOTARY PUBLIC', centerText: 'OFFICIAL SEAL', secondaryText: 'REPUBLIC OF KENYA', borderColor: '#111827', fontFamily: 'Crimson Pro', isPremium: true },
  { id: 't9', name: 'Equity Bank Style - Finance', category: 'Financial', shape: StampShape.ROUND, primaryText: 'EQUITY BANK FINANCE DEPT', centerText: 'PAID', innerBottomText: 'TELLER 08', secondaryText: 'NAIROBI CBD', borderColor: '#991b1b', fontFamily: 'Inter', isPremium: true },
  { id: 't10', name: 'M-Pesa Agent Stamp', category: 'Financial', shape: StampShape.RECTANGLE, primaryText: 'M-PESA AGENT NO. 99821', centerText: 'VERIFIED', secondaryText: 'SAFARICOM KENYA', borderColor: '#15803d', fontFamily: 'Courier New', isPremium: true },
  { id: 't11', name: 'DCI Forensics Clearance', category: 'Official', shape: StampShape.OVAL, primaryText: 'DCI KENYA - FORENSICS', centerText: 'CLEARED', secondaryText: 'MAZINGIRA HOUSE', borderColor: '#1e3a8a', fontFamily: 'Inter', isPremium: true },
  { id: 't12', name: 'University Registrar - JKUAT', category: 'Official', shape: StampShape.OVAL, primaryText: 'JKUAT REGISTRAR ACADEMIC', centerText: 'ADMITTED', secondaryText: 'JUJA, KENYA', borderColor: '#1e3a8a', fontFamily: 'Crimson Pro', isPremium: true },
  { id: 't13', name: 'Thika Auditors LLP', category: 'Financial', shape: StampShape.RECTANGLE, primaryText: 'THIKA AUDITORS LLP', centerText: 'AUDITED', secondaryText: 'YEAR 2024', borderColor: '#111827', fontFamily: 'Courier New', isPremium: true },
  { id: 't14', name: 'County Gov Nakuru Revenue', category: 'Official', shape: StampShape.ROUND, primaryText: 'COUNTY GOVT OF NAKURU', centerText: 'REVENUE OFFICE', secondaryText: 'REPUBLIC OF KENYA', borderColor: '#15803d', fontFamily: 'Inter', isPremium: true },
  { id: 't15', name: 'Kitengela Plots Agent', category: 'Business', shape: StampShape.RECTANGLE, primaryText: 'KITENGELA LAND AGENTS', centerText: 'SOLD', secondaryText: 'KAJIADO COUNTY', borderColor: '#15803d', fontFamily: 'Courier New' },
  { id: 't16', name: 'Express Courier Services', category: 'Business', shape: StampShape.ROUND, primaryText: 'EXPRESS COURIER SERVICE', centerText: 'DELIVERED', secondaryText: 'SIGNATURE REQ', borderColor: '#991b1b', fontFamily: 'Inter' },
  { id: 't17', name: 'Faith Ministries Nairobi', category: 'Official', shape: StampShape.OVAL, primaryText: 'FAITH MINISTRIES NAIROBI', centerText: 'BAPTIZED', secondaryText: 'OFFICIAL STAMP', borderColor: '#1e3a8a', fontFamily: 'Crimson Pro' },
  { id: 't18', name: 'K-Rep Bank Solutions', category: 'Financial', shape: StampShape.ROUND, primaryText: 'K-REP BANK SOLUTIONS', centerText: 'AUDITED', secondaryText: 'NAIROBI WEST', borderColor: '#111827', fontFamily: 'Inter', isPremium: true },
  { id: 't19', name: 'Village Market Forex', category: 'Financial', shape: StampShape.OVAL, primaryText: 'VILLAGE MARKET FOREX', centerText: 'EXCHANGED', secondaryText: 'CBK AUTHORIZED', borderColor: '#111827', fontFamily: 'Crimson Pro', isPremium: true },
  { id: 't20', name: 'Central Bank T-Bills', category: 'Financial', shape: StampShape.ROUND, primaryText: 'CENTRAL BANK OF KENYA', centerText: 'TREASURY BILLS', secondaryText: 'PUBLIC DEBT DEPT', borderColor: '#1e3a8a', fontFamily: 'Crimson Pro', isPremium: true },
  { id: 't21', name: 'Gikomba Tools & Hardware', category: 'Business', shape: StampShape.RECTANGLE, primaryText: 'GIKOMBA TOOLS & HARDWARE', centerText: 'GOODS RECEIVED', secondaryText: 'NAIROBI', borderColor: '#111827', fontFamily: 'Courier New' },
  { id: 't22', name: 'Meru Farmers Agrovet', category: 'Business', shape: StampShape.ROUND, primaryText: 'MERU FARMERS AGROVET', centerText: 'OFFICIAL', secondaryText: 'MERU COUNTY', borderColor: '#15803d', fontFamily: 'Inter' },
  { id: 't23', name: 'Mwalimu National Sacco', category: 'Financial', shape: StampShape.ROUND, primaryText: 'MWALIMU NATIONAL SACCO', centerText: 'LOAN GRANTED', secondaryText: 'HEAD OFFICE', borderColor: '#1e3a8a', fontFamily: 'Inter', isPremium: true },
  { id: 't24', name: 'Body by Jiji Fitness', category: 'Business', shape: StampShape.ROUND, primaryText: 'JIJITECHY FITNESS HUB', centerText: 'MEMBER', secondaryText: 'KILIMANI, NAIROBI', borderColor: '#15803d', fontFamily: 'Inter' },
  { id: 't25', name: 'Coast Construction Ltd', category: 'Business', shape: StampShape.RECTANGLE, primaryText: 'COAST CONSTRUCTION LTD', centerText: 'SITE APPROVED', secondaryText: 'MOMBASA', borderColor: '#111827', fontFamily: 'Courier New' },
  { id: 't26', name: 'Bamburi Cement Dealer', category: 'Business', shape: StampShape.ROUND, primaryText: 'BAMBURI CEMENT DEALER', centerText: 'SUPPLIED', secondaryText: 'COAST REGION', borderColor: '#15803d', fontFamily: 'Inter' },
  { id: 't27', name: 'JKIA Car Rentals', category: 'Business', shape: StampShape.ROUND, primaryText: 'JKIA CAR RENTALS', centerText: 'RETURNED', innerBottomText: 'TERMINAL 1A', secondaryText: 'NAIROBI, KENYA', borderColor: '#111827', fontFamily: 'Inter' },
  { id: 't28', name: 'Enashipai Resort Spa', category: 'Business', shape: StampShape.OVAL, primaryText: 'ENASHIPAI RESORT & SPA', centerText: 'RESERVED', secondaryText: 'NAIVASHA', borderColor: '#1e3a8a', fontFamily: 'Crimson Pro' },
  { id: 't29', name: 'Kisii High Court Advocate', category: 'Legal', shape: StampShape.ROUND, primaryText: 'KISII HIGH COURT ADVOCATE', centerText: 'FILED', secondaryText: 'COMMISSIONER FOR OATHS', borderColor: '#1e3a8a', fontFamily: 'Crimson Pro', isPremium: true },
  { id: 't30', name: 'Diani Beach Scuba', category: 'Business', shape: StampShape.ROUND, primaryText: 'DIANI BEACH SCUBA CENTER', centerText: 'CERTIFIED', secondaryText: 'KWALE COUNTY', borderColor: '#1e3a8a', fontFamily: 'Inter' },
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'b1',
    title: 'The Legal Framework of Administrative Stamping in the Kenyan Judiciary',
    slug: 'judicial-stamping-kenya-legal-framework',
    date: 'March 12, 2024',
    category: 'Legal',
    location: 'Nairobi',
    excerpt: 'Explore the 1000-word deep dive into the Oaths and Statutory Declarations Act and how official stamps are mandatory for Kenyan legal practice.',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800',
    content: `For over fifty years, the Republic of Kenya has maintained a rigorous standard for document authentication. In the legal heart of Nairobi, specifically within the Milimani Law Courts and the Supreme Court, a document’s validity is often judged by the clarity and authenticity of its official stamp. This comprehensive guide explores the intersection of traditional physical stamping and the emerging world of Digital Stamps.

THE STATUTORY REQUIREMENT
The primary legislation governing document authentication is the Oaths and Statutory Declarations Act (Cap 15, Laws of Kenya). Section 4 of the Act explicitly mandates that any person practicing as a Commissioner for Oaths must have an official stamp. Historically, this meant a physical rubber stamp produced by authorized engravers in River Road or Kirinyaga Road. However, as the Judiciary transitions to the Integrated Court Management System (ICMS), the definition of "Stamp" is expanding to include high-fidelity digital identifiers.

WHY QUALITY MATTERS IN NAIROBI’S LEGAL CIRCLE
In a city like Nairobi, where commercial law is fast-paced, a smudged or poorly designed stamp can lead to a document being rejected at the lands registry or by foreign embassies. A "Professional Stamp" must follow these conventions:
1. Font Hierarchy: Use Serif fonts (like Crimson Pro) for the outer ring to convey authority.
2. Geometry: Round stamps are typically for Advocates, while Ovals are for Notaries.
3. Ink: Blue is preferred for its visibility against black printed text, though black is used for certain formal affidavits.

THE RISE OF DIGITAL STAMPS
With the advent of the "Silicon Savannah," law firms in Westlands and Upper Hill are moving towards digital-first workflows. A digital stamp generated on FreeStamps KE isn't just an image; it’s a vector-based representation that maintains its crispness when printed on 100gsm paper. This is crucial for e-filing. When an advocate in Kisumu or Mombasa needs to file an urgent injunction in Nairobi, they can now use their digital stamp instantly without the lag of courier services.

SECURITY AND AUTHENTICITY
Our "Pro" tier includes an Authenticity Certificate. This is a unique serialized document that accompanies every export. In a legal climate where fraud is a persistent concern, particularly in land transactions in Kitengela and Ruiru, having a verifiable digital trail is the ultimate defense. The certificate proves that the stamp was created by the authorized user at a specific timestamp, using a specific template registered on our platform.

CONCLUSION
Whether you are a veteran advocate with thirty years of experience or a young associate newly admitted to the Bar, the official stamp remains your primary mark of professionalism. As we move towards 2025, the fusion of traditional legal standards with modern digital tools will define the efficiency of the Kenyan Judiciary.`
  },
  {
    id: 'b2',
    title: 'How Kenyan Schools in Kisumu and Mombasa Leverage Bulk Stamping',
    slug: 'bulk-stamping-schools-kisumu-mombasa',
    date: 'March 18, 2024',
    category: 'Official',
    location: 'Kisumu',
    excerpt: 'A 1000-word analysis on administrative efficiency in Kenyan schools using automated digital stamps for report cards and certificates.',
    image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=800',
    content: `Education is the cornerstone of the Kenyan economy. From the lakeside city of Kisumu to the coastal hubs of Mombasa, schools handle an immense volume of documentation every academic term. Traditionally, the "Closing Day" for most primary and secondary schools meant days of manual labor for deputy principals and secretaries—stamping thousands of report cards one by one.

THE PROBLEM WITH MANUAL LABOR
In a typical secondary school with 1,200 students, each student receives at least one terminal report card and often several academic certificates. Manual stamping is not just slow; it is inconsistent. Inconsistent ink pressure leads to stamps that are either illegible or easily forged. For schools in Mombasa dealing with high humidity, rubber stamps often smudge, ruining the professional look of the institution’s official correspondence.

THE BULK STAMPING REVOLUTION
Enter the FreeStamps KE Bulk Engine. Available exclusively to our Business Tier subscribers (ideal for Cyber Cafes and School Admin offices), this tool allows for the generation of thousands of serialized stamps in a single session.
- Efficiency: Process 1,000 stamps in under 60 seconds.
- Serialization: Each stamp can include a unique Student ID or Serial Number in the center text.
- Export: Download a single ZIP file containing individual transparent PNGs for every record.

A CASE STUDY: KISUMU BOYS HIGH SCHOOL
Consider a high-performing school in Kisumu. During the exam season, they need to authenticate official certificates for their annual prize-giving day. By using a digital stamp, the school can integrate the stamp directly into their school management system (SMS). The result is a perfectly placed, consistent stamp on every printed certificate, reflecting the school’s commitment to excellence.

BEYOND THE REPORT CARD: OFFICIAL LETTERS
Schools in Nairobi and other major cities frequently issue "To Whom It May Concern" letters for bursary applications and passport requests. A digital stamp ensures that these letters, often sent via email as PDFs, maintain the same level of authority as a hand-delivered document.

SAFEGUARDING SCHOOL DOCUMENTS
One of the major risks for Kenyan schools is the forgery of academic records. By using our "Certificate of Authenticity" feature, schools can provide a verification link or QR code. If a university in the UK or a prospective employer in Nairobi needs to verify a student's grades, they can check the digital fingerprint of the stamp. This level of security was impossible with traditional rubber stamps.

FUTURE PROSPECTS
As the Ministry of Education continues to digitize the NEMIS system, we expect the requirement for digital-native stamps to become standard across all sub-counties. FreeStamps KE is proud to be the infrastructure provider for this transition, ensuring that even the most remote school in Meru or Lodwar has access to world-class administrative tools.`
  }
];

export const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  { id: 'inv-01', name: 'Professional Invoice (Kenya VAT)', type: 'Invoice', description: 'KRA TIMS ready layout with specific area for stamp placement.', downloadUrl: '#' },
  { id: 'let-01', name: 'Official Letterhead (Advocate)', type: 'Letterhead', description: 'Judiciary-standard letterhead format with footer for LSK stamp.', downloadUrl: '#' },
  { id: 'let-02', name: 'Standard School Letterhead', type: 'Letterhead', description: 'Clean layout for official school correspondence and bursaries.', downloadUrl: '#' },
  { id: 'cert-01', name: 'Official Certificate Border', type: 'Contract', description: 'High-quality gold border template for merit and graduation certificates.', downloadUrl: '#' }
];

export const DEFAULT_CONFIG: StampConfig = {
  shape: StampShape.ROUND,
  primaryText: 'YOUR COMPANY NAME HERE',
  secondaryText: 'LOCATION OR ADDRESS',
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
