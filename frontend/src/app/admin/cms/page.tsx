
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileText, Megaphone, ArrowRight, Layout } from 'lucide-react';
import Link from 'next/link';

export default function CMSDashboard() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Layout className="h-8 w-8 text-primary" />
                    Content Management
                </h1>
                <p className="text-muted-foreground">Manage static pages and system announcements.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Link href="/admin/cms/pages">
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-6 w-6 text-blue-500" />
                                Static Pages
                            </CardTitle>
                            <CardDescription>
                                Manage Terms, Privacy Policy, About Us, and other static content.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="ghost" className="p-0 h-auto font-normal text-muted-foreground hover:text-primary">
                                Manage Pages <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/cms/announcements">
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Megaphone className="h-6 w-6 text-orange-500" />
                                Announcements
                            </CardTitle>
                            <CardDescription>
                                Create and manage system-wide alerts and news tickers.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="ghost" className="p-0 h-auto font-normal text-muted-foreground hover:text-primary">
                                Manage Announcements <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
