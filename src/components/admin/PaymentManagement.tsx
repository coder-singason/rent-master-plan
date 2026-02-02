import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { paymentApi, leaseApi, userApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/mock-data';
import type { Payment, PaymentStatus, PaymentMethod, Lease, User } from '@/types';
import { Plus, Search, CreditCard, AlertCircle, CheckCircle, Clock, DollarSign } from 'lucide-react';

export function PaymentManagement() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRecordPaymentDialogOpen, setIsRecordPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  
  const { toast } = useToast();

  const [newPaymentData, setNewPaymentData] = useState({
    leaseId: '',
    amount: 0,
    dueDate: '',
    notes: '',
  });

  const [recordPaymentData, setRecordPaymentData] = useState({
    method: 'mpesa' as PaymentMethod,
    transactionRef: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [paymentsRes, leasesRes, usersRes] = await Promise.all([
        paymentApi.getAll(),
        leaseApi.getAll(),
        userApi.getAll(),
      ]);
      if (paymentsRes.success) setPayments(paymentsRes.data);
      if (leasesRes.success) setLeases(leasesRes.data);
      if (usersRes.success) setUsers(usersRes.data);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const tenant = users.find((u) => u.id === payment.tenantId);
    const matchesSearch =
      tenant?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant?.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transactionRef?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getLease = (leaseId: string) => leases.find((l) => l.id === leaseId);
  const getUser = (userId: string) => users.find((u) => u.id === userId);
  const getActiveLeases = () => leases.filter((l) => l.status === 'active');

  const handleOpenNewPaymentDialog = () => {
    const today = new Date();
    today.setDate(today.getDate() + 5);
    setNewPaymentData({
      leaseId: '',
      amount: 0,
      dueDate: today.toISOString().split('T')[0],
      notes: '',
    });
    setIsDialogOpen(true);
  };

  const handleCreatePayment = async () => {
    const lease = getLease(newPaymentData.leaseId);
    if (!lease) return;

    const paymentData = {
      ...newPaymentData,
      tenantId: lease.tenantId,
      status: 'pending' as PaymentStatus,
    };

    const response = await paymentApi.create(paymentData);
    if (response.success) {
      setPayments([...payments, response.data]);
      toast({ title: 'Invoice created', description: 'New payment invoice has been generated.' });
    }
    setIsDialogOpen(false);
  };

  const handleOpenRecordPaymentDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setRecordPaymentData({
      method: 'mpesa',
      transactionRef: '',
      notes: '',
    });
    setIsRecordPaymentDialogOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedPayment) return;

    const response = await paymentApi.update(selectedPayment.id, {
      status: 'paid',
      paidDate: new Date().toISOString().split('T')[0],
      method: recordPaymentData.method,
      transactionRef: recordPaymentData.transactionRef,
      notes: recordPaymentData.notes,
    });

    if (response.success) {
      setPayments(payments.map((p) => (p.id === selectedPayment.id ? response.data : p)));
      toast({ title: 'Payment recorded', description: 'The payment has been recorded successfully.' });
    }
    setIsRecordPaymentDialogOpen(false);
  };

  const handleLeaseSelect = (leaseId: string) => {
    const lease = getLease(leaseId);
    if (lease) {
      setNewPaymentData({
        ...newPaymentData,
        leaseId,
        amount: lease.rentAmount,
      });
    }
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const config: Record<PaymentStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
      paid: { variant: 'default', icon: CheckCircle },
      pending: { variant: 'secondary', icon: Clock },
      overdue: { variant: 'destructive', icon: AlertCircle },
      partial: { variant: 'outline', icon: DollarSign },
    };
    const { variant, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getMethodLabel = (method?: PaymentMethod) => {
    const labels: Record<PaymentMethod, string> = {
      mpesa: 'M-Pesa',
      bank_transfer: 'Bank Transfer',
      cash: 'Cash',
      cheque: 'Cheque',
    };
    return method ? labels[method] : '-';
  };

  // Calculate stats
  const totalCollected = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalOverdue = payments
    .filter((p) => p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount + (p.lateFee || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payment & Billing</h2>
          <p className="text-muted-foreground">Manage rent payments and invoices</p>
        </div>
        <Button onClick={handleOpenNewPaymentDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Generate Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Collected</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(totalCollected)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(totalOverdue)}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">
                  {payments.filter((p) => {
                    const paymentMonth = new Date(p.dueDate).getMonth();
                    const currentMonth = new Date().getMonth();
                    return paymentMonth === currentMonth;
                  }).length}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by tenant or transaction ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payments ({filteredPayments.length})</CardTitle>
          <CardDescription>All payment records and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Paid Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No payments found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => {
                  const tenant = getUser(payment.tenantId);
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(payment.amount)}
                        {payment.lateFee && (
                          <span className="ml-1 text-sm text-destructive">
                            +{formatCurrency(payment.lateFee)} late fee
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(payment.dueDate)}</TableCell>
                      <TableCell>{payment.paidDate ? formatDate(payment.paidDate) : '-'}</TableCell>
                      <TableCell>{getMethodLabel(payment.method)}</TableCell>
                      <TableCell className="font-mono text-sm">{payment.transactionRef || '-'}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        {(payment.status === 'pending' || payment.status === 'overdue') && (
                          <Button size="sm" onClick={() => handleOpenRecordPaymentDialog(payment)}>
                            Record
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Generate Invoice Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
            <DialogDescription>Create a new payment invoice for a tenant</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lease">Lease</Label>
              <Select value={newPaymentData.leaseId} onValueChange={handleLeaseSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lease" />
                </SelectTrigger>
                <SelectContent>
                  {getActiveLeases().map((lease) => {
                    const tenant = getUser(lease.tenantId);
                    return (
                      <SelectItem key={lease.id} value={lease.id}>
                        {tenant?.firstName} {tenant?.lastName} - {formatCurrency(lease.rentAmount)}/mo
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (KES)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newPaymentData.amount}
                  onChange={(e) => setNewPaymentData({ ...newPaymentData, amount: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newPaymentData.dueDate}
                  onChange={(e) => setNewPaymentData({ ...newPaymentData, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newPaymentData.notes}
                onChange={(e) => setNewPaymentData({ ...newPaymentData, notes: e.target.value })}
                placeholder="Optional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePayment} disabled={!newPaymentData.leaseId}>
              Generate Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={isRecordPaymentDialogOpen} onOpenChange={setIsRecordPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record payment of {selectedPayment && formatCurrency(selectedPayment.amount)}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="method">Payment Method</Label>
              <Select
                value={recordPaymentData.method}
                onValueChange={(value: PaymentMethod) => setRecordPaymentData({ ...recordPaymentData, method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transactionRef">Transaction Reference</Label>
              <Input
                id="transactionRef"
                value={recordPaymentData.transactionRef}
                onChange={(e) => setRecordPaymentData({ ...recordPaymentData, transactionRef: e.target.value })}
                placeholder="e.g., QKL2026040312345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentNotes">Notes</Label>
              <Textarea
                id="paymentNotes"
                value={recordPaymentData.notes}
                onChange={(e) => setRecordPaymentData({ ...recordPaymentData, notes: e.target.value })}
                placeholder="Optional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRecordPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
