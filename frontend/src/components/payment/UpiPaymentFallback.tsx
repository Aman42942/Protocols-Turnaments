'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
    Copy, CheckCircle, AlertTriangle, X, Smartphone, CreditCard,
    Loader2, Timer, Shield, QrCode, Zap, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface UpiPaymentFallbackProps {
    amount: number;
    tournamentName: string;
    tournamentId: string;
    onClose: () => void;
    onConfirm: () => void; // No longer needs txnId from client — backend generates it
}

const DEFAULT_UPI_ID = 'keeps@ptyes';
const DEFAULT_UPI_NAME = 'Protocol Tournament Support';

export function UpiPaymentFallback({
    amount,
    tournamentName,
    tournamentId,
    onClose,
    onConfirm,
}: UpiPaymentFallbackProps) {
    const [status, setStatus] = useState<'paying' | 'verifying' | 'success' | 'expired' | 'failed'>('paying');
    const [timeLeft, setTimeLeft] = useState(300);
    const [upiDetails, setUpiDetails] = useState({ upiId: DEFAULT_UPI_ID, merchantName: DEFAULT_UPI_NAME });
    const [copied, setCopied] = useState(false);
    const [step, setStep] = useState(0); // 0 = Scan, 1 = Pay, 2 = Done

    // Timer
    useEffect(() => {
        if (status !== 'paying' || timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) { setStatus('expired'); clearInterval(interval); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [status, timeLeft]);

    // Fetch real UPI details
    useEffect(() => {
        import('@/lib/api').then(({ default: api }) => {
            api.get('/wallet/upi-details')
                .then(res => setUpiDetails(res.data))
                .catch(() => { });
        });
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const { upiId, merchantName } = upiDetails;
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Tournament: ${tournamentName}`)}`;

    // Called when user taps any UPI app — calls backend to validate & record payment, then auto-confirms
    const handlePaymentRedirect = () => {
        setStep(1);
        // After returning from UPI app, call backend to confirm registration
        setTimeout(async () => {
            setStep(2);
            setStatus('verifying');
            try {
                const { default: api } = await import('@/lib/api');
                await api.post(`/tournaments/${tournamentId}/upi-payment`, {
                    amount,
                });
                setStatus('success');
                setTimeout(() => {
                    onConfirm();
                }, 2000);
            } catch (err: any) {
                // Backend rejected (amount mismatch, already registered, etc.)
                setStatus('failed');
                console.error('Payment registration failed:', err);
            }
        }, 4000);
    };

    const AppButton = ({ app, color, icon }: { app: string, color: string, icon: React.ReactNode }) => (
        <a
            href={upiLink}
            onClick={handlePaymentRedirect}
            className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 active:scale-95"
        >
            <div className={`w-12 h-12 rounded-xl scale-90 ${color} flex items-center justify-center shadow-lg`}>
                {icon}
            </div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{app}</span>
        </a>
    );

    if (status === 'verifying') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050510]/95 backdrop-blur-md p-4">
                <div className="w-full max-w-sm flex flex-col items-center gap-8 text-center">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-yellow-500/20 border-t-yellow-500 animate-spin" />
                        <Shield className="w-10 h-10 text-yellow-500 absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white mb-2">Verifying Payment</h3>
                        <p className="text-gray-400 text-sm max-w-[250px] mx-auto">Please wait while we confirm your payment automatically.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        // Confetti particle positions
        const particles = Array.from({ length: 20 }, (_, i) => ({
            id: i,
            x: (Math.random() - 0.5) * 400,
            y: -(Math.random() * 300 + 100),
            rotate: Math.random() * 360,
            color: ['#22c55e', '#16a34a', '#4ade80', '#86efac', '#facc15', '#38bdf8'][Math.floor(Math.random() * 6)],
            size: Math.random() * 8 + 4,
        }));

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 overflow-hidden">
                {/* Particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
                    {particles.map((p) => (
                        <motion.div
                            key={p.id}
                            initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
                            animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.3, rotate: p.rotate }}
                            transition={{ duration: 1.5, delay: Math.random() * 0.3, ease: 'easeOut' }}
                            style={{ backgroundColor: p.color, width: p.size, height: p.size, borderRadius: Math.random() > 0.5 ? '50%' : '2px', position: 'absolute' }}
                        />
                    ))}
                </div>

                <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center relative">
                    {/* Glowing Icon with rings */}
                    <div className="relative flex items-center justify-center">
                        {/* Outer pulse ring */}
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: [1, 1.4, 1.2], opacity: [0.8, 0, 0.4] }}
                            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeOut' }}
                            className="absolute w-40 h-40 rounded-full border-2 border-green-400/30"
                        />
                        {/* Mid ring */}
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: [1, 1.2, 1.05], opacity: [1, 0.3, 0.7] }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'easeOut', delay: 0.3 }}
                            className="absolute w-32 h-32 rounded-full border-2 border-green-400/60"
                        />
                        {/* Main icon circle */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                            className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-[0_0_60px_-10px_rgba(34,197,94,0.8)]"
                        >
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
                            >
                                <CheckCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Text */}
                    <div className="space-y-2">
                        <motion.h3
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="text-4xl font-black text-white tracking-tight"
                        >
                            Payment
                        </motion.h3>
                        <motion.h3
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.65, duration: 0.5 }}
                            className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300 tracking-tight"
                        >
                            Successful! 🎉
                        </motion.h3>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.85 }}
                            className="text-green-400/80 font-bold tracking-[0.3em] text-[10px] uppercase"
                        >
                            ✦ &nbsp; Registration Confirmed &nbsp; ✦
                        </motion.p>
                    </div>

                    {/* Receipt Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 1, duration: 0.5, type: 'spring', stiffness: 120 }}
                        className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 space-y-3 backdrop-blur-sm"
                    >
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-[10px] uppercase font-black tracking-widest">Amount Paid</span>
                            <span className="text-2xl font-black text-white">₹{amount}</span>
                        </div>
                        <div className="w-full h-px bg-white/5" />
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-[10px] uppercase font-black tracking-widest">Tournament</span>
                            <span className="text-white text-xs font-bold text-right max-w-[180px] truncate">{tournamentName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-[10px] uppercase font-black tracking-widest">Status</span>
                            <span className="text-green-400 text-[10px] font-black bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full uppercase tracking-wider">Registered ✓</span>
                        </div>
                    </motion.div>

                    {/* Loading entering */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.3 }}
                        className="flex items-center gap-2 text-green-500/60"
                    >
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-medium">Entering Tournament...</span>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (status === 'expired') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050510]/98 backdrop-blur-xl p-4">
                <div className="bg-[#0f0f1a] border border-red-500/30 rounded-3xl w-full max-w-md p-8 text-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                        <Timer className="w-10 h-10 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-2">Session Expired</h3>
                        <p className="text-gray-400 text-sm">For security reasons, payment sessions expire after 5 minutes. Please try again.</p>
                    </div>
                    <Button onClick={onClose} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-2xl border-none">
                        Back to Tournament
                    </Button>
                </div>
            </div>
        );
    }

    if (status === 'failed') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050510]/98 backdrop-blur-xl p-4">
                <div className="bg-[#0f0f1a] border border-orange-500/30 rounded-3xl w-full max-w-md p-8 text-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-10 h-10 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-2">Registration Failed</h3>
                        <p className="text-gray-400 text-sm">Payment could not be verified. This may happen if you're already registered, or the payment amount is incorrect. Please contact support.</p>
                    </div>
                    <Button onClick={onClose} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-2xl border-none">
                        Back to Tournament
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg p-2 sm:p-4 transition-all duration-500">
            <div className="relative bg-[#0b0b14] border border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-[0_0_80px_-20px_rgba(234,179,8,0.15)] flex flex-col max-h-[96vh] overflow-hidden">

                {/* Premium Header */}
                <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 p-[1px]">
                            <div className="w-full h-full rounded-xl bg-[#0b0b14] flex items-center justify-center">
                                <Shield className="w-5 h-5 text-yellow-500" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-white font-black text-lg leading-tight uppercase tracking-tight">Checkout</h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Protocol Direct Secure</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full flex items-center gap-2">
                            <Timer className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                            <span className="text-red-500 font-mono font-bold text-sm tracking-tighter">{formatTime(timeLeft)}</span>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors border border-white/10">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">

                    {/* Stepper */}
                    <div className="flex items-center justify-between px-4 relative">
                        <div className="absolute top-1/2 left-[15%] right-[15%] h-[1px] bg-white/5 -z-10" />
                        {[
                            { icon: <QrCode className="w-4 h-4" />, label: 'Scan' },
                            { icon: <Smartphone className="w-4 h-4" />, label: 'Pay' },
                            { icon: <CheckCircle className="w-4 h-4" />, label: 'Done' }
                        ].map((s, i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${i < step ? 'bg-green-500 border-green-500 text-black' :
                                    i === step ? 'bg-yellow-500 border-yellow-500 text-black shadow-[0_0_15px_-2px_rgba(234,179,8,0.5)]' :
                                        'bg-[#0b0b14] border-white/10 text-gray-600'
                                    }`}>
                                    {s.icon}
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${i <= step ? 'text-yellow-500' : 'text-gray-600'
                                    }`}>{s.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                        {/* QR Section */}
                        <div className="flex flex-col items-center gap-4 shrink-0">
                            <div className="relative group p-6 bg-white rounded-[2rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] transition-transform hover:scale-[1.02]">
                                <QRCodeSVG value={upiLink} size={150} level="H" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-white font-bold text-xs uppercase tracking-widest">Scan to Pay</p>
                                <p className="text-gray-500 text-[10px] leading-relaxed">Point your camera at the QR code<br />to initiate direct payment</p>
                            </div>
                        </div>

                        {/* Payment Info Section */}
                        <div className="flex-1 w-full space-y-6">
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-1">Total Payable</p>
                                        <h3 className="text-4xl font-black text-white leading-none">₹{amount}</h3>
                                    </div>
                                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[9px] h-6 px-3">PROTECTED</Badge>
                                </div>
                                <div className="pt-4 border-t border-white/5 space-y-3">
                                    <p className="text-gray-400 text-xs font-medium leading-relaxed">
                                        You are paying for <strong className="text-white">{tournamentName}</strong> registration.
                                    </p>
                                    <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/5 hover:bg-white/[0.08] transition-colors">
                                        <div className="flex-1 truncate">
                                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">VPA / UPI ID</p>
                                            <p className="text-white font-mono text-xs truncate font-bold">{upiId}</p>
                                        </div>
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(upiId); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                                            className="p-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                                        >
                                            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Pay with App Buttons */}
                            <div>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-3 text-center">Pay Instantly With</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <AppButton app="Paytm" color="bg-[#00baf2]" icon={<div className="font-black text-white text-[10px]">paytm</div>} />
                                    <AppButton app="PhonePe" color="bg-[#5f259f]" icon={<Smartphone className="w-5 h-5 text-white" />} />
                                    <AppButton app="GPay" color="bg-white" icon={<div className="font-black text-blue-600 text-sm italic">G</div>} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Auto-confirm note instead of button */}
                    <div className="pt-4 border-t border-white/5 space-y-4">
                        <div className="flex items-center justify-center gap-3 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
                            <Zap className="w-5 h-5 text-yellow-500 shrink-0" />
                            <p className="text-xs text-gray-400 leading-relaxed text-center">
                                <span className="text-yellow-400 font-bold">Auto-confirm enabled.</span> After paying via app, your registration will be confirmed automatically.
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-6">
                            <div className="flex items-center gap-1.5 opacity-50">
                                <Shield className="w-3 h-3 text-white" />
                                <span className="text-[10px] font-bold text-white tracking-widest uppercase">Verified</span>
                            </div>
                            <div className="flex items-center gap-1.5 opacity-50">
                                <Zap className="w-3 h-3 text-white" />
                                <span className="text-[10px] font-bold text-white tracking-widest uppercase">Instant</span>
                            </div>
                            <div className="flex items-center gap-1.5 opacity-50">
                                <CreditCard className="w-3 h-3 text-white" />
                                <span className="text-[10px] font-bold text-white tracking-widest uppercase">Direct</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-white/[0.02] border-t border-white/5 rounded-b-[2.5rem] flex items-center justify-center text-[8px] text-gray-600 font-bold uppercase tracking-[0.2em]">
                    Powered by Protocol Gateway 2.0 • Auto-Confirm Active
                </div>
            </div>
        </div>
    );
}
