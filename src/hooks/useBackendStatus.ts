import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export function useBackendStatus() {
    const [isConnected, setIsConnected] = useState<boolean | null>(null);
    const [isChecking, setIsChecking] = useState(true);

    const checkConnection = async () => {
        setIsChecking(true);
        try {
            await api.healthCheck();
            setIsConnected(true);
        } catch (error) {
            setIsConnected(false);
        } finally {
            setIsChecking(false);
        }
    };

    useEffect(() => {
        checkConnection();

        // Check every 30 seconds
        const interval = setInterval(checkConnection, 30000);

        return () => clearInterval(interval);
    }, []);

    return { isConnected, isChecking, recheckConnection: checkConnection };
}
