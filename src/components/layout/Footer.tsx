import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';

export function Footer() {
    return (
        <footer className="border-t bg-card py-12">
            <div className="container mx-auto px-4">
                <div className="grid gap-8 md:grid-cols-4">
                    <div>
                        <div className="mb-4 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                                <Building2 className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <span className="font-bold">RentEase</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Kenya's premier property management platform for modern living.
                        </p>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold">Platform</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link to="/listings" className="hover:text-foreground">Browse Listings</Link></li>
                            <li><Link to="/register" className="hover:text-foreground">For Tenants</Link></li>
                            <li><Link to="/register" className="hover:text-foreground">For Landlords</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold">Company</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link to="/about" className="hover:text-foreground">About Us</Link></li>
                            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
                            <li><Link to="/careers" className="hover:text-foreground">Careers</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold">Legal</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-foreground">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
                    <p>© {new Date().getFullYear()} RentEase. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
