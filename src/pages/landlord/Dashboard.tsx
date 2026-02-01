import { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
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
  Clock,
  ArrowRight,
  MessageSquare,
  CreditCard,
} from 'lucide-react';

// Import landlord components
import LandlordProperties from '@/components/landlord/LandlordProperties';
import LandlordApplications from '@/components/landlord/LandlordApplications';
import LandlordLeases from '@/components/landlord/LandlordLeases';
import LandlordPayments from '@/components/landlord/LandlordPayments';
import LandlordMaintenance from '@/components/landlord/LandlordMaintenance';
import LandlordMessages from '@/components/landlord/LandlordMessages';

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
      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user?.firstName}!</CardTitle>
          <CardDescription>
            Manage your properties, review applications, and communicate with tenants.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
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

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <Link to="/landlord/properties">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Properties</h3>
                <p className="text-sm text-muted-foreground">Manage units</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <Link to="/landlord/applications">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-warning/10 p-3">
                <FileText className="h-6 w-6 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Applications</h3>
                <p className="text-sm text-muted-foreground">Review tenants</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <Link to="/landlord/maintenance">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-info/10 p-3">
                <Wrench className="h-6 w-6 text-info" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Maintenance</h3>
                <p className="text-sm text-muted-foreground">Handle requests</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <Link to="/landlord/messages">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-success/10 p-3">
                <MessageSquare className="h-6 w-6 text-success" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Messages</h3>
                <p className="text-sm text-muted-foreground">Contact tenants</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}

export default function LandlordDashboard() {
  return (
    <DashboardLayout navItems={landlordNavItems} title="Landlord Dashboard">
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="properties/*" element={<LandlordProperties />} />
        <Route path="applications/*" element={<LandlordApplications />} />
        <Route path="leases/*" element={<LandlordLeases />} />
        <Route path="payments/*" element={<LandlordPayments />} />
        <Route path="maintenance/*" element={<LandlordMaintenance />} />
        <Route path="messages/*" element={<LandlordMessages />} />
      </Routes>
    </DashboardLayout>
  );
}
