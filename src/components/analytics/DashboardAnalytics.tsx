import { useState, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parse } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
} from 'recharts';
import { TrendingUp, TrendingDown, Building2, CreditCard, Users, CalendarIcon } from 'lucide-react';

// Generate full data with dates for filtering
const generateOccupancyData = () => {
  const data = [
    { month: 'Jan', monthNum: 0, occupancy: 85, available: 15 },
    { month: 'Feb', monthNum: 1, occupancy: 87, available: 13 },
    { month: 'Mar', monthNum: 2, occupancy: 89, available: 11 },
    { month: 'Apr', monthNum: 3, occupancy: 88, available: 12 },
    { month: 'May', monthNum: 4, occupancy: 91, available: 9 },
    { month: 'Jun', monthNum: 5, occupancy: 93, available: 7 },
    { month: 'Jul', monthNum: 6, occupancy: 92, available: 8 },
    { month: 'Aug', monthNum: 7, occupancy: 94, available: 6 },
    { month: 'Sep', monthNum: 8, occupancy: 95, available: 5 },
    { month: 'Oct', monthNum: 9, occupancy: 93, available: 7 },
    { month: 'Nov', monthNum: 10, occupancy: 91, available: 9 },
    { month: 'Dec', monthNum: 11, occupancy: 89, available: 11 },
  ];
  
  // Assign dates to each month (using current year for demo)
  const currentYear = new Date().getFullYear();
  return data.map(item => ({
    ...item,
    date: new Date(currentYear, item.monthNum, 1),
  }));
};

const generatePaymentData = () => {
  const data = [
    { month: 'Jan', monthNum: 0, collected: 2450000, pending: 350000, overdue: 120000 },
    { month: 'Feb', monthNum: 1, collected: 2520000, pending: 280000, overdue: 100000 },
    { month: 'Mar', monthNum: 2, collected: 2680000, pending: 320000, overdue: 80000 },
    { month: 'Apr', monthNum: 3, collected: 2590000, pending: 410000, overdue: 150000 },
    { month: 'May', monthNum: 4, collected: 2750000, pending: 250000, overdue: 90000 },
    { month: 'Jun', monthNum: 5, collected: 2880000, pending: 220000, overdue: 70000 },
    { month: 'Jul', monthNum: 6, collected: 2820000, pending: 280000, overdue: 100000 },
    { month: 'Aug', monthNum: 7, collected: 2950000, pending: 200000, overdue: 50000 },
    { month: 'Sep', monthNum: 8, collected: 3020000, pending: 180000, overdue: 40000 },
    { month: 'Oct', monthNum: 9, collected: 2890000, pending: 310000, overdue: 110000 },
    { month: 'Nov', monthNum: 10, collected: 2780000, pending: 350000, overdue: 130000 },
    { month: 'Dec', monthNum: 11, collected: 2650000, pending: 400000, overdue: 160000 },
  ];
  
  const currentYear = new Date().getFullYear();
  return data.map(item => ({
    ...item,
    date: new Date(currentYear, item.monthNum, 1),
  }));
};

const allOccupancyData = generateOccupancyData();
const allPaymentData = generatePaymentData();

// Mock data for unit type distribution
const unitTypeData = [
  { name: 'Studio', value: 15, color: 'hsl(var(--chart-1))' },
  { name: 'Bedsitter', value: 25, color: 'hsl(var(--chart-2))' },
  { name: '1 BR', value: 35, color: 'hsl(var(--chart-3))' },
  { name: '2 BR', value: 18, color: 'hsl(var(--chart-4))' },
  { name: '3+ BR', value: 7, color: 'hsl(var(--chart-5))' },
];

// Mock data for property performance
const propertyPerformanceData = [
  { name: 'Sunrise Apartments', occupancy: 95, revenue: 1250000 },
  { name: 'Garden Estate', occupancy: 88, revenue: 980000 },
  { name: 'City View Complex', occupancy: 92, revenue: 1450000 },
  { name: 'Green Meadows', occupancy: 78, revenue: 650000 },
  { name: 'Lake View Residences', occupancy: 96, revenue: 1680000 },
];

const formatCurrency = (value: number) => {
  return `KES ${(value / 1000).toFixed(0)}K`;
};

const formatCurrencyFull = (value: number) => {
  return `KES ${(value / 1000000).toFixed(2)}M`;
};

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  trend: 'up' | 'down';
}

function StatCard({ title, value, change, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            <div className={`mt-1 flex items-center gap-1 text-sm ${trend === 'up' ? 'text-success' : 'text-destructive'}`}>
              {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{Math.abs(change)}% vs previous period</span>
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
}

function DateRangePicker({ startDate, endDate, onStartDateChange, onEndDateChange }: DateRangePickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[160px] justify-start text-left font-normal",
              !startDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDate ? format(startDate, "MMM yyyy") : "Start date"}
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
              "w-[160px] justify-start text-left font-normal",
              !endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {endDate ? format(endDate, "MMM yyyy") : "End date"}
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

interface QuickRangeButtonsProps {
  onSelect: (months: number) => void;
  activeRange: number;
}

function QuickRangeButtons({ onSelect, activeRange }: QuickRangeButtonsProps) {
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

export default function DashboardAnalytics() {
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(currentYear, 0, 1));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(currentYear, 11, 31));
  const [activeQuickRange, setActiveQuickRange] = useState<number>(12);

  const handleQuickRangeSelect = (months: number) => {
    const now = new Date();
    const end = endOfMonth(now);
    const start = startOfMonth(subMonths(now, months - 1));
    setStartDate(start);
    setEndDate(end);
    setActiveQuickRange(months);
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    setActiveQuickRange(0); // Clear quick range selection
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    setActiveQuickRange(0); // Clear quick range selection
  };

  // Filter data based on date range
  const filteredOccupancyData = useMemo(() => {
    if (!startDate || !endDate) return allOccupancyData;
    
    return allOccupancyData.filter(item => {
      const itemDate = item.date;
      return isWithinInterval(itemDate, { 
        start: startOfMonth(startDate), 
        end: endOfMonth(endDate) 
      });
    });
  }, [startDate, endDate]);

  const filteredPaymentData = useMemo(() => {
    if (!startDate || !endDate) return allPaymentData;
    
    return allPaymentData.filter(item => {
      const itemDate = item.date;
      return isWithinInterval(itemDate, { 
        start: startOfMonth(startDate), 
        end: endOfMonth(endDate) 
      });
    });
  }, [startDate, endDate]);

  // Calculate dynamic stats based on filtered data
  const stats = useMemo(() => {
    const avgOccupancy = filteredOccupancyData.length > 0
      ? filteredOccupancyData.reduce((sum, item) => sum + item.occupancy, 0) / filteredOccupancyData.length
      : 0;

    const totalRevenue = filteredPaymentData.reduce((sum, item) => sum + item.collected, 0);
    const totalPending = filteredPaymentData.reduce((sum, item) => sum + item.pending, 0);
    const totalOverdue = filteredPaymentData.reduce((sum, item) => sum + item.overdue, 0);
    const totalExpected = totalRevenue + totalPending + totalOverdue;
    const collectionRate = totalExpected > 0 ? (totalRevenue / totalExpected) * 100 : 0;

    // Calculate change vs previous period (simple comparison)
    const midpoint = Math.floor(filteredOccupancyData.length / 2);
    const firstHalfOccupancy = filteredOccupancyData.slice(0, midpoint);
    const secondHalfOccupancy = filteredOccupancyData.slice(midpoint);
    
    const firstAvg = firstHalfOccupancy.length > 0 
      ? firstHalfOccupancy.reduce((s, i) => s + i.occupancy, 0) / firstHalfOccupancy.length 
      : 0;
    const secondAvg = secondHalfOccupancy.length > 0 
      ? secondHalfOccupancy.reduce((s, i) => s + i.occupancy, 0) / secondHalfOccupancy.length 
      : 0;
    const occupancyChange = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    const firstHalfPayment = filteredPaymentData.slice(0, midpoint);
    const secondHalfPayment = filteredPaymentData.slice(midpoint);
    const firstRevenue = firstHalfPayment.reduce((s, i) => s + i.collected, 0);
    const secondRevenue = secondHalfPayment.reduce((s, i) => s + i.collected, 0);
    const revenueChange = firstRevenue > 0 ? ((secondRevenue - firstRevenue) / firstRevenue) * 100 : 0;

    return {
      avgOccupancy: avgOccupancy.toFixed(1),
      totalRevenue: formatCurrencyFull(totalRevenue),
      collectionRate: collectionRate.toFixed(1),
      occupancyChange: Number(occupancyChange.toFixed(1)),
      revenueChange: Number(revenueChange.toFixed(1)),
      latestCollected: filteredPaymentData.length > 0 ? filteredPaymentData[filteredPaymentData.length - 1].collected : 0,
      latestPending: filteredPaymentData.length > 0 ? filteredPaymentData[filteredPaymentData.length - 1].pending : 0,
      latestOverdue: filteredPaymentData.length > 0 ? filteredPaymentData[filteredPaymentData.length - 1].overdue : 0,
    };
  }, [filteredOccupancyData, filteredPaymentData]);

  const latestTotal = stats.latestCollected + stats.latestPending + stats.latestOverdue;
  const collectedPercent = latestTotal > 0 ? (stats.latestCollected / latestTotal) * 100 : 0;
  const pendingPercent = latestTotal > 0 ? (stats.latestPending / latestTotal) * 100 : 0;
  const overduePercent = latestTotal > 0 ? (stats.latestOverdue / latestTotal) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Track occupancy trends and payment performance</p>
          </div>
          <QuickRangeButtons onSelect={handleQuickRangeSelect} activeRange={activeQuickRange} />
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
          />
          <p className="text-sm text-muted-foreground">
            Showing {filteredOccupancyData.length} months of data
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Avg. Occupancy Rate"
          value={`${stats.avgOccupancy}%`}
          change={stats.occupancyChange}
          icon={Building2}
          trend={stats.occupancyChange >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Total Revenue"
          value={stats.totalRevenue}
          change={stats.revenueChange}
          icon={CreditCard}
          trend={stats.revenueChange >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Collection Rate"
          value={`${stats.collectionRate}%`}
          change={1.2}
          icon={TrendingUp}
          trend="up"
        />
        <StatCard
          title="Active Tenants"
          value="247"
          change={-0.8}
          icon={Users}
          trend="down"
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
            {/* Occupancy Trend Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Occupancy Rate Over Time</CardTitle>
                <CardDescription>
                  Monthly occupancy percentage across all properties
                  {startDate && endDate && (
                    <span className="ml-1">
                      ({format(startDate, "MMM yyyy")} - {format(endDate, "MMM yyyy")})
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  {filteredOccupancyData.length > 0 ? (
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
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No data available for selected date range
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Unit Type Distribution */}
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
            {/* Payment History Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Payment Collection History</CardTitle>
                <CardDescription>
                  Monthly breakdown of collected, pending, and overdue payments
                  {startDate && endDate && (
                    <span className="ml-1">
                      ({format(startDate, "MMM yyyy")} - {format(endDate, "MMM yyyy")})
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  {filteredPaymentData.length > 0 ? (
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
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No data available for selected date range
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Status Summary */}
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
                    <span className="font-semibold">{formatCurrency(stats.latestCollected)}</span>
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
                    <span className="font-semibold">{formatCurrency(stats.latestPending)}</span>
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
                    <span className="font-semibold">{formatCurrency(stats.latestOverdue)}</span>
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
          {/* Property Performance */}
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

          {/* Property Revenue Table */}
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
