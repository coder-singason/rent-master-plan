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
import { maintenanceApi, unitApi, usersApi as userApi } from '@/lib/api';
import { formatDate } from '@/lib/mock-data';
import type { MaintenanceRequest, MaintenanceStatus, MaintenancePriority, Unit, User } from '@/types';
import { Search, MoreHorizontal, Eye, CheckCircle, Clock, AlertTriangle, Wrench, XCircle } from 'lucide-react';

export function MaintenanceManagement() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [updateStatus, setUpdateStatus] = useState<MaintenanceStatus>('open');
  const [assignTo, setAssignTo] = useState('');
  const [updateNote, setUpdateNote] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [requestsRes, unitsRes, usersRes] = await Promise.all([
        maintenanceApi.getAll(),
        unitApi.getAll(),
        userApi.getAll(),
      ]);
      if (requestsRes.success) setRequests(requestsRes.data);
      if (unitsRes.success) setUnits(unitsRes.data);
      if (usersRes.success) setUsers(usersRes.data);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getUnit = (unitId: string) => units.find((u) => u.id === unitId);
  const getUser = (userId: string) => users.find((u) => u.id === userId);
  const getLandlords = () => users.filter((u) => u.role === 'landlord');

  const handleViewRequest = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setIsViewDialogOpen(true);
  };

  const handleOpenUpdateDialog = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setUpdateStatus(request.status);
    setAssignTo(request.assignedTo || '');
    setUpdateNote('');
    setIsUpdateDialogOpen(true);
  };

  const handleUpdateRequest = async () => {
    if (!selectedRequest) return;

    const updates: Partial<MaintenanceRequest> = {
      status: updateStatus,
      assignedTo: assignTo || undefined,
    };

    if (updateStatus === 'completed') {
      updates.completedAt = new Date().toISOString();
    }

    const response = await maintenanceApi.updateStatus(selectedRequest.id, updateStatus);
    if (response.success) {
      const updatedData = { ...response.data, assignedTo: assignTo || undefined };
      setRequests(requests.map((r) => (r.id === selectedRequest.id ? updatedData : r)));
      toast({
        title: 'Request updated',
        description: `Maintenance request has been updated to ${updateStatus}.`,
      });
    }
    setIsUpdateDialogOpen(false);
  };

  const getStatusBadge = (status: MaintenanceStatus) => {
    const config: Record<MaintenanceStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
      open: { variant: 'secondary', icon: Clock },
      in_progress: { variant: 'default', icon: Wrench },
      completed: { variant: 'outline', icon: CheckCircle },
      cancelled: { variant: 'destructive', icon: XCircle },
    };
    const { variant, icon: Icon } = config[status];
    const labels: Record<MaintenanceStatus, string> = {
      open: 'Open',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {labels[status]}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: MaintenancePriority) => {
    const config: Record<MaintenancePriority, { className: string; icon: typeof AlertTriangle }> = {
      low: { className: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300', icon: Clock },
      medium: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Clock },
      high: { className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', icon: AlertTriangle },
      urgent: { className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: AlertTriangle },
    };
    const { className, icon: Icon } = config[priority];
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${className}`}>
        <Icon className="h-3 w-3" />
        {priority}
      </span>
    );
  };

  const getCategoryLabel = (category: MaintenanceRequest['category']) => {
    const labels: Record<MaintenanceRequest['category'], string> = {
      plumbing: 'Plumbing',
      electrical: 'Electrical',
      hvac: 'HVAC',
      appliance: 'Appliance',
      structural: 'Structural',
      pest_control: 'Pest Control',
      other: 'Other',
    };
    return labels[category];
  };

  // Stats
  const openRequests = requests.filter((r) => r.status === 'open').length;
  const inProgressRequests = requests.filter((r) => r.status === 'in_progress').length;
  const urgentRequests = requests.filter((r) => r.priority === 'urgent' && r.status !== 'completed').length;
  const completedThisMonth = requests.filter((r) => {
    if (r.status !== 'completed' || !r.completedAt) return false;
    const completedDate = new Date(r.completedAt);
    const now = new Date();
    return completedDate.getMonth() === now.getMonth() && completedDate.getFullYear() === now.getFullYear();
  }).length;

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
          <h2 className="text-2xl font-bold tracking-tight">Maintenance Requests</h2>
          <p className="text-muted-foreground">Manage and track maintenance requests</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold">{openRequests}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{inProgressRequests}</p>
              </div>
              <Wrench className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold text-destructive">{urgentRequests}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed (Month)</p>
                <p className="text-2xl font-bold text-success">{completedThisMonth}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
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
                placeholder="Search by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Requests ({filteredRequests.length})</CardTitle>
          <CardDescription>All maintenance requests in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No requests found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => {
                  const unit = getUnit(request.unitId);
                  const tenant = getUser(request.tenantId);
                  const assignee = request.assignedTo ? getUser(request.assignedTo) : null;
                  return (
                    <TableRow key={request.id}>
                      <TableCell className="max-w-[200px]">
                        <p className="font-medium truncate">{request.title}</p>
                      </TableCell>
                      <TableCell>{unit?.unitNumber || 'Unknown'}</TableCell>
                      <TableCell>
                        {tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Unknown'}
                      </TableCell>
                      <TableCell>{getCategoryLabel(request.category)}</TableCell>
                      <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                      <TableCell>
                        {assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Unassigned'}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{formatDate(request.createdAt)}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleViewRequest(request)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenUpdateDialog(request)}>
                              <Wrench className="mr-2 h-4 w-4" />
                              Update Status
                            </DropdownMenuItem>
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

      {/* View Request Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedRequest?.title}</DialogTitle>
            <DialogDescription>
              Submitted on {selectedRequest && formatDate(selectedRequest.createdAt)}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Unit</Label>
                  <p className="font-medium">{getUnit(selectedRequest.unitId)?.unitNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tenant</Label>
                  <p className="font-medium">
                    {getUser(selectedRequest.tenantId)?.firstName} {getUser(selectedRequest.tenantId)?.lastName}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="font-medium">{getCategoryLabel(selectedRequest.category)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Priority</Label>
                  <div className="mt-1">{getPriorityBadge(selectedRequest.priority)}</div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1">{selectedRequest.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Assigned To</Label>
                  <p className="font-medium">
                    {selectedRequest.assignedTo
                      ? `${getUser(selectedRequest.assignedTo)?.firstName} ${getUser(selectedRequest.assignedTo)?.lastName}`
                      : 'Unassigned'}
                  </p>
                </div>
              </div>
              {selectedRequest.comments.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Comments</Label>
                  <div className="mt-2 space-y-2">
                    {selectedRequest.comments.map((comment) => {
                      const commenter = getUser(comment.userId);
                      return (
                        <div key={comment.id} className="rounded-lg bg-muted p-3">
                          <p className="text-sm">{comment.content}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {commenter?.firstName} {commenter?.lastName} • {formatDate(comment.createdAt)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              if (selectedRequest) handleOpenUpdateDialog(selectedRequest);
            }}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Request</DialogTitle>
            <DialogDescription>Update the status and assignment for this request</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={updateStatus}
                onValueChange={(value: MaintenanceStatus) => setUpdateStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignTo">Assign To</Label>
              <Select value={assignTo} onValueChange={setAssignTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {getLandlords().map((landlord) => (
                    <SelectItem key={landlord.id} value={landlord.id}>
                      {landlord.firstName} {landlord.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Add Note (Optional)</Label>
              <Textarea
                id="note"
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
                placeholder="Add a note about this update..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRequest}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
