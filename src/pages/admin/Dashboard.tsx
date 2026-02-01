import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout, adminNavItems } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { dashboardApi } from '@/lib/api';
import { mockActivities, formatCurrency, formatDate } from '@/lib/mock-data';
import type { AdminDashboardStats, Activity } from '@/types';
import { 
  Building2, 
  Home, 
  Users, 
  CreditCard, 
  FileText, 
  Wrench,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';

function DashboardHome() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, activitiesRes] = await Promise.all([
          dashboardApi.getAdminStats(),
          dashboardApi.getActivities(10),
        ]);
        if (statsRes.success) setStats(statsRes.data);
        if (activitiesRes.success) setActivities(activitiesRes.data);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
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
      title: 'Total Properties',
      value: stats?.totalProperties || 0,
      icon: Building2,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Total Units',
      value: stats?.totalUnits || 0,
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
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: CreditCard,
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
    {
      title: 'Overdue Payments',
      value: stats?.overduePayments || 0,
      icon: AlertCircle,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      {/* Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`mt-1 rounded-full p-1.5 ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <QuickAction 
                icon={Users} 
                label="Add User" 
                href="/admin/users/new" 
              />
              <QuickAction 
                icon={Building2} 
                label="Add Property" 
                href="/admin/properties/new" 
              />
              <QuickAction 
                icon={FileText} 
                label="Review Applications" 
                href="/admin/applications" 
              />
              <QuickAction 
                icon={CreditCard} 
                label="Record Payment" 
                href="/admin/payments/new" 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, href }: { icon: typeof Users; label: string; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}

function getActivityIcon(type: Activity['type']) {
  const iconClass = 'h-3 w-3 text-white';
  switch (type) {
    case 'payment_received':
      return <CreditCard className={iconClass} />;
    case 'maintenance_opened':
    case 'maintenance_completed':
      return <Wrench className={iconClass} />;
    case 'application_submitted':
    case 'application_approved':
      return <FileText className={iconClass} />;
    case 'lease_created':
      return <FileText className={iconClass} />;
    case 'user_created':
      return <Users className={iconClass} />;
    default:
      return <CheckCircle2 className={iconClass} />;
  }
}

function getActivityColor(type: Activity['type']) {
  switch (type) {
    case 'payment_received':
      return 'bg-success';
    case 'maintenance_opened':
      return 'bg-warning';
    case 'maintenance_completed':
      return 'bg-success';
    case 'application_submitted':
      return 'bg-info';
    case 'application_approved':
      return 'bg-success';
    default:
      return 'bg-primary';
  }
}

// Import admin components
import { UserManagement } from '@/components/admin/UserManagement';
import { PropertyManagement } from '@/components/admin/PropertyManagement';
import { ApplicationManagement } from '@/components/admin/ApplicationManagement';
import { LeaseManagement } from '@/components/admin/LeaseManagement';
import { PaymentManagement } from '@/components/admin/PaymentManagement';
import { MaintenanceManagement } from '@/components/admin/MaintenanceManagement';
import { MessagesManagement } from '@/components/admin/MessagesManagement';
import { SettingsManagement } from '@/components/admin/SettingsManagement';

export default function AdminDashboard() {
  return (
    <DashboardLayout navItems={adminNavItems} title="Admin Dashboard">
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="users/*" element={<UserManagement />} />
        <Route path="properties/*" element={<PropertyManagement />} />
        <Route path="applications/*" element={<ApplicationManagement />} />
        <Route path="leases/*" element={<LeaseManagement />} />
        <Route path="payments/*" element={<PaymentManagement />} />
        <Route path="maintenance/*" element={<MaintenanceManagement />} />
        <Route path="messages/*" element={<MessagesManagement />} />
        <Route path="settings/*" element={<SettingsManagement />} />
      </Routes>
    </DashboardLayout>
  );
}
