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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { leaseApi, unitApi, userApi, applicationApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/mock-data';
import type { Lease, LeaseStatus, PaymentFrequency, Unit, User, Application } from '@/types';
import { Plus, MoreHorizontal, Edit, Eye, FileText, Calendar, XCircle } from 'lucide-react';

export function LeaseManagement() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [approvedApplications, setApprovedApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingLease, setEditingLease] = useState<Lease | null>(null);
  const [viewingLease, setViewingLease] = useState<Lease | null>(null);
  
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    unitId: '',
    tenantId: '',
    startDate: '',
    endDate: '',
    rentAmount: 0,
    depositAmount: 0,
    paymentFrequency: 'monthly' as PaymentFrequency,
    status: 'active' as LeaseStatus,
    terms: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [leasesRes, unitsRes, usersRes, appsRes] = await Promise.all([
        leaseApi.getAll(),
        unitApi.getAll(),
        userApi.getAll(),
        applicationApi.getAll(),
      ]);
      if (leasesRes.success) setLeases(leasesRes.data);
      if (unitsRes.success) setUnits(unitsRes.data);
      if (usersRes.success) setUsers(usersRes.data);
      if (appsRes.success) {
        setApprovedApplications(appsRes.data.filter((a: Application) => a.status === 'approved'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLeases = leases.filter((lease) => {
    return statusFilter === 'all' || lease.status === statusFilter;
  });

  const getUnit = (unitId: string) => units.find((u) => u.id === unitId);
  const getUser = (userId: string) => users.find((u) => u.id === userId);
  const getTenants = () => users.filter((u) => u.role === 'tenant');
  const getAvailableUnits = () => units.filter((u) => u.status === 'available' || u.status === 'reserved');

  const handleOpenDialog = (lease?: Lease) => {
    if (lease) {
      setEditingLease(lease);
      setFormData({
        unitId: lease.unitId,
        tenantId: lease.tenantId,
        startDate: lease.startDate,
        endDate: lease.endDate,
        rentAmount: lease.rentAmount,
        depositAmount: lease.depositAmount,
        paymentFrequency: lease.paymentFrequency,
        status: lease.status,
        terms: lease.terms || '',
      });
    } else {
      setEditingLease(null);
      const today = new Date();
      const nextYear = new Date(today);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      setFormData({
        unitId: '',
        tenantId: '',
        startDate: today.toISOString().split('T')[0],
        endDate: nextYear.toISOString().split('T')[0],
        rentAmount: 0,
        depositAmount: 0,
        paymentFrequency: 'monthly',
        status: 'active',
        terms: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingLease) {
      const response = await leaseApi.update(editingLease.id, formData);
      if (response.success) {
        setLeases(leases.map((l) => (l.id === editingLease.id ? response.data : l)));
        toast({ title: 'Lease updated', description: 'Lease details have been updated.' });
      }
    } else {
      const response = await leaseApi.create(formData);
      if (response.success) {
        setLeases([...leases, response.data]);
        toast({ title: 'Lease created', description: 'New lease has been created.' });
      }
    }
    setIsDialogOpen(false);
  };

  const handleTerminateLease = async (lease: Lease) => {
    const response = await leaseApi.update(lease.id, { status: 'terminated' });
    if (response.success) {
      setLeases(leases.map((l) => (l.id === lease.id ? response.data : l)));
      toast({ title: 'Lease terminated', description: 'The lease has been terminated.' });
    }
  };

  const handleUnitSelect = (unitId: string) => {
    const unit = units.find((u) => u.id === unitId);
    if (unit) {
      setFormData({
        ...formData,
        unitId,
        rentAmount: unit.rentAmount,
        depositAmount: unit.depositAmount,
      });
    }
  };

  const getStatusBadge = (status: LeaseStatus) => {
    const config: Record<LeaseStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      active: { variant: 'default', label: 'Active' },
      pending: { variant: 'secondary', label: 'Pending' },
      ended: { variant: 'outline', label: 'Ended' },
      terminated: { variant: 'destructive', label: 'Terminated' },
    };
    const { variant, label } = config[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

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
          <h2 className="text-2xl font-bold tracking-tight">Lease Management</h2>
          <p className="text-muted-foreground">Create and manage tenant leases</p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Create Lease
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Leases</p>
                <p className="text-2xl font-bold">{leases.filter((l) => l.status === 'active').length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Monthly Rent</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    leases.filter((l) => l.status === 'active').reduce((sum, l) => sum + l.rentAmount, 0)
                  )}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold">
                  {
                    leases.filter((l) => {
                      if (l.status !== 'active') return false;
                      const endDate = new Date(l.endDate);
                      const thirtyDaysFromNow = new Date();
                      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                      return endDate <= thirtyDaysFromNow;
                    }).length
                  }
                </p>
              </div>
              <Calendar className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Terminated</p>
                <p className="text-2xl font-bold">{leases.filter((l) => l.status === 'terminated').length}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leases ({filteredLeases.length})</CardTitle>
          <CardDescription>All lease agreements in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No leases found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeases.map((lease) => {
                  const tenant = getUser(lease.tenantId);
                  const unit = getUnit(lease.unitId);
                  return (
                    <TableRow key={lease.id}>
                      <TableCell className="font-medium">
                        {tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Unknown'}
                        <p className="text-sm text-muted-foreground">{tenant?.email}</p>
                      </TableCell>
                      <TableCell>{unit?.unitNumber || 'Unknown'}</TableCell>
                      <TableCell>
                        <p>{formatDate(lease.startDate)}</p>
                        <p className="text-sm text-muted-foreground">to {formatDate(lease.endDate)}</p>
                      </TableCell>
                      <TableCell>{formatCurrency(lease.rentAmount)}</TableCell>
                      <TableCell className="capitalize">{lease.paymentFrequency}</TableCell>
                      <TableCell>{getStatusBadge(lease.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setViewingLease(lease);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenDialog(lease)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {lease.status === 'active' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleTerminateLease(lease)}
                                  className="text-destructive"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Terminate
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingLease ? 'Edit Lease' : 'Create New Lease'}</DialogTitle>
            <DialogDescription>
              {editingLease ? 'Update lease details below.' : 'Fill in the details for the new lease agreement.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select value={formData.unitId} onValueChange={handleUnitSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableUnits().map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.unitNumber} - {formatCurrency(unit.rentAmount)}/mo
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenant">Tenant</Label>
                <Select
                  value={formData.tenantId}
                  onValueChange={(value) => setFormData({ ...formData, tenantId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {getTenants().map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.firstName} {tenant.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rentAmount">Rent Amount (KES)</Label>
                <Input
                  id="rentAmount"
                  type="number"
                  value={formData.rentAmount}
                  onChange={(e) => setFormData({ ...formData, rentAmount: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depositAmount">Deposit (KES)</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  value={formData.depositAmount}
                  onChange={(e) => setFormData({ ...formData, depositAmount: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Payment Frequency</Label>
                <Select
                  value={formData.paymentFrequency}
                  onValueChange={(value: PaymentFrequency) => setFormData({ ...formData, paymentFrequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: LeaseStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea
                id="terms"
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                placeholder="Enter lease terms and conditions..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{editingLease ? 'Save Changes' : 'Create Lease'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Lease Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Lease Details</DialogTitle>
            <DialogDescription>Lease agreement information</DialogDescription>
          </DialogHeader>
          {viewingLease && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Tenant</Label>
                  <p className="font-medium">
                    {getUser(viewingLease.tenantId)?.firstName} {getUser(viewingLease.tenantId)?.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Unit</Label>
                  <p className="font-medium">{getUnit(viewingLease.unitId)?.unitNumber}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Start Date</Label>
                  <p className="font-medium">{formatDate(viewingLease.startDate)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">End Date</Label>
                  <p className="font-medium">{formatDate(viewingLease.endDate)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Rent Amount</Label>
                  <p className="font-medium">{formatCurrency(viewingLease.rentAmount)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Deposit</Label>
                  <p className="font-medium">{formatCurrency(viewingLease.depositAmount)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Frequency</Label>
                  <p className="font-medium capitalize">{viewingLease.paymentFrequency}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="mt-1">{getStatusBadge(viewingLease.status)}</div>
              </div>
              {viewingLease.terms && (
                <div>
                  <Label className="text-muted-foreground">Terms & Conditions</Label>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{viewingLease.terms}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
