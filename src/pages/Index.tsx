import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Shield,
  Users,
  CreditCard,
  Wrench,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Home
} from 'lucide-react';
import { mockProperties, mockUnits, formatCurrency } from '@/lib/mock-data';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function Index() {
  const featuredUnits = mockUnits
    .filter(u => u.status === 'available')
    .slice(0, 3)
    .map(unit => ({
      ...unit,
      property: mockProperties.find(p => p.id === unit.propertyId)!
    }));

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4" variant="secondary">
            Kenya's Premier Property Management Platform
          </Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Find Your Perfect
            <span className="text-primary"> Home</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Whether you're a tenant looking for your next home, a landlord managing properties,
            or an administrator overseeing everything—RentEase makes property management seamless.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="gap-2">
                Start Free Today
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/listings">
              <Button size="lg" variant="outline">
                Browse Listings
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Everything You Need</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Comprehensive tools for tenants, landlords, and administrators
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Home className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Property Listings</CardTitle>
                <CardDescription>
                  Browse available apartments with detailed photos, amenities, and virtual tours
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <CreditCard className="h-5 w-5 text-success" />
                </div>
                <CardTitle className="text-lg">Easy Payments</CardTitle>
                <CardDescription>
                  Pay rent via M-Pesa, bank transfer, or card. Track your payment history
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Wrench className="h-5 w-5 text-warning" />
                </div>
                <CardTitle className="text-lg">Maintenance Requests</CardTitle>
                <CardDescription>
                  Submit and track repair requests with real-time status updates
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                  <MessageSquare className="h-5 w-5 text-info" />
                </div>
                <CardTitle className="text-lg">Direct Messaging</CardTitle>
                <CardDescription>
                  Communicate directly with landlords and administrators
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <Shield className="h-5 w-5 text-destructive" />
                </div>
                <CardTitle className="text-lg">Secure Leases</CardTitle>
                <CardDescription>
                  Digital lease agreements with secure document storage
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Role-Based Access</CardTitle>
                <CardDescription>
                  Tailored dashboards for admins, landlords, and tenants
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="mb-2 text-3xl font-bold">Featured Listings</h2>
              <p className="text-muted-foreground">Discover our most popular available units</p>
            </div>
            <Link to="/listings">
              <Button variant="outline" className="gap-2">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredUnits.map((unit) => (
              <Card key={unit.id} className="overflow-hidden">
                <div className="aspect-video bg-muted">
                  <img
                    src={unit.imageUrls[0] || unit.property.imageUrls[0]}
                    alt={`${unit.property.name} - Unit ${unit.unitNumber}`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{unit.property.name}</h3>
                      <p className="text-sm text-muted-foreground">Unit {unit.unitNumber}</p>
                    </div>
                    <Badge variant="secondary">
                      {unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} BR`}
                    </Badge>
                  </div>

                  <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {unit.property.city}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold">{formatCurrency(unit.rentAmount)}</span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                    <Link to={`/listings/${unit.id}`}>
                      <Button size="sm">View Details</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">How It Works</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="mb-2 text-lg font-semibold">Create Account</h3>
              <p className="text-muted-foreground">
                Sign up for free and complete your profile verification
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="mb-2 text-lg font-semibold">Find & Apply</h3>
              <p className="text-muted-foreground">
                Browse listings, submit applications, and get approved
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="mb-2 text-lg font-semibold">Move In</h3>
              <p className="text-muted-foreground">
                Sign your lease, pay deposit, and move into your new home
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground">
            Ready to Find Your New Home?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-primary-foreground/80">
            Join thousands of tenants and landlords who trust RentEase for their property needs
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
