import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Contact() {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert("Thanks for contacting us! This is a demo form.");
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl">
                        Get in Touch
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                        Have questions? We'd love to hear from you.
                    </p>
                </div>
            </section>

            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="grid gap-12 lg:grid-cols-2">

                        {/* Contact Info */}
                        <div className="space-y-8">
                            <div>
                                <h2 className="mb-4 text-2xl font-bold">Contact Information</h2>
                                <p className="text-muted-foreground">
                                    Our team is available Monday through Friday, 9am to 5pm EAT.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <Card>
                                    <CardContent className="flex items-center gap-4 p-6">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                            <Mail className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Email Us</p>
                                            <p className="text-sm text-muted-foreground">hello@rentease.co.ke</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="flex items-center gap-4 p-6">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                            <Phone className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Call Us</p>
                                            <p className="text-sm text-muted-foreground">+254 700 000 000</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="flex items-center gap-4 p-6">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                            <MapPin className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Visit Us</p>
                                            <p className="text-sm text-muted-foreground">Westlands, Nairobi, Kenya</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Send us a Message</CardTitle>
                                <CardDescription>
                                    Fill out the form below and we'll get back to you as soon as possible.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="first-name">First name</Label>
                                            <Input id="first-name" placeholder="John" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="last-name">Last name</Label>
                                            <Input id="last-name" placeholder="Doe" required />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" placeholder="john@example.com" type="email" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="message">Message</Label>
                                        <Textarea className="min-h-[150px]" id="message" placeholder="How can we help you?" required />
                                    </div>
                                    <Button type="submit" className="w-full">
                                        Send Message
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
