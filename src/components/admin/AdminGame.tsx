import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../../hooks/useSession';
import { useQuiz } from '../../hooks/useQuiz';
import { usePlayers } from '../../hooks/usePlayers';
import { useAnswers } from '../../hooks/useAnswers';
import { updateSession } from '../../firebase/database';
import { Timer } from '../shared/Timer';
import { Leaderboard } from '../shared/Leaderboard';

export function AdminGame() {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession(sessionCode || null);
  const { quiz } = useQuiz(session?.quizId || null);
  const { playersList, playerCount } = usePlayers(sessionCode || null);
  const { getQuestionAnswers } = useAnswers(sessionCode || null);

  if (!sessionCode) {
    navigate('/admin');
    return null;
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Session Not Found</h2>
          <button
            onClick={() => navigate('/admin')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg"
          >
            Create New Game
          </button>
        </div>
      </div>
    );
  }

  const currentRound = quiz?.rounds[session.currentRound];
  const currentQuestion = currentRound?.questions[session.currentQuestion];
  const totalQuestions = currentRound?.questions.length || 0;
  const totalRounds = quiz?.rounds.length || 0;

  const isLastQuestion = session.currentQuestion >= totalQuestions - 1;
  const isLastRound = session.currentRound >= totalRounds - 1;

  // Get answer stats for current question
  const currentAnswers = currentQuestion
    ? getQuestionAnswers(session.currentRound, session.currentQuestion)
    : {};
  const answerCount = Object.keys(currentAnswers).length;

  const handleStartQuiz = async () => {
    await updateSession(sessionCode, {
      status: 'playing',
      questionPhase: 'waiting',
    });
  };

  const handleStartQuestion = async () => {
    await updateSession(sessionCode, {
      questionPhase: 'answering',
      questionStartedAt: Date.now(),
    });
  };

  const handleRevealAnswer = async () => {
    await updateSession(sessionCode, {
      questionPhase: 'revealed',
    });
  };

  const handleShowRoundLeaderboard = async () => {
    await updateSession(sessionCode, {
      questionPhase: 'round_end',
    });
  };

  const handleNextRound = async () => {
    await updateSession(sessionCode, {
      currentRound: session.currentRound + 1,
      currentQuestion: 0,
      questionPhase: 'waiting',
      questionStartedAt: null,
    });
  };

  const handleFinishQuiz = async () => {
    await updateSession(sessionCode, {
      status: 'finished',
      questionPhase: 'waiting',
    });
  };

  const handleNextQuestion = async () => {
    await updateSession(sessionCode, {
      currentQuestion: session.currentQuestion + 1,
      questionPhase: 'waiting',
      questionStartedAt: null,
    });
  };

  // Lobby state
  if (session.status === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {quiz?.name || 'Quiz'}
            </h1>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 inline-block">
              <p className="text-white/60 text-sm mb-1">Join at</p>
              <p className="text-white text-lg mb-2">your-site.com/play</p>
              <p className="text-white/60 text-sm mb-1">Game Code</p>
              <p className="text-5xl font-mono font-bold text-white tracking-widest">
                {sessionCode}
              </p>
            </div>
          </div>

          {/* Players */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Players ({playerCount})
            </h2>
            {playerCount === 0 ? (
              <p className="text-white/60">Waiting for players to join...</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {playersList.map((player) => (
                  <div
                    key={player.odUserId}
                    className="bg-white/10 rounded-lg p-3 text-white text-center truncate"
                  >
                    {player.teamName}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Start button */}
          <button
            onClick={handleStartQuiz}
            disabled={playerCount === 0}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-xl transition-colors"
          >
            {playerCount === 0 ? 'Waiting for Players...' : 'Start Quiz!'}
          </button>
        </div>
      </div>
    );
  }

  // Game finished
  if (session.status === 'finished') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Game Over!</h1>
            <p className="text-white/80 text-xl">Final Results</p>
          </div>

          <Leaderboard players={playersList} title="Final Standings" />

          <button
            onClick={() => navigate('/admin')}
            className="w-full mt-6 bg-white/20 hover:bg-white/30 text-white font-bold py-4 rounded-xl transition-colors"
          >
            Host Another Game
          </button>
        </div>
      </div>
    );
  }

  // Round end leaderboard
  if (session.questionPhase === 'round_end') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 to-pink-600 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              {currentRound?.name || `Round ${session.currentRound + 1}`} Complete!
            </h1>
            <p className="text-white/80 text-xl">
              {isLastRound ? 'Final Round Finished!' : `${totalRounds - session.currentRound - 1} round${totalRounds - session.currentRound - 1 !== 1 ? 's' : ''} remaining`}
            </p>
          </div>

          <Leaderboard
            players={playersList}
            title="Leaderboard"
            showRoundScore={session.currentRound}
          />

          <div className="mt-6 space-y-3">
            {isLastRound ? (
              <button
                onClick={handleFinishQuiz}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl text-xl transition-colors"
              >
                Show Final Results
              </button>
            ) : (
              <button
                onClick={handleNextRound}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl text-xl transition-colors"
              >
                Start Round {session.currentRound + 2}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Playing state
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-white">
            <h2 className="text-xl font-bold">
              {currentRound?.name || `Round ${session.currentRound + 1}`}
            </h2>
            <p className="text-white/60">
              Question {session.currentQuestion + 1} of {totalQuestions}
            </p>
          </div>
          <div className="bg-white/10 rounded-lg px-4 py-2 text-white">
            Code: <span className="font-mono font-bold">{sessionCode}</span>
          </div>
        </div>

        {/* Main content area */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Question panel */}
          <div className="md:col-span-2">
            {/* Question */}
            <div className="bg-white rounded-2xl p-6 mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                {currentQuestion?.question}
              </h3>

              <div className="space-y-3">
                {currentQuestion?.options.map((option, index) => {
                  const labels = ['A', 'B', 'C', 'D'];
                  const isCorrect = index === currentQuestion.correctIndex;
                  const showCorrect = session.questionPhase === 'revealed';

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-xl flex items-center gap-4 ${
                        showCorrect && isCorrect
                          ? 'bg-green-100 border-2 border-green-500'
                          : 'bg-gray-100'
                      }`}
                    >
                      <span className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold">
                        {labels[index]}
                      </span>
                      <span className="flex-1">{option}</span>
                      {showCorrect && isCorrect && (
                        <span className="text-green-600 font-bold">✓ Correct</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timer & Stats */}
            <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-white">
                <p className="text-sm text-white/60">Answers received</p>
                <p className="text-2xl font-bold">
                  {answerCount} / {playerCount}
                </p>
              </div>

              {session.questionPhase === 'answering' && session.questionStartedAt && currentQuestion && (
                <Timer
                  startTime={session.questionStartedAt}
                  duration={currentQuestion.timeLimit}
                  size="large"
                />
              )}
            </div>

            {/* Control buttons */}
            <div className="mt-6 space-y-3">
              {session.questionPhase === 'waiting' && (
                <button
                  onClick={handleStartQuestion}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl text-xl transition-colors"
                >
                  Start Timer
                </button>
              )}

              {session.questionPhase === 'answering' && (
                <button
                  onClick={handleRevealAnswer}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 rounded-xl text-xl transition-colors"
                >
                  Reveal Answer
                </button>
              )}

              {session.questionPhase === 'revealed' && (
                <button
                  onClick={isLastQuestion ? handleShowRoundLeaderboard : handleNextQuestion}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl text-xl transition-colors"
                >
                  {isLastQuestion ? 'Show Round Leaderboard' : 'Next Question'}
                </button>
              )}
            </div>
          </div>

          {/* Leaderboard sidebar */}
          <div>
            <Leaderboard
              players={playersList}
              title="Leaderboard"
              maxDisplay={8}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
