import { useState, useEffect } from 'react';
import { subscribeToSession } from '../firebase/database';
import type { Session } from '../types';

export function useSession(sessionCode: string | null) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionCode) {
      setSession(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const unsubscribe = subscribeToSession(sessionCode, (data) => {
        setSession(data);
        setLoading(false);
        if (!data) {
          setError('Session not found');
        }
      });

      return unsubscribe;
    } catch (err) {
      setError('Failed to connect to session');
      setLoading(false);
    }
  }, [sessionCode]);

  return { session, loading, error };
}
