import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket, Gem, Heart, Globe } from 'lucide-react';

export default function Careers() {
    const openPositions = [
        {
            title: "Senior Frontend Engineer",
            department: "Engineering",
            location: "Nairobi (Hybrid)",
            type: "Full-time",
            description: "We're looking for an experienced React developer to help build the future of property management in Kenya."
        },
        {
            title: "Product Designer",
            department: "Design",
            location: "Remote",
            type: "Full-time",
            description: "Shape the user experience of RentEase. We need someone who obsess over details and user flows."
        },
        {
            title: "Customer Success Manager",
            department: "Sales",
            location: "Nairobi",
            type: "Full-time",
            description: "Be the face of RentEase for our landlord partners. Ensure they succeed and grow with our platform."
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            <Header />

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20">
                <div className="container mx-auto px-4 text-center">
                    <Badge className="mb-4" variant="secondary">
                        Join the Team
                    </Badge>
                    <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl">
                        Build the Future of Housing
                    </h1>
                    <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                        We're on a mission to make renting simpler, transparent, and fair for everyone. Come help us solve real problems.
                    </p>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-3xl font-bold">Why Join RentEase?</h2>
                    </div>

                    <div className="grid gap-6 md:grid-cols-4">
                        <Card>
                            <CardContent className="flex flex-col items-center p-6 text-center">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                    <Rocket className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="mb-2 font-semibold">High Impact</h3>
                                <p className="text-sm text-muted-foreground">Work on a product that affects people's daily lives and homes.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="flex flex-col items-center p-6 text-center">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                    <Gem className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="mb-2 font-semibold">Competitive Pay</h3>
                                <p className="text-sm text-muted-foreground">We offer top-tier salaries and equity packages.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="flex flex-col items-center p-6 text-center">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                    <Heart className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="mb-2 font-semibold">Great Culture</h3>
                                <p className="text-sm text-muted-foreground">Collaborative, respectful, and fun environment.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="flex flex-col items-center p-6 text-center">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                    <Globe className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="mb-2 font-semibold">Remote Friendly</h3>
                                <p className="text-sm text-muted-foreground">Work from where you're most productive.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Open Positions */}
            <section className="bg-muted/30 py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-3xl font-bold">Open Positions</h2>
                    </div>

                    <div className="mx-auto grid max-w-4xl gap-6">
                        {openPositions.map((position, index) => (
                            <Card key={index}>
                                <CardHeader>
                                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                        <div>
                                            <div className="mb-2 flex items-center gap-2">
                                                <CardTitle>{position.title}</CardTitle>
                                                <Badge>{position.department}</Badge>
                                            </div>
                                            <CardDescription className="mb-4 text-base">
                                                {position.description}
                                            </CardDescription>
                                            <div className="flex gap-4 text-sm text-muted-foreground">
                                                <span>{position.location}</span>
                                                <span>•</span>
                                                <span>{position.type}</span>
                                            </div>
                                        </div>
                                        <Button>Apply Now</Button>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
