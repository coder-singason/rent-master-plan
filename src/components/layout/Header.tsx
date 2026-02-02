import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';

export function Header() {
    return (
        <header className="border-b bg-card">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link to="/" className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                        <Building2 className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-bold">RentEase</span>
                </Link>

                <nav className="hidden items-center gap-6 md:flex">
                    <Link to="/listings" className="text-sm text-muted-foreground hover:text-foreground">
                        Browse Listings
                    </Link>
                    <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground">
                        About
                    </Link>
                    <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground">
                        Contact
                    </Link>
                </nav>

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
    );
}
