import { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { DashboardLayout, tenantNavItems } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/mock-data';
import type { TenantDashboardStats } from '@/types';
import {
  Home,
  FileText,
  CreditCard,
  Wrench,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';

// Import tenant components
import TenantListings from '@/components/tenant/TenantListings';
import TenantApplications from '@/components/tenant/TenantApplications';
import TenantLease from '@/components/tenant/TenantLease';
import TenantPayments from '@/components/tenant/TenantPayments';
import TenantMaintenance from '@/components/tenant/TenantMaintenance';
import TenantMessages from '@/components/tenant/TenantMessages';
import TenantSettings from '@/components/tenant/TenantSettings';

function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TenantDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const statsRes = await dashboardApi.getTenantStats(user.id);
        if (statsRes.success) setStats(statsRes.data);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-20 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome back, {user?.firstName}!</CardTitle>
          <CardDescription>
            Here's an overview of your rental status
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Lease Status */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lease Status</p>
                {stats?.currentLease ? (
                  <Badge className="mt-1" variant="default">Active</Badge>
                ) : (
                  <Badge className="mt-1" variant="secondary">No Active Lease</Badge>
                )}
              </div>
              <div className="rounded-lg bg-primary/10 p-3">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Payment */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Next Payment</p>
                {stats?.nextPaymentDue ? (
                  <>
                    <p className="mt-1 text-lg font-bold">
                      {formatCurrency(stats.nextPaymentDue.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due: {formatDate(stats.nextPaymentDue.dueDate)}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm">No payment due</p>
                )}
              </div>
              <div className="rounded-lg bg-success/10 p-3">
                <CreditCard className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Open Maintenance */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Requests</p>
                <p className="mt-1 text-2xl font-bold">
                  {stats?.openMaintenanceRequests || 0}
                </p>
              </div>
              <div className="rounded-lg bg-warning/10 p-3">
                <Wrench className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unread Messages */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unread Messages</p>
                <p className="mt-1 text-2xl font-bold">
                  {stats?.unreadMessages || 0}
                </p>
              </div>
              <div className="rounded-lg bg-info/10 p-3">
                <MessageSquare className="h-5 w-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Lease Details */}
      {stats?.currentLease && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Lease</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Rent</p>
                <p className="font-semibold">{formatCurrency(stats.currentLease.rentAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-semibold">{formatDate(stats.currentLease.startDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-semibold">{formatDate(stats.currentLease.endDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Frequency</p>
                <p className="font-semibold capitalize">{stats.currentLease.paymentFrequency}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <Link to="/tenant/listings">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Browse Listings</h3>
                <p className="text-sm text-muted-foreground">Find your next home</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <Link to="/tenant/maintenance">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-warning/10 p-3">
                <Wrench className="h-6 w-6 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Submit Request</h3>
                <p className="text-sm text-muted-foreground">Report a maintenance issue</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <Link to="/tenant/messages">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-info/10 p-3">
                <MessageSquare className="h-6 w-6 text-info" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Contact Landlord</h3>
                <p className="text-sm text-muted-foreground">Send a message</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}

export default function TenantDashboard() {
  return (
    <DashboardLayout navItems={tenantNavItems} title="Tenant Dashboard">
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="listings/*" element={<TenantListings />} />
        <Route path="applications/*" element={<TenantApplications />} />
        <Route path="lease/*" element={<TenantLease />} />
        <Route path="payments/*" element={<TenantPayments />} />
        <Route path="maintenance/*" element={<TenantMaintenance />} />
        <Route path="messages/*" element={<TenantMessages />} />
        <Route path="settings" element={<TenantSettings />} />
      </Routes>
    </DashboardLayout>
  );
}
