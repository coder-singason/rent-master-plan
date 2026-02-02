import { useState, useMemo, useEffect } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from 'recharts';
import { TrendingUp, TrendingDown, Building2, CreditCard, Users, CalendarIcon, GitCompare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi, propertiesApi, unitsApi, paymentsApi, leasesApi, applicationsApi, maintenanceApi, usersApi } from '@/lib/api';
import type { Property, Unit, Payment, Lease, Application, MaintenanceRequest, User } from '@/types';

const formatCurrency = (value: number) => `KES ${(value / 1000).toFixed(0)}K`;
const formatCurrencyFull = (value: number) => `KES ${(value / 1000000).toFixed(2)}M`;

// Generate dynamic occupancy data from real units
const generateOccupancyData = (units: Unit[], dateRange?: { start: Date; end: Date }) => {
  const currentYear = new Date().getFullYear();
  const monthlyData = [];
  
  // Generate data for the last 12 months
  for (let i = 11; i >= 0; i--) {
    const monthDate = subMonths(new Date(), i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    // For demo purposes, simulate occupancy trends based on current data
    const currentOccupancyRate = units.length > 0 
      ? (units.filter(u => u.status === 'occupied').length / units.length) * 100 
      : 0;
    
    // Add some variation to make it realistic
    const variation = Math.sin((11 - i) * 0.5) * 5;
    const occupancy = Math.max(0, Math.min(100, currentOccupancyRate + variation));
    
    monthlyData.push({
      month: format(monthDate, 'MMM'),
      monthNum: monthDate.getMonth(),
      occupancy: Math.round(occupancy),
      available: Math.round(100 - occupancy),
      date: monthDate,
    });
  }
  
  return monthlyData;
};

// Generate dynamic payment data from real payments
const generatePaymentData = (payments: Payment[], dateRange?: { start: Date; end: Date }) => {
  const currentYear = new Date().getFullYear();
  const monthlyData = [];
  
  // Generate data for the last 12 months
  for (let i = 11; i >= 0; i--) {
    const monthDate = subMonths(new Date(), i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    // Filter payments for this month
    const monthPayments = payments.filter(p => {
      const paymentDate = new Date(p.dueDate);
      return paymentDate >= monthStart && paymentDate <= monthEnd;
    });
    
    const collected = monthPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const pending = monthPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const overdue = monthPayments
      .filter(p => p.status === 'overdue')
      .reduce((sum, p) => sum + p.amount, 0);
    
    monthlyData.push({
      month: format(monthDate, 'MMM'),
      monthNum: monthDate.getMonth(),
      collected,
      pending,
      overdue,
      date: monthDate,
    });
  }
  
  return monthlyData;
};

// Generate unit type distribution from real units
const generateUnitTypeData = (units: Unit[]) => {
  const typeCounts = units.reduce((acc, unit) => {
    acc[unit.type] = (acc[unit.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];
  
  return Object.entries(typeCounts).map(([name, value], index) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
    value,
    color: colors[index % colors.length],
  }));
};

// Generate property performance data from real properties and units
const generatePropertyPerformanceData = (properties: Property[], units: Unit[], leases: Lease[]) => {
  return properties.map(property => {
    const propertyUnits = units.filter(u => u.propertyId === property.id);
    const occupiedUnits = propertyUnits.filter(u => u.status === 'occupied');
    const occupancyRate = propertyUnits.length > 0 
      ? (occupiedUnits.length / propertyUnits.length) * 100 
      : 0;
    
    // Calculate revenue from active leases for this property
    const propertyLeases = leases.filter(l => {
      const leaseUnit = units.find(u => u.id === l.unitId);
      return leaseUnit?.propertyId === property.id && l.status === 'active';
    });
    
    const monthlyRevenue = propertyLeases.reduce((sum, lease) => sum + lease.rentAmount, 0);
    
    return {
      name: property.name,
      occupancy: Math.round(occupancyRate),
      revenue: monthlyRevenue,
    };
  });
};

interface ComparisonStatCardProps {
  title: string;
  currentValue: string;
  compareValue?: string;
  change: number;
  icon: React.ElementType;
  isComparing: boolean;
}

function ComparisonStatCard({ title, currentValue, compareValue, change, icon: Icon, isComparing }: ComparisonStatCardProps) {
  const trend = change >= 0 ? 'up' : 'down';
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{currentValue}</p>
              {isComparing && (
                <Badge variant="outline" className="text-xs">Current</Badge>
              )}
            </div>
            {isComparing && compareValue && (
              <div className="flex items-center gap-2">
                <p className="text-lg text-muted-foreground">{compareValue}</p>
                <Badge variant="secondary" className="text-xs">Compare</Badge>
              </div>
            )}
            <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-success' : 'text-destructive'}`}>
              {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{Math.abs(change).toFixed(1)}% {isComparing ? 'difference' : 'vs previous'}</span>
            </div>
          </div>
          <div className="rounded-lg bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DateRangePickerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  label?: string;
  color?: string;
}

function DateRangePicker({ startDate, endDate, onStartDateChange, onEndDateChange, label, color }: DateRangePickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && (
        <Badge variant="outline" className={cn("mr-1", color)}>
          {label}
        </Badge>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[140px] justify-start text-left font-normal",
              !startDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDate ? format(startDate, "MMM yyyy") : "Start"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={onStartDateChange}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
      <span className="text-muted-foreground">to</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[140px] justify-start text-left font-normal",
              !endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {endDate ? format(endDate, "MMM yyyy") : "End"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={onEndDateChange}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function QuickRangeButtons({ onSelect, activeRange }: { onSelect: (months: number) => void; activeRange: number }) {
  const ranges = [
    { label: '3M', months: 3 },
    { label: '6M', months: 6 },
    { label: '12M', months: 12 },
  ];

  return (
    <div className="flex gap-1">
      {ranges.map(({ label, months }) => (
        <Button
          key={months}
          variant={activeRange === months ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(months)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}

function filterData<T extends { date: Date }>(data: T[], startDate: Date | undefined, endDate: Date | undefined): T[] {
  if (!startDate || !endDate) return data;
  return data.filter(item => 
    isWithinInterval(item.date, { start: startOfMonth(startDate), end: endOfMonth(endDate) })
  );
}

function calculateStats(occupancyData, paymentData) {
  const avgOccupancy = occupancyData.length > 0
    ? occupancyData.reduce((sum, item) => sum + item.occupancy, 0) / occupancyData.length
    : 0;

  const totalRevenue = paymentData.reduce((sum, item) => sum + item.collected, 0);
  const totalPending = paymentData.reduce((sum, item) => sum + item.pending, 0);
  const totalOverdue = paymentData.reduce((sum, item) => sum + item.overdue, 0);
  const totalExpected = totalRevenue + totalPending + totalOverdue;
  const collectionRate = totalExpected > 0 ? (totalRevenue / totalExpected) * 100 : 0;

  const latestPayment = paymentData.length > 0 ? paymentData[paymentData.length - 1] : null;

  return {
    avgOccupancy,
    totalRevenue,
    collectionRate,
    latestCollected: latestPayment?.collected || 0,
    latestPending: latestPayment?.pending || 0,
    latestOverdue: latestPayment?.overdue || 0,
  };
}

export default function DashboardAnalytics() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  
  // State for dynamic data
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Primary date range
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(currentYear, 6, 1));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(currentYear, 11, 31));
  const [activeQuickRange, setActiveQuickRange] = useState<number>(6);
  
  // Comparison mode
  const [isComparing, setIsComparing] = useState(false);
  const [compareStartDate, setCompareStartDate] = useState<Date | undefined>(new Date(currentYear, 0, 1));
  const [compareEndDate, setCompareEndDate] = useState<Date | undefined>(new Date(currentYear, 5, 30));

  // Load data based on user role
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        if (user.role === 'admin') {
          // Admin sees all data
          const [propsRes, unitsRes, paymentsRes, leasesRes, appsRes, maintRes, usersRes] = await Promise.all([
            propertiesApi.getAll(),
            unitsApi.getAll(),
            paymentsApi.getAll(),
            leasesApi.getAll(),
            applicationsApi.getAll(),
            maintenanceApi.getAll(),
            usersApi.getAll(),
          ]);
          
          setProperties(propsRes.data || []);
          setUnits(unitsRes.data || []);
          setPayments(paymentsRes.data || []);
          setLeases(leasesRes.data || []);
          setApplications(appsRes.data || []);
          setMaintenance(maintRes.data || []);
          setAllUsers(usersRes.data || []);
          
        } else if (user.role === 'landlord') {
          // Landlord sees only their data
          const [propsRes, unitsRes, paymentsRes, leasesRes, appsRes, maintRes] = await Promise.all([
            propertiesApi.getAll(),
            unitsApi.getAll(),
            paymentsApi.getAll(),
            leasesApi.getAll(),
            applicationsApi.getAll(),
            maintenanceApi.getAll(),
          ]);
          
          const myProperties = (propsRes.data || []).filter(p => p.landlordId === user.id);
          const myPropertyIds = myProperties.map(p => p.id);
          const myUnits = (unitsRes.data || []).filter(u => myPropertyIds.includes(u.propertyId));
          const myUnitIds = myUnits.map(u => u.id);
          
          setProperties(myProperties);
          setUnits(myUnits);
          setPayments((paymentsRes.data || []).filter(p => {
            const lease = leasesRes.data?.find(l => l.id === p.leaseId);
            return lease && myUnitIds.includes(lease.unitId);
          }));
          setLeases((leasesRes.data || []).filter(l => myUnitIds.includes(l.unitId)));
          setApplications((appsRes.data || []).filter(a => myUnitIds.includes(a.unitId)));
          setMaintenance((maintRes.data || []).filter(m => myUnitIds.includes(m.unitId)));
          
        } else {
          // Tenant sees only their data
          const [leasesRes, paymentsRes, maintRes] = await Promise.all([
            leasesApi.getAll(),
            paymentsApi.getAll(),
            maintenanceApi.getAll(),
          ]);
          
          const myLeases = (leasesRes.data || []).filter(l => l.tenantId === user.id);
          const myUnitIds = myLeases.map(l => l.unitId);
          
          setProperties([]);
          setUnits([]);
          setLeases(myLeases);
          setPayments((paymentsRes.data || []).filter(p => myLeases.some(l => l.id === p.leaseId)));
          setApplications([]);
          setMaintenance((maintRes.data || []).filter(m => m.tenantId === user.id));
        }
        
      } catch (error) {
        console.error('Failed to load analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Generate dynamic data
  const occupancyData = useMemo(() => generateOccupancyData(units), [units]);
  const paymentData = useMemo(() => generatePaymentData(payments), [payments]);
  const unitTypeData = useMemo(() => generateUnitTypeData(units), [units]);
  const propertyPerformanceData = useMemo(() => generatePropertyPerformanceData(properties, units, leases), [properties, units, leases]);

  const handleQuickRangeSelect = (months: number) => {
    const now = new Date();
    const end = endOfMonth(now);
    const start = startOfMonth(subMonths(now, months - 1));
    setStartDate(start);
    setEndDate(end);
    setActiveQuickRange(months);
    
    // Auto-set comparison period to previous equivalent period
    if (isComparing) {
      const compareEnd = startOfMonth(subMonths(start, 1));
      const compareStart = startOfMonth(subMonths(compareEnd, months - 1));
      setCompareStartDate(compareStart);
      setCompareEndDate(endOfMonth(compareEnd));
    }
  };

  // Filter data
  const filteredOccupancyData = useMemo(() => filterData(occupancyData, startDate, endDate), [occupancyData, startDate, endDate]);
  const filteredPaymentData = useMemo(() => filterData(paymentData, startDate, endDate), [paymentData, startDate, endDate]);
  const compareOccupancyData = useMemo(() => filterData(occupancyData, compareStartDate, compareEndDate), [occupancyData, compareStartDate, compareEndDate]);
  const comparePaymentData = useMemo(() => filterData(paymentData, compareStartDate, compareEndDate), [paymentData, compareStartDate, compareEndDate]);

  // Calculate stats
  const currentStats = useMemo(() => calculateStats(filteredOccupancyData, filteredPaymentData), [filteredOccupancyData, filteredPaymentData]);
  const compareStats = useMemo(() => calculateStats(compareOccupancyData, comparePaymentData), [compareOccupancyData, comparePaymentData]);

  // Calculate differences
  const occupancyDiff = compareStats.avgOccupancy > 0 
    ? ((currentStats.avgOccupancy - compareStats.avgOccupancy) / compareStats.avgOccupancy) * 100 
    : 0;
  const revenueDiff = compareStats.totalRevenue > 0 
    ? ((currentStats.totalRevenue - compareStats.totalRevenue) / compareStats.totalRevenue) * 100 
    : 0;
  const collectionDiff = compareStats.collectionRate > 0 
    ? ((currentStats.collectionRate - compareStats.collectionRate) / compareStats.collectionRate) * 100 
    : 0;

  // Prepare comparison chart data
  const comparisonOccupancyChartData = useMemo(() => {
    if (!isComparing) return filteredOccupancyData;
    
    const maxLength = Math.max(filteredOccupancyData.length, compareOccupancyData.length);
    return Array.from({ length: maxLength }, (_, i) => ({
      period: `Period ${i + 1}`,
      current: filteredOccupancyData[i]?.occupancy || null,
      compare: compareOccupancyData[i]?.occupancy || null,
      currentMonth: filteredOccupancyData[i]?.month || '',
      compareMonth: compareOccupancyData[i]?.month || '',
    }));
  }, [filteredOccupancyData, compareOccupancyData, isComparing]);

  const comparisonPaymentChartData = useMemo(() => {
    if (!isComparing) return filteredPaymentData;
    
    const maxLength = Math.max(filteredPaymentData.length, comparePaymentData.length);
    return Array.from({ length: maxLength }, (_, i) => ({
      period: `Period ${i + 1}`,
      currentCollected: filteredPaymentData[i]?.collected || null,
      compareCollected: comparePaymentData[i]?.collected || null,
      currentMonth: filteredPaymentData[i]?.month || '',
      compareMonth: comparePaymentData[i]?.month || '',
    }));
  }, [filteredPaymentData, comparePaymentData, isComparing]);

  const latestTotal = currentStats.latestCollected + currentStats.latestPending + currentStats.latestOverdue;
  const collectedPercent = latestTotal > 0 ? (currentStats.latestCollected / latestTotal) * 100 : 0;
  const pendingPercent = latestTotal > 0 ? (currentStats.latestPending / latestTotal) * 100 : 0;
  const overduePercent = latestTotal > 0 ? (currentStats.latestOverdue / latestTotal) * 100 : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-64 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (properties.length === 0 && units.length === 0 && payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">No Data Available</h3>
          <p className="text-muted-foreground">
            {user?.role === 'admin' 
              ? "Generate sample data or add properties, units, and leases to see analytics."
              : user?.role === 'landlord'
              ? "Add properties and units to see your analytics."
              : "Your analytics will appear once you have active leases."
            }
          </p>
          {user?.role === 'admin' && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">
                Tip: Go to Settings → System → Generate Comprehensive Sample Data
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Track occupancy trends and payment performance</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="compare-mode"
                checked={isComparing}
                onCheckedChange={setIsComparing}
              />
              <Label htmlFor="compare-mode" className="flex items-center gap-2 cursor-pointer">
                <GitCompare className="h-4 w-4" />
                Compare Periods
              </Label>
            </div>
            <QuickRangeButtons onSelect={handleQuickRangeSelect} activeRange={activeQuickRange} />
          </div>
        </div>

        {/* Date Range Pickers */}
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={(d) => { setStartDate(d); setActiveQuickRange(0); }}
            onEndDateChange={(d) => { setEndDate(d); setActiveQuickRange(0); }}
            label="Current"
            color="bg-primary/10 text-primary border-primary/20"
          />
          
          {isComparing && (
            <DateRangePicker
              startDate={compareStartDate}
              endDate={compareEndDate}
              onStartDateChange={setCompareStartDate}
              onEndDateChange={setCompareEndDate}
              label="Compare"
              color="bg-secondary text-secondary-foreground"
            />
          )}
          
          <p className="text-sm text-muted-foreground">
            Current: {filteredOccupancyData.length} months
            {isComparing && ` • Compare: ${compareOccupancyData.length} months`}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ComparisonStatCard
          title="Avg. Occupancy Rate"
          currentValue={`${currentStats.avgOccupancy.toFixed(1)}%`}
          compareValue={isComparing ? `${compareStats.avgOccupancy.toFixed(1)}%` : undefined}
          change={isComparing ? occupancyDiff : occupancyDiff}
          icon={Building2}
          isComparing={isComparing}
        />
        <ComparisonStatCard
          title="Total Revenue"
          currentValue={formatCurrencyFull(currentStats.totalRevenue)}
          compareValue={isComparing ? formatCurrencyFull(compareStats.totalRevenue) : undefined}
          change={isComparing ? revenueDiff : revenueDiff}
          icon={CreditCard}
          isComparing={isComparing}
        />
        <ComparisonStatCard
          title="Collection Rate"
          currentValue={`${currentStats.collectionRate.toFixed(1)}%`}
          compareValue={isComparing ? `${compareStats.collectionRate.toFixed(1)}%` : undefined}
          change={isComparing ? collectionDiff : 1.2}
          icon={TrendingUp}
          isComparing={isComparing}
        />
        <ComparisonStatCard
          title="Active Tenants"
          currentValue={allUsers.filter(u => u.role === 'tenant' && u.status === 'active').length.toString()}
          compareValue={isComparing ? allUsers.filter(u => u.role === 'tenant' && u.status === 'active').length.toString() : undefined}
          change={isComparing ? 3.3 : -0.8}
          icon={Users}
          isComparing={isComparing}
        />
      </div>

      {/* Main Charts */}
      <Tabs defaultValue="occupancy" className="space-y-4">
        <TabsList>
          <TabsTrigger value="occupancy">Occupancy Trends</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="properties">Property Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="occupancy" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Occupancy Rate Over Time
                  {isComparing && <Badge variant="secondary">Comparison View</Badge>}
                </CardTitle>
                <CardDescription>
                  {isComparing 
                    ? "Side-by-side comparison of occupancy rates"
                    : "Monthly occupancy percentage across all properties"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  {isComparing ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonOccupancyChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="period" className="text-xs" />
                        <YAxis domain={[70, 100]} tickFormatter={(v) => `${v}%`} className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number, name: string) => [
                            value ? `${value}%` : 'N/A',
                            name === 'current' ? 'Current Period' : 'Compare Period'
                          ]}
                          labelFormatter={(_, payload) => {
                            if (payload && payload[0]) {
                              const data = payload[0].payload;
                              return `${data.currentMonth || '—'} vs ${data.compareMonth || '—'}`;
                            }
                            return '';
                          }}
                        />
                        <Legend />
                        <Bar dataKey="current" name="Current Period" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="compare" name="Compare Period" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={filteredOccupancyData}>
                        <defs>
                          <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis domain={[70, 100]} tickFormatter={(v) => `${v}%`} className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [`${value}%`, 'Occupancy']}
                        />
                        <Area
                          type="monotone"
                          dataKey="occupancy"
                          stroke="hsl(var(--primary))"
                          fill="url(#occupancyGradient)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Unit Type Distribution</CardTitle>
                <CardDescription>Breakdown by bedroom count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={unitTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {unitTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`${value} units`, 'Count']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Payment Collection History
                  {isComparing && <Badge variant="secondary">Comparison View</Badge>}
                </CardTitle>
                <CardDescription>
                  {isComparing 
                    ? "Compare collected payments between periods"
                    : "Monthly breakdown of collected, pending, and overdue payments"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  {isComparing ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={comparisonPaymentChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="period" className="text-xs" />
                        <YAxis tickFormatter={formatCurrency} className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number, name: string) => [
                            value ? formatCurrency(value) : 'N/A',
                            name === 'currentCollected' ? 'Current Period' : 'Compare Period'
                          ]}
                          labelFormatter={(_, payload) => {
                            if (payload && payload[0]) {
                              const data = payload[0].payload;
                              return `${data.currentMonth || '—'} vs ${data.compareMonth || '—'}`;
                            }
                            return '';
                          }}
                        />
                        <Legend />
                        <Bar dataKey="currentCollected" name="Current Period" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="compareCollected" name="Compare Period" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={filteredPaymentData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis tickFormatter={formatCurrency} className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [formatCurrency(value), '']}
                        />
                        <Legend />
                        <Bar dataKey="collected" name="Collected" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="pending" name="Pending" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="overdue" name="Overdue" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Latest Month Status</CardTitle>
                <CardDescription>Payment breakdown for last month in range</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-success" />
                      <span className="text-sm">Collected</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(currentStats.latestCollected)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-success" style={{ width: `${collectedPercent}%` }} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-warning" />
                      <span className="text-sm">Pending</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(currentStats.latestPending)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-warning" style={{ width: `${pendingPercent}%` }} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-destructive" />
                      <span className="text-sm">Overdue</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(currentStats.latestOverdue)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-destructive" style={{ width: `${overduePercent}%` }} />
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Collection Rate</p>
                    <p className="text-3xl font-bold text-success">{collectedPercent.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Performance Comparison</CardTitle>
              <CardDescription>Occupancy rate and revenue by property</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={propertyPerformanceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} className="text-xs" />
                    <YAxis type="category" dataKey="name" width={150} className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => [
                        name === 'occupancy' ? `${value}%` : formatCurrency(value),
                        name === 'occupancy' ? 'Occupancy' : 'Revenue',
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="occupancy" name="Occupancy %" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by Property</CardTitle>
              <CardDescription>Monthly revenue breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {propertyPerformanceData
                  .sort((a, b) => b.revenue - a.revenue)
                  .map((property, index) => (
                    <div key={property.name} className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{property.name}</span>
                          <span className="font-semibold">{formatCurrency(property.revenue)}</span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${(property.revenue / 1680000) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
