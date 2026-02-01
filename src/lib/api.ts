/**
 * API Service Layer
 * 
 * This module provides a standardized interface for all API calls.
 * Currently uses mock data, but structured for easy backend integration.
 * 
 * To connect to your Node.js/Express backend:
 * 1. Update API_BASE_URL to your backend URL
 * 2. Remove mock implementations
 * 3. Uncomment the fetch calls
 */

import type {
  User,
  AuthUser,
  Property,
  Unit,
  Application,
  Lease,
  Payment,
  MaintenanceRequest,
  Message,
  Activity,
  AdminDashboardStats,
  LandlordDashboardStats,
  TenantDashboardStats,
  ApiResponse,
  PaginatedResponse,
  PropertyFilters,
} from '@/types';

import {
  mockUsers,
  mockProperties,
  mockUnits,
  mockApplications,
  mockLeases,
  mockPayments,
  mockMaintenanceRequests,
  mockMessages,
  mockActivities,
} from './mock-data';

// Configuration
const API_BASE_URL = '/api'; // Change to your backend URL
const SIMULATED_DELAY = 300; // Simulate network latency

// Helper to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Get auth token from storage
const getAuthToken = (): string | null => {
  const user = localStorage.getItem('auth_user');
  if (user) {
    const parsed = JSON.parse(user) as AuthUser;
    return parsed.token;
  }
  return null;
};

// Generic fetch wrapper (for future backend integration)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const apiFetch = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
};

// ==================== AUTH API ====================

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<AuthUser>> => {
    await delay(SIMULATED_DELAY);
    
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      return { success: false, message: 'Invalid email or password', data: null as unknown as AuthUser };
    }
    
    // In real app, validate password hash
    if (password.length < 6) {
      return { success: false, message: 'Invalid email or password', data: null as unknown as AuthUser };
    }

    const authUser: AuthUser = {
      ...user,
      token: `mock_jwt_token_${user.id}_${Date.now()}`,
    };

    return { success: true, data: authUser };
  },

  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }): Promise<ApiResponse<AuthUser>> => {
    await delay(SIMULATED_DELAY);

    const exists = mockUsers.find(u => u.email === data.email);
    if (exists) {
      return { success: false, message: 'Email already registered', data: null as unknown as AuthUser };
    }

    const newUser: AuthUser = {
      id: `tenant-${Date.now()}`,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: 'tenant',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      token: `mock_jwt_token_new_${Date.now()}`,
    };

    return { success: true, data: newUser };
  },

  logout: async (): Promise<void> => {
    await delay(100);
    localStorage.removeItem('auth_user');
  },

  resetPassword: async (email: string): Promise<ApiResponse<null>> => {
    await delay(SIMULATED_DELAY);
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      // Don't reveal if email exists
      return { success: true, message: 'If the email exists, a reset link has been sent', data: null };
    }
    return { success: true, message: 'Password reset link sent to your email', data: null };
  },
};

// ==================== USERS API ====================

export const usersApi = {
  getAll: async (): Promise<ApiResponse<User[]>> => {
    await delay(SIMULATED_DELAY);
    return { success: true, data: mockUsers };
  },

  getById: async (id: string): Promise<ApiResponse<User | null>> => {
    await delay(SIMULATED_DELAY);
    const user = mockUsers.find(u => u.id === id);
    return { success: true, data: user || null };
  },

  update: async (id: string, data: Partial<User>): Promise<ApiResponse<User>> => {
    await delay(SIMULATED_DELAY);
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) {
      return { success: false, message: 'User not found', data: null as unknown as User };
    }
    const updated = { ...mockUsers[index], ...data, updatedAt: new Date().toISOString() };
    return { success: true, data: updated };
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    await delay(SIMULATED_DELAY);
    return { success: true, data: null };
  },
};

// ==================== PROPERTIES API ====================

export const propertiesApi = {
  getAll: async (filters?: PropertyFilters): Promise<PaginatedResponse<Property>> => {
    await delay(SIMULATED_DELAY);
    let filtered = [...mockProperties];
    
    if (filters?.city) {
      filtered = filtered.filter(p => p.city === filters.city);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.address.toLowerCase().includes(search)
      );
    }
    
    return {
      data: filtered,
      total: filtered.length,
      page: 1,
      pageSize: 10,
      totalPages: Math.ceil(filtered.length / 10),
    };
  },

  getById: async (id: string): Promise<ApiResponse<Property | null>> => {
    await delay(SIMULATED_DELAY);
    const property = mockProperties.find(p => p.id === id);
    return { success: true, data: property || null };
  },

  getByLandlord: async (landlordId: string): Promise<ApiResponse<Property[]>> => {
    await delay(SIMULATED_DELAY);
    const properties = mockProperties.filter(p => p.landlordId === landlordId);
    return { success: true, data: properties };
  },

  create: async (data: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Property>> => {
    await delay(SIMULATED_DELAY);
    const newProperty: Property = {
      ...data,
      id: `prop-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: newProperty };
  },

  update: async (id: string, data: Partial<Property>): Promise<ApiResponse<Property>> => {
    await delay(SIMULATED_DELAY);
    const property = mockProperties.find(p => p.id === id);
    if (!property) {
      return { success: false, message: 'Property not found', data: null as unknown as Property };
    }
    const updated = { ...property, ...data, updatedAt: new Date().toISOString() };
    return { success: true, data: updated };
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    await delay(SIMULATED_DELAY);
    return { success: true, data: null };
  },
};

// ==================== UNITS API ====================

export const unitsApi = {
  getByProperty: async (propertyId: string): Promise<ApiResponse<Unit[]>> => {
    await delay(SIMULATED_DELAY);
    const units = mockUnits.filter(u => u.propertyId === propertyId);
    return { success: true, data: units };
  },

  getById: async (id: string): Promise<ApiResponse<Unit | null>> => {
    await delay(SIMULATED_DELAY);
    const unit = mockUnits.find(u => u.id === id);
    return { success: true, data: unit || null };
  },

  getAvailable: async (filters?: PropertyFilters): Promise<PaginatedResponse<Unit & { property: Property }>> => {
    await delay(SIMULATED_DELAY);
    let available = mockUnits.filter(u => u.status === 'available');
    
    if (filters?.minRent) {
      available = available.filter(u => u.rentAmount >= filters.minRent!);
    }
    if (filters?.maxRent) {
      available = available.filter(u => u.rentAmount <= filters.maxRent!);
    }
    if (filters?.bedrooms !== undefined) {
      available = available.filter(u => u.bedrooms === filters.bedrooms);
    }

    const withProperty = available.map(unit => ({
      ...unit,
      property: mockProperties.find(p => p.id === unit.propertyId)!,
    }));

    return {
      data: withProperty,
      total: withProperty.length,
      page: 1,
      pageSize: 10,
      totalPages: Math.ceil(withProperty.length / 10),
    };
  },

  create: async (data: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Unit>> => {
    await delay(SIMULATED_DELAY);
    const newUnit: Unit = {
      ...data,
      id: `unit-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: newUnit };
  },

  update: async (id: string, data: Partial<Unit>): Promise<ApiResponse<Unit>> => {
    await delay(SIMULATED_DELAY);
    const unit = mockUnits.find(u => u.id === id);
    if (!unit) {
      return { success: false, message: 'Unit not found', data: null as unknown as Unit };
    }
    const updated = { ...unit, ...data, updatedAt: new Date().toISOString() };
    return { success: true, data: updated };
  },
};

// ==================== APPLICATIONS API ====================

export const applicationsApi = {
  getAll: async (): Promise<ApiResponse<Application[]>> => {
    await delay(SIMULATED_DELAY);
    return { success: true, data: mockApplications };
  },

  getByTenant: async (tenantId: string): Promise<ApiResponse<Application[]>> => {
    await delay(SIMULATED_DELAY);
    const apps = mockApplications.filter(a => a.tenantId === tenantId);
    return { success: true, data: apps };
  },

  getByUnit: async (unitId: string): Promise<ApiResponse<Application[]>> => {
    await delay(SIMULATED_DELAY);
    const apps = mockApplications.filter(a => a.unitId === unitId);
    return { success: true, data: apps };
  },

  create: async (data: Omit<Application, 'id' | 'status' | 'landlordRecommendation' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Application>> => {
    await delay(SIMULATED_DELAY);
    const newApp: Application = {
      ...data,
      id: `app-${Date.now()}`,
      status: 'pending',
      landlordRecommendation: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: newApp };
  },

  updateStatus: async (id: string, status: Application['status'], notes?: string): Promise<ApiResponse<Application>> => {
    await delay(SIMULATED_DELAY);
    const app = mockApplications.find(a => a.id === id);
    if (!app) {
      return { success: false, message: 'Application not found', data: null as unknown as Application };
    }
    const updated = { ...app, status, adminNotes: notes, updatedAt: new Date().toISOString() };
    return { success: true, data: updated };
  },

  updateRecommendation: async (id: string, recommendation: Application['landlordRecommendation'], notes?: string): Promise<ApiResponse<Application>> => {
    await delay(SIMULATED_DELAY);
    const app = mockApplications.find(a => a.id === id);
    if (!app) {
      return { success: false, message: 'Application not found', data: null as unknown as Application };
    }
    const updated = { ...app, landlordRecommendation: recommendation, landlordNotes: notes, updatedAt: new Date().toISOString() };
    return { success: true, data: updated };
  },
};

// ==================== LEASES API ====================

export const leasesApi = {
  getAll: async (): Promise<ApiResponse<Lease[]>> => {
    await delay(SIMULATED_DELAY);
    return { success: true, data: mockLeases };
  },

  getByTenant: async (tenantId: string): Promise<ApiResponse<Lease[]>> => {
    await delay(SIMULATED_DELAY);
    const leases = mockLeases.filter(l => l.tenantId === tenantId);
    return { success: true, data: leases };
  },

  getById: async (id: string): Promise<ApiResponse<Lease | null>> => {
    await delay(SIMULATED_DELAY);
    const lease = mockLeases.find(l => l.id === id);
    return { success: true, data: lease || null };
  },

  create: async (data: Omit<Lease, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Lease>> => {
    await delay(SIMULATED_DELAY);
    const newLease: Lease = {
      ...data,
      id: `lease-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: newLease };
  },

  update: async (id: string, data: Partial<Lease>): Promise<ApiResponse<Lease>> => {
    await delay(SIMULATED_DELAY);
    const lease = mockLeases.find(l => l.id === id);
    if (!lease) {
      return { success: false, message: 'Lease not found', data: null as unknown as Lease };
    }
    const updated = { ...lease, ...data, updatedAt: new Date().toISOString() };
    return { success: true, data: updated };
  },
};

// ==================== PAYMENTS API ====================

export const paymentsApi = {
  getAll: async (): Promise<ApiResponse<Payment[]>> => {
    await delay(SIMULATED_DELAY);
    return { success: true, data: mockPayments };
  },

  getByTenant: async (tenantId: string): Promise<ApiResponse<Payment[]>> => {
    await delay(SIMULATED_DELAY);
    const payments = mockPayments.filter(p => p.tenantId === tenantId);
    return { success: true, data: payments };
  },

  getByLease: async (leaseId: string): Promise<ApiResponse<Payment[]>> => {
    await delay(SIMULATED_DELAY);
    const payments = mockPayments.filter(p => p.leaseId === leaseId);
    return { success: true, data: payments };
  },

  create: async (data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Payment>> => {
    await delay(SIMULATED_DELAY);
    const newPayment: Payment = {
      ...data,
      id: `pay-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: newPayment };
  },

  recordPayment: async (id: string, data: { method: Payment['method']; transactionRef?: string }): Promise<ApiResponse<Payment>> => {
    await delay(SIMULATED_DELAY);
    const payment = mockPayments.find(p => p.id === id);
    if (!payment) {
      return { success: false, message: 'Payment not found', data: null as unknown as Payment };
    }
    const updated = {
      ...payment,
      status: 'paid' as const,
      paidDate: new Date().toISOString().split('T')[0],
      method: data.method,
      transactionRef: data.transactionRef,
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: updated };
  },
};

// ==================== MAINTENANCE API ====================

export const maintenanceApi = {
  getAll: async (): Promise<ApiResponse<MaintenanceRequest[]>> => {
    await delay(SIMULATED_DELAY);
    return { success: true, data: mockMaintenanceRequests };
  },

  getByTenant: async (tenantId: string): Promise<ApiResponse<MaintenanceRequest[]>> => {
    await delay(SIMULATED_DELAY);
    const requests = mockMaintenanceRequests.filter(m => m.tenantId === tenantId);
    return { success: true, data: requests };
  },

  getByUnit: async (unitId: string): Promise<ApiResponse<MaintenanceRequest[]>> => {
    await delay(SIMULATED_DELAY);
    const requests = mockMaintenanceRequests.filter(m => m.unitId === unitId);
    return { success: true, data: requests };
  },

  create: async (data: Omit<MaintenanceRequest, 'id' | 'status' | 'comments' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<MaintenanceRequest>> => {
    await delay(SIMULATED_DELAY);
    const newRequest: MaintenanceRequest = {
      ...data,
      id: `maint-${Date.now()}`,
      status: 'open',
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: newRequest };
  },

  updateStatus: async (id: string, status: MaintenanceRequest['status']): Promise<ApiResponse<MaintenanceRequest>> => {
    await delay(SIMULATED_DELAY);
    const request = mockMaintenanceRequests.find(m => m.id === id);
    if (!request) {
      return { success: false, message: 'Request not found', data: null as unknown as MaintenanceRequest };
    }
    const updated = {
      ...request,
      status,
      updatedAt: new Date().toISOString(),
      ...(status === 'completed' && { completedAt: new Date().toISOString() }),
    };
    return { success: true, data: updated };
  },

  addComment: async (id: string, content: string, userId: string): Promise<ApiResponse<MaintenanceRequest>> => {
    await delay(SIMULATED_DELAY);
    const request = mockMaintenanceRequests.find(m => m.id === id);
    if (!request) {
      return { success: false, message: 'Request not found', data: null as unknown as MaintenanceRequest };
    }
    const newComment = {
      id: `comm-${Date.now()}`,
      requestId: id,
      userId,
      content,
      createdAt: new Date().toISOString(),
    };
    const updated = {
      ...request,
      comments: [...request.comments, newComment],
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: updated };
  },
};

// ==================== MESSAGES API ====================

export const messagesApi = {
  getByUser: async (userId: string): Promise<ApiResponse<Message[]>> => {
    await delay(SIMULATED_DELAY);
    const messages = mockMessages.filter(m => m.senderId === userId || m.receiverId === userId);
    return { success: true, data: messages };
  },

  send: async (data: Omit<Message, 'id' | 'read' | 'createdAt'>): Promise<ApiResponse<Message>> => {
    await delay(SIMULATED_DELAY);
    const newMessage: Message = {
      ...data,
      id: `msg-${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    return { success: true, data: newMessage };
  },

  markAsRead: async (id: string): Promise<ApiResponse<Message>> => {
    await delay(SIMULATED_DELAY);
    const message = mockMessages.find(m => m.id === id);
    if (!message) {
      return { success: false, message: 'Message not found', data: null as unknown as Message };
    }
    const updated = { ...message, read: true };
    return { success: true, data: updated };
  },
};

// ==================== DASHBOARD API ====================

export const dashboardApi = {
  getAdminStats: async (): Promise<ApiResponse<AdminDashboardStats>> => {
    await delay(SIMULATED_DELAY);
    const stats: AdminDashboardStats = {
      totalProperties: mockProperties.length,
      totalUnits: mockUnits.length,
      occupancyRate: (mockUnits.filter(u => u.status === 'occupied').length / mockUnits.length) * 100,
      totalRevenue: mockPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
      pendingApplications: mockApplications.filter(a => a.status === 'pending').length,
      openMaintenanceRequests: mockMaintenanceRequests.filter(m => m.status === 'open' || m.status === 'in_progress').length,
      overduePayments: mockPayments.filter(p => p.status === 'overdue').length,
      activeLeases: mockLeases.filter(l => l.status === 'active').length,
    };
    return { success: true, data: stats };
  },

  getLandlordStats: async (landlordId: string): Promise<ApiResponse<LandlordDashboardStats>> => {
    await delay(SIMULATED_DELAY);
    const myProperties = mockProperties.filter(p => p.landlordId === landlordId);
    const myPropertyIds = myProperties.map(p => p.id);
    const myUnits = mockUnits.filter(u => myPropertyIds.includes(u.propertyId));
    const myUnitIds = myUnits.map(u => u.id);
    
    const stats: LandlordDashboardStats = {
      myProperties: myProperties.length,
      myUnits: myUnits.length,
      occupancyRate: myUnits.length > 0 
        ? (myUnits.filter(u => u.status === 'occupied').length / myUnits.length) * 100 
        : 0,
      pendingApplications: mockApplications.filter(a => myUnitIds.includes(a.unitId) && a.status === 'pending').length,
      openMaintenanceRequests: mockMaintenanceRequests.filter(m => myUnitIds.includes(m.unitId) && (m.status === 'open' || m.status === 'in_progress')).length,
      activeLeases: mockLeases.filter(l => myUnitIds.includes(l.unitId) && l.status === 'active').length,
    };
    return { success: true, data: stats };
  },

  getTenantStats: async (tenantId: string): Promise<ApiResponse<TenantDashboardStats>> => {
    await delay(SIMULATED_DELAY);
    const myLeases = mockLeases.filter(l => l.tenantId === tenantId);
    const activeLease = myLeases.find(l => l.status === 'active');
    const myPayments = mockPayments.filter(p => p.tenantId === tenantId);
    const nextPayment = myPayments.find(p => p.status === 'pending');
    
    const stats: TenantDashboardStats = {
      currentLease: activeLease,
      nextPaymentDue: nextPayment,
      openMaintenanceRequests: mockMaintenanceRequests.filter(m => m.tenantId === tenantId && (m.status === 'open' || m.status === 'in_progress')).length,
      unreadMessages: mockMessages.filter(m => m.receiverId === tenantId && !m.read).length,
    };
    return { success: true, data: stats };
  },

  getActivities: async (limit?: number): Promise<ApiResponse<Activity[]>> => {
    await delay(SIMULATED_DELAY);
    const sorted = [...mockActivities].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return { success: true, data: limit ? sorted.slice(0, limit) : sorted };
  },
};
