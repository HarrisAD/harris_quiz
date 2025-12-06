import { useNavigate } from 'react-router-dom';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-gray-800 text-center mb-2">
          Vibe Quiz
        </h1>
        <p className="text-gray-500 text-center mb-8">
          The realtime multiplayer quiz game
        </p>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/admin')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors text-lg flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🎤</span>
            Host a Quiz
          </button>

          <button
            onClick={() => navigate('/play')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors text-lg flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🎮</span>
            Join a Game
          </button>
        </div>

        <p className="text-gray-400 text-center text-sm mt-8">
          Powered by Firebase Realtime Database
        </p>
      </div>
    </div>
  );
}
