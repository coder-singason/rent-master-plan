import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, User } from 'lucide-react';
import { z } from 'zod';

const profileSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    phone: z.string().min(10, 'Phone number must be valid'),
    email: z.string().email(), // Read-only usually, but good to validate if we allowed change
});

export default function TenantSettings() {
    const { user, login } = useAuth(); // We might need to update context if user changes
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                email: user.email,
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error for field
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            // Validate
            profileSchema.parse(formData);
            setErrors({});
            setIsSubmitting(true);

            // Call API
            const res = await usersApi.update(user.id, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
            });

            if (res.success && res.data) {
                toast({
                    title: 'Profile Updated',
                    description: 'Your changes have been saved successfully.',
                });

                // Optimistically update auth context if possible, 
                // or rely on the fact that usersApi.update updates localStorage 
                // and we might need to reload the page or trigger a context refresh.
                // The usersApi.update already updates the session in localStorage. 
                // Ideally AuthContext should listen to storage changes or expose a refresh. 
                // For prototype, a simple toast is enough, the new data will show on next reload 
                // or if we manually update the user object in context. 
                // Since useAuth doesn't expose 'updateUser', we'll rely on the persistence.

                // Optional: Force reload to reflect name changes in header immediately
                // window.location.reload(); // A bit harsh.
            } else {
                toast({
                    title: 'Error',
                    description: res.message || 'Failed to update profile',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Record<string, string> = {};
                error.errors.forEach((err) => {
                    if (err.path[0]) {
                        newErrors[err.path[0].toString()] = err.message;
                    }
                });
                setErrors(newErrors);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h2 className="text-2xl font-bold">Account Settings</h2>
                <p className="text-muted-foreground">Manage your profile information</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your contact details and name.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                />
                                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                />
                                {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                disabled={isSubmitting}
                            />
                            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                name="email"
                                value={formData.email}
                                disabled={true} // Read-only
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">Email cannot be changed directly.</p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isSubmitting} className="ml-auto">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
