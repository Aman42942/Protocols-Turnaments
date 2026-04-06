
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import {
    FileText, Plus, Pencil, Trash2, Loader2, Globe, Eye, EyeOff
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PagesList() {
    const [pages, setPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchPages();
    }, []);

    const fetchPages = async () => {
        try {
            const res = await api.get('/content/admin/pages');
            setPages(res.data);
        } catch (error) {
            console.error('Failed to load pages', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (slug: string) => {
        if (!confirm('Are you sure you want to delete this page?')) return;
        try {
            await api.delete(`/content/admin/pages/${slug}`);
            fetchPages();
        } catch (error) {
            console.error('Failed to delete page', error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Static Pages</h1>
                    <p className="text-muted-foreground">Manage website content pages.</p>
                </div>
                <Link href="/admin/cms/pages/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create Page
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4">
                {pages.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-muted-foreground">
                            No pages found. Create one to get started.
                        </CardContent>
                    </Card>
                ) : pages.map((page) => (
                    <Card key={page.id} className="overflow-hidden">
                        <div className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-primary/10 text-primary">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        {page.title}
                                        {!page.isPublished && (
                                            <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <EyeOff className="h-3 w-3" /> Draft
                                            </span>
                                        )}
                                        {page.isPublished && (
                                            <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <Eye className="h-3 w-3" /> Published
                                            </span>
                                        )}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                        <span className="flex items-center gap-1">
                                            <Globe className="h-3 w-3" /> /{page.slug}
                                        </span>
                                        <span>Last updated: {new Date(page.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Link href={`/p/${page.slug}`} target="_blank">
                                    <Button variant="outline" size="sm">View</Button>
                                </Link>
                                <Link href={`/admin/cms/pages/${page.slug}`}>
                                    <Button variant="outline" size="sm">
                                        <Pencil className="h-4 w-4 mr-1" /> Edit
                                    </Button>
                                </Link>
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(page.slug)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
