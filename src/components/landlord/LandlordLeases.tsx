import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Calendar, User, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { mockLeases, mockUnits, mockProperties, mockUsers, formatCurrency, formatDate } from '@/lib/mock-data';
import type { Lease, LeaseStatus } from '@/types';

interface LeaseWithDetails extends Lease {
  unit: { unitNumber: string; type: string };
  property: { name: string; city: string };
  tenant: { firstName: string; lastName: string; email: string; phone: string } | null;
}

const statusConfig: Record<LeaseStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Active', variant: 'default' },
  pending: { label: 'Pending', variant: 'secondary' },
  ended: { label: 'Ended', variant: 'outline' },
  terminated: { label: 'Terminated', variant: 'destructive' },
};

export default function LandlordLeases() {
  const { user } = useAuth();
  const [leases, setLeases] = useState<LeaseWithDetails[]>([]);

  useEffect(() => {
    // Get leases for properties owned by this landlord
    const landlordId = user?.id || 'landlord-001';
    const myPropertyIds = mockProperties
      .filter((p) => p.landlordId === landlordId)
      .map((p) => p.id);

    const myUnitIds = mockUnits
      .filter((u) => myPropertyIds.includes(u.propertyId))
      .map((u) => u.id);

    const myLeases = mockLeases
      .filter((lease) => myUnitIds.includes(lease.unitId))
      .map((lease) => {
        const unit = mockUnits.find((u) => u.id === lease.unitId);
        const property = unit ? mockProperties.find((p) => p.id === unit.propertyId) : null;
        const tenant = mockUsers.find((u) => u.id === lease.tenantId);

        return {
          ...lease,
          unit: unit ? { unitNumber: unit.unitNumber, type: unit.type } : { unitNumber: 'N/A', type: 'N/A' },
          property: property ? { name: property.name, city: property.city } : { name: 'N/A', city: 'N/A' },
          tenant: tenant ? {
            firstName: tenant.firstName,
            lastName: tenant.lastName,
            email: tenant.email,
            phone: tenant.phone,
          } : null,
        };
      })
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    setLeases(myLeases);
  }, [user]);

  const activeLeases = leases.filter((l) => l.status === 'active');
  const endedLeases = leases.filter((l) => l.status !== 'active');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Leases</h2>
        <p className="text-muted-foreground">View lease agreements for your properties</p>
      </div>

      {/* Info Card */}
      <Card className="border-info bg-info/5">
        <CardContent className="flex items-start gap-4 p-4">
          <div className="rounded-lg bg-info/10 p-2">
            <AlertCircle className="h-5 w-5 text-info" />
          </div>
          <div>
            <h4 className="font-semibold">Read-Only Access</h4>
            <p className="text-sm text-muted-foreground">
              Lease creation and modification is handled by the system administrator. 
              You can view lease details and tenant information here.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leases</p>
                <p className="text-2xl font-bold">{leases.length}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeLeases.length}</p>
              </div>
              <div className="rounded-lg bg-success/10 p-2">
                <FileText className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ended/Terminated</p>
                <p className="text-2xl font-bold">{endedLeases.length}</p>
              </div>
              <div className="rounded-lg bg-muted p-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lease Agreements</CardTitle>
        </CardHeader>
        <CardContent>
          {leases.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No leases</h3>
              <p className="text-muted-foreground">
                Leases for your properties will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property / Unit</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leases.map((lease) => (
                    <TableRow key={lease.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{lease.property.name}</p>
                          <p className="text-sm text-muted-foreground">Unit {lease.unit.unitNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {lease.tenant ? `${lease.tenant.firstName} ${lease.tenant.lastName}` : 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{lease.tenant?.phone}</p>
                          <p className="text-muted-foreground">{lease.tenant?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatCurrency(lease.rentAmount)}</span>
                        <span className="text-sm text-muted-foreground">/mo</span>
                      </TableCell>
                      <TableCell>{formatDate(lease.startDate)}</TableCell>
                      <TableCell>{formatDate(lease.endDate)}</TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[lease.status].variant}>
                          {statusConfig[lease.status].label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
