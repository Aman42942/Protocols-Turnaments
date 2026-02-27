"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/Dialog';
import { Loader2, Save } from 'lucide-react';
import api from '@/lib/api';

interface EditProfileDialogProps {
    user: any;
    onUpdate: (updatedUser: any) => void;
    children?: React.ReactNode;
}

export function EditProfileDialog({ user, onUpdate, children }: EditProfileDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: user?.name || "",
        bio: user?.bio || "",
        country: user?.country || "",
        bgmiId: user?.bgmiId || "",
        freeFireId: user?.freeFireId || "",
    });

    // Update form when user prop changes
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                bio: user.bio || "",
                country: user.country || "",
                bgmiId: user.bgmiId || "",
                freeFireId: user.freeFireId || "",
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.patch('/users/me', formData);
            const updatedUser = response.data;
            localStorage.setItem('user', JSON.stringify(updatedUser)); // Sync localStorage
            window.dispatchEvent(new Event('auth-change')); // Notify other components
            onUpdate(updatedUser);
            setOpen(false);
        } catch (error) {
            console.error('Failed to update profile:', error);
            // In a full app, we would show a toast here
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || <Button className="w-full mb-4">Edit Profile</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-border/50 bg-card/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tight italic">Edit Your Legend</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
                        Your profile is your identity across all tournaments.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Display Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="rounded-xl border-border/50 bg-background/50"
                                placeholder="Enter your name"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="bio" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Battle Bio</Label>
                            <Textarea
                                id="bio"
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                className="col-span-3 rounded-xl border-border/50 bg-background/50 min-h-[80px]"
                                placeholder="Tell the world your story..."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="country" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Location</Label>
                            <Input
                                id="country"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                className="rounded-xl border-border/50 bg-background/50"
                                placeholder="e.g. Mumbai, India"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="bgmiId" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">BGMI ID</Label>
                                <Input
                                    id="bgmiId"
                                    name="bgmiId"
                                    value={formData.bgmiId}
                                    onChange={handleChange}
                                    className="rounded-xl border-border/50 bg-background/50"
                                    placeholder="5XXXXXXXXX"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="freeFireId" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Free Fire ID</Label>
                                <Input
                                    id="freeFireId"
                                    name="freeFireId"
                                    value={formData.freeFireId}
                                    onChange={handleChange}
                                    className="rounded-xl border-border/50 bg-background/50"
                                    placeholder="UID..."
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-2xl h-11 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Update Legend
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
