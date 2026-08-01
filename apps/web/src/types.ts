export enum PipelineStageId {
  LEAD = "lead",
  DISCOVERY = "discovery",
  PROPOSAL = "proposal",
  NEGOTIATION = "negotiation",
  CLOSED_WON = "closed_won",
  CLOSED_LOST = "closed_lost",
}

/** Alinhado ao backend: backend/src/common/enums/user-role.enum.ts */
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  SA_MASTER = "SA_MASTER",
  SA_BILLING = "SA_BILLING",
  SA_USER = "SA_USER",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  COORDINATOR = "COORDINATOR",
  USER = "USER",
}

// SAAS / WHITE-LABEL TYPES
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string; // URL do logo da organização
  primaryColor?: string; // Hex code
  plan: "Standard" | "Professional" | "Enterprise";
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string; // mime type or extension
  size: number;
  url: string; // base64 or url
  uploadedAt: string;
  uploadedBy: string;
}

export interface PipelineStageDef {
  id: string;
  label: string;
  color: string;
}

export interface PipelineDef {
  id: string;
  name: string;
  stages: PipelineStageDef[];
}

/**
 * `Contact` — mock legado, sem consumidor real hoje.
 */
export interface Contact {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  segment: string;
  tags: string[];
  files?: FileAttachment[];
  ownerId?: string; // Relacionamento com usuário dono da organização
  customData?: Record<string, any>;
}

export interface Comment {
  id: string;
  dealId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  pipelineId: string;
  contactId: string;
  ownerId: string;
  probability: number;
  expectedCloseDate: string;
  createdAt: string;
  closedAt?: string;
  lossReason?: string;
  tags?: string[];
  files?: FileAttachment[];
  comments?: Comment[];
  customData?: Record<string, any>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole | string;
  avatarUrl: string;
  status: "Active" | "Invited" | "Inactive";
  theme?: "light" | "dark";
}

export interface CadenceStep {
  id: string;
  day: number;
  /** `CadenceStep` é mock, sem consumidor real hoje. */
  type: string;
  script: string;
}

export interface Cadence {
  id: string;
  name: string;
  description: string;
  steps: CadenceStep[];
}

// FORM BUILDER TYPES

export type FormFieldType = "text" | "email" | "number" | "select" | "textarea";

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  options?: string[];
}

export interface FormTemplate {
  id: string;
  title: string;
  status: "active" | "draft" | "paused";
  fields: FormField[];
  views: number;
  submissionsCount: number;
  createdAt: string;
}

export interface FormSubmission {
  id: string;
  formId: string;
  submittedAt: string;
  data: Record<string, string>;
}

// PRODUCTS MODULE
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
  category: string;
  active: boolean;
  customData?: Record<string, any>;
}

// PROPOSALS MODULE
export type ProposalStatus = "Draft" | "Sent" | "Accepted" | "Rejected";

export interface ProposalItem {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Proposal {
  id: string;
  title: string;
  contactId: string;
  dealId?: string; // Optional link to a deal in the organization
  status: ProposalStatus;
  items: ProposalItem[];
  totalValue: number;
  validUntil: string;
  createdAt: string;
  ownerId: string;
  customData?: Record<string, any>;
}

// FINANCE MODULE
export interface Invoice {
  id: string;
  number: string; // e.g. INV-2023-001
  contactId: string;
  amount: number;
  status: "Draft" | "Sent" | "Paid" | "Overdue" | "Cancelled";
  dueDate: string;
  issueDate: string;
  items: { description: string; quantity: number; price: number }[];
  customData?: Record<string, any>;
}

// CONTRACTS MODULE
export interface Contract {
  id: string;
  title: string;
  contactId: string;
  value: number; // Recurring or total value
  status: "Active" | "Pending" | "Expired" | "Cancelled";
  startDate: string;
  endDate: string;
  renewalDate: string;
  documentUrl?: string;
  ownerId: string;
  customData?: Record<string, any>;
}

// PROJECTS MODULE
export interface Project {
  id: string;
  title: string;
  contactId: string;
  status: "Planning" | "In Progress" | "Review" | "Done";
  health: "On Track" | "At Risk" | "Delayed";
  progress: number; // 0-100
  startDate: string;
  deadline: string;
  ownerId: string;
  description?: string;
  customData?: Record<string, any>;
}

// AUTOMATIONS MODULE
export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  active: boolean;
  runCount: number;
  lastRun?: string;
  config?: {
    subject?: string;
    body?: string;
    title?: string;
    [key: string]: any;
  };
}

// MARKETING CAMPAIGNS MODULE
export interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: "Draft" | "Scheduled" | "Sent";
  segment: string; // e.g. 'All', 'Technology', 'Varejo'
  audienceSize: number;
  sentAt?: string;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
  };
}

// MARKETPLACE MODULE
export interface IntegrationApp {
  id: string;
  name: string;
  description: string;
  category: "Communication" | "Productivity" | "Finance" | "Marketing";
  connected: boolean;
  iconUrl?: string; // Optional icon
}

// DEVELOPER MODULE
export interface Webhook {
  id: string;
  url: string;
  event: "deal.won" | "contact.created" | "all";
  active: boolean;
  lastTriggered?: string;
}

// INBOX MODULE
export interface InboxMessage {
  id: string;
  sender: "contact" | "agent" | "system";
  content: string;
  timestamp: string;
}

export interface InboxThread {
  id: string;
  contactId: string;
  channel: "email" | "whatsapp";
  subject?: string; // Only for email
  lastMessage: string;
  lastMessageAt: string;
  unread: boolean;
  messages: InboxMessage[];
}

// SETTINGS TYPES

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  timestamp: string;
  ipAddress: string;
}

export interface CustomFieldDef {
  id: string;
  label: string;
  type: "Text" | "Number" | "Date" | "Select";
  context:
    | "Contact"
    | "Deal"
    | "Product"
    | "Contract"
    | "Proposal"
    | "Task"
    | "Invoice"
    | "Project";
  required: boolean;
  options?: string[];
}

// HELP CHAT TYPES
export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
}
