import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";

export function useEvent(eventName: string, handler: (data: any) => void) {
    const socket = useSocket();

    useEffect(() => {
        if (!socket) return;

        socket.on(eventName, handler);

        return () => {
            socket.off(eventName, handler);
        };
    }, [socket, eventName, handler]);
}
