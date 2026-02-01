// User & Authentication Types
export type UserRole = 'admin' | 'landlord' | 'tenant';
export type UserStatus = 'active' | 'suspended' | 'pending';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser extends User {
  token: string;
}

// Property Types
export type PropertyStatus = 'active' | 'inactive' | 'maintenance';

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  county: string;
  description: string;
  imageUrls: string[];
  landlordId: string;
  totalUnits: number;
  occupiedUnits: number;
  amenities: string[];
  status: PropertyStatus;
  createdAt: string;
  updatedAt: string;
}

// Unit Types
export type UnitStatus = 'available' | 'occupied' | 'maintenance' | 'reserved';
export type UnitType = 'studio' | 'bedsitter' | '1br' | '2br' | '3br' | '4br+';

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  type: UnitType;
  bedrooms: number;
  bathrooms: number;
  squareMeters: number;
  rentAmount: number;
  depositAmount: number;
  status: UnitStatus;
  floor: number;
  amenities: string[];
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

// Application Types
export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';
export type RecommendationStatus = 'pending' | 'recommended' | 'not_recommended';

export interface Application {
  id: string;
  unitId: string;
  tenantId: string;
  status: ApplicationStatus;
  landlordRecommendation: RecommendationStatus;
  landlordNotes?: string;
  adminNotes?: string;
  employmentStatus: string;
  monthlyIncome: number;
  emergencyContact: string;
  emergencyPhone: string;
  moveInDate: string;
  createdAt: string;
  updatedAt: string;
}

// Lease Types
export type LeaseStatus = 'active' | 'ended' | 'terminated' | 'pending';
export type PaymentFrequency = 'monthly' | 'quarterly' | 'annually';

export interface Lease {
  id: string;
  unitId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount: number;
  paymentFrequency: PaymentFrequency;
  status: LeaseStatus;
  terms?: string;
  createdAt: string;
  updatedAt: string;
}

// Payment Types
export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'partial';
export type PaymentMethod = 'mpesa' | 'bank_transfer' | 'cash' | 'cheque';

export interface Payment {
  id: string;
  leaseId: string;
  tenantId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: PaymentStatus;
  method?: PaymentMethod;
  transactionRef?: string;
  lateFee?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Maintenance Types
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type MaintenanceCategory = 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'pest_control' | 'other';

export interface MaintenanceRequest {
  id: string;
  unitId: string;
  tenantId: string;
  category: MaintenanceCategory;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  assignedTo?: string;
  imageUrls: string[];
  comments: MaintenanceComment[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface MaintenanceComment {
  id: string;
  requestId: string;
  userId: string;
  content: string;
  createdAt: string;
}

// Message Types
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  subject: string;
  content: string;
  read: boolean;
  createdAt: string;
}

// Activity Log
export type ActivityType = 'user_created' | 'application_submitted' | 'application_approved' | 'lease_created' | 'payment_received' | 'maintenance_opened' | 'maintenance_completed';

export interface Activity {
  id: string;
  type: ActivityType;
  userId: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// Dashboard Stats
export interface AdminDashboardStats {
  totalProperties: number;
  totalUnits: number;
  occupancyRate: number;
  totalRevenue: number;
  pendingApplications: number;
  openMaintenanceRequests: number;
  overduePayments: number;
  activeLeases: number;
}

export interface LandlordDashboardStats {
  myProperties: number;
  myUnits: number;
  occupancyRate: number;
  pendingApplications: number;
  openMaintenanceRequests: number;
  activeLeases: number;
}

export interface TenantDashboardStats {
  currentLease?: Lease;
  nextPaymentDue?: Payment;
  openMaintenanceRequests: number;
  unreadMessages: number;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter Types
export interface PropertyFilters {
  city?: string;
  county?: string;
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  status?: UnitStatus;
  search?: string;
}
