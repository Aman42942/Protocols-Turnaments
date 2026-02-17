
import React from 'react';
import { notFound } from 'next/navigation';
import api from '@/lib/api';
import { Metadata } from 'next';

interface PageProps {
    params: {
        slug: string;
    };
}

// Ensure the page is dynamic
export const dynamic = 'force-dynamic';

async function getPage(slug: string) {
    try {
        // We need to use the absolute URL for server-side fetching if using fetch directly,
        // but since we are using axios instance 'api' which might have base URL set,
        // we might need to be careful about server-side vs client-side.
        // For simplicity in this robust setup, we'll try to use the api lib if configured for server,
        // or just fetch from localhost if needed.
        // HOWEVER, api lib might use localStorage which fails on server.
        // So we should use a direct fetch or a separate server-api client.

        // Let's assume we can fetch from the backend directly.
        // Since we are adding this to the existing Next.js app, let's use a client component 
        // approach for simplicity and consistency with the rest of the app's data fetching,
        // OR better, make this a React Server Component and fetch data properly.

        // For now, let's use a client component wrapper or just standard fetch if we know the backend URL.
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/content/pages/${slug}`, {
            cache: 'no-store'
        });

        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('Failed to fetch page:', error);
        return null;
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const page = await getPage(params.slug);
    if (!page) return { title: 'Page Not Found' };

    return {
        title: `${page.title} | Protocol Tournaments`,
        description: page.content.substring(0, 160),
    };
}

export default async function DynamicPage({ params }: PageProps) {
    const page = await getPage(params.slug);

    if (!page || !page.isPublished) {
        notFound();
    }

    // Markdown rendering would go here. For now, simple whitespace-pre-wrap.
    // In a real app, use 'react-markdown' or 'markdown-to-jsx'.

    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8">{page.title}</h1>
            <div className="prose prose-invert max-w-none whitespace-pre-wrap leading-relaxed text-zinc-300">
                {page.content}
            </div>
            <div className="mt-12 pt-8 border-t border-border text-sm text-muted-foreground">
                Last updated: {new Date(page.updatedAt).toLocaleDateString()}
            </div>
        </div>
    );
}
