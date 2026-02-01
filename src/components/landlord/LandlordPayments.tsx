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
import { CreditCard, CheckCircle2, Clock, AlertTriangle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { mockPayments, mockLeases, mockUnits, mockProperties, mockUsers, formatDate } from '@/lib/mock-data';
import type { Payment, PaymentStatus } from '@/types';

interface PaymentWithDetails extends Payment {
  unit: { unitNumber: string };
  property: { name: string };
  tenant: { firstName: string; lastName: string } | null;
}

const statusConfig: Record<PaymentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }> }> = {
  paid: { label: 'Paid', variant: 'default', icon: CheckCircle2 },
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  overdue: { label: 'Overdue', variant: 'destructive', icon: AlertTriangle },
  partial: { label: 'Partial', variant: 'outline', icon: Clock },
};

export default function LandlordPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);

  useEffect(() => {
    // Get payments for leases in properties owned by this landlord
    const landlordId = user?.id || 'landlord-001';
    const myPropertyIds = mockProperties
      .filter((p) => p.landlordId === landlordId)
      .map((p) => p.id);

    const myUnitIds = mockUnits
      .filter((u) => myPropertyIds.includes(u.propertyId))
      .map((u) => u.id);

    const myLeaseIds = mockLeases
      .filter((l) => myUnitIds.includes(l.unitId))
      .map((l) => l.id);

    const myPayments = mockPayments
      .filter((payment) => myLeaseIds.includes(payment.leaseId))
      .map((payment) => {
        const lease = mockLeases.find((l) => l.id === payment.leaseId);
        const unit = lease ? mockUnits.find((u) => u.id === lease.unitId) : null;
        const property = unit ? mockProperties.find((p) => p.id === unit.propertyId) : null;
        const tenant = mockUsers.find((u) => u.id === payment.tenantId);

        return {
          ...payment,
          unit: unit ? { unitNumber: unit.unitNumber } : { unitNumber: 'N/A' },
          property: property ? { name: property.name } : { name: 'N/A' },
          tenant: tenant ? {
            firstName: tenant.firstName,
            lastName: tenant.lastName,
          } : null,
        };
      })
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

    setPayments(myPayments);
  }, [user]);

  const stats = {
    total: payments.length,
    paid: payments.filter((p) => p.status === 'paid').length,
    pending: payments.filter((p) => p.status === 'pending').length,
    overdue: payments.filter((p) => p.status === 'overdue').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Payment Status</h2>
        <p className="text-muted-foreground">View payment status for your tenants</p>
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
              Payment processing and recording is handled by the system administrator. 
              You can view payment status to track which tenants are up to date.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-2">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold text-success">{stats.paid}</p>
              </div>
              <div className="rounded-lg bg-success/10 p-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <div className="rounded-lg bg-warning/10 p-2">
                <Clock className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-destructive">{stats.overdue}</p>
              </div>
              <div className="rounded-lg bg-destructive/10 p-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="py-12 text-center">
              <CreditCard className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No payment records</h3>
              <p className="text-muted-foreground">
                Payment records for your properties will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property / Unit</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Paid Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => {
                    const status = statusConfig[payment.status];
                    const StatusIcon = status.icon;

                    return (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.property.name}</p>
                            <p className="text-sm text-muted-foreground">Unit {payment.unit.unitNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {payment.tenant
                            ? `${payment.tenant.firstName} ${payment.tenant.lastName}`
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{formatDate(payment.dueDate)}</TableCell>
                        <TableCell>
                          {payment.paidDate ? formatDate(payment.paidDate) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
