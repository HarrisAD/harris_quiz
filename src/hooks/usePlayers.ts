import { useState, useEffect } from 'react';
import { subscribeToPlayers } from '../firebase/database';
import type { Player } from '../types';

export function usePlayers(sessionCode: string | null) {
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionCode) {
      setPlayers({});
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToPlayers(sessionCode, (data) => {
      setPlayers(data || {});
      setLoading(false);
    });

    return unsubscribe;
  }, [sessionCode]);

  // Convert to sorted array for leaderboard display
  const playersList = Object.values(players).sort(
    (a, b) => b.totalScore - a.totalScore
  );

  const playerCount = Object.keys(players).length;

  return { players, playersList, playerCount, loading };
}
