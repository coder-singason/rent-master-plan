import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileText, Clock, CheckCircle2, XCircle, Eye, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { mockApplications, mockUnits, mockProperties, formatCurrency, formatDate } from '@/lib/mock-data';
import type { Application, ApplicationStatus, RecommendationStatus } from '@/types';

interface ApplicationWithDetails extends Application {
  unit: {
    unitNumber: string;
    type: string;
    rentAmount: number;
  };
  property: {
    name: string;
    address: string;
    city: string;
  };
}

const statusConfig: Record<ApplicationStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  approved: { label: 'Approved', variant: 'default', icon: CheckCircle2 },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
  withdrawn: { label: 'Withdrawn', variant: 'outline', icon: AlertCircle },
};

const recommendationConfig: Record<RecommendationStatus, { label: string; color: string }> = {
  pending: { label: 'Pending Review', color: 'text-muted-foreground' },
  recommended: { label: 'Recommended', color: 'text-success' },
  not_recommended: { label: 'Not Recommended', color: 'text-destructive' },
};

export default function TenantApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithDetails | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    // Filter applications for the current tenant
    const tenantApplications = mockApplications
      .filter((app) => app.tenantId === user?.id || app.tenantId === 'tenant-001')
      .map((app) => {
        const unit = mockUnits.find((u) => u.id === app.unitId);
        const property = unit ? mockProperties.find((p) => p.id === unit.propertyId) : null;
        return {
          ...app,
          unit: unit ? {
            unitNumber: unit.unitNumber,
            type: unit.type,
            rentAmount: unit.rentAmount,
          } : { unitNumber: 'N/A', type: 'N/A', rentAmount: 0 },
          property: property ? {
            name: property.name,
            address: property.address,
            city: property.city,
          } : { name: 'N/A', address: 'N/A', city: 'N/A' },
        };
      });

    setApplications(tenantApplications);
  }, [user]);

  const viewDetails = (application: ApplicationWithDetails) => {
    setSelectedApplication(application);
    setShowDetailsDialog(true);
  };

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    approved: applications.filter((a) => a.status === 'approved').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Applications</h2>
        <p className="text-muted-foreground">Track the status of your rental applications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
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
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
              <div className="rounded-lg bg-destructive/10 p-2">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>Application History</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No applications yet</h3>
              <p className="text-muted-foreground">
                Browse available listings and submit your first application
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Landlord Review</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => {
                    const status = statusConfig[application.status];
                    const StatusIcon = status.icon;
                    const recommendation = recommendationConfig[application.landlordRecommendation];

                    return (
                      <TableRow key={application.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{application.property.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {application.property.city}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">Unit {application.unit.unitNumber}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {application.unit.type}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {formatCurrency(application.unit.rentAmount)}
                          </span>
                          <span className="text-sm text-muted-foreground">/mo</span>
                        </TableCell>
                        <TableCell>{formatDate(application.createdAt)}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={recommendation.color}>{recommendation.label}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewDetails(application)}
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Button>
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
              {selectedApplication && (
                <>
                  {selectedApplication.property.name} - Unit {selectedApplication.unit.unitNumber}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={statusConfig[selectedApplication.status].variant}>
                    {statusConfig[selectedApplication.status].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Rent</p>
                  <p className="font-semibold">
                    {formatCurrency(selectedApplication.unit.rentAmount)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Applied On</p>
                  <p className="font-medium">{formatDate(selectedApplication.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Preferred Move-in</p>
                  <p className="font-medium">{formatDate(selectedApplication.moveInDate)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Employment Status</p>
                <p className="font-medium">{selectedApplication.employmentStatus}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Monthly Income</p>
                <p className="font-medium">{formatCurrency(selectedApplication.monthlyIncome)}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Emergency Contact</p>
                <p className="font-medium">
                  {selectedApplication.emergencyContact} ({selectedApplication.emergencyPhone})
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Landlord Recommendation</p>
                <p className={`font-medium ${recommendationConfig[selectedApplication.landlordRecommendation].color}`}>
                  {recommendationConfig[selectedApplication.landlordRecommendation].label}
                </p>
                {selectedApplication.landlordNotes && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    "{selectedApplication.landlordNotes}"
                  </p>
                )}
              </div>

              {selectedApplication.adminNotes && (
                <div>
                  <p className="text-sm text-muted-foreground">Admin Notes</p>
                  <p className="text-sm">{selectedApplication.adminNotes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
