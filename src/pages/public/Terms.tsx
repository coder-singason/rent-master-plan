import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Terms() {
    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="container mx-auto px-4 py-8">
                <div className="mx-auto max-w-3xl">
                    <div className="mb-8 text-center">
                        <h1 className="mb-4 text-3xl font-bold">Terms of Service</h1>
                        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>1. Acceptance of Terms</CardTitle>
                            </CardHeader>
                            <CardContent className="text-muted-foreground">
                                <p>By accessing or using RentEase, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>2. Use of Service</CardTitle>
                            </CardHeader>
                            <CardContent className="text-muted-foreground">
                                <p>RentEase provides a platform for connecting landlords and tenants. You agree that:</p>
                                <ul className="ml-6 mt-2 list-disc space-y-1">
                                    <li>You must provide accurate and complete information.</li>
                                    <li>You are responsible for maintaining the confidentiality of your account.</li>
                                    <li>You will not use the service for any illegal or unauthorized purpose.</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>3. User Roles</CardTitle>
                            </CardHeader>
                            <CardContent className="text-muted-foreground">
                                <p><strong>Tenants:</strong> You agree to provide accurate income and background information for applications.</p>
                                <p className="mt-2"><strong>Landlords:</strong> You warrant that you have the right to lease listed properties and agree to maintain them in habitable condition.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>4. Limitation of Liability</CardTitle>
                            </CardHeader>
                            <CardContent className="text-muted-foreground">
                                <p>RentEase is not a party to any rental agreement. We shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of the service.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
