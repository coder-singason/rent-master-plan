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
import { CreditCard, CheckCircle2, Clock, AlertTriangle, DollarSign, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { paymentApi, leaseApi, unitApi, propertyApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/mock-data';
import type { Payment, PaymentStatus } from '@/types';

interface PaymentWithDetails extends Payment {
  unit: {
    unitNumber: string;
  };
  property: {
    name: string;
  };
}

const statusConfig: Record<PaymentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }> }> = {
  paid: { label: 'Paid', variant: 'default', icon: CheckCircle2 },
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  overdue: { label: 'Overdue', variant: 'destructive', icon: AlertTriangle },
  partial: { label: 'Partial', variant: 'outline', icon: DollarSign },
};

export default function TenantPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);

  useEffect(() => {
    const loadPayments = async () => {
      if (!user) return;
      try {
        // 1. Get Tenant's Payments
        const paymentRes = await paymentApi.getByTenant(user.id);

        if (paymentRes.success && paymentRes.data) {
          const myPayments = paymentRes.data;

          if (myPayments.length === 0) {
            setPayments([]);
            return;
          }

          // 2. Fetch dependencies
          // Need leases to trace unit/property from payment if payment only has leaseId
          // Need units and properties
          const [leasesRes, unitsRes, propsRes] = await Promise.all([
            leaseApi.getAll(),
            unitApi.getAll(),
            propertyApi.getAll()
          ]);

          const leases = leasesRes.data || [];
          const units = unitsRes.data || [];
          const properties = propsRes.data || [];

          // 3. Map Details
          const enrichedPayments = myPayments.map((payment) => {
            const lease = leases.find((l) => l.id === payment.leaseId);
            const unit = lease ? units.find((u) => u.id === lease.unitId) : null;
            const property = unit ? properties.find((p) => p.id === unit.propertyId) : null;

            return {
              ...payment,
              unit: unit ? { unitNumber: unit.unitNumber } : { unitNumber: 'N/A' },
              property: property ? { name: property.name } : { name: 'N/A' },
            };
          }).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

          setPayments(enrichedPayments);
        }
      } catch (error) {
        console.error("Failed to load payments", error);
        setPayments([]);
      }
    };

    loadPayments();
  }, [user]);

  const stats = {
    totalPaid: payments.filter((p) => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0),
    pending: payments.filter((p) => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0),
    overdue: payments.filter((p) => p.status === 'overdue').reduce((acc, p) => acc + p.amount + (p.lateFee || 0), 0),
    nextDue: payments.find((p) => p.status === 'pending' || p.status === 'overdue'),
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Payments</h2>
        <p className="text-muted-foreground">View your payment history and upcoming dues</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(stats.totalPaid)}</p>
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
                <p className="text-2xl font-bold">{formatCurrency(stats.pending)}</p>
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
                <p className="text-2xl font-bold text-destructive">{formatCurrency(stats.overdue)}</p>
              </div>
              <div className="rounded-lg bg-destructive/10 p-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Next Due</p>
                {stats.nextDue ? (
                  <p className="text-lg font-bold">{formatDate(stats.nextDue.dueDate)}</p>
                ) : (
                  <p className="text-lg font-medium text-muted-foreground">No dues</p>
                )}
              </div>
              <div className="rounded-lg bg-primary/10 p-2">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Payment Alert */}
      {stats.nextDue && stats.nextDue.status === 'overdue' && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-destructive/10 p-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-destructive">Payment Overdue</h4>
              <p className="text-sm text-muted-foreground">
                You have an overdue payment of {formatCurrency(stats.nextDue.amount + (stats.nextDue.lateFee || 0))}
                (includes {formatCurrency(stats.nextDue.lateFee || 0)} late fee).
                Please contact your landlord or administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="py-12 text-center">
              <CreditCard className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No payment history</h3>
              <p className="text-muted-foreground">
                Your payment history will appear here once you have an active lease.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Late Fee</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid On</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => {
                    const status = statusConfig[payment.status];
                    const StatusIcon = status.icon;
                    const total = payment.amount + (payment.lateFee || 0);

                    return (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.property.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Unit {payment.unit.unitNumber}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(payment.dueDate)}</TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>
                          {payment.lateFee ? (
                            <span className="text-destructive">{formatCurrency(payment.lateFee)}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(total)}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.paidDate ? formatDate(payment.paidDate) : '-'}
                        </TableCell>
                        <TableCell>
                          {payment.transactionRef ? (
                            <code className="rounded bg-muted px-2 py-1 text-xs">
                              {payment.transactionRef}
                            </code>
                          ) : (
                            '-'
                          )}
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

      {/* Payment Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="mb-2 font-medium">M-Pesa Payment</h4>
            <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
              <li>Go to M-Pesa menu on your phone</li>
              <li>Select Lipa na M-Pesa {'>'} Pay Bill</li>
              <li>Enter Business Number: <span className="font-mono font-medium">123456</span></li>
              <li>Enter your Unit Number as Account Number</li>
              <li>Enter the amount and confirm</li>
            </ol>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="mb-2 font-medium">Bank Transfer</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Bank: <span className="font-medium">Equity Bank</span></p>
              <p>Account Name: <span className="font-medium">RentEase Properties Ltd</span></p>
              <p>Account Number: <span className="font-mono font-medium">0123456789</span></p>
              <p>Reference: <span className="font-medium">Your Unit Number</span></p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Note: Payments may take up to 24 hours to reflect in your account.
            Contact support if your payment doesn't show after this period.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
