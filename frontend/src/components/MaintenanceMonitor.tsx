"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSocket } from "@/context/SocketContext";
import api from "@/lib/api";

export function MaintenanceMonitor() {
    const router = useRouter();
    const pathname = usePathname();
    const socket = useSocket();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);

    // Initial role check
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                const ADMIN_ROLES = [
                    'ULTIMATE_ADMIN', 'SUPERADMIN',
                    'SENIOR_CHIEF_SECURITY_ADMIN', 'CHIEF_DEVELOPMENT_ADMIN',
                    'CHIEF_SECURITY_ADMIN', 'VICE_CHIEF_SECURITY_ADMIN',
                    'SENIOR_ADMIN', 'JUNIOR_ADMIN', 'EMPLOYEE', 'ADMIN'
                ];
                if (user.role && ADMIN_ROLES.includes(user.role)) {
                    setIsAdmin(true);
                }
            } catch (e) {
                console.error("Failed to parse user role for maintenance sync");
            }
        }
    }, []);

    const handleStatusChange = (isMaintenanceMode: boolean) => {
        setIsMaintenanceActive(isMaintenanceMode);

        // Only react if we definitely know their admin status or lack thereof
        if (isMaintenanceMode) {
            // Maintenance ON - Kick non-admins
            if (!isAdmin && pathname !== "/maintenance") {
                router.push("/maintenance");
            }
        } else {
            // Maintenance OFF - Only push regular users back home who are stuck on the maintenance page
            if (!isAdmin && pathname === "/maintenance") {
                router.push("/");
            }
        }
    };

    // WebSocket Listener
    useEffect(() => {
        if (!socket) return;

        socket.on("maintenance-status", (data: { isMaintenanceMode: boolean }) => {
            handleStatusChange(data.isMaintenanceMode);
        });

        return () => {
            socket.off("maintenance-status");
        };
    }, [socket, isAdmin, pathname, router]);

    // Polling Fallback (Every 60 seconds)
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await api.get("/maintenance");
                if (res.data) {
                    handleStatusChange(res.data.isMaintenanceMode);
                }
            } catch (err) {
                // Ignore background errors
            }
        };

        const interval = setInterval(checkStatus, 60000);
        return () => clearInterval(interval);
    }, [isAdmin, pathname, router]);

    if (isAdmin && isMaintenanceActive) {
        return (
            <div className="fixed top-0 left-0 right-0 z-[99999] bg-red-600 text-white text-center text-[10px] md:text-xs font-black uppercase tracking-widest py-1.5 shadow-lg shadow-red-900/50 flex items-center justify-center gap-2">
                <span className="animate-pulse w-2 h-2 rounded-full bg-white block"></span>
                SYSTEM MAINTENANCE IS CURRENTLY ACTIVE. REGULAR USERS ARE LOCKED OUT.
            </div>
        );
    }

    return null;
}
