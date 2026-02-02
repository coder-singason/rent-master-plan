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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { applicationApi, propertyApi, unitApi, userApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/mock-data';
import type { Application, ApplicationStatus, RecommendationStatus } from '@/types';

interface ApplicationWithDetails extends Application {
  unit: { unitNumber: string; type: string; rentAmount: number };
  property: { name: string; city: string };
  tenant: { firstName: string; lastName: string; email: string; phone: string } | null;
}

const statusConfig: Record<ApplicationStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  approved: { label: 'Approved', variant: 'default', icon: CheckCircle2 },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
  withdrawn: { label: 'Withdrawn', variant: 'outline', icon: AlertCircle },
};

const recommendationConfig: Record<RecommendationStatus, { label: string; color: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: 'Pending Review', color: 'text-muted-foreground', variant: 'secondary' },
  recommended: { label: 'Recommended', color: 'text-success', variant: 'default' },
  not_recommended: { label: 'Not Recommended', color: 'text-destructive', variant: 'destructive' },
};

export default function LandlordApplications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [selectedApp, setSelectedApp] = useState<ApplicationWithDetails | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRecommendDialog, setShowRecommendDialog] = useState(false);
  const [recommendationType, setRecommendationType] = useState<'recommended' | 'not_recommended'>('recommended');
  const [recommendationNotes, setRecommendationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const loadApplications = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        // 1. Get landlord's properties
        const propsRes = await propertyApi.getByLandlord(user.id);
        if (!propsRes.success || !propsRes.data) {
          setApplications([]);
          return;
        }
        const myPropertyIds = propsRes.data.map(p => p.id);

        // 2. Get all units for these properties
        const unitsRes = await unitApi.getAll();
        const allUnits = unitsRes.data || [];
        const myUnits = allUnits.filter(u => myPropertyIds.includes(u.propertyId));
        const myUnitIds = myUnits.map(u => u.id);

        // 3. Get all applications
        const appsRes = await applicationApi.getAll();
        const allApps = appsRes.data || [];

        // 4. Filter to applications for my units
        const myApps = allApps.filter(app => myUnitIds.includes(app.unitId));

        // 5. Get all users for tenant details
        const usersRes = await userApi.getAll();
        const allUsers = usersRes.data || [];

        // 6. Enrich applications
        const enriched: ApplicationWithDetails[] = myApps.map(app => {
          const unit = myUnits.find(u => u.id === app.unitId);
          const property = unit ? propsRes.data?.find(p => p.id === unit.propertyId) : null;
          const tenant = allUsers.find(u => u.id === app.tenantId);

          return {
            ...app,
            unit: unit ? {
              unitNumber: unit.unitNumber,
              type: unit.type,
              rentAmount: unit.rentAmount,
            } : { unitNumber: 'N/A', type: 'N/A', rentAmount: 0 },
            property: property ? {
              name: property.name,
              city: property.city,
            } : { name: 'N/A', city: 'N/A' },
            tenant: tenant ? {
              firstName: tenant.firstName,
              lastName: tenant.lastName,
              email: tenant.email,
              phone: tenant.phone,
            } : null,
          };
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setApplications(enriched);
      } catch (error) {
        console.error('Failed to load applications', error);
        setApplications([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadApplications();
  }, [user, refreshTrigger]);

  const viewDetails = (app: ApplicationWithDetails) => {
    setSelectedApp(app);
    setShowDetailsDialog(true);
  };

  const openRecommendDialog = (app: ApplicationWithDetails, type: 'recommended' | 'not_recommended') => {
    setSelectedApp(app);
    setRecommendationType(type);
    setRecommendationNotes('');
    setShowRecommendDialog(true);
  };

  const handleSubmitRecommendation = async () => {
    if (!selectedApp) return;
    setIsSubmitting(true);

    try {
      const res = await applicationApi.update(selectedApp.id, {
        landlordRecommendation: recommendationType,
        landlordNotes: recommendationNotes || undefined,
      });

      if (res.success) {
        toast({
          title: 'Recommendation Submitted',
          description: `Your ${recommendationType === 'recommended' ? 'approval' : 'rejection'} recommendation has been sent to the admin.`,
        });
        setShowRecommendDialog(false);
        setRefreshTrigger(prev => prev + 1); // Refresh data
      } else {
        toast({ title: 'Error', description: 'Failed to submit recommendation', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to submit recommendation', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'pending' && a.landlordRecommendation === 'pending').length,
    reviewed: applications.filter((a) => a.landlordRecommendation !== 'pending').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Tenant Applications</h2>
        <p className="text-muted-foreground">Review applications and provide recommendations to admin</p>
      </div>

      {/* Info Card */}
      <Card className="border-info bg-info/5">
        <CardContent className="flex items-start gap-4 p-4">
          <div className="rounded-lg bg-info/10 p-2">
            <AlertCircle className="h-5 w-5 text-info" />
          </div>
          <div>
            <h4 className="font-semibold">Recommendation Only</h4>
            <p className="text-sm text-muted-foreground">
              As a landlord, you can recommend approving or rejecting applications.
              Final decisions are made by the system administrator.
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
                <p className="text-sm text-muted-foreground">Total Applications</p>
                <p className="text-2xl font-bold">{stats.total}</p>
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
                <p className="text-sm text-muted-foreground">Awaiting Review</p>
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
                <p className="text-sm text-muted-foreground">Reviewed</p>
                <p className="text-2xl font-bold">{stats.reviewed}</p>
              </div>
              <div className="rounded-lg bg-success/10 p-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No applications</h3>
              <p className="text-muted-foreground">
                Applications for your properties will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Property / Unit</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Your Recommendation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => {
                    const status = statusConfig[app.status];
                    const recommendation = recommendationConfig[app.landlordRecommendation];
                    const StatusIcon = status.icon;
                    const canRecommend = app.status === 'pending' && app.landlordRecommendation === 'pending';

                    return (
                      <TableRow key={app.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {app.tenant ? `${app.tenant.firstName} ${app.tenant.lastName}` : 'Unknown'}
                            </p>
                            <p className="text-sm text-muted-foreground">{app.tenant?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{app.property.name}</p>
                            <p className="text-sm text-muted-foreground">Unit {app.unit.unitNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(app.unit.rentAmount)}/mo</TableCell>
                        <TableCell>{formatDate(app.createdAt)}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={recommendation.variant}>
                            {recommendation.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => viewDetails(app)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canRecommend && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-success hover:text-success"
                                  onClick={() => openRecommendDialog(app, 'recommended')}
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => openRecommendDialog(app, 'not_recommended')}
                                >
                                  <ThumbsDown className="h-4 w-4" />
                                </Button>
                              </>
                            )}
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
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              {selectedApp && `${selectedApp.property.name} - Unit ${selectedApp.unit.unitNumber}`}
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="mb-2 font-semibold">Applicant Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">
                      {selectedApp.tenant ? `${selectedApp.tenant.firstName} ${selectedApp.tenant.lastName}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedApp.tenant?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedApp.tenant?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Move-in Date</p>
                    <p className="font-medium">{formatDate(selectedApp.moveInDate)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="mb-2 font-semibold">Financial Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Employment</p>
                    <p className="font-medium">{selectedApp.employmentStatus}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Monthly Income</p>
                    <p className="font-medium">{formatCurrency(selectedApp.monthlyIncome)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Requested Rent</p>
                    <p className="font-medium">{formatCurrency(selectedApp.unit.rentAmount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Income to Rent Ratio</p>
                    <p className="font-medium">
                      {(selectedApp.monthlyIncome / selectedApp.unit.rentAmount).toFixed(1)}x
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="mb-2 font-semibold">Emergency Contact</h4>
                <p className="text-sm">
                  {selectedApp.emergencyContact} - {selectedApp.emergencyPhone}
                </p>
              </div>

              {selectedApp.landlordNotes && (
                <div className="rounded-lg border p-4">
                  <h4 className="mb-2 font-semibold">Your Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedApp.landlordNotes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Recommendation Dialog */}
      <Dialog open={showRecommendDialog} onOpenChange={setShowRecommendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {recommendationType === 'recommended' ? 'Recommend Approval' : 'Recommend Rejection'}
            </DialogTitle>
            <DialogDescription>
              Your recommendation will be sent to the administrator for final decision.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm">
                <span className="font-medium">Applicant:</span>{' '}
                {selectedApp?.tenant ? `${selectedApp.tenant.firstName} ${selectedApp.tenant.lastName}` : 'N/A'}
              </p>
              <p className="text-sm">
                <span className="font-medium">Property:</span>{' '}
                {selectedApp?.property.name} - Unit {selectedApp?.unit.unitNumber}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Notes for Admin (Optional)</Label>
              <Textarea
                value={recommendationNotes}
                onChange={(e) => setRecommendationNotes(e.target.value)}
                placeholder={
                  recommendationType === 'recommended'
                    ? 'e.g., Verified employment, good references...'
                    : 'e.g., Income insufficient, could not verify employment...'
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecommendDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRecommendation}
              disabled={isSubmitting}
              variant={recommendationType === 'recommended' ? 'default' : 'destructive'}
            >
              {isSubmitting ? 'Submitting...' : recommendationType === 'recommended' ? 'Recommend Approval' : 'Recommend Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
