export type Role = 'USER' | 'ADMIN';

export type Category = string;

export interface CategoryItem {
  id: string;
  slug: string;        // e.g. "ELECTRONICS", "ROBOTICS", "PROGRAMMING", "PROJECTS", "ESPORTS", etc.
  name: string;        // e.g. "Electronics", "Robotics", "Programming", "Projects", "Esports"
  description?: string;
  icon?: string;       // Material symbol, e.g. "memory", "smart_toy", "terminal", "devices", "sports_esports"
  orderNum?: number;
  createdAt?: string;
}

export type Format = 'SOLO' | 'TEAM' | 'BOTH';

export type RegStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type ParticipationModel = 'SOLO' | 'TEAM';

export type RegistrationPhase = 'NOT_STARTED' | 'OPEN' | 'CLOSED';

export interface EventSettings {
  registrationPhase: RegistrationPhase;
  eventDate: string;           // ISO date string for the event day(s)
  registrationStartDate: string; // ISO date string
  registrationEndDate: string;   // ISO date string
  competitionDates: string;      // Free text like "15–16 April 2026"
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  university?: string;
  studentId?: string;
  department?: string;
  phoneNumber?: string;
  createdAt: string;
}

export interface Competition {
  id: string;
  slug: string;
  orderNum: number;
  title: string;
  category: Category;
  description: string;
  format: Format;
  minMembers: number;
  maxMembers: number;
  soloFee: number;
  teamFee: number;
  keyDeliverables?: string;
  specsSummary?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamMember {
  id: string;
  registrationId: string;
  memberIndex: number;
  name: string;
  studentId: string;
  email?: string;
}

export interface Registration {
  id: string;
  registrationId: string; // e.g. SPEC26-NED-88421
  userId: string;
  competitionId: string;
  competitionTitle?: string;
  competitionCategory?: Category;
  participationModel: ParticipationModel;
  teamName?: string;
  fullName: string;
  studentId: string;
  universityName: string;
  department: string;
  academicYear: string;
  phoneNumber: string;
  emailAddress: string;
  paymentChannel: string;
  transactionId: string;
  receiptUrl: string; // Base64 data URL or Supabase storage URL
  receiptFileName?: string;
  status: RegStatus;
  calculatedFee: number;
  notes?: string;
  createdAt: string;
  teamMembers: TeamMember[];
}

export interface ContactMessage {
  id: string;
  fullName: string;
  emailAddress: string;
  subjectCategory: string;
  messageBody: string;
  createdAt: string;
  status: 'NEW' | 'RESOLVED';
}
