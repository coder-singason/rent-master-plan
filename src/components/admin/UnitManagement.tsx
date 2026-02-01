import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { unitApi } from '@/lib/api';
import { formatCurrency } from '@/lib/mock-data';
import type { Unit, UnitStatus, UnitType } from '@/types';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface UnitManagementProps {
  propertyId: string;
}

export function UnitManagement({ propertyId }: UnitManagementProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);
  
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    unitNumber: '',
    type: '1br' as UnitType,
    bedrooms: 1,
    bathrooms: 1,
    squareMeters: 50,
    rentAmount: 0,
    depositAmount: 0,
    floor: 1,
    amenities: '',
    status: 'available' as UnitStatus,
  });

  useEffect(() => {
    loadUnits();
  }, [propertyId]);

  const loadUnits = async () => {
    setIsLoading(true);
    try {
      const response = await unitApi.getByProperty(propertyId);
      if (response.success) {
        setUnits(response.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (unit?: Unit) => {
    if (unit) {
      setEditingUnit(unit);
      setFormData({
        unitNumber: unit.unitNumber,
        type: unit.type,
        bedrooms: unit.bedrooms,
        bathrooms: unit.bathrooms,
        squareMeters: unit.squareMeters,
        rentAmount: unit.rentAmount,
        depositAmount: unit.depositAmount,
        floor: unit.floor,
        amenities: unit.amenities.join(', '),
        status: unit.status,
      });
    } else {
      setEditingUnit(null);
      setFormData({
        unitNumber: '',
        type: '1br',
        bedrooms: 1,
        bathrooms: 1,
        squareMeters: 50,
        rentAmount: 0,
        depositAmount: 0,
        floor: 1,
        amenities: '',
        status: 'available',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const unitData = {
      ...formData,
      propertyId,
      amenities: formData.amenities.split(',').map((a) => a.trim()).filter(Boolean),
      imageUrls: editingUnit?.imageUrls || [],
    };

    if (editingUnit) {
      const response = await unitApi.update(editingUnit.id, unitData);
      if (response.success) {
        setUnits(units.map((u) => (u.id === editingUnit.id ? response.data : u)));
        toast({ title: 'Unit updated', description: 'Unit details have been updated.' });
      }
    } else {
      const response = await unitApi.create(unitData);
      if (response.success) {
        setUnits([...units, response.data]);
        toast({ title: 'Unit created', description: 'New unit has been added.' });
      }
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deletingUnit) {
      const response = await unitApi.delete(deletingUnit.id);
      if (response.success) {
        setUnits(units.filter((u) => u.id !== deletingUnit.id));
        toast({ title: 'Unit deleted', description: 'Unit has been removed.' });
      }
    }
    setIsDeleteDialogOpen(false);
    setDeletingUnit(null);
  };

  const getStatusBadge = (status: UnitStatus) => {
    const variants: Record<UnitStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      available: { variant: 'default', label: 'Available' },
      occupied: { variant: 'secondary', label: 'Occupied' },
      reserved: { variant: 'outline', label: 'Reserved' },
      maintenance: { variant: 'destructive', label: 'Maintenance' },
    };
    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const unitTypeLabels: Record<UnitType, string> = {
    studio: 'Studio',
    bedsitter: 'Bedsitter',
    '1br': '1 Bedroom',
    '2br': '2 Bedroom',
    '3br': '3 Bedroom',
    '4br+': '4+ Bedroom',
  };

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading units...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Unit
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Unit</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Rent</TableHead>
            <TableHead>Deposit</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No units found. Add your first unit.
              </TableCell>
            </TableRow>
          ) : (
            units.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell className="font-medium">
                  {unit.unitNumber}
                  <span className="ml-2 text-sm text-muted-foreground">Floor {unit.floor}</span>
                </TableCell>
                <TableCell>{unitTypeLabels[unit.type]}</TableCell>
                <TableCell>{unit.squareMeters} m²</TableCell>
                <TableCell>{formatCurrency(unit.rentAmount)}</TableCell>
                <TableCell>{formatCurrency(unit.depositAmount)}</TableCell>
                <TableCell>{getStatusBadge(unit.status)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(unit)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeletingUnit(unit);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingUnit ? 'Edit Unit' : 'Create New Unit'}</DialogTitle>
            <DialogDescription>
              {editingUnit ? 'Update unit details below.' : 'Fill in the details for the new unit.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitNumber">Unit Number</Label>
                <Input
                  id="unitNumber"
                  value={formData.unitNumber}
                  onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                  placeholder="e.g., A101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  type="number"
                  min={0}
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: UnitType) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="bedsitter">Bedsitter</SelectItem>
                    <SelectItem value="1br">1 Bedroom</SelectItem>
                    <SelectItem value="2br">2 Bedroom</SelectItem>
                    <SelectItem value="3br">3 Bedroom</SelectItem>
                    <SelectItem value="4br+">4+ Bedroom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min={0}
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min={1}
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="squareMeters">Size (m²)</Label>
                <Input
                  id="squareMeters"
                  type="number"
                  min={1}
                  value={formData.squareMeters}
                  onChange={(e) => setFormData({ ...formData, squareMeters: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rentAmount">Rent (KES)</Label>
                <Input
                  id="rentAmount"
                  type="number"
                  min={0}
                  value={formData.rentAmount}
                  onChange={(e) => setFormData({ ...formData, rentAmount: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depositAmount">Deposit (KES)</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  min={0}
                  value={formData.depositAmount}
                  onChange={(e) => setFormData({ ...formData, depositAmount: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: UnitStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amenities">Amenities (comma-separated)</Label>
              <Input
                id="amenities"
                value={formData.amenities}
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                placeholder="e.g., Balcony, Built-in Wardrobes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{editingUnit ? 'Save Changes' : 'Create Unit'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Unit</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete unit "{deletingUnit?.unitNumber}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
