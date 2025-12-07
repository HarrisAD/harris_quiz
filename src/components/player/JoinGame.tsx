import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession, joinSession, generatePlayerId, getPlayer } from '../../firebase/database';

export function JoinGame() {
  const navigate = useNavigate();
  const [sessionCode, setSessionCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [reconnectInfo, setReconnectInfo] = useState<{ code: string; name: string; odUserId: string } | null>(null);

  // Check for reconnection opportunity on mount
  useEffect(() => {
    const lastCode = localStorage.getItem('lastSessionCode');
    const lastPlayerId = localStorage.getItem('lastPlayerId');
    const lastName = localStorage.getItem('lastTeamName');

    if (lastCode && lastPlayerId && lastName) {
      // Check if player still exists in that session
      checkReconnection(lastCode, lastPlayerId, lastName);
    }
  }, []);

  const checkReconnection = async (code: string, odUserId: string, name: string) => {
    try {
      const session = await getSession(code);
      if (!session || session.status === 'finished') {
        // Clear old data
        localStorage.removeItem('lastSessionCode');
        localStorage.removeItem('lastPlayerId');
        localStorage.removeItem('lastTeamName');
        return;
      }

      const player = await getPlayer(code, odUserId);
      if (player) {
        setReconnectInfo({ code, name, odUserId });
      } else {
        // Player no longer exists (game was reset)
        localStorage.removeItem('lastSessionCode');
        localStorage.removeItem('lastPlayerId');
        localStorage.removeItem('lastTeamName');
      }
    } catch {
      // Ignore errors
    }
  };

  const handleReconnect = () => {
    if (!reconnectInfo) return;

    // Restore session storage for this tab
    sessionStorage.setItem(`player_${reconnectInfo.code}`, reconnectInfo.odUserId);
    sessionStorage.setItem(`teamName_${reconnectInfo.code}`, reconnectInfo.name);

    navigate(`/play/${reconnectInfo.code}`);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const code = sessionCode.toUpperCase().trim();
    const name = teamName.trim();

    if (!code || !name) {
      setError('Please enter both a game code and team name');
      setLoading(false);
      return;
    }

    try {
      const session = await getSession(code);
      if (!session) {
        setError('Game not found. Check your code and try again.');
        setLoading(false);
        return;
      }

      if (session.status === 'finished') {
        setError('This game has already ended.');
        setLoading(false);
        return;
      }

      // Generate a player ID and store it
      const odUserId = generatePlayerId();

      // sessionStorage for per-tab (allows multiple players in same browser)
      sessionStorage.setItem(`player_${code}`, odUserId);
      sessionStorage.setItem(`teamName_${code}`, name);

      // localStorage for reconnection (persists across browser close)
      localStorage.setItem('lastSessionCode', code);
      localStorage.setItem('lastPlayerId', odUserId);
      localStorage.setItem('lastTeamName', name);

      await joinSession(code, odUserId, name);
      navigate(`/play/${code}`);
    } catch (err) {
      setError('Failed to join game. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
          Join Quiz
        </h1>
        <p className="text-gray-500 text-center mb-6">
          Enter the game code from your host
        </p>

        {/* Reconnect banner */}
        {reconnectInfo && (
          <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <p className="text-green-800 font-medium text-center mb-3">
              Rejoin as "{reconnectInfo.name}"?
            </p>
            <button
              onClick={handleReconnect}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Rejoin Game ({reconnectInfo.code})
            </button>
            <button
              onClick={() => {
                setReconnectInfo(null);
                localStorage.removeItem('lastSessionCode');
                localStorage.removeItem('lastPlayerId');
                localStorage.removeItem('lastTeamName');
              }}
              className="w-full mt-2 text-green-600 hover:text-green-800 text-sm"
            >
              Join as someone else
            </button>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Game Code
            </label>
            <input
              type="text"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              placeholder="ABCD12"
              maxLength={6}
              className="w-full px-4 py-3 text-2xl text-center font-mono tracking-widest border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none uppercase"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Name
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="The Quizzards"
              maxLength={30}
              className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 rounded-lg transition-colors text-lg"
          >
            {loading ? 'Joining...' : 'Join Game'}
          </button>
        </form>

        <button
          onClick={() => navigate('/')}
          className="w-full mt-4 text-gray-500 hover:text-gray-700 font-medium py-2"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
