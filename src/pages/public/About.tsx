import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function About() {
    return (
        <div className="min-h-screen bg-background">
            <Header />

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20">
                <div className="container mx-auto px-4 text-center">
                    <Badge className="mb-4" variant="secondary">
                        Our Story
                    </Badge>
                    <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl">
                        Revolutionizing Property Management in Kenya
                    </h1>
                    <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                        We're on a mission to simplify the relationship between landlords and tenants through technology.
                    </p>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="grid gap-12 md:grid-cols-2 lg:gap-8">
                        <div className="flex flex-col justify-center">
                            <h2 className="mb-4 text-3xl font-bold">Our Mission</h2>
                            <p className="mb-6 text-muted-foreground">
                                RentEase was born from a simple observation: property management is often more stressful than it needs to be. Landlords struggle with tracking payments and maintenance, while tenants face opaque application processes and communication barriers.
                            </p>
                            <p className="text-muted-foreground">
                                We bridge this gap with a seamless, transparent platform that serves everyone involved in the rental ecosystem.
                            </p>
                        </div>
                        <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
                            <img
                                src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80"
                                alt="Modern office space"
                                className="h-full w-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="bg-muted/30 py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-3xl font-bold">Our Core Values</h2>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        {[
                            {
                                title: "Transparency",
                                description: "We believe in clear communication and honest dealings between all parties."
                            },
                            {
                                title: "Efficiency",
                                description: "We hate paperwork. We automate the boring stuff so you can focus on living."
                            },
                            {
                                title: "Trust",
                                description: "Security and reliability are at the foundation of everything we build."
                            }
                        ].map((value, i) => (
                            <Card key={i}>
                                <CardContent className="pt-6">
                                    <h3 className="mb-2 text-xl font-semibold">{value.title}</h3>
                                    <p className="text-muted-foreground">{value.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
