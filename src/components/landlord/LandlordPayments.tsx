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
import { paymentApi, leaseApi, unitApi, propertyApi, userApi } from '@/lib/api';
import { formatDate } from '@/lib/mock-data';
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPayments = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        // 1. Get landlord's properties
        const propsRes = await propertyApi.getByLandlord(user.id);
        if (!propsRes.success || !propsRes.data) {
          setPayments([]);
          return;
        }
        const myPropertyIds = propsRes.data.map(p => p.id);

        // 2. Get units for these properties
        const unitsRes = await unitApi.getAll();
        const allUnits = unitsRes.data || [];
        const myUnits = allUnits.filter(u => myPropertyIds.includes(u.propertyId));
        const myUnitIds = myUnits.map(u => u.id);

        // 3. Get leases for these units
        const leasesRes = await leaseApi.getAll();
        const allLeases = leasesRes.data || [];
        const myLeases = allLeases.filter(l => myUnitIds.includes(l.unitId));
        const myLeaseIds = myLeases.map(l => l.id);

        // 4. Get payments for these leases
        const paymentsRes = await paymentApi.getAll();
        const allPayments = paymentsRes.data || [];
        const myPayments = allPayments.filter(p => myLeaseIds.includes(p.leaseId));

        // 5. Get all users for tenant details
        const usersRes = await userApi.getAll();
        const allUsers = usersRes.data || [];

        // 6. Enrich payments
        const enriched: PaymentWithDetails[] = myPayments.map(payment => {
          const lease = myLeases.find(l => l.id === payment.leaseId);
          const unit = lease ? myUnits.find(u => u.id === lease.unitId) : null;
          const property = unit ? propsRes.data?.find(p => p.id === unit.propertyId) : null;
          const tenant = allUsers.find(u => u.id === payment.tenantId);

          return {
            ...payment,
            unit: unit ? { unitNumber: unit.unitNumber } : { unitNumber: 'N/A' },
            property: property ? { name: property.name } : { name: 'N/A' },
            tenant: tenant ? {
              firstName: tenant.firstName,
              lastName: tenant.lastName,
            } : null,
          };
        }).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

        setPayments(enriched);
      } catch (error) {
        console.error('Failed to load payments', error);
        setPayments([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPayments();
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
          {isLoading ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
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
