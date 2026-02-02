import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Privacy() {
    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="container mx-auto px-4 py-8">
                <div className="mx-auto max-w-3xl">
                    <div className="mb-8 text-center">
                        <h1 className="mb-4 text-3xl font-bold">Privacy Policy</h1>
                        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>1. Information We Collect</CardTitle>
                            </CardHeader>
                            <CardContent className="text-muted-foreground">
                                <p>We collect information you provide directly to us when you create an account, update your profile, list a property, or communicate with us. This includes:</p>
                                <ul className="ml-6 mt-2 list-disc space-y-1">
                                    <li>Name, email address, and phone number</li>
                                    <li>Property details and location data</li>
                                    <li>Payment information and transaction history</li>
                                    <li>Communications between landlords and tenants</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>2. How We Use Your Information</CardTitle>
                            </CardHeader>
                            <CardContent className="text-muted-foreground">
                                <p>We use the information we collect to:</p>
                                <ul className="ml-6 mt-2 list-disc space-y-1">
                                    <li>Provide, maintain, and improve our services</li>
                                    <li>Process transactions and send related information</li>
                                    <li>Verify user identity and prevent fraud</li>
                                    <li>Send technical notices, updates, and support messages</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>3. Data Security</CardTitle>
                            </CardHeader>
                            <CardContent className="text-muted-foreground">
                                <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>4. Contact Us</CardTitle>
                            </CardHeader>
                            <CardContent className="text-muted-foreground">
                                <p>If you have any questions about this Privacy Policy, please contact us at privacy@rentease.co.ke.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
