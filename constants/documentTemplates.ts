
import { 
  Receipt, 
  FileText, 
  Mail, 
  TrendingUp, 
  FileCode, 
  Briefcase, 
  ShieldCheck, 
  Users, 
  GraduationCap, 
  Scale, 
  ClipboardCheck, 
  FileSpreadsheet,
  Package,
  CreditCard,
  DollarSign,
  UserCheck,
  Building,
  Gavel,
  FileSignature,
  Stamp,
  CheckSquare
} from 'lucide-react';

export interface DocTemplate {
  id: string;
  name: string;
  category: 'Financial' | 'Administrative' | 'Legal' | 'HR' | 'Academic' | 'Compliance';
  icon: any;
  color: string;
  desc: string;
  fields: string[];
}

export const DOCUMENT_TEMPLATES: DocTemplate[] = [
  // Financial
  { id: 'invoice', name: 'Invoice', category: 'Financial', icon: Receipt, color: 'bg-blue-600', desc: 'Standard billing document for services or goods.', fields: ['invoiceNumber', 'clientName', 'items', 'total'] },
  { id: 'receipt', name: 'Receipt', category: 'Financial', icon: CheckSquare, color: 'bg-emerald-600', desc: 'Proof of payment for a transaction.', fields: ['receiptNumber', 'amount', 'paymentMethod'] },
  { id: 'po', name: 'Purchase Order (PO)', category: 'Financial', icon: Package, color: 'bg-indigo-600', desc: 'Official order for purchasing goods/services.', fields: ['poNumber', 'vendorName', 'items'] },
  { id: 'quotation', name: 'Quotation', category: 'Financial', icon: FileSpreadsheet, color: 'bg-amber-600', desc: 'Estimated cost for proposed work.', fields: ['quoteNumber', 'clientName', 'items'] },
  { id: 'delivery-note', name: 'Delivery Note', category: 'Financial', icon: Package, color: 'bg-slate-600', desc: 'Accompanies a shipment of goods.', fields: ['deliveryNumber', 'recipientName', 'items'] },
  { id: 'proforma', name: 'Proforma Invoice', category: 'Financial', icon: Receipt, color: 'bg-blue-500', desc: 'Preliminary bill sent before work completion.', fields: ['proformaNumber', 'clientName', 'items'] },
  { id: 'credit-note', name: 'Credit Note', category: 'Financial', icon: CreditCard, color: 'bg-rose-600', desc: 'Document issued for returned goods or errors.', fields: ['noteNumber', 'amount', 'reason'] },
  { id: 'expense-claim', name: 'Expense Claim Form', category: 'Financial', icon: DollarSign, color: 'bg-orange-600', desc: 'Request for reimbursement of expenses.', fields: ['employeeName', 'expenses', 'total'] },
  { id: 'payment-voucher', name: 'Payment Voucher', category: 'Financial', icon: FileText, color: 'bg-cyan-600', desc: 'Internal record for payments made.', fields: ['voucherNumber', 'payee', 'amount'] },

  // Administrative
  { id: 'memo', name: 'Memo', category: 'Administrative', icon: Mail, color: 'bg-slate-700', desc: 'Internal communication for staff.', fields: ['subject', 'to', 'from', 'content'] },
  { id: 'internal-letter', name: 'Internal Letter', category: 'Administrative', icon: FileText, color: 'bg-slate-500', desc: 'Formal internal correspondence.', fields: ['subject', 'recipient', 'content'] },
  { id: 'minutes', name: 'Meeting Minutes', category: 'Administrative', icon: FileCode, color: 'bg-amber-500', desc: 'Record of discussions and decisions.', fields: ['meetingTitle', 'attendees', 'actionItems'] },
  { id: 'circular', name: 'Circular / Notice', category: 'Administrative', icon: Bell, color: 'bg-red-500', desc: 'Public announcement for an organization.', fields: ['title', 'content', 'date'] },
  { id: 'report', name: 'Report', category: 'Administrative', icon: TrendingUp, color: 'bg-indigo-500', desc: 'Detailed analysis or summary of activities.', fields: ['reportTitle', 'executiveSummary', 'findings'] },
  { id: 'approval-form', name: 'Approval Form', category: 'Administrative', icon: ClipboardCheck, color: 'bg-green-600', desc: 'Request for formal authorization.', fields: ['requestTitle', 'description', 'approver'] },
  { id: 'dept-request', name: 'Departmental Request', category: 'Administrative', icon: Building, color: 'bg-blue-400', desc: 'Inter-departmental resource request.', fields: ['department', 'itemsRequested', 'purpose'] },

  // Legal
  { id: 'employment-contract', name: 'Employment Contract', category: 'Legal', icon: UserCheck, color: 'bg-emerald-700', desc: 'Agreement between employer and employee.', fields: ['employeeName', 'position', 'salary', 'terms'] },
  { id: 'service-agreement', name: 'Service Agreement', category: 'Legal', icon: FileSignature, color: 'bg-blue-700', desc: 'Contract for professional services.', fields: ['clientName', 'scopeOfWork', 'paymentTerms'] },
  { id: 'nda', name: 'Non-Disclosure Agreement (NDA)', category: 'Legal', icon: ShieldCheck, color: 'bg-slate-900', desc: 'Confidentiality agreement.', fields: ['partyA', 'partyB', 'duration'] },
  { id: 'lease-agreement', name: 'Lease Agreement', category: 'Legal', icon: Building, color: 'bg-stone-600', desc: 'Contract for property rental.', fields: ['landlord', 'tenant', 'propertyAddress', 'rent'] },
  { id: 'partnership-agreement', name: 'Partnership Agreement', category: 'Legal', icon: Users, color: 'bg-indigo-700', desc: 'Agreement between business partners.', fields: ['partners', 'shares', 'responsibilities'] },
  { id: 'loan-agreement', name: 'Loan Agreement', category: 'Legal', icon: DollarSign, color: 'bg-green-700', desc: 'Contract for borrowed funds.', fields: ['lender', 'borrower', 'amount', 'interestRate'] },
  { id: 'terms-conditions', name: 'Terms & Conditions', category: 'Legal', icon: Scale, color: 'bg-slate-600', desc: 'Rules for using a service or product.', fields: ['serviceName', 'rules', 'liability'] },
  { id: 'affidavit', name: 'Affidavit', category: 'Legal', icon: Gavel, color: 'bg-stone-800', desc: 'Sworn statement of fact.', fields: ['deponentName', 'statement', 'notary'] },

  // HR
  { id: 'offer-letter', name: 'Offer Letter', category: 'HR', icon: Mail, color: 'bg-blue-500', desc: 'Formal job offer to a candidate.', fields: ['candidateName', 'position', 'startDate'] },
  { id: 'appointment-letter', name: 'Appointment Letter', category: 'HR', icon: UserCheck, color: 'bg-emerald-500', desc: 'Confirmation of employment.', fields: ['employeeName', 'position', 'department'] },
  { id: 'warning-letter', name: 'Warning Letter', category: 'HR', icon: Bell, color: 'bg-red-600', desc: 'Disciplinary notice to an employee.', fields: ['employeeName', 'reason', 'consequences'] },
  { id: 'leave-app', name: 'Leave Application', category: 'HR', icon: Calendar, color: 'bg-amber-500', desc: 'Request for time off work.', fields: ['employeeName', 'leaveType', 'dates'] },
  { id: 'appraisal', name: 'Employee Appraisal Form', category: 'HR', icon: TrendingUp, color: 'bg-indigo-600', desc: 'Performance review document.', fields: ['employeeName', 'rating', 'feedback'] },
  { id: 'termination-letter', name: 'Termination Letter', category: 'HR', icon: Trash2, color: 'bg-red-700', desc: 'Formal notice of end of employment.', fields: ['employeeName', 'reason', 'effectiveDate'] },
  { id: 'promotion-letter', name: 'Promotion Letter', category: 'HR', icon: Award, color: 'bg-amber-400', desc: 'Notice of career advancement.', fields: ['employeeName', 'newPosition', 'salaryIncrease'] },
  { id: 'payroll-auth', name: 'Payroll Authorization', category: 'HR', icon: DollarSign, color: 'bg-green-600', desc: 'Approval for salary payments.', fields: ['period', 'totalAmount', 'approver'] },

  // Academic
  { id: 'admission-letter', name: 'Admission Letter', category: 'Academic', icon: GraduationCap, color: 'bg-blue-800', desc: 'Notice of acceptance to an institution.', fields: ['studentName', 'course', 'intakeDate'] },
  { id: 'recommendation-letter', name: 'Recommendation Letter', category: 'Academic', icon: FileText, color: 'bg-slate-400', desc: 'Letter supporting an application.', fields: ['studentName', 'recommender', 'content'] },
  { id: 'transcript-request', name: 'Transcript Request', category: 'Academic', icon: FileCode, color: 'bg-indigo-400', desc: 'Request for academic records.', fields: ['studentId', 'purpose', 'destination'] },
  { id: 'clearance-form', name: 'Clearance Form', category: 'Academic', icon: ClipboardCheck, color: 'bg-emerald-400', desc: 'Proof of meeting all obligations.', fields: ['studentName', 'department', 'status'] },
  { id: 'exam-result', name: 'Examination Result Slip', category: 'Academic', icon: Award, color: 'bg-amber-500', desc: 'Official record of exam scores.', fields: ['studentName', 'examTitle', 'grades'] },
  { id: 'cert-issuance', name: 'Certificate Issuance Letter', category: 'Academic', icon: ShieldCheck, color: 'bg-blue-600', desc: 'Notice that a certificate is ready.', fields: ['studentName', 'certificateType', 'collectionDate'] },

  // Compliance
  { id: 'permit-app', name: 'Permit Application', category: 'Compliance', icon: Stamp, color: 'bg-slate-700', desc: 'Request for official permission.', fields: ['applicantName', 'permitType', 'purpose'] },
  { id: 'license-form', name: 'License Form', category: 'Compliance', icon: ShieldCheck, color: 'bg-blue-900', desc: 'Application for professional license.', fields: ['licensee', 'licenseType', 'validity'] },
  { id: 'compliance-cert', name: 'Compliance Certificate', category: 'Compliance', icon: CheckSquare, color: 'bg-emerald-800', desc: 'Proof of meeting regulatory standards.', fields: ['companyName', 'standard', 'expiryDate'] },
  { id: 'tax-doc', name: 'Tax Document', category: 'Compliance', icon: DollarSign, color: 'bg-red-800', desc: 'Official tax-related filing.', fields: ['taxId', 'period', 'amount'] },
  { id: 'board-resolution', name: 'Board Resolution', category: 'Compliance', icon: Gavel, color: 'bg-stone-900', desc: 'Formal decision by a board of directors.', fields: ['companyName', 'resolutionTitle', 'content'] },
  { id: 'registration-form', name: 'Registration Form', category: 'Compliance', icon: ClipboardCheck, color: 'bg-blue-600', desc: 'Official enrollment or signup document.', fields: ['entityName', 'type', 'details'] },
];

import { Award, Bell, Calendar, Trash2 } from 'lucide-react';
