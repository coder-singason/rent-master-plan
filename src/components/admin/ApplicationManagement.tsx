import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { applicationApi, unitApi, userApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/mock-data';
import type { Application, ApplicationStatus, Unit, User } from '@/types';
import { Eye, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

export function ApplicationManagement() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [appsRes, unitsRes, usersRes] = await Promise.all([
        applicationApi.getAll(),
        unitApi.getAll(),
        userApi.getAll(),
      ]);
      if (appsRes.success) setApplications(appsRes.data);
      if (unitsRes.success) setUnits(unitsRes.data);
      if (usersRes.success) setUsers(usersRes.data);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredApplications = applications.filter((app) => {
    return statusFilter === 'all' || app.status === statusFilter;
  });

  const getUnit = (unitId: string) => units.find((u) => u.id === unitId);
  const getUser = (userId: string) => users.find((u) => u.id === userId);

  const handleViewApplication = (app: Application) => {
    setSelectedApplication(app);
    setIsViewDialogOpen(true);
  };

  const handleOpenActionDialog = (app: Application, action: 'approve' | 'reject') => {
    setSelectedApplication(app);
    setActionType(action);
    setAdminNotes('');
    setIsActionDialogOpen(true);
  };

  const handleProcessApplication = async () => {
    if (!selectedApplication) return;

    const newStatus: ApplicationStatus = actionType === 'approve' ? 'approved' : 'rejected';
    const response = await applicationApi.update(selectedApplication.id, {
      status: newStatus,
      adminNotes,
    });

    if (response.success) {
      setApplications(applications.map((a) => (a.id === selectedApplication.id ? response.data : a)));
      toast({
        title: `Application ${actionType === 'approve' ? 'Approved' : 'Rejected'}`,
        description: `The application has been ${actionType === 'approve' ? 'approved' : 'rejected'}.`,
      });
    }
    setIsActionDialogOpen(false);
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    const config: Record<ApplicationStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
      pending: { variant: 'secondary', icon: Clock },
      approved: { variant: 'default', icon: CheckCircle },
      rejected: { variant: 'destructive', icon: XCircle },
      withdrawn: { variant: 'outline', icon: FileText },
    };
    const { variant, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRecommendationBadge = (recommendation: Application['landlordRecommendation']) => {
    const config = {
      pending: { variant: 'outline' as const, label: 'Pending Review' },
      recommended: { variant: 'default' as const, label: 'Recommended' },
      not_recommended: { variant: 'destructive' as const, label: 'Not Recommended' },
    };
    const { variant, label } = config[recommendation];
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
          <h2 className="text-2xl font-bold tracking-tight">Application Processing</h2>
          <p className="text-muted-foreground">Review and process rental applications</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pending Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        {(['pending', 'approved', 'rejected', 'withdrawn'] as ApplicationStatus[]).map((status) => {
          const count = applications.filter((a) => a.status === status).length;
          return (
            <Card key={status}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground capitalize">{status}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  {getStatusBadge(status)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications ({filteredApplications.length})</CardTitle>
          <CardDescription>All rental applications submitted to the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Move-in Date</TableHead>
                <TableHead>Monthly Income</TableHead>
                <TableHead>Landlord Rec.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No applications found
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((app) => {
                  const tenant = getUser(app.tenantId);
                  const unit = getUnit(app.unitId);
                  return (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">
                        {tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Unknown'}
                        <p className="text-sm text-muted-foreground">{tenant?.email}</p>
                      </TableCell>
                      <TableCell>
                        {unit?.unitNumber || 'Unknown'}
                        <p className="text-sm text-muted-foreground">{formatCurrency(unit?.rentAmount || 0)}/mo</p>
                      </TableCell>
                      <TableCell>{formatDate(app.moveInDate)}</TableCell>
                      <TableCell>{formatCurrency(app.monthlyIncome)}</TableCell>
                      <TableCell>{getRecommendationBadge(app.landlordRecommendation)}</TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell>{formatDate(app.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleViewApplication(app)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {app.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenActionDialog(app, 'approve')}
                                className="text-success hover:text-success"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenActionDialog(app, 'reject')}
                                className="text-destructive hover:text-destructive"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Application Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Application submitted on {selectedApplication && formatDate(selectedApplication.createdAt)}
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Applicant</Label>
                  <p className="font-medium">
                    {getUser(selectedApplication.tenantId)?.firstName}{' '}
                    {getUser(selectedApplication.tenantId)?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getUser(selectedApplication.tenantId)?.email}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Unit</Label>
                  <p className="font-medium">{getUnit(selectedApplication.unitId)?.unitNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(getUnit(selectedApplication.unitId)?.rentAmount || 0)}/mo
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Employment</Label>
                  <p className="font-medium">{selectedApplication.employmentStatus}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Monthly Income</Label>
                  <p className="font-medium">{formatCurrency(selectedApplication.monthlyIncome)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Emergency Contact</Label>
                  <p className="font-medium">{selectedApplication.emergencyContact}</p>
                  <p className="text-sm text-muted-foreground">{selectedApplication.emergencyPhone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Desired Move-in</Label>
                  <p className="font-medium">{formatDate(selectedApplication.moveInDate)}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Landlord Recommendation</Label>
                <div className="mt-1">{getRecommendationBadge(selectedApplication.landlordRecommendation)}</div>
                {selectedApplication.landlordNotes && (
                  <p className="mt-2 text-sm">{selectedApplication.landlordNotes}</p>
                )}
              </div>
              {selectedApplication.adminNotes && (
                <div>
                  <Label className="text-muted-foreground">Admin Notes</Label>
                  <p className="text-sm">{selectedApplication.adminNotes}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Application' : 'Reject Application'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? 'Are you sure you want to approve this application? This will allow the tenant to proceed with the lease.'
                : 'Are you sure you want to reject this application? Please provide a reason.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adminNotes">Admin Notes</Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={
                  actionType === 'approve'
                    ? 'Optional notes about the approval...'
                    : 'Reason for rejection (required)...'
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={handleProcessApplication}
              disabled={actionType === 'reject' && !adminNotes.trim()}
            >
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
