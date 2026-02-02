import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Building2,
  Search,
  MapPin,
  Bed,
  Bath,
  Square,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  SlidersHorizontal,
} from 'lucide-react';
import { mockProperties, mockUnits, formatCurrency } from '@/lib/mock-data';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const ITEMS_PER_PAGE = 9;

// Get unique values for filters
const cities = [...new Set(mockProperties.map((p) => p.city))];
const unitTypes = ['studio', 'bedsitter', '1br', '2br', '3br', '4br+'];
const maxRent = Math.max(...mockUnits.map((u) => u.rentAmount));
const minRent = Math.min(...mockUnits.map((u) => u.rentAmount));

export default function Listings() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([minRent, maxRent]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('newest');

  // Combine units with property data and filter
  const unitsWithProperties = useMemo(() => {
    return mockUnits
      .filter((unit) => unit.status === 'available')
      .map((unit) => ({
        ...unit,
        property: mockProperties.find((p) => p.id === unit.propertyId)!,
      }));
  }, []);

  const filteredUnits = useMemo(() => {
    let results = unitsWithProperties.filter((unit) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        unit.property.name.toLowerCase().includes(searchLower) ||
        unit.property.address.toLowerCase().includes(searchLower) ||
        unit.property.city.toLowerCase().includes(searchLower);

      // City filter
      const matchesCity = selectedCity === 'all' || unit.property.city === selectedCity;

      // Type filter
      const matchesType = selectedType === 'all' || unit.type === selectedType;

      // Price filter
      const matchesPrice = unit.rentAmount >= priceRange[0] && unit.rentAmount <= priceRange[1];

      return matchesSearch && matchesCity && matchesType && matchesPrice;
    });

    // Sort
    switch (sortBy) {
      case 'price-low':
        results.sort((a, b) => a.rentAmount - b.rentAmount);
        break;
      case 'price-high':
        results.sort((a, b) => b.rentAmount - a.rentAmount);
        break;
      case 'size':
        results.sort((a, b) => b.squareMeters - a.squareMeters);
        break;
      case 'newest':
      default:
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return results;
  }, [unitsWithProperties, searchQuery, selectedCity, selectedType, priceRange, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredUnits.length / ITEMS_PER_PAGE);
  const paginatedUnits = filteredUnits.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCity('all');
    setSelectedType('all');
    setPriceRange([minRent, maxRent]);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedCity !== 'all' ||
    selectedType !== 'all' ||
    priceRange[0] !== minRent ||
    priceRange[1] !== maxRent;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* City Filter */}
      <div className="space-y-2">
        <Label>Location</Label>
        <Select value={selectedCity} onValueChange={(v) => { setSelectedCity(v); setCurrentPage(1); }}>
          <SelectTrigger>
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Unit Type Filter */}
      <div className="space-y-2">
        <Label>Property Type</Label>
        <Select value={selectedType} onValueChange={(v) => { setSelectedType(v); setCurrentPage(1); }}>
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {unitTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type === 'studio' ? 'Studio' : type === 'bedsitter' ? 'Bedsitter' : type.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className="space-y-4">
        <Label>Price Range</Label>
        <Slider
          value={priceRange}
          min={minRent}
          max={maxRent}
          step={5000}
          onValueChange={(value) => { setPriceRange(value as [number, number]); setCurrentPage(1); }}
          className="mt-2"
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{formatCurrency(priceRange[0])}</span>
          <span>{formatCurrency(priceRange[1])}</span>
        </div>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" onClick={clearFilters} className="w-full gap-2">
          <X className="h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );

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

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Available Apartments</h1>
          <p className="text-muted-foreground">
            Browse {filteredUnits.length} available listings across Kenya
          </p>
        </div>

        {/* Search and Sort Bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by property, location..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 lg:hidden">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                      !
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="size">Largest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-24 rounded-lg border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Filters</h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear
                  </Button>
                )}
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* Listings Grid */}
          <div className="flex-1">
            {paginatedUnits.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <Home className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No listings found</h3>
                  <p className="mb-4 text-muted-foreground">
                    Try adjusting your filters or search criteria
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {paginatedUnits.map((unit) => (
                    <Card
                      key={unit.id}
                      className="group overflow-hidden transition-shadow hover:shadow-lg"
                    >
                      <div className="relative aspect-[4/3] bg-muted">
                        <img
                          src={unit.imageUrls[0] || unit.property.imageUrls[0]}
                          alt={`${unit.property.name} - Unit ${unit.unitNumber}`}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                        <Badge className="absolute left-3 top-3" variant="secondary">
                          {unit.bedrooms === 0
                            ? 'Studio'
                            : unit.bedrooms === 1
                              ? '1 Bedroom'
                              : `${unit.bedrooms} Bedrooms`}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <div className="mb-3">
                          <h3 className="font-semibold leading-tight">{unit.property.name}</h3>
                          <p className="text-sm text-muted-foreground">Unit {unit.unitNumber}</p>
                        </div>

                        <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>
                            {unit.property.address}, {unit.property.city}
                          </span>
                        </div>

                        <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Bed className="h-4 w-4" />
                            <span>{unit.bedrooms === 0 ? 'Studio' : unit.bedrooms}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Bath className="h-4 w-4" />
                            <span>{unit.bathrooms}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Square className="h-4 w-4" />
                            <span>{unit.squareMeters}m²</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t pt-4">
                          <div>
                            <span className="text-xl font-bold text-primary">
                              {formatCurrency(unit.rentAmount)}
                            </span>
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    ))}

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
