/**
 * API Service Layer
 * 
 * This module provides a standardized interface for all API calls.
 * Uses localStorage for persistence to enable a functional prototype without a backend.
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
const SIMULATED_DELAY = 500; // Simulate network latency

// Helper to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ==================== LOCAL STORAGE HELPERS ====================

const STORAGE_KEYS = {
  USERS: 'rentease_users',
  PROPERTIES: 'rentease_properties',
  UNITS: 'rentease_units',
  APPLICATIONS: 'rentease_applications',
  LEASES: 'rentease_leases',
  PAYMENTS: 'rentease_payments',
  MAINTENANCE: 'rentease_maintenance',
  MESSAGES: 'rentease_messages',
  ACTIVITIES: 'rentease_activities',
  AUTH_USER: 'rentease_auth_user',
};

// Initialize Storage with Mock Data if empty
const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mockUsers));
    localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(mockProperties));
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(mockUnits));
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(mockApplications));
    localStorage.setItem(STORAGE_KEYS.LEASES, JSON.stringify(mockLeases));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(mockPayments));
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(mockMaintenanceRequests));
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(mockMessages));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(mockActivities));
    console.log('LocalStorage initialized with mock data');
  }
};

// Run initialization immediately
if (typeof window !== 'undefined') {
  initializeStorage();
}

// Generic Storage Get
const getFromStorage = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

// Generic Storage Set
const saveToStorage = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Get auth token from storage
const getAuthToken = (): string | null => {
  const user = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
  if (user) {
    const parsed = JSON.parse(user) as AuthUser;
    return parsed.token;
  }
  return null;
};

// ==================== AUTH API ====================

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<AuthUser>> => {
    await delay(SIMULATED_DELAY);

    // Ensure storage is ready
    initializeStorage();

    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return { success: false, message: 'Invalid email or password', data: null as unknown as AuthUser };
    }

    // In prototype, simple password check (simulated)
    if (password.length < 6) {
      return { success: false, message: 'Invalid email or password', data: null as unknown as AuthUser };
    }

    // Check if user is active
    if (user.status !== 'active') {
      return { success: false, message: 'Account is not active. Please contact admin.', data: null as unknown as AuthUser };
    }

    const authUser: AuthUser = {
      ...user,
      token: `mock_jwt_token_${user.id}_${Date.now()}`,
    };

    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(authUser));
    return { success: true, data: authUser };
  },

  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    role?: 'tenant' | 'landlord'; // Allow registering as landlord for prototype
  }): Promise<ApiResponse<AuthUser>> => {
    await delay(SIMULATED_DELAY);

    initializeStorage();
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);

    const exists = users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (exists) {
      return { success: false, message: 'Email already registered', data: null as unknown as AuthUser };
    }

    const role = data.role || 'tenant';
    const newUser: User = {
      id: `${role}-${Date.now()}`,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: role,
      status: 'active', // Auto-activate for prototype
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to users list
    users.push(newUser);
    saveToStorage(STORAGE_KEYS.USERS, users);

    // No auto login - just return user data without token
    // The auth context will handle redirection to login

    // Log Activity
    const activities = getFromStorage<Activity>(STORAGE_KEYS.ACTIVITIES);
    activities.unshift({
      id: `act-${Date.now()}`,
      type: 'user_created',
      userId: newUser.id,
      description: `New ${role} registered: ${newUser.firstName} ${newUser.lastName}`,
      createdAt: new Date().toISOString(),
    });
    saveToStorage(STORAGE_KEYS.ACTIVITIES, activities);

    // Return user but without a meaningful token since they aren't logged in yet
    // The frontend will ignore the token anyway
    const authUser: AuthUser = {
      ...newUser,
      token: '',
    };

    return { success: true, data: authUser };
  },

  logout: async (): Promise<void> => {
    await delay(100);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  },

  resetPassword: async (email: string): Promise<ApiResponse<null>> => {
    await delay(SIMULATED_DELAY);
    return { success: true, message: 'If the email exists, a reset link has been sent', data: null };
  },
};

// ==================== USERS API ====================

export const usersApi = {
  getAll: async (): Promise<ApiResponse<User[]>> => {
    await delay(SIMULATED_DELAY);
    return { success: true, data: getFromStorage<User>(STORAGE_KEYS.USERS) };
  },

  getById: async (id: string): Promise<ApiResponse<User | null>> => {
    await delay(SIMULATED_DELAY);
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    const user = users.find(u => u.id === id);
    return { success: true, data: user || null };
  },

  create: async (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<User>> => {
    await delay(SIMULATED_DELAY);
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);

    const newUser: User = {
      ...data,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.unshift(newUser); // Add to top
    saveToStorage(STORAGE_KEYS.USERS, users);

    return { success: true, data: newUser };
  },

  update: async (id: string, data: Partial<User>): Promise<ApiResponse<User>> => {
    await delay(SIMULATED_DELAY);
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    const index = users.findIndex(u => u.id === id);

    if (index === -1) {
      return { success: false, message: 'User not found', data: null as unknown as User };
    }

    const updated = { ...users[index], ...data, updatedAt: new Date().toISOString() };
    users[index] = updated;
    saveToStorage(STORAGE_KEYS.USERS, users);

    // If updating current user, update session too
    const currentUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (currentUser) {
      const parsed = JSON.parse(currentUser) as AuthUser;
      if (parsed.id === id) {
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify({ ...parsed, ...updated }));
      }
    }

    return { success: true, data: updated };
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    await delay(SIMULATED_DELAY);
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    const filtered = users.filter(u => u.id !== id);
    saveToStorage(STORAGE_KEYS.USERS, filtered);
    return { success: true, data: null };
  },
};


// ==================== PROPERTIES API ====================

export const propertiesApi = {
  getAll: async (filters?: PropertyFilters): Promise<PaginatedResponse<Property>> => {
    await delay(SIMULATED_DELAY);
    let filtered = getFromStorage<Property>(STORAGE_KEYS.PROPERTIES);

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
      pageSize: 50, // Simplified pagination for prototype
      totalPages: 1,
    };
  },

  getById: async (id: string): Promise<ApiResponse<Property | null>> => {
    await delay(SIMULATED_DELAY);
    const properties = getFromStorage<Property>(STORAGE_KEYS.PROPERTIES);
    const property = properties.find(p => p.id === id);
    return { success: true, data: property || null };
  },

  getByLandlord: async (landlordId: string): Promise<ApiResponse<Property[]>> => {
    await delay(SIMULATED_DELAY);
    const properties = getFromStorage<Property>(STORAGE_KEYS.PROPERTIES);
    const filtered = properties.filter(p => p.landlordId === landlordId);
    return { success: true, data: filtered };
  },

  create: async (data: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Property>> => {
    await delay(SIMULATED_DELAY);
    const properties = getFromStorage<Property>(STORAGE_KEYS.PROPERTIES);

    const newProperty: Property = {
      ...data,
      id: `prop-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    properties.unshift(newProperty);
    saveToStorage(STORAGE_KEYS.PROPERTIES, properties);
    return { success: true, data: newProperty };
  },

  update: async (id: string, data: Partial<Property>): Promise<ApiResponse<Property>> => {
    await delay(SIMULATED_DELAY);
    const properties = getFromStorage<Property>(STORAGE_KEYS.PROPERTIES);
    const index = properties.findIndex(p => p.id === id);

    if (index === -1) {
      return { success: false, message: 'Property not found', data: null as unknown as Property };
    }

    const updated = { ...properties[index], ...data, updatedAt: new Date().toISOString() };
    properties[index] = updated;
    saveToStorage(STORAGE_KEYS.PROPERTIES, properties);

    return { success: true, data: updated };
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    await delay(SIMULATED_DELAY);
    const properties = getFromStorage<Property>(STORAGE_KEYS.PROPERTIES);
    const filtered = properties.filter(p => p.id !== id);
    saveToStorage(STORAGE_KEYS.PROPERTIES, filtered);

    // Also cleanup units related to property? (Optional for prototype)
    return { success: true, data: null };
  },
};

// ==================== UNITS API ====================

export const unitsApi = {
  getByProperty: async (propertyId: string): Promise<ApiResponse<Unit[]>> => {
    await delay(SIMULATED_DELAY);
    const units = getFromStorage<Unit>(STORAGE_KEYS.UNITS);
    const filtered = units.filter(u => u.propertyId === propertyId);
    return { success: true, data: filtered };
  },

  getById: async (id: string): Promise<ApiResponse<Unit | null>> => {
    await delay(SIMULATED_DELAY);
    const units = getFromStorage<Unit>(STORAGE_KEYS.UNITS);
    const unit = units.find(u => u.id === id);
    return { success: true, data: unit || null };
  },

  getAvailable: async (filters?: PropertyFilters): Promise<PaginatedResponse<Unit & { property: Property }>> => {
    await delay(SIMULATED_DELAY);
    const units = getFromStorage<Unit>(STORAGE_KEYS.UNITS);
    const properties = getFromStorage<Property>(STORAGE_KEYS.PROPERTIES);

    let available = units.filter(u => u.status === 'available');

    // Filter logic
    if (filters?.minRent) {
      available = available.filter(u => u.rentAmount >= filters.minRent!);
    }
    if (filters?.maxRent) {
      available = available.filter(u => u.rentAmount <= filters.maxRent!);
    }
    if (filters?.bedrooms !== undefined) {
      available = available.filter(u => u.bedrooms === filters.bedrooms);
    }
    // Filter by city (requires property lookup)
    if (filters?.city) {
      available = available.filter(u => {
        const prop = properties.find(p => p.id === u.propertyId);
        return prop && prop.city === filters.city;
      });
    }

    const withProperty = available.map(unit => ({
      ...unit,
      property: properties.find(p => p.id === unit.propertyId)!,
    })).filter(u => u.property); // Ensure property exists

    return {
      data: withProperty,
      total: withProperty.length,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    };
  },

  create: async (data: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Unit>> => {
    await delay(SIMULATED_DELAY);
    const units = getFromStorage<Unit>(STORAGE_KEYS.UNITS);

    const newUnit: Unit = {
      ...data,
      id: `unit-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    units.push(newUnit);
    saveToStorage(STORAGE_KEYS.UNITS, units);
    return { success: true, data: newUnit };
  },

  update: async (id: string, data: Partial<Unit>): Promise<ApiResponse<Unit>> => {
    await delay(SIMULATED_DELAY);
    const units = getFromStorage<Unit>(STORAGE_KEYS.UNITS);
    const index = units.findIndex(u => u.id === id);

    if (index === -1) {
      return { success: false, message: 'Unit not found', data: null as unknown as Unit };
    }

    const updated = { ...units[index], ...data, updatedAt: new Date().toISOString() };
    units[index] = updated;
    saveToStorage(STORAGE_KEYS.UNITS, units);

    return { success: true, data: updated };
  },
};

// ==================== APPLICATIONS API ====================

export const applicationsApi = {
  getAll: async (): Promise<ApiResponse<Application[]>> => {
    await delay(SIMULATED_DELAY);
    return { success: true, data: getFromStorage<Application>(STORAGE_KEYS.APPLICATIONS) };
  },

  getByTenant: async (tenantId: string): Promise<ApiResponse<Application[]>> => {
    await delay(SIMULATED_DELAY);
    const apps = getFromStorage<Application>(STORAGE_KEYS.APPLICATIONS);
    const filtered = apps.filter(a => a.tenantId === tenantId);
    return { success: true, data: filtered };
  },

  getByUnit: async (unitId: string): Promise<ApiResponse<Application[]>> => {
    await delay(SIMULATED_DELAY);
    const apps = getFromStorage<Application>(STORAGE_KEYS.APPLICATIONS);
    const filtered = apps.filter(a => a.unitId === unitId);
    return { success: true, data: filtered };
  },

  create: async (data: Omit<Application, 'id' | 'status' | 'landlordRecommendation' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Application>> => {
    await delay(SIMULATED_DELAY);
    const apps = getFromStorage<Application>(STORAGE_KEYS.APPLICATIONS);

    const newApp: Application = {
      ...data,
      id: `app-${Date.now()}`,
      status: 'pending',
      landlordRecommendation: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    apps.unshift(newApp);
    saveToStorage(STORAGE_KEYS.APPLICATIONS, apps);

    // Log Activity
    const activities = getFromStorage<Activity>(STORAGE_KEYS.ACTIVITIES);
    activities.unshift({
      id: `act-${Date.now()}`,
      type: 'application_submitted',
      userId: data.tenantId,
      description: `New application submitted`,
      createdAt: new Date().toISOString(),
    });
    saveToStorage(STORAGE_KEYS.ACTIVITIES, activities);

    return { success: true, data: newApp };
  },

  updateStatus: async (id: string, status: Application['status'], notes?: string): Promise<ApiResponse<Application>> => {
    await delay(SIMULATED_DELAY);
    const apps = getFromStorage<Application>(STORAGE_KEYS.APPLICATIONS);
    const index = apps.findIndex(a => a.id === id);

    if (index === -1) {
      return { success: false, message: 'Application not found', data: null as unknown as Application };
    }

    const updated = { ...apps[index], status, adminNotes: notes, updatedAt: new Date().toISOString() };
    apps[index] = updated;
    saveToStorage(STORAGE_KEYS.APPLICATIONS, apps);

    // If approved, verify logs
    if (status === 'approved') {
      const activities = getFromStorage<Activity>(STORAGE_KEYS.ACTIVITIES);
      activities.unshift({
        id: `act-appr-${Date.now()}`,
        type: 'application_approved',
        userId: 'admin',
        description: `Application ${id} approved`,
        createdAt: new Date().toISOString(),
      });
      saveToStorage(STORAGE_KEYS.ACTIVITIES, activities);
    }

    return { success: true, data: updated };
  },

  updateRecommendation: async (id: string, recommendation: Application['landlordRecommendation'], notes?: string): Promise<ApiResponse<Application>> => {
    await delay(SIMULATED_DELAY);
    const apps = getFromStorage<Application>(STORAGE_KEYS.APPLICATIONS);
    const index = apps.findIndex(a => a.id === id);

    if (index === -1) {
      return { success: false, message: 'Application not found', data: null as unknown as Application };
    }

    const updated = {
      ...apps[index],
      landlordRecommendation: recommendation,
      landlordNotes: notes,
      updatedAt: new Date().toISOString()
    };
    apps[index] = updated;
    saveToStorage(STORAGE_KEYS.APPLICATIONS, apps);
    return { success: true, data: updated };
  },
};

// ==================== LEASES API ====================

export const leasesApi = {
  getAll: async (): Promise<ApiResponse<Lease[]>> => {
    await delay(SIMULATED_DELAY);
    return { success: true, data: getFromStorage<Lease>(STORAGE_KEYS.LEASES) };
  },

  getByTenant: async (tenantId: string): Promise<ApiResponse<Lease[]>> => {
    await delay(SIMULATED_DELAY);
    const leases = getFromStorage<Lease>(STORAGE_KEYS.LEASES);
    const filtered = leases.filter(l => l.tenantId === tenantId);
    return { success: true, data: filtered };
  },

  getById: async (id: string): Promise<ApiResponse<Lease | null>> => {
    await delay(SIMULATED_DELAY);
    const leases = getFromStorage<Lease>(STORAGE_KEYS.LEASES);
    const lease = leases.find(l => l.id === id);
    return { success: true, data: lease || null };
  },

  create: async (data: Omit<Lease, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Lease>> => {
    await delay(SIMULATED_DELAY);
    const leases = getFromStorage<Lease>(STORAGE_KEYS.LEASES);

    const newLease: Lease = {
      ...data,
      id: `lease-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    leases.unshift(newLease);
    saveToStorage(STORAGE_KEYS.LEASES, leases);

    // Also update unit status to occupied
    const units = getFromStorage<Unit>(STORAGE_KEYS.UNITS);
    const unitIndex = units.findIndex(u => u.id === data.unitId);
    if (unitIndex !== -1) {
      units[unitIndex] = { ...units[unitIndex], status: 'occupied', updatedAt: new Date().toISOString() };
      saveToStorage(STORAGE_KEYS.UNITS, units);
    }

    // Log
    const activities = getFromStorage<Activity>(STORAGE_KEYS.ACTIVITIES);
    activities.unshift({
      id: `act-lease-${Date.now()}`,
      type: 'lease_created',
      userId: 'admin',
      description: `New lease created for Unit`,
      createdAt: new Date().toISOString(),
    });
    saveToStorage(STORAGE_KEYS.ACTIVITIES, activities);

    return { success: true, data: newLease };
  },

  update: async (id: string, data: Partial<Lease>): Promise<ApiResponse<Lease>> => {
    await delay(SIMULATED_DELAY);
    const leases = getFromStorage<Lease>(STORAGE_KEYS.LEASES);
    const index = leases.findIndex(l => l.id === id);

    if (index === -1) {
      return { success: false, message: 'Lease not found', data: null as unknown as Lease };
    }

    const updated = { ...leases[index], ...data, updatedAt: new Date().toISOString() };
    leases[index] = updated;
    saveToStorage(STORAGE_KEYS.LEASES, leases);
    return { success: true, data: updated };
  },
};

// ==================== PAYMENTS API ====================

export const paymentsApi = {
  getAll: async (): Promise<ApiResponse<Payment[]>> => {
    await delay(SIMULATED_DELAY);
    return { success: true, data: getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS) };
  },

  getByTenant: async (tenantId: string): Promise<ApiResponse<Payment[]>> => {
    await delay(SIMULATED_DELAY);
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
    // Sort by date desc
    const filtered = payments
      .filter(p => p.tenantId === tenantId)
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
    return { success: true, data: filtered };
  },

  getByLease: async (leaseId: string): Promise<ApiResponse<Payment[]>> => {
    await delay(SIMULATED_DELAY);
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
    const filtered = payments.filter(p => p.leaseId === leaseId);
    return { success: true, data: filtered };
  },

  create: async (data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Payment>> => {
    await delay(SIMULATED_DELAY);
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);

    const newPayment: Payment = {
      ...data,
      id: `pay-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    payments.unshift(newPayment);
    saveToStorage(STORAGE_KEYS.PAYMENTS, payments);
    return { success: true, data: newPayment };
  },

  recordPayment: async (id: string, data: { method: Payment['method']; transactionRef?: string }): Promise<ApiResponse<Payment>> => {
    await delay(SIMULATED_DELAY);
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
    const index = payments.findIndex(p => p.id === id);

    if (index === -1) {
      return { success: false, message: 'Payment not found', data: null as unknown as Payment };
    }

    const updated = {
      ...payments[index],
      status: 'paid' as const,
      paidDate: new Date().toISOString().split('T')[0],
      method: data.method,
      transactionRef: data.transactionRef,
      updatedAt: new Date().toISOString(),
    };
    payments[index] = updated;
    saveToStorage(STORAGE_KEYS.PAYMENTS, payments);

    // Log
    const activities = getFromStorage<Activity>(STORAGE_KEYS.ACTIVITIES);
    activities.unshift({
      id: `act-pay-${Date.now()}`,
      type: 'payment_received',
      userId: updated.tenantId,
      description: `Payment received: KES ${updated.amount}`,
      createdAt: new Date().toISOString(),
    });
    saveToStorage(STORAGE_KEYS.ACTIVITIES, activities);

    return { success: true, data: updated };
  },
};

// ==================== MAINTENANCE API ====================

export const maintenanceApi = {
  getAll: async (): Promise<ApiResponse<MaintenanceRequest[]>> => {
    await delay(SIMULATED_DELAY);
    return { success: true, data: getFromStorage<MaintenanceRequest>(STORAGE_KEYS.MAINTENANCE) };
  },

  getByTenant: async (tenantId: string): Promise<ApiResponse<MaintenanceRequest[]>> => {
    await delay(SIMULATED_DELAY);
    const requests = getFromStorage<MaintenanceRequest>(STORAGE_KEYS.MAINTENANCE);
    const filtered = requests.filter(m => m.tenantId === tenantId);
    return { success: true, data: filtered };
  },

  getByUnit: async (unitId: string): Promise<ApiResponse<MaintenanceRequest[]>> => {
    await delay(SIMULATED_DELAY);
    const requests = getFromStorage<MaintenanceRequest>(STORAGE_KEYS.MAINTENANCE);
    const filtered = requests.filter(m => m.unitId === unitId);
    return { success: true, data: filtered };
  },

  create: async (data: Omit<MaintenanceRequest, 'id' | 'status' | 'comments' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<MaintenanceRequest>> => {
    await delay(SIMULATED_DELAY);
    const requests = getFromStorage<MaintenanceRequest>(STORAGE_KEYS.MAINTENANCE);

    const newRequest: MaintenanceRequest = {
      ...data,
      id: `maint-${Date.now()}`,
      status: 'open',
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    requests.unshift(newRequest);
    saveToStorage(STORAGE_KEYS.MAINTENANCE, requests);

    // Log
    const activities = getFromStorage<Activity>(STORAGE_KEYS.ACTIVITIES);
    activities.unshift({
      id: `act-maint-${Date.now()}`,
      type: 'maintenance_opened',
      userId: data.tenantId,
      description: `Maintenance request: ${data.title}`,
      createdAt: new Date().toISOString(),
    });
    saveToStorage(STORAGE_KEYS.ACTIVITIES, activities);

    return { success: true, data: newRequest };
  },

  updateStatus: async (id: string, status: MaintenanceRequest['status']): Promise<ApiResponse<MaintenanceRequest>> => {
    await delay(SIMULATED_DELAY);
    const requests = getFromStorage<MaintenanceRequest>(STORAGE_KEYS.MAINTENANCE);
    const index = requests.findIndex(m => m.id === id);

    if (index === -1) {
      return { success: false, message: 'Request not found', data: null as unknown as MaintenanceRequest };
    }

    // Check if status changed to completed to log activity
    const wasCompleted = requests[index].status !== 'completed' && status === 'completed';

    const updated = {
      ...requests[index],
      status,
      updatedAt: new Date().toISOString(),
      ...(status === 'completed' && { completedAt: new Date().toISOString() }),
    };
    requests[index] = updated;
    saveToStorage(STORAGE_KEYS.MAINTENANCE, requests);

    if (wasCompleted) {
      const activities = getFromStorage<Activity>(STORAGE_KEYS.ACTIVITIES);
      activities.unshift({
        id: `act-maint-comp-${Date.now()}`,
        type: 'maintenance_completed',
        userId: 'admin', // or whoever
        description: `Maintenance completed: ${updated.title}`,
        createdAt: new Date().toISOString(),
      });
      saveToStorage(STORAGE_KEYS.ACTIVITIES, activities);
    }

    return { success: true, data: updated };
  },

  addComment: async (id: string, content: string, userId: string): Promise<ApiResponse<MaintenanceRequest>> => {
    await delay(SIMULATED_DELAY);
    const requests = getFromStorage<MaintenanceRequest>(STORAGE_KEYS.MAINTENANCE);
    const index = requests.findIndex(m => m.id === id);

    if (index === -1) {
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
      ...requests[index],
      comments: [...requests[index].comments, newComment],
      updatedAt: new Date().toISOString(),
    };
    requests[index] = updated;
    saveToStorage(STORAGE_KEYS.MAINTENANCE, requests);

    return { success: true, data: updated };
  },
};

// ==================== MESSAGES API ====================

export const messagesApi = {
  getByUser: async (userId: string): Promise<ApiResponse<Message[]>> => {
    await delay(SIMULATED_DELAY);
    const messages = getFromStorage<Message>(STORAGE_KEYS.MESSAGES);
    const filtered = messages.filter(m => m.senderId === userId || m.receiverId === userId);
    return { success: true, data: filtered };
  },

  send: async (data: Omit<Message, 'id' | 'read' | 'createdAt'>): Promise<ApiResponse<Message>> => {
    await delay(SIMULATED_DELAY);
    const messages = getFromStorage<Message>(STORAGE_KEYS.MESSAGES);

    const newMessage: Message = {
      ...data,
      id: `msg-${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString(),
    };

    messages.unshift(newMessage);
    saveToStorage(STORAGE_KEYS.MESSAGES, messages);
    return { success: true, data: newMessage };
  },

  markAsRead: async (id: string): Promise<ApiResponse<Message>> => {
    await delay(SIMULATED_DELAY);
    const messages = getFromStorage<Message>(STORAGE_KEYS.MESSAGES);
    const index = messages.findIndex(m => m.id === id);

    if (index === -1) {
      return { success: false, message: 'Message not found', data: null as unknown as Message };
    }

    const updated = { ...messages[index], read: true };
    messages[index] = updated;
    saveToStorage(STORAGE_KEYS.MESSAGES, messages);

    return { success: true, data: updated };
  },

  getAll: async (): Promise<ApiResponse<Message[]>> => {
    await delay(SIMULATED_DELAY);
    return { success: true, data: getFromStorage<Message>(STORAGE_KEYS.MESSAGES) };
  },

  create: async (data: Omit<Message, 'id' | 'createdAt'>): Promise<ApiResponse<Message>> => {
    // Alias for send
    return messagesApi.send({ ...data, read: false } as any);
  },

  update: async (id: string, data: Partial<Message>): Promise<ApiResponse<Message>> => {
    await delay(SIMULATED_DELAY);
    const messages = getFromStorage<Message>(STORAGE_KEYS.MESSAGES);
    const index = messages.findIndex(m => m.id === id);

    if (index === -1) {
      return { success: false, message: 'Message not found', data: null as unknown as Message };
    }

    const updated = { ...messages[index], ...data };
    messages[index] = updated;
    saveToStorage(STORAGE_KEYS.MESSAGES, messages);
    return { success: true, data: updated };
  }
};

// ==================== DASHBOARD API ====================

export const dashboardApi = {
  getAdminStats: async (): Promise<ApiResponse<AdminDashboardStats>> => {
    await delay(SIMULATED_DELAY);
    const properties = getFromStorage<Property>(STORAGE_KEYS.PROPERTIES);
    const units = getFromStorage<Unit>(STORAGE_KEYS.UNITS);
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
    const applications = getFromStorage<Application>(STORAGE_KEYS.APPLICATIONS);
    const maintenance = getFromStorage<MaintenanceRequest>(STORAGE_KEYS.MAINTENANCE);
    const leases = getFromStorage<Lease>(STORAGE_KEYS.LEASES);

    const stats: AdminDashboardStats = {
      totalProperties: properties.length,
      totalUnits: units.length,
      occupancyRate: units.length > 0 ? (units.filter(u => u.status === 'occupied').length / units.length) * 100 : 0,
      totalRevenue: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
      pendingApplications: applications.filter(a => a.status === 'pending').length,
      openMaintenanceRequests: maintenance.filter(m => m.status === 'open' || m.status === 'in_progress').length,
      overduePayments: payments.filter(p => p.status === 'overdue').length,
      activeLeases: leases.filter(l => l.status === 'active').length,
    };
    return { success: true, data: stats };
  },

  getLandlordStats: async (landlordId: string): Promise<ApiResponse<LandlordDashboardStats>> => {
    await delay(SIMULATED_DELAY);
    const properties = getFromStorage<Property>(STORAGE_KEYS.PROPERTIES).filter(p => p.landlordId === landlordId);
    const allUnits = getFromStorage<Unit>(STORAGE_KEYS.UNITS);

    // Get units belonging to these properties
    const myPropIds = properties.map(p => p.id);
    const myUnits = allUnits.filter(u => myPropIds.includes(u.propertyId));
    const myUnitIds = myUnits.map(u => u.id);

    const applications = getFromStorage<Application>(STORAGE_KEYS.APPLICATIONS);
    const maintenance = getFromStorage<MaintenanceRequest>(STORAGE_KEYS.MAINTENANCE);
    const leases = getFromStorage<Lease>(STORAGE_KEYS.LEASES);

    const stats: LandlordDashboardStats = {
      myProperties: properties.length,
      myUnits: myUnits.length,
      occupancyRate: myUnits.length > 0
        ? (myUnits.filter(u => u.status === 'occupied').length / myUnits.length) * 100
        : 0,
      pendingApplications: applications.filter(a => myUnitIds.includes(a.unitId) && a.status === 'pending').length,
      openMaintenanceRequests: maintenance.filter(m => myUnitIds.includes(m.unitId) && (m.status === 'open' || m.status === 'in_progress')).length,
      activeLeases: leases.filter(l => myUnitIds.includes(l.unitId) && l.status === 'active').length,
    };
    return { success: true, data: stats };
  },

  getTenantStats: async (tenantId: string): Promise<ApiResponse<TenantDashboardStats>> => {
    await delay(SIMULATED_DELAY);
    const leases = getFromStorage<Lease>(STORAGE_KEYS.LEASES).filter(l => l.tenantId === tenantId);
    const activeLease = leases.find(l => l.status === 'active');

    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS).filter(p => p.tenantId === tenantId);
    // Find next pending payment or earliest overdue
    const nextPayment = payments.filter(p => p.status === 'pending' || p.status === 'overdue')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

    const maintenance = getFromStorage<MaintenanceRequest>(STORAGE_KEYS.MAINTENANCE);
    const messages = getFromStorage<Message>(STORAGE_KEYS.MESSAGES);

    const stats: TenantDashboardStats = {
      currentLease: activeLease,
      nextPaymentDue: nextPayment,
      openMaintenanceRequests: maintenance.filter(m => m.tenantId === tenantId && (m.status === 'open' || m.status === 'in_progress')).length,
      unreadMessages: messages.filter(m => m.receiverId === tenantId && !m.read).length,
    };
    return { success: true, data: stats };
  },

  getActivities: async (limit?: number): Promise<ApiResponse<Activity[]>> => {
    await delay(SIMULATED_DELAY);
    const activities = getFromStorage<Activity>(STORAGE_KEYS.ACTIVITIES);
    // Already sorted by most recent first if weunshift, but sort to be safe
    const sorted = [...activities].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return { success: true, data: limit ? sorted.slice(0, limit) : sorted };
  },
};

// ==================== API ALIASES ====================
// For consistent naming across components
export const userApi = usersApi;
export const propertyApi = {
  ...propertiesApi,
  getAll: async (): Promise<ApiResponse<Property[]>> => {
    const result = await propertiesApi.getAll();
    return { success: true, data: result.data };
  },
};
export const unitApi = {
  ...unitsApi,
  getAll: async (): Promise<ApiResponse<Unit[]>> => {
    await delay(SIMULATED_DELAY);
    return { success: true, data: getFromStorage<Unit>(STORAGE_KEYS.UNITS) };
  },
  delete: async (id: string): Promise<ApiResponse<null>> => {
    await delay(SIMULATED_DELAY);
    const units = getFromStorage<Unit>(STORAGE_KEYS.UNITS);
    const filtered = units.filter(u => u.id !== id);
    saveToStorage(STORAGE_KEYS.UNITS, filtered);
    return { success: true, data: null };
  },
};
export const applicationApi = {
  ...applicationsApi,
  update: async (id: string, data: Partial<Application>): Promise<ApiResponse<Application>> => {
    // Reuse specific methods if possible, or generic update
    const res = await applicationsApi.updateStatus(id, data.status as any, (data as any).adminNotes);
    // This simple alias is imperfect if upgrading fields other than status, but valid for current Prototype usage
    // Better to implement a full update

    // FULL UPDATE Implementation for Alias
    const apps = getFromStorage<Application>(STORAGE_KEYS.APPLICATIONS);
    const index = apps.findIndex(a => a.id === id);
    if (index === -1) return { success: false, message: 'Not found', data: null as any };

    const updated = { ...apps[index], ...data, updatedAt: new Date().toISOString() };
    apps[index] = updated;
    saveToStorage(STORAGE_KEYS.APPLICATIONS, apps);
    return { success: true, data: updated };
  },
};
export const leaseApi = leasesApi;
export const paymentApi = {
  ...paymentsApi,
  update: async (id: string, data: Partial<Payment>): Promise<ApiResponse<Payment>> => {
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
    const index = payments.findIndex(p => p.id === id);
    if (index === -1) return { success: false, message: 'Not found', data: null as any };

    const updated = { ...payments[index], ...data, updatedAt: new Date().toISOString() };
    payments[index] = updated;
    saveToStorage(STORAGE_KEYS.PAYMENTS, payments);
    return { success: true, data: updated };
  },
};
export const messageApi = messagesApi;
