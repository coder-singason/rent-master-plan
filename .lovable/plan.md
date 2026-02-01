
# Rental & Apartment Management System

## Overview
A comprehensive, enterprise-grade property management platform with role-based dashboards for Admins, Landlords, and Tenants. Built as a React frontend with mock data architecture, ready to connect to your Node.js/Express backend.

---

## Phase 1: Foundation & Authentication

### Authentication System
- Login page with email/password form
- Registration with role selection (Tenant default, Admin/Landlord by invite)
- Mock authentication with JWT-style token simulation
- Password reset flow (UI ready for backend integration)
- Session persistence with localStorage

### Role-Based Routing
- Protected routes based on user role
- Automatic redirect to role-specific dashboard
- Unauthorized access handling

---

## Phase 2: Admin Dashboard (Full Control)

### System Overview
- Key metrics: Total properties, units, occupancy rate, revenue
- Recent activity feed
- Quick action shortcuts
- Charts: Revenue trends, occupancy by property, payment status breakdown

### User Management
- Full CRUD for all users (Admins, Landlords, Tenants)
- User status: Active, Suspended, Pending verification
- Role assignment and modification
- Search, filter, and bulk actions

### Property & Unit Management
- Create/edit/delete properties with full details
- Assign landlords to properties
- Unit management within properties
- Image gallery management
- Availability status controls

### Application Processing
- View all rental applications
- Approve/reject with notes
- See landlord recommendations
- Application history and audit trail

### Lease Management
- Create leases for approved applications
- Set terms, rent amount, dates, payment frequency
- Lease status management (Active, Ended, Terminated)
- Lease document text storage

### Payment & Billing (Admin-Exclusive)
- Generate rent invoices
- Record payments manually (M-Pesa reference ready)
- Payment status: Paid, Pending, Overdue
- Late payment penalty configuration
- Full payment history
- Financial reports and export (CSV/PDF ready)

### Maintenance Overview
- View all maintenance requests across properties
- Assign to landlords or mark complete
- Priority and status management

### System Settings
- M-Pesa configuration placeholders
- Email notification settings
- System-wide configurations

---

## Phase 3: Landlord Dashboard (Limited Financial Access)

### Dashboard Overview
- My properties summary
- Unit occupancy stats
- Pending applications count
- Recent maintenance requests

### Property Management
- Full CRUD for owned properties only
- Add/edit/remove units
- Set rent prices and availability
- Upload property and unit images

### Tenant Applications
- View applications for their properties
- Submit recommendations (approve/reject)
- Cannot make final decisions (Admin only)

### Lease Viewing (Read-Only)
- View active leases for their properties
- See lease terms and tenant info
- Cannot create or modify leases

### Payment Status (Read-Only)
- View payment status per tenant/unit
- See Paid/Pending/Overdue indicators
- No access to payment processing or amounts

### Maintenance Requests
- View requests for their properties
- Add comments and status updates
- Communicate with tenants

### Messaging
- Chat with tenants
- Receive system notifications

---

## Phase 4: Tenant Dashboard

### Dashboard Overview
- Current lease summary
- Upcoming rent due
- Maintenance request status
- Messages/notifications

### Apartment Browsing
- Search available listings
- Filters: Location, price range, bedrooms, availability
- Detailed apartment view with images
- Apply button for interested units

### Rental Applications
- Submit application with personal details
- Track application status (Pending, Approved, Rejected)
- View application history

### Lease Details (Read-Only)
- View current lease terms
- See rent amount and payment schedule
- Lease start/end dates

### Payments (Read-Only)
- View rent due amounts
- See payment status and history
- Payment confirmation receipts

### Maintenance Requests
- Submit new requests with category, description, priority
- Track request status (Open, In Progress, Completed)
- View updates and comments

### Messaging
- Communicate with landlord
- Contact admin for escalations

---

## Phase 5: Public Pages & Guest Experience

### Landing Page
- Hero section with value proposition
- Featured properties carousel
- How it works section
- Call-to-action for registration

### Public Listings
- Browse all available apartments
- Filters and search functionality
- Pagination
- "Register to Apply" prompts

### Apartment Detail Page
- Full property information
- Image gallery
- Amenities list
- Location information
- Contact/Apply buttons

---

## Technical Architecture

### Data Layer
- Mock data service with realistic Kenyan property data
- TypeScript interfaces matching your backend schema
- API service layer with standardized request/response patterns
- Easy swap to real API endpoints

### State Management
- React Query for data fetching patterns
- Context for authentication state
- Local state for forms and UI

### UI Components
- Enterprise-grade data tables with sorting, filtering, pagination
- Form components with validation (Zod)
- Modal dialogs for CRUD operations
- Toast notifications for actions
- Charts and analytics visualizations

### Design System
- Professional color palette (blues, grays, accent colors)
- Dense, information-rich layouts
- Responsive but desktop-optimized
- Multi-currency display ready (KES default)
- Consistent iconography (Lucide)

---

## Data Models (Frontend Interfaces)

```
User, Property, Unit, Application, Lease, Payment, MaintenanceRequest, Message
```

All interfaces will match your planned PostgreSQL schema for seamless backend integration.

---

## Ready for Backend Integration
- All API calls abstracted to service layer
- Authentication tokens stored and sent with requests
- Error handling for API failures
- Loading and empty states throughout

---

## Deliverables Summary

| Feature | Admin | Landlord | Tenant | Guest |
|---------|-------|----------|--------|-------|
| Dashboard | ✅ | ✅ | ✅ | ❌ |
| User Management | ✅ Full | ❌ | ❌ | ❌ |
| Property CRUD | ✅ All | ✅ Owned | ❌ | View |
| Applications | ✅ Approve | ✅ Recommend | ✅ Submit | ❌ |
| Leases | ✅ Full | 👁️ View | 👁️ View | ❌ |
| Payments | ✅ Full | 👁️ Status | 👁️ History | ❌ |
| Maintenance | ✅ All | ✅ Manage | ✅ Submit | ❌ |
| Messaging | ✅ All | ✅ Tenants | ✅ Up | ❌ |

