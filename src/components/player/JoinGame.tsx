import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession, joinSession, generatePlayerId } from '../../firebase/database';

export function JoinGame() {
  const navigate = useNavigate();
  const [sessionCode, setSessionCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

      // Generate a player ID and store it in sessionStorage (per-tab)
      const odUserId = generatePlayerId();
      sessionStorage.setItem(`player_${code}`, odUserId);
      sessionStorage.setItem(`teamName_${code}`, name);

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
