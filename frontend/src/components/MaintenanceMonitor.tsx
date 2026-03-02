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
        if (isMaintenanceMode) {
            // If maintenance turned ON and user is NOT an admin
            if (!isAdmin && pathname !== "/maintenance") {
                router.push("/maintenance");
            }
        } else {
            // If maintenance turned OFF and user is ON maintenance page
            if (pathname === "/maintenance") {
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

    return null; // Component does not render anything
}
