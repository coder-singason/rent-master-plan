import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  MapPin,
  Bed,
  Bath,
  Square,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  DollarSign,
  Home,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { mockProperties, mockUnits, formatCurrency } from '@/lib/mock-data';
import { useState } from 'react';

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const unit = mockUnits.find((u) => u.id === id);
  const property = unit ? mockProperties.find((p) => p.id === unit.propertyId) : null;

  if (!unit || !property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Home className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">Listing Not Found</h2>
            <p className="mb-4 text-muted-foreground">
              The property you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/listings">
              <Button>Browse Listings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Combine unit and property images
  const allImages = [...unit.imageUrls, ...property.imageUrls].filter(Boolean);
  if (allImages.length === 0) {
    allImages.push('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80');
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // Get similar units
  const similarUnits = mockUnits
    .filter(
      (u) =>
        u.id !== unit.id &&
        u.status === 'available' &&
        (u.propertyId === unit.propertyId || u.type === unit.type)
    )
    .slice(0, 3)
    .map((u) => ({
      ...u,
      property: mockProperties.find((p) => p.id === u.propertyId)!,
    }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">RentEase</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4 gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Listings
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="relative mb-6 overflow-hidden rounded-xl">
              <div className="aspect-[16/10] bg-muted">
                <img
                  src={allImages[currentImageIndex]}
                  alt={`${property.name} - Image ${currentImageIndex + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>

              {allImages.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>

                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                    {allImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-2 w-2 rounded-full transition-all ${index === currentImageIndex
                          ? 'w-6 bg-primary'
                          : 'bg-white/60 hover:bg-white/80'
                          }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Property Info */}
            <div className="mb-6">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} BR`}
                </Badge>
                <Badge variant="outline" className="text-success border-success">
                  Available
                </Badge>
              </div>

              <h1 className="mb-2 text-2xl font-bold sm:text-3xl">{property.name}</h1>
              <p className="text-lg text-muted-foreground">Unit {unit.unitNumber}</p>

              <div className="mt-3 flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {property.address}, {property.city}, {property.county}
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Card>
                <CardContent className="flex flex-col items-center p-4">
                  <Bed className="mb-2 h-5 w-5 text-muted-foreground" />
                  <span className="text-lg font-semibold">
                    {unit.bedrooms === 0 ? 'Studio' : unit.bedrooms}
                  </span>
                  <span className="text-xs text-muted-foreground">Bedrooms</span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center p-4">
                  <Bath className="mb-2 h-5 w-5 text-muted-foreground" />
                  <span className="text-lg font-semibold">{unit.bathrooms}</span>
                  <span className="text-xs text-muted-foreground">Bathrooms</span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center p-4">
                  <Square className="mb-2 h-5 w-5 text-muted-foreground" />
                  <span className="text-lg font-semibold">{unit.squareMeters}</span>
                  <span className="text-xs text-muted-foreground">Sq Meters</span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center p-4">
                  <Building2 className="mb-2 h-5 w-5 text-muted-foreground" />
                  <span className="text-lg font-semibold">
                    {unit.floor === 0 ? 'Ground' : unit.floor}
                  </span>
                  <span className="text-xs text-muted-foreground">Floor</span>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>About This Property</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{property.description}</p>
              </CardContent>
            </Card>

            {/* Unit Amenities */}
            {unit.amenities.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Unit Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {unit.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Building Amenities */}
            {property.amenities.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Building Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Pricing Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-primary">
                      {formatCurrency(unit.rentAmount)}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Deposit Required</span>
                      <span className="font-medium">{formatCurrency(unit.depositAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Property Type</span>
                      <span className="font-medium capitalize">{unit.type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Available</span>
                      <span className="font-medium text-success">Now</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <Link to="/register" className="block">
                    <Button size="lg" className="w-full">
                      Apply Now
                    </Button>
                  </Link>

                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Create an account to submit your application
                  </p>
                </CardContent>
              </Card>

              {/* Contact Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Interested?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Register for a free account to schedule a viewing or submit your rental
                    application.
                  </p>

                  <div className="flex flex-col gap-2">
                    <Link to="/register">
                      <Button variant="outline" className="w-full gap-2">
                        <Calendar className="h-4 w-4" />
                        Schedule Viewing
                      </Button>
                    </Link>
                    <Link to="/contact">
                      <Button variant="ghost" className="w-full gap-2">
                        <Mail className="h-4 w-4" />
                        Contact Us
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Similar Listings */}
        {similarUnits.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-6 text-2xl font-bold">Similar Listings</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similarUnits.map((u) => (
                <Card key={u.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted">
                    <img
                      src={u.imageUrls[0] || u.property.imageUrls[0]}
                      alt={`${u.property.name} - Unit ${u.unitNumber}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="mb-1 font-semibold">{u.property.name}</h3>
                    <p className="mb-2 text-sm text-muted-foreground">Unit {u.unitNumber}</p>

                    <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {u.property.city}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">
                        {formatCurrency(u.rentAmount)}/mo
                      </span>
                      <Link to={`/listings/${u.id}`}>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
