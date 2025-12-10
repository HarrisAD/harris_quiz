import type { Player } from '../../types';

interface LeaderboardProps {
  players: Player[];
  title?: string;
  showRoundScore?: number; // round index to show round-specific score
  maxDisplay?: number;
  highlightPlayerId?: string;
}

export function Leaderboard({
  players,
  title = 'Leaderboard',
  showRoundScore,
  maxDisplay = 10,
  highlightPlayerId,
}: LeaderboardProps) {
  const displayPlayers = players.slice(0, maxDisplay);

  const getMedalEmoji = (index: number) => {
    switch (index) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return `${index + 1}.`;
    }
  };

  const getScore = (player: Player) => {
    if (showRoundScore !== undefined) {
      return player.scores?.[showRoundScore] || 0;
    }
    return player.totalScore || 0;
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
      <h2 className="text-2xl font-bold text-white text-center mb-4">{title}</h2>

      {displayPlayers.length === 0 ? (
        <p className="text-white/60 text-center">No players yet</p>
      ) : (
        <div className="space-y-2">
          {displayPlayers.map((player, index) => (
            <div
              key={player.odUserId}
              className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                highlightPlayerId === player.odUserId
                  ? 'bg-yellow-500/30 border-2 border-yellow-400'
                  : 'bg-white/5'
              } ${index < 3 ? 'text-lg font-semibold' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 text-center">{getMedalEmoji(index)}</span>
                <span className="text-white truncate max-w-[150px]">
                  {player.teamName}
                </span>
              </div>
              <span className="text-white font-mono font-bold">
                {getScore(player).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {players.length > maxDisplay && (
        <p className="text-white/40 text-center text-sm mt-4">
          +{players.length - maxDisplay} more teams
        </p>
      )}
    </div>
  );
}
