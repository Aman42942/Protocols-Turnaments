'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Mail, MessageCircle, MapPin, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ContactUs() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-muted/30 py-12 px-4">
            <div className="container max-w-4xl mx-auto">
                <Button variant="ghost" className="mb-6" onClick={() => router.back()}>← Back</Button>

                <Card className="border-primary/10 shadow-xl overflow-hidden">
                    <CardHeader className="bg-primary border-b text-white text-center py-12">
                        <CardTitle className="text-4xl font-black uppercase tracking-tighter">Get In Touch</CardTitle>
                        <p className="opacity-80 mt-2 font-bold tracking-widest text-xs">WE&apos;RE HERE TO HELP YOU WIN</p>
                    </CardHeader>
                    <CardContent className="p-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-8">
                                <h3 className="text-2xl font-bold">Contact Information</h3>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <Mail className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-muted-foreground uppercase">Email Support</p>
                                            <p className="font-bold">support@protocol.com</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                                            <MessageCircle className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-muted-foreground uppercase">WhatsApp Support</p>
                                            <p className="font-bold">+91 98765 43210</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                                            <MapPin className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-muted-foreground uppercase">Office Address</p>
                                            <p className="font-bold text-sm">Hacker Street, Tech Valley, New Delhi, India</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-muted/50 p-8 rounded-2xl border-2 border-dashed">
                                <h3 className="text-lg font-bold mb-4">Support Hours</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span>Monday - Friday</span>
                                        <span className="font-bold">10 AM - 8 PM</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Saturday</span>
                                        <span className="font-bold">11 AM - 5 PM</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-red-500">
                                        <span>Sunday</span>
                                        <span className="font-bold">Closed</span>
                                    </div>
                                </div>
                                <div className="mt-8">
                                    <Button className="w-full font-bold py-6">
                                        START LIVE CHAT
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
