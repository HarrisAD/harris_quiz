import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../../hooks/useSession';
import { useQuiz } from '../../hooks/useQuiz';
import { usePlayers } from '../../hooks/usePlayers';
import { useAnswers } from '../../hooks/useAnswers';
import { updateSession, resetSession } from '../../firebase/database';
import { Timer } from '../shared/Timer';
import { Leaderboard } from '../shared/Leaderboard';

export function AdminGame() {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession(sessionCode || null);
  const { quiz } = useQuiz(session?.quizId || null);
  const { playersList, playerCount, players } = usePlayers(sessionCode || null);
  const { getQuestionAnswers, getAllAnswers } = useAnswers(sessionCode || null);
  const [showAnswerHistory, setShowAnswerHistory] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetGame = async () => {
    if (!sessionCode) return;
    await resetSession(sessionCode);
    setShowResetConfirm(false);
  };

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

  // Build answer history grouped by round and question
  const buildAnswerHistory = () => {
    const allAnswers = getAllAnswers();
    const history: Record<number, Record<number, { player: string; answer: string; answerText: string; correct: boolean; points: number }[]>> = {};

    for (const key in allAnswers) {
      const answer = allAnswers[key];

      // Key format: odUserId_roundIdx_questionIdx
      // Parse from end since odUserId can contain special chars
      const parts = key.split('_');
      if (parts.length < 3) continue;

      const questionIdx = parseInt(parts[parts.length - 1]);
      const roundIdx = parseInt(parts[parts.length - 2]);

      // Skip invalid indices
      if (isNaN(roundIdx) || isNaN(questionIdx)) continue;

      // Skip if round/question doesn't exist in current quiz (orphan data)
      const round = quiz?.rounds[roundIdx];
      const question = round?.questions[questionIdx];
      if (!round || !question) continue;

      // Use odUserId from the answer object itself (more reliable)
      const player = players[answer.odUserId];

      if (!history[roundIdx]) history[roundIdx] = {};
      if (!history[roundIdx][questionIdx]) history[roundIdx][questionIdx] = [];

      const labels = ['A', 'B', 'C', 'D'];
      const answerLabel = labels[answer.answerIndex] || '?';
      const answerText = question.options[answer.answerIndex] || 'Unknown';

      history[roundIdx][questionIdx].push({
        player: player?.teamName || 'Unknown Player',
        answer: answerLabel,
        answerText: answerText,
        correct: answer.correct,
        points: answer.points,
      });
    }

    return history;
  };

  // Convert history to display format with round/question names
  const getHistoryDisplay = () => {
    const history = buildAnswerHistory();
    const display: { roundName: string; roundIdx: number; questions: { questionName: string; questionIdx: number; answers: { player: string; answer: string; answerText: string; correct: boolean; points: number }[] }[] }[] = [];

    const sortedRounds = Object.keys(history).map(Number).sort((a, b) => a - b);

    for (const roundIdx of sortedRounds) {
      const round = quiz?.rounds[roundIdx];
      const roundName = round?.name || `Round ${roundIdx + 1}`;
      const questions: { questionName: string; questionIdx: number; answers: { player: string; answer: string; answerText: string; correct: boolean; points: number }[] }[] = [];

      const sortedQuestions = Object.keys(history[roundIdx]).map(Number).sort((a, b) => a - b);

      for (const questionIdx of sortedQuestions) {
        const question = round?.questions[questionIdx];
        const questionText = question?.question || 'Unknown';
        const questionName = `Q${questionIdx + 1}: ${questionText.substring(0, 50)}${questionText.length > 50 ? '...' : ''}`;

        questions.push({
          questionName,
          questionIdx,
          answers: history[roundIdx][questionIdx],
        });
      }

      display.push({ roundName, roundIdx, questions });
    }

    return display;
  };

  // Render answer history modal
  const renderAnswerHistory = () => {
    const historyDisplay = getHistoryDisplay();

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-2xl font-bold">Answer History</h2>
            <button
              onClick={() => setShowAnswerHistory(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              &times;
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {historyDisplay.length === 0 ? (
              <p className="text-gray-500 text-center">No answers recorded yet</p>
            ) : (
              historyDisplay.map((round) => (
                <div key={round.roundIdx} className="mb-6">
                  <h3 className="text-lg font-bold text-purple-600 mb-3">{round.roundName}</h3>
                  {round.questions.map((q) => (
                    <div key={q.questionIdx} className="mb-4 bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-2">{q.questionName}</h4>
                      <div className="space-y-1">
                        {q.answers.map((a, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded text-sm flex justify-between items-center ${
                              a.correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            <div>
                              <span className="font-medium">{a.player}</span>
                              <span className="mx-2">→</span>
                              <span>{a.answer}: {a.answerText}</span>
                            </div>
                            <span className="text-xs font-mono">{a.points}pts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
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
        {showAnswerHistory && renderAnswerHistory()}
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Game Over!</h1>
            <p className="text-white/80 text-xl">Final Results</p>
          </div>

          <Leaderboard players={playersList} title="Final Standings" />

          <div className="mt-6 space-y-3">
            <button
              onClick={() => setShowAnswerHistory(true)}
              className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-4 rounded-xl transition-colors"
            >
              View All Answers
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl transition-colors"
            >
              Play Again (Same Quiz)
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl transition-colors"
            >
              Host Different Quiz
            </button>
          </div>

          {/* Reset confirmation modal */}
          {showResetConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">Start New Game?</h2>
                <p className="text-gray-600 mb-6">
                  This will clear all players and scores. Everyone will need to rejoin with the same code: <strong>{sessionCode}</strong>
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetGame}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    Reset & Play Again
                  </button>
                </div>
              </div>
            </div>
          )}
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
      {showAnswerHistory && renderAnswerHistory()}
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAnswerHistory(true)}
              className="bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 text-white text-sm transition-colors"
            >
              View Answers
            </button>
            <div className="bg-white/10 rounded-lg px-4 py-2 text-white">
              Code: <span className="font-mono font-bold">{sessionCode}</span>
            </div>
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
