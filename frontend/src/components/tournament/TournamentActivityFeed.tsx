"use client";

import React, { useEffect, useState } from 'react';
import { useSocket } from '@/context/SocketContext';
import { Swords, Trophy, UserPlus, AlertCircle } from 'lucide-react';

interface Activity {
    id: string;
    type: 'MATCH_START' | 'MATCH_END' | 'JOIN' | 'ANNOUNCEMENT';
    message: string;
    timestamp: string;
}

export function TournamentActivityFeed({ tournamentId }: { tournamentId: string }) {
    const socket = useSocket();
    const [activities, setActivities] = useState<Activity[]>([
        { id: '1', type: 'ANNOUNCEMENT', message: 'Tournament setup complete.', timestamp: new Date().toISOString() }
    ]);

    useEffect(() => {
        if (!socket) return;

        socket.on(`activity-${tournamentId}`, (newActivity: Activity) => {
            setActivities(prev => [newActivity, ...prev]);
        });

        return () => {
            socket.off(`activity-${tournamentId}`);
        };
    }, [socket, tournamentId]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'MATCH_START': return <Swords className="w-4 h-4 text-blue-500" />;
            case 'MATCH_END': return <Trophy className="w-4 h-4 text-yellow-500" />;
            case 'JOIN': return <UserPlus className="w-4 h-4 text-green-500" />;
            default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 border-b bg-muted/30 font-semibold text-sm">Live Activity</div>
            <div className="h-[200px] overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {activities.map((act) => (
                    <div key={act.id} className="flex gap-3 text-sm">
                        <div className="mt-0.5">{getIcon(act.type)}</div>
                        <div>
                            <p className="leading-tight">{act.message}</p>
                            <span className="text-[10px] text-muted-foreground">
                                {new Date(act.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
