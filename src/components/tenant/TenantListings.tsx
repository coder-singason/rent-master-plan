import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Search,
  MapPin,
  Bed,
  Bath,
  Square,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  SlidersHorizontal,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { mockProperties, mockUnits, formatCurrency, formatDate } from '@/lib/mock-data';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';

const ITEMS_PER_PAGE = 6;

const cities = [...new Set(mockProperties.map((p) => p.city))];
const unitTypes = ['studio', 'bedsitter', '1br', '2br', '3br', '4br+'];
const maxRent = Math.max(...mockUnits.map((u) => u.rentAmount));
const minRent = Math.min(...mockUnits.map((u) => u.rentAmount));

// Application form schema
const applicationSchema = z.object({
  employmentStatus: z.string().min(1, 'Employment status is required').max(100),
  monthlyIncome: z.number().min(1, 'Monthly income is required'),
  emergencyContact: z.string().min(2, 'Emergency contact name is required').max(100),
  emergencyPhone: z.string().min(10, 'Valid phone number required').max(20),
  moveInDate: z.string().min(1, 'Move-in date is required'),
  additionalNotes: z.string().max(500).optional(),
});

interface UnitWithProperty {
  id: string;
  propertyId: string;
  unitNumber: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  squareMeters: number;
  rentAmount: number;
  depositAmount: number;
  status: string;
  floor: number;
  amenities: string[];
  imageUrls: string[];
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    county: string;
    description: string;
    imageUrls: string[];
    amenities: string[];
  };
}

export default function TenantListings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([minRent, maxRent]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('newest');

  // Application dialog
  const [selectedUnit, setSelectedUnit] = useState<UnitWithProperty | null>(null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationForm, setApplicationForm] = useState({
    employmentStatus: '',
    monthlyIncome: '',
    emergencyContact: '',
    emergencyPhone: '',
    moveInDate: '',
    additionalNotes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Combine units with property data
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
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        unit.property.name.toLowerCase().includes(searchLower) ||
        unit.property.address.toLowerCase().includes(searchLower) ||
        unit.property.city.toLowerCase().includes(searchLower);

      const matchesCity = selectedCity === 'all' || unit.property.city === selectedCity;
      const matchesType = selectedType === 'all' || unit.type === selectedType;
      const matchesPrice = unit.rentAmount >= priceRange[0] && unit.rentAmount <= priceRange[1];

      return matchesSearch && matchesCity && matchesType && matchesPrice;
    });

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
      default:
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return results;
  }, [unitsWithProperties, searchQuery, selectedCity, selectedType, priceRange, sortBy]);

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

  const openApplyDialog = (unit: UnitWithProperty) => {
    setSelectedUnit(unit);
    setApplicationForm({
      employmentStatus: '',
      monthlyIncome: '',
      emergencyContact: '',
      emergencyPhone: '',
      moveInDate: '',
      additionalNotes: '',
    });
    setFormErrors({});
    setShowApplyDialog(true);
  };

  const handleApplicationSubmit = async () => {
    try {
      const validated = applicationSchema.parse({
        ...applicationForm,
        monthlyIncome: parseFloat(applicationForm.monthlyIncome) || 0,
      });

      setFormErrors({});
      setIsSubmitting(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'Application Submitted!',
        description: `Your application for Unit ${selectedUnit?.unitNumber} at ${selectedUnit?.property.name} has been submitted successfully.`,
      });

      setShowApplyDialog(false);
      setSelectedUnit(null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setFormErrors(errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Location</Label>
        <Select value={selectedCity} onValueChange={(v) => { setSelectedCity(v); setCurrentPage(1); }}>
          <SelectTrigger>
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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

      <div className="space-y-4">
        <Label>Price Range</Label>
        <Slider
          value={priceRange}
          min={minRent}
          max={maxRent}
          step={5000}
          onValueChange={(value) => { setPriceRange(value as [number, number]); setCurrentPage(1); }}
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Browse Available Listings</h2>
        <p className="text-muted-foreground">
          Find your next home from {filteredUnits.length} available units
        </p>
      </div>

      {/* Search and Sort */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2 lg:hidden">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">!</Badge>
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
        {/* Desktop Filters */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-lg border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Filters</h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>
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
              <div className="grid gap-6 sm:grid-cols-2">
                {paginatedUnits.map((unit) => (
                  <Card key={unit.id} className="overflow-hidden">
                    <div className="relative aspect-[4/3] bg-muted">
                      <img
                        src={unit.imageUrls[0] || unit.property.imageUrls[0]}
                        alt={`${unit.property.name} - Unit ${unit.unitNumber}`}
                        className="h-full w-full object-cover"
                      />
                      <Badge className="absolute left-3 top-3" variant="secondary">
                        {unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} BR`}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <div className="mb-3">
                        <h3 className="font-semibold leading-tight">{unit.property.name}</h3>
                        <p className="text-sm text-muted-foreground">Unit {unit.unitNumber}</p>
                      </div>

                      <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{unit.property.address}, {unit.property.city}</span>
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
                          <span className="text-sm text-muted-foreground">/mo</span>
                        </div>
                        <Button size="sm" onClick={() => openApplyDialog(unit)}>
                          Apply Now
                        </Button>
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

      {/* Application Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply for Rental</DialogTitle>
            <DialogDescription>
              {selectedUnit && (
                <>
                  <span className="font-medium">{selectedUnit.property.name}</span> - Unit {selectedUnit.unitNumber}
                  <br />
                  <span className="text-primary font-semibold">{formatCurrency(selectedUnit.rentAmount)}/month</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employmentStatus">Employment Status *</Label>
              <Input
                id="employmentStatus"
                placeholder="e.g., Employed at ABC Company"
                value={applicationForm.employmentStatus}
                onChange={(e) => setApplicationForm({ ...applicationForm, employmentStatus: e.target.value })}
              />
              {formErrors.employmentStatus && (
                <p className="text-sm text-destructive">{formErrors.employmentStatus}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyIncome">Monthly Income (KES) *</Label>
              <Input
                id="monthlyIncome"
                type="number"
                placeholder="e.g., 150000"
                value={applicationForm.monthlyIncome}
                onChange={(e) => setApplicationForm({ ...applicationForm, monthlyIncome: e.target.value })}
              />
              {formErrors.monthlyIncome && (
                <p className="text-sm text-destructive">{formErrors.monthlyIncome}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact Name *</Label>
              <Input
                id="emergencyContact"
                placeholder="Full name"
                value={applicationForm.emergencyContact}
                onChange={(e) => setApplicationForm({ ...applicationForm, emergencyContact: e.target.value })}
              />
              {formErrors.emergencyContact && (
                <p className="text-sm text-destructive">{formErrors.emergencyContact}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">Emergency Contact Phone *</Label>
              <Input
                id="emergencyPhone"
                placeholder="+254 7XX XXX XXX"
                value={applicationForm.emergencyPhone}
                onChange={(e) => setApplicationForm({ ...applicationForm, emergencyPhone: e.target.value })}
              />
              {formErrors.emergencyPhone && (
                <p className="text-sm text-destructive">{formErrors.emergencyPhone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="moveInDate">Preferred Move-in Date *</Label>
              <Input
                id="moveInDate"
                type="date"
                value={applicationForm.moveInDate}
                onChange={(e) => setApplicationForm({ ...applicationForm, moveInDate: e.target.value })}
              />
              {formErrors.moveInDate && (
                <p className="text-sm text-destructive">{formErrors.moveInDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalNotes">Additional Notes</Label>
              <Textarea
                id="additionalNotes"
                placeholder="Any additional information you'd like to share..."
                value={applicationForm.additionalNotes}
                onChange={(e) => setApplicationForm({ ...applicationForm, additionalNotes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplicationSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
