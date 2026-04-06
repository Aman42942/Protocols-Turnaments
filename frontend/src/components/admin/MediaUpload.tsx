"use client";
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Upload, X, FileVideo, Image as ImageIcon, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

interface MediaUploadProps {
    onUploadSuccess: (url: string) => void;
    currentUrl?: string;
    type?: 'image' | 'video' | 'any';
    label?: string;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({ 
    onUploadSuccess, 
    currentUrl, 
    type = 'any',
    label = 'Media File'
}) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (type === 'image' && !isImage) {
            setError('Please upload an image file (JPG, PNG, WEBP)');
            return;
        }
        if (type === 'video' && !isVideo) {
            setError('Please upload a video file (MP4, WEBM)');
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            setError('File size exceeds 20MB limit');
            return;
        }

        setError(null);
        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/cms/media/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
                    setProgress(percentCompleted);
                },
            });

            if (response.data.success) {
                onUploadSuccess(response.data.url);
            } else {
                setError('Upload failed');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error uploading file');
        } finally {
            setUploading(false);
        }
    };

    const clearMedia = () => {
        onUploadSuccess('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">{label}</label>
                {currentUrl && !uploading && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-600 h-8 px-2"
                        onClick={clearMedia}
                    >
                        <X className="h-4 w-4 mr-1" /> Remove
                    </Button>
                )}
            </div>

            {!currentUrl && !uploading ? (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept={type === 'image' ? 'image/*' : type === 'video' ? 'video/*' : 'image/*,video/*'}
                    />
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium">Click to upload {type === 'any' ? 'media' : type}</p>
                    <p className="text-xs text-muted-foreground mt-1">Images or Videos up to 20MB</p>
                </div>
            ) : uploading ? (
                <div className="border rounded-xl p-6 bg-muted/30">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">Uploading...</p>
                            <p className="text-xs text-muted-foreground">{progress}% complete</p>
                        </div>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            ) : (
                <div className="relative rounded-xl overflow-hidden border aspect-video bg-black/50">
                    {currentUrl?.match(/\.(mp4|webm|mov|ogg|m4v)$|(\/video\/upload\/)/i) ? (
                        <video 
                            src={currentUrl} 
                            controls 
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <img 
                            src={currentUrl} 
                            alt="Preview" 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Invalid+Media+URL';
                            }}
                        />
                    )}
                    <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5 shadow-lg">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Ready</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 text-red-500 text-xs mt-2 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {error}
                </div>
            )}
        </div>
    );
};
