import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Wrench, Clock, CheckCircle2, XCircle, Eye, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { maintenanceApi, unitApi, propertyApi, userApi } from '@/lib/api';
import { formatDate } from '@/lib/mock-data';
import type { MaintenanceRequest, MaintenanceStatus, MaintenancePriority } from '@/types';

interface RequestWithDetails extends MaintenanceRequest {
  unit: { unitNumber: string };
  property: { name: string };
  tenant: { firstName: string; lastName: string; phone: string } | null;
}

const statusConfig: Record<MaintenanceStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }> }> = {
  open: { label: 'Open', variant: 'secondary', icon: Clock },
  in_progress: { label: 'In Progress', variant: 'default', icon: Wrench },
  completed: { label: 'Completed', variant: 'outline', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', variant: 'destructive', icon: XCircle },
};

const priorityConfig: Record<MaintenancePriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-muted-foreground' },
  medium: { label: 'Medium', color: 'text-warning' },
  high: { label: 'High', color: 'text-orange-500' },
  urgent: { label: 'Urgent', color: 'text-destructive' },
};

export default function LandlordMaintenance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<RequestWithDetails[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestWithDetails | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<MaintenanceStatus>('open');
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const loadRequests = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        // 1. Get landlord's properties
        const propsRes = await propertyApi.getByLandlord(user.id);
        if (!propsRes.success || !propsRes.data) {
          setRequests([]);
          return;
        }
        const myPropertyIds = propsRes.data.map(p => p.id);

        // 2. Get units for these properties
        const unitsRes = await unitApi.getAll();
        const allUnits = unitsRes.data || [];
        const myUnits = allUnits.filter(u => myPropertyIds.includes(u.propertyId));
        const myUnitIds = myUnits.map(u => u.id);

        // 3. Get all maintenance requests
        const requestsRes = await maintenanceApi.getAll();
        const allRequests = requestsRes.data || [];
        const myRequests = allRequests.filter(req => myUnitIds.includes(req.unitId));

        // 4. Get all users for tenant details
        const usersRes = await userApi.getAll();
        const allUsers = usersRes.data || [];

        // 5. Enrich requests
        const enriched: RequestWithDetails[] = myRequests.map(req => {
          const unit = myUnits.find(u => u.id === req.unitId);
          const property = unit ? propsRes.data?.find(p => p.id === unit.propertyId) : null;
          const tenant = allUsers.find(u => u.id === req.tenantId);

          return {
            ...req,
            unit: unit ? { unitNumber: unit.unitNumber } : { unitNumber: 'N/A' },
            property: property ? { name: property.name } : { name: 'N/A' },
            tenant: tenant ? {
              firstName: tenant.firstName,
              lastName: tenant.lastName,
              phone: tenant.phone,
            } : null,
          };
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setRequests(enriched);
      } catch (error) {
        console.error('Failed to load maintenance requests', error);
        setRequests([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadRequests();
  }, [user, refreshTrigger]);

  const viewDetails = (request: RequestWithDetails) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
  };

  const openUpdateDialog = (request: RequestWithDetails) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setNewComment('');
    setShowUpdateDialog(true);
  };

  const handleUpdateRequest = async () => {
    if (!selectedRequest) return;
    setIsSubmitting(true);

    try {
      const updateData: any = { status: newStatus };

      // Add comment if provided
      if (newComment.trim()) {
        updateData.comments = [
          ...selectedRequest.comments,
          {
            id: `comment-${Date.now()}`,
            userId: user?.id || 'landlord-001',
            content: newComment,
            createdAt: new Date().toISOString(),
          },
        ];
      }

      const res = await maintenanceApi.update(selectedRequest.id, updateData);

      if (res.success) {
        toast({
          title: 'Request Updated',
          description: 'The maintenance request has been updated successfully.',
        });
        setShowUpdateDialog(false);
        setRefreshTrigger(prev => prev + 1);
      } else {
        toast({ title: 'Error', description: 'Failed to update request', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update request', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = {
    total: requests.length,
    open: requests.filter((r) => r.status === 'open').length,
    inProgress: requests.filter((r) => r.status === 'in_progress').length,
    completed: requests.filter((r) => r.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Maintenance Requests</h2>
        <p className="text-muted-foreground">Manage maintenance requests for your properties</p>
      </div>

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
                <Wrench className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold">{stats.open}</p>
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
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
              <div className="rounded-lg bg-info/10 p-2">
                <Wrench className="h-5 w-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <div className="rounded-lg bg-success/10 p-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Loading maintenance requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="py-12 text-center">
              <Wrench className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No maintenance requests</h3>
              <p className="text-muted-foreground">
                Requests from your tenants will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Property / Unit</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => {
                    const status = statusConfig[request.status];
                    const priority = priorityConfig[request.priority];
                    const StatusIcon = status.icon;

                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.title}</TableCell>
                        <TableCell>
                          <div>
                            <p>{request.property.name}</p>
                            <p className="text-sm text-muted-foreground">Unit {request.unit.unitNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {request.tenant
                            ? `${request.tenant.firstName} ${request.tenant.lastName}`
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="capitalize">{request.category.replace('_', ' ')}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${priority.color}`}>{priority.label}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(request.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => viewDetails(request)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openUpdateDialog(request)}>
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedRequest?.title}</DialogTitle>
            <DialogDescription>
              {selectedRequest && `${selectedRequest.property.name} - Unit ${selectedRequest.unit.unitNumber}`}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <Badge variant={statusConfig[selectedRequest.status].variant}>
                  {statusConfig[selectedRequest.status].label}
                </Badge>
                <span className={`font-medium ${priorityConfig[selectedRequest.priority].color}`}>
                  {priorityConfig[selectedRequest.priority].label} Priority
                </span>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">{selectedRequest.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tenant</p>
                  <p className="font-medium">
                    {selectedRequest.tenant
                      ? `${selectedRequest.tenant.firstName} ${selectedRequest.tenant.lastName}`
                      : 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.tenant?.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="font-medium">{formatDate(selectedRequest.createdAt)}</p>
                </div>
              </div>

              {selectedRequest.comments.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Comments</p>
                  <div className="space-y-2">
                    {selectedRequest.comments.map((comment) => (
                      <div key={comment.id} className="rounded-lg bg-muted/50 p-3">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-medium">Staff</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Request</DialogTitle>
            <DialogDescription>
              Update status and add a comment for the tenant
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as MaintenanceStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Add Comment</Label>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add an update or note for the tenant..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateRequest} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
