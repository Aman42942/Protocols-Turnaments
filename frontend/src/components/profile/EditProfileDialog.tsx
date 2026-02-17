"use client";
import React, { useState } from 'react';
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

export function EditProfileDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    // Mock initial data - in real app, this would come from props or context
    const [formData, setFormData] = useState({
        username: "NightStalker",
        bio: "Pro Valorant Player | IGL for Team Liquid | Streamer",
        location: "Mumbai, India",
        twitter: "https://twitter.com/nightstalker",
        twitch: "https://twitch.tv/nightstalker",
        github: "https://github.com/nightstalker",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            setOpen(false);
            // Toast notification would go here
            console.log("Profile updated:", formData);
        }, 1000);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full mb-4">Edit Profile</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        You can change your avatar in your global profile settings. It&apos;s shared across all teams.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <Label>Social Links</Label>
                            <Input
                                name="twitter"
                                placeholder="Twitter URL"
                                value={formData.twitter}
                                onChange={handleChange}
                            />
                            <Input
                                name="twitch"
                                placeholder="Twitch URL"
                                value={formData.twitch}
                                onChange={handleChange}
                            />
                            <Input
                                name="github"
                                placeholder="GitHub URL"
                                value={formData.github}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Save changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
