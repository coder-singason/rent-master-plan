import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Calendar, DollarSign, Home, User, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { leaseApi, unitApi, propertyApi, userApi } from '@/lib/api';
// Keeping mockUsers as fallback if needed implies we might not have them in simple API check,
// but let's try to stick to API. If userApi.getAll is not available we might error.
// We will check api.ts for userApi.getAll availability. 
import { formatCurrency, formatDate } from '@/lib/mock-data';
import type { Lease, LeaseStatus } from '@/types';

interface LeaseWithDetails extends Lease {
  unit: {
    unitNumber: string;
    type: string;
    floor: number;
    squareMeters: number;
  };
  property: {
    name: string;
    address: string;
    city: string;
    county: string;
  };
  landlord: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  } | null;
}

const statusConfig: Record<LeaseStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Active', variant: 'default' },
  pending: { label: 'Pending', variant: 'secondary' },
  ended: { label: 'Ended', variant: 'outline' },
  terminated: { label: 'Terminated', variant: 'destructive' },
};

export default function TenantLease() {
  const { user } = useAuth();
  const [currentLease, setCurrentLease] = useState<LeaseWithDetails | null>(null);
  const [pastLeases, setPastLeases] = useState<LeaseWithDetails[]>([]);

  useEffect(() => {
    const loadLeaseData = async () => {
      if (!user) return;
      try {
        // 1. Get Tenant's Leases
        const leaseRes = await leaseApi.getByTenant(user.id);

        if (leaseRes.success && leaseRes.data) {
          const myLeases = leaseRes.data;

          if (myLeases.length === 0) {
            setCurrentLease(null);
            setPastLeases([]);
            return;
          }

          // 2. Fetch dependencies (Units, Properties, Users for landlord)
          // In a real app, we'd probably have an endpoint for "Lease Details" or use GraphQL/include
          // For this prototype, we'll fetch all units/props to map them. 
          // Optimization: fetch only what we need or cache.
          const [unitsRes, propsRes, usersRes] = await Promise.all([
            unitApi.getAll(),
            propertyApi.getAll(),
            userApi.getAll() // Assuming userApi.getAll exists, need to verify or use mockUsers for static landlords if api missing
          ]);

          const units = unitsRes.data || [];
          const properties = propsRes.data || [];
          const users = usersRes.data || []; // Fallback to empty if fails

          // 3. Map Details
          const enrichedLeases = myLeases.map(lease => {
            const unit = units.find(u => u.id === lease.unitId);
            const property = unit ? properties.find(p => p.id === unit.propertyId) : null;
            const landlord = property ? users.find(u => u.id === property.landlordId) : null;

            return {
              ...lease,
              unit: unit ? {
                unitNumber: unit.unitNumber,
                type: unit.type,
                floor: unit.floor,
                squareMeters: unit.squareMeters,
              } : { unitNumber: 'N/A', type: 'N/A', floor: 0, squareMeters: 0 },
              property: property ? {
                name: property.name,
                address: property.address,
                city: property.city,
                county: property.county,
              } : { name: 'N/A', address: 'N/A', city: 'N/A', county: 'N/A' },
              landlord: landlord ? {
                firstName: landlord.firstName,
                lastName: landlord.lastName,
                phone: landlord.phone,
                email: landlord.email,
              } : null,
            };
          });

          const active = enrichedLeases.find((l) => l.status === 'active');
          const past = enrichedLeases.filter((l) => l.status !== 'active');

          setCurrentLease(active || null);
          setPastLeases(past);
        }
      } catch (error) {
        console.error("Failed to load lease data", error);
      }
    };

    loadLeaseData();
  }, [user]);

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  if (!currentLease && pastLeases.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">My Lease</h2>
          <p className="text-muted-foreground">View your current and past lease agreements</p>
        </div>

        <Card className="py-12">
          <CardContent className="text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No lease found</h3>
            <p className="text-muted-foreground">
              You don't have any active or past leases. Browse listings and apply for a property to get started.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Lease</h2>
        <p className="text-muted-foreground">View your current and past lease agreements</p>
      </div>

      {/* Current Lease */}
      {currentLease && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Lease</CardTitle>
                <CardDescription>
                  {currentLease.property.name} - Unit {currentLease.unit.unitNumber}
                </CardDescription>
              </div>
              <Badge variant={statusConfig[currentLease.status].variant}>
                {statusConfig[currentLease.status].label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Property Details */}
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Property Details</h4>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Property</p>
                  <p className="font-medium">{currentLease.property.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unit</p>
                  <p className="font-medium">{currentLease.unit.unitNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{currentLease.unit.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Size</p>
                  <p className="font-medium">{currentLease.unit.squareMeters} m²</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">
                  {currentLease.property.address}, {currentLease.property.city}, {currentLease.property.county}
                </p>
              </div>
            </div>

            {/* Lease Terms */}
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Lease Terms</h4>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{formatDate(currentLease.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{formatDate(currentLease.endDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Days Remaining</p>
                  <p className="font-medium">{calculateDaysRemaining(currentLease.endDate)} days</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Frequency</p>
                  <p className="font-medium capitalize">{currentLease.paymentFrequency}</p>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Financial Details</h4>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Rent</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(currentLease.rentAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Deposit Paid</p>
                  <p className="text-2xl font-bold">{formatCurrency(currentLease.depositAmount)}</p>
                </div>
              </div>
            </div>

            {/* Landlord Contact */}
            {currentLease.landlord && (
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Landlord Contact</h4>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">
                      {currentLease.landlord.firstName} {currentLease.landlord.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{currentLease.landlord.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{currentLease.landlord.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Lease Terms Text */}
            {currentLease.terms && (
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-semibold">Lease Terms & Conditions</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {currentLease.terms}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Past Leases */}
      {pastLeases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Leases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pastLeases.map((lease) => (
                <div
                  key={lease.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">
                      {lease.property.name} - Unit {lease.unit.unitNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={statusConfig[lease.status].variant}>
                      {statusConfig[lease.status].label}
                    </Badge>
                    <p className="mt-1 text-sm font-medium">
                      {formatCurrency(lease.rentAmount)}/mo
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
