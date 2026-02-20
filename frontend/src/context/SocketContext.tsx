"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

interface SocketProviderProps {
    children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        // Connect to the backend URL (ensure this matches your .env or backend port)
        // Assuming backend is on port 3001 or proxied via Next.js rewrites
        // For local dev, simpler to point directly if CORS allowed.
        const socketInstance = io("http://localhost:3001", {
            transports: ["websocket"],
            autoConnect: true,
            reconnection: true,
        });

        socketInstance.on("connect", () => {
            console.log("Connected to Real-time Server", socketInstance.id);
        });

        socketInstance.on("disconnect", () => {
            console.log("Disconnected from Real-time Server");
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
