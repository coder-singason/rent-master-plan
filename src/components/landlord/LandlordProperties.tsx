import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Home,
  MapPin,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { mockProperties, mockUnits, formatCurrency } from '@/lib/mock-data';
import type { Property, Unit, PropertyStatus, UnitStatus, UnitType } from '@/types';
import { z } from 'zod';

const propertySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  address: z.string().min(5, 'Address is required').max(200),
  city: z.string().min(2, 'City is required').max(50),
  county: z.string().min(2, 'County is required').max(50),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000),
  status: z.string(),
});

const unitSchema = z.object({
  unitNumber: z.string().min(1, 'Unit number is required').max(20),
  type: z.string().min(1, 'Type is required'),
  bedrooms: z.number().min(0).max(10),
  bathrooms: z.number().min(1).max(10),
  squareMeters: z.number().min(10).max(1000),
  rentAmount: z.number().min(1000, 'Rent must be at least 1,000'),
  depositAmount: z.number().min(0),
  floor: z.number().min(0).max(100),
  status: z.string(),
});

const statusConfig: Record<PropertyStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  active: { label: 'Active', variant: 'default' },
  inactive: { label: 'Inactive', variant: 'secondary' },
  maintenance: { label: 'Maintenance', variant: 'destructive' },
};

const unitStatusConfig: Record<UnitStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  available: { label: 'Available', variant: 'default' },
  occupied: { label: 'Occupied', variant: 'secondary' },
  maintenance: { label: 'Maintenance', variant: 'destructive' },
  reserved: { label: 'Reserved', variant: 'outline' },
};

const unitTypeLabels: Record<UnitType, string> = {
  studio: 'Studio',
  bedsitter: 'Bedsitter',
  '1br': '1 Bedroom',
  '2br': '2 Bedrooms',
  '3br': '3 Bedrooms',
  '4br+': '4+ Bedrooms',
};

export default function LandlordProperties() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [showUnitsView, setShowUnitsView] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [propertyForm, setPropertyForm] = useState({
    name: '',
    address: '',
    city: '',
    county: '',
    description: '',
    status: 'active' as PropertyStatus,
  });

  const [unitForm, setUnitForm] = useState({
    unitNumber: '',
    type: '1br' as UnitType,
    bedrooms: 1,
    bathrooms: 1,
    squareMeters: 50,
    rentAmount: 30000,
    depositAmount: 60000,
    floor: 0,
    status: 'available' as UnitStatus,
  });

  useEffect(() => {
    // Get properties owned by this landlord
    const landlordId = user?.id || 'landlord-001';
    const myProperties = mockProperties.filter((p) => p.landlordId === landlordId);
    setProperties(myProperties);

    // Get all units for these properties
    const propertyIds = myProperties.map((p) => p.id);
    const myUnits = mockUnits.filter((u) => propertyIds.includes(u.propertyId));
    setUnits(myUnits);
  }, [user]);

  const openPropertyDialog = (property?: Property) => {
    if (property) {
      setEditingProperty(property);
      setPropertyForm({
        name: property.name,
        address: property.address,
        city: property.city,
        county: property.county,
        description: property.description,
        status: property.status,
      });
    } else {
      setEditingProperty(null);
      setPropertyForm({
        name: '',
        address: '',
        city: '',
        county: '',
        description: '',
        status: 'active',
      });
    }
    setFormErrors({});
    setShowPropertyDialog(true);
  };

  const openUnitDialog = (unit?: Unit) => {
    if (unit) {
      setEditingUnit(unit);
      setUnitForm({
        unitNumber: unit.unitNumber,
        type: unit.type,
        bedrooms: unit.bedrooms,
        bathrooms: unit.bathrooms,
        squareMeters: unit.squareMeters,
        rentAmount: unit.rentAmount,
        depositAmount: unit.depositAmount,
        floor: unit.floor,
        status: unit.status,
      });
    } else {
      setEditingUnit(null);
      setUnitForm({
        unitNumber: '',
        type: '1br',
        bedrooms: 1,
        bathrooms: 1,
        squareMeters: 50,
        rentAmount: 30000,
        depositAmount: 60000,
        floor: 0,
        status: 'available',
      });
    }
    setFormErrors({});
    setShowUnitDialog(true);
  };

  const handlePropertySubmit = async () => {
    try {
      propertySchema.parse(propertyForm);
      setFormErrors({});
      setIsSubmitting(true);

      await new Promise((resolve) => setTimeout(resolve, 500));

      toast({
        title: editingProperty ? 'Property Updated' : 'Property Created',
        description: `${propertyForm.name} has been ${editingProperty ? 'updated' : 'added'} successfully.`,
      });

      setShowPropertyDialog(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) errors[err.path[0].toString()] = err.message;
        });
        setFormErrors(errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnitSubmit = async () => {
    try {
      unitSchema.parse(unitForm);
      setFormErrors({});
      setIsSubmitting(true);

      await new Promise((resolve) => setTimeout(resolve, 500));

      toast({
        title: editingUnit ? 'Unit Updated' : 'Unit Added',
        description: `Unit ${unitForm.unitNumber} has been ${editingUnit ? 'updated' : 'added'} successfully.`,
      });

      setShowUnitDialog(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) errors[err.path[0].toString()] = err.message;
        });
        setFormErrors(errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewPropertyUnits = (property: Property) => {
    setSelectedProperty(property);
    setShowUnitsView(true);
  };

  const getPropertyUnits = (propertyId: string) => {
    return units.filter((u) => u.propertyId === propertyId);
  };

  const stats = {
    totalProperties: properties.length,
    totalUnits: units.length,
    occupiedUnits: units.filter((u) => u.status === 'occupied').length,
    availableUnits: units.filter((u) => u.status === 'available').length,
  };

  if (showUnitsView && selectedProperty) {
    const propertyUnits = getPropertyUnits(selectedProperty.id);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowUnitsView(false)}>
            ← Back to Properties
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedProperty.name}</CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {selectedProperty.address}, {selectedProperty.city}
                </CardDescription>
              </div>
              <Badge variant={statusConfig[selectedProperty.status].variant}>
                {statusConfig[selectedProperty.status].label}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Units ({propertyUnits.length})</CardTitle>
              <Button onClick={() => openUnitDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Unit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {propertyUnits.length === 0 ? (
              <div className="py-12 text-center">
                <Home className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No units yet</h3>
                <p className="mb-4 text-muted-foreground">Add your first unit to this property</p>
                <Button onClick={() => openUnitDialog()} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Unit
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Beds/Baths</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Rent</TableHead>
                      <TableHead>Deposit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {propertyUnits.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">{unit.unitNumber}</TableCell>
                        <TableCell>{unitTypeLabels[unit.type]}</TableCell>
                        <TableCell>{unit.bedrooms} / {unit.bathrooms}</TableCell>
                        <TableCell>{unit.squareMeters} m²</TableCell>
                        <TableCell>{formatCurrency(unit.rentAmount)}</TableCell>
                        <TableCell>{formatCurrency(unit.depositAmount)}</TableCell>
                        <TableCell>
                          <Badge variant={unitStatusConfig[unit.status].variant}>
                            {unitStatusConfig[unit.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => openUnitDialog(unit)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unit Dialog */}
        <Dialog open={showUnitDialog} onOpenChange={setShowUnitDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUnit ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
              <DialogDescription>
                {editingUnit ? 'Update unit details' : 'Add a new unit to ' + selectedProperty.name}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unit Number *</Label>
                  <Input
                    value={unitForm.unitNumber}
                    onChange={(e) => setUnitForm({ ...unitForm, unitNumber: e.target.value })}
                    placeholder="e.g., A101"
                  />
                  {formErrors.unitNumber && <p className="text-sm text-destructive">{formErrors.unitNumber}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select value={unitForm.type} onValueChange={(v) => setUnitForm({ ...unitForm, type: v as UnitType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(unitTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Bedrooms</Label>
                  <Input
                    type="number"
                    value={unitForm.bedrooms}
                    onChange={(e) => setUnitForm({ ...unitForm, bedrooms: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bathrooms</Label>
                  <Input
                    type="number"
                    value={unitForm.bathrooms}
                    onChange={(e) => setUnitForm({ ...unitForm, bathrooms: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Floor</Label>
                  <Input
                    type="number"
                    value={unitForm.floor}
                    onChange={(e) => setUnitForm({ ...unitForm, floor: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Size (m²)</Label>
                <Input
                  type="number"
                  value={unitForm.squareMeters}
                  onChange={(e) => setUnitForm({ ...unitForm, squareMeters: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monthly Rent (KES) *</Label>
                  <Input
                    type="number"
                    value={unitForm.rentAmount}
                    onChange={(e) => setUnitForm({ ...unitForm, rentAmount: parseInt(e.target.value) || 0 })}
                  />
                  {formErrors.rentAmount && <p className="text-sm text-destructive">{formErrors.rentAmount}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Deposit (KES)</Label>
                  <Input
                    type="number"
                    value={unitForm.depositAmount}
                    onChange={(e) => setUnitForm({ ...unitForm, depositAmount: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={unitForm.status} onValueChange={(v) => setUnitForm({ ...unitForm, status: v as UnitStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUnitDialog(false)}>Cancel</Button>
              <Button onClick={handleUnitSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingUnit ? 'Update Unit' : 'Add Unit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Properties</h2>
          <p className="text-muted-foreground">Manage your properties and units</p>
        </div>
        <Button onClick={() => openPropertyDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Property
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Properties</p>
                <p className="text-2xl font-bold">{stats.totalProperties}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-2">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Units</p>
                <p className="text-2xl font-bold">{stats.totalUnits}</p>
              </div>
              <div className="rounded-lg bg-info/10 p-2">
                <Home className="h-5 w-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Occupied</p>
                <p className="text-2xl font-bold">{stats.occupiedUnits}</p>
              </div>
              <div className="rounded-lg bg-success/10 p-2">
                <Home className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold">{stats.availableUnits}</p>
              </div>
              <div className="rounded-lg bg-warning/10 p-2">
                <Home className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties Grid */}
      {properties.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No properties yet</h3>
            <p className="mb-4 text-muted-foreground">Add your first property to get started</p>
            <Button onClick={() => openPropertyDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Property
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => {
            const propertyUnits = getPropertyUnits(property.id);
            const occupied = propertyUnits.filter((u) => u.status === 'occupied').length;
            const available = propertyUnits.filter((u) => u.status === 'available').length;

            return (
              <Card key={property.id} className="overflow-hidden">
                <div className="aspect-video bg-muted">
                  <img
                    src={property.imageUrls[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'}
                    alt={property.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{property.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {property.city}, {property.county}
                      </p>
                    </div>
                    <Badge variant={statusConfig[property.status].variant}>
                      {statusConfig[property.status].label}
                    </Badge>
                  </div>

                  <div className="mb-4 grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-lg bg-muted p-2">
                      <p className="font-semibold">{propertyUnits.length}</p>
                      <p className="text-xs text-muted-foreground">Units</p>
                    </div>
                    <div className="rounded-lg bg-muted p-2">
                      <p className="font-semibold text-success">{occupied}</p>
                      <p className="text-xs text-muted-foreground">Occupied</p>
                    </div>
                    <div className="rounded-lg bg-muted p-2">
                      <p className="font-semibold text-warning">{available}</p>
                      <p className="text-xs text-muted-foreground">Available</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openPropertyDialog(property)}
                    >
                      <Edit className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => viewPropertyUnits(property)}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      Manage Units
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Property Dialog */}
      <Dialog open={showPropertyDialog} onOpenChange={setShowPropertyDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProperty ? 'Edit Property' : 'Add New Property'}</DialogTitle>
            <DialogDescription>
              {editingProperty ? 'Update property details' : 'Add a new property to your portfolio'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Property Name *</Label>
              <Input
                value={propertyForm.name}
                onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
                placeholder="e.g., Kilimani Heights"
              />
              {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label>Address *</Label>
              <Input
                value={propertyForm.address}
                onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                placeholder="e.g., 123 Argwings Kodhek Road"
              />
              {formErrors.address && <p className="text-sm text-destructive">{formErrors.address}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City *</Label>
                <Input
                  value={propertyForm.city}
                  onChange={(e) => setPropertyForm({ ...propertyForm, city: e.target.value })}
                  placeholder="e.g., Nairobi"
                />
                {formErrors.city && <p className="text-sm text-destructive">{formErrors.city}</p>}
              </div>
              <div className="space-y-2">
                <Label>County *</Label>
                <Input
                  value={propertyForm.county}
                  onChange={(e) => setPropertyForm({ ...propertyForm, county: e.target.value })}
                  placeholder="e.g., Nairobi"
                />
                {formErrors.county && <p className="text-sm text-destructive">{formErrors.county}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={propertyForm.description}
                onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
                placeholder="Describe the property, its features, and amenities..."
                rows={3}
              />
              {formErrors.description && <p className="text-sm text-destructive">{formErrors.description}</p>}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={propertyForm.status}
                onValueChange={(v) => setPropertyForm({ ...propertyForm, status: v as PropertyStatus })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Under Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPropertyDialog(false)}>Cancel</Button>
            <Button onClick={handlePropertySubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingProperty ? 'Update Property' : 'Add Property'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
