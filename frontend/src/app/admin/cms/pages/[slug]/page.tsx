
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import {
    Save, Loader2, ArrowLeft, CheckCircle
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

export default function EditPage() {
    const router = useRouter();
    const params = useParams();
    const slug = params?.slug as string;
    const isNew = slug === 'new';

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        content: '',
        isPublished: true,
    });

    useEffect(() => {
        if (!isNew && slug) {
            fetchPage();
        }
    }, [slug]);

    const fetchPage = async () => {
        try {
            const res = await api.get(`/content/pages/${slug}`);
            if (res.data) {
                setFormData({
                    title: res.data.title,
                    slug: res.data.slug,
                    content: res.data.content,
                    isPublished: res.data.isPublished,
                });
            }
        } catch (error) {
            console.error('Failed to load page', error);
            router.push('/admin/cms/pages');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!formData.title || !formData.slug || !formData.content) {
            alert('Please fill in all fields');
            return;
        }

        setSaving(true);
        try {
            // Both create and update use the same endpoint structure in our controller 
            // but normally you'd split them. Our controller uses upsert on 'admin/pages' 
            // which takes a body with slug.

            await api.post('/content/admin/pages', formData);

            setSaved(true);
            setTimeout(() => {
                setSaved(false);
                if (isNew) router.push('/admin/cms/pages');
            }, 1000);
        } catch (error) {
            console.error('Failed to save page', error);
            alert('Failed to save page. Slug might be duplicate.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {isNew ? 'Create New Page' : 'Edit Page'}
                        </h1>
                        <p className="text-muted-foreground">
                            {isNew ? 'Add a new static page to the site.' : `Editing page: ${formData.title}`}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={saving} size="lg">
                        {saving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : saved ? (
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        {saved ? 'Saved!' : 'Save Page'}
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="space-y-4 pt-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Page Title</label>
                            <Input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Terms of Service"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">URL Slug</label>
                            <Input
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                placeholder="e.g. terms-of-service"
                                disabled={!isNew} // Lock slug after creation to prevent broken links
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Content (Markdown supported)</label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            className="flex min-h-[400px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                            placeholder="# Page Title\n\nWrite your content here..."
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isPublished"
                            checked={formData.isPublished}
                            onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="isPublished" className="text-sm font-medium">Publish this page immediately</label>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
