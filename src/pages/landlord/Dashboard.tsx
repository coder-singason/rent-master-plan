import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout, landlordNavItems } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi } from '@/lib/api';
import type { LandlordDashboardStats } from '@/types';
import { 
  Building2, 
  Home, 
  FileText, 
  Wrench,
  TrendingUp,
  Clock
} from 'lucide-react';

function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState<LandlordDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const statsRes = await dashboardApi.getLandlordStats(user.id);
        if (statsRes.success) setStats(statsRes.data);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-20 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'My Properties',
      value: stats?.myProperties || 0,
      icon: Building2,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Total Units',
      value: stats?.myUnits || 0,
      icon: Home,
      color: 'text-info',
      bg: 'bg-info/10',
    },
    {
      title: 'Occupancy Rate',
      value: `${(stats?.occupancyRate || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      title: 'Active Leases',
      value: stats?.activeLeases || 0,
      icon: FileText,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Pending Applications',
      value: stats?.pendingApplications || 0,
      icon: Clock,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      title: 'Open Maintenance',
      value: stats?.openMaintenanceRequests || 0,
      icon: Wrench,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`rounded-lg p-3 ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user?.firstName}!</CardTitle>
          <CardDescription>
            Manage your properties, review applications, and communicate with tenants.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Full landlord dashboard features coming soon. You'll be able to manage properties, 
            review tenant applications, view payment statuses, and handle maintenance requests.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Placeholder pages
function PropertiesPage() {
  return <div><h2 className="text-2xl font-bold mb-4">My Properties</h2><p className="text-muted-foreground">Property management interface coming soon...</p></div>;
}
function ApplicationsPage() {
  return <div><h2 className="text-2xl font-bold mb-4">Tenant Applications</h2><p className="text-muted-foreground">Applications interface coming soon...</p></div>;
}
function LeasesPage() {
  return <div><h2 className="text-2xl font-bold mb-4">Leases</h2><p className="text-muted-foreground">Leases interface coming soon...</p></div>;
}
function PaymentsPage() {
  return <div><h2 className="text-2xl font-bold mb-4">Payment Status</h2><p className="text-muted-foreground">Payment status interface coming soon...</p></div>;
}
function MaintenancePage() {
  return <div><h2 className="text-2xl font-bold mb-4">Maintenance Requests</h2><p className="text-muted-foreground">Maintenance interface coming soon...</p></div>;
}
function MessagesPage() {
  return <div><h2 className="text-2xl font-bold mb-4">Messages</h2><p className="text-muted-foreground">Messaging interface coming soon...</p></div>;
}

export default function LandlordDashboard() {
  return (
    <DashboardLayout navItems={landlordNavItems} title="Landlord Dashboard">
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="properties/*" element={<PropertiesPage />} />
        <Route path="applications/*" element={<ApplicationsPage />} />
        <Route path="leases/*" element={<LeasesPage />} />
        <Route path="payments/*" element={<PaymentsPage />} />
        <Route path="maintenance/*" element={<MaintenancePage />} />
        <Route path="messages/*" element={<MessagesPage />} />
      </Routes>
    </DashboardLayout>
  );
}
