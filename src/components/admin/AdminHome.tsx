import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession, saveQuiz } from '../../firebase/database';
import { sampleQuiz } from '../../data/sample-quiz';
import { isFirebaseConfigured } from '../../firebase/config';

export function AdminHome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateGame = async () => {
    if (!isFirebaseConfigured()) {
      setError('Firebase is not configured. Please set up your .env.local file.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Save the sample quiz to Firebase
      await saveQuiz(sampleQuiz);

      // Create a new session
      const sessionCode = await createSession(sampleQuiz.id);

      // Navigate to the admin lobby
      navigate(`/admin/${sessionCode}`);
    } catch (err) {
      console.error('Failed to create game:', err);
      setError('Failed to create game. Check your Firebase configuration.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
          Host a Quiz
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Choose how to start your quiz
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {!isFirebaseConfigured() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Firebase Setup Required</h4>
            <ol className="text-yellow-700 text-sm space-y-1 list-decimal list-inside">
              <li>Go to Firebase Console</li>
              <li>Create a new project</li>
              <li>Add a web app and copy config</li>
              <li>Create Realtime Database (test mode)</li>
              <li>Copy .env.local.example to .env.local</li>
              <li>Paste your Firebase config values</li>
              <li>Restart the dev server</li>
            </ol>
          </div>
        )}

        {/* Sample Quiz Option */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <h3 className="font-semibold text-gray-800 mb-1">{sampleQuiz.name}</h3>
          <p className="text-gray-600 text-sm mb-3">
            {sampleQuiz.rounds.length} rounds • {' '}
            {sampleQuiz.rounds.reduce((acc, r) => acc + r.questions.length, 0)} questions
          </p>
          <button
            onClick={handleCreateGame}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? 'Creating...' : 'Use Sample Quiz'}
          </button>
        </div>

        {/* Create Custom Quiz Option */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border border-green-200">
          <h3 className="font-semibold text-gray-800 mb-1">Create Your Own Quiz</h3>
          <p className="text-gray-600 text-sm mb-3">
            Build a custom quiz with your own questions
          </p>
          <button
            onClick={() => navigate('/admin/create')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Create New Quiz
          </button>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full text-gray-500 hover:text-gray-700 font-medium py-2"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
