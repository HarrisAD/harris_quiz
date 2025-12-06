import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../../hooks/useSession';
import { useQuiz } from '../../hooks/useQuiz';
import { usePlayers } from '../../hooks/usePlayers';
import { useAnswers } from '../../hooks/useAnswers';
import { submitAnswer, updatePlayerScore } from '../../firebase/database';
import { Timer } from '../shared/Timer';
import { AnswerButton } from '../shared/AnswerButton';
import { Leaderboard } from '../shared/Leaderboard';

export function PlayerGame() {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const navigate = useNavigate();
  const { session, loading: sessionLoading, error: sessionError } = useSession(sessionCode || null);
  const { quiz } = useQuiz(session?.quizId || null);
  const { players, playersList } = usePlayers(sessionCode || null);
  const { hasPlayerAnswered, getPlayerAnswer } = useAnswers(sessionCode || null);

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Get player info from sessionStorage (per-tab, allows multiple players in same browser)
  const odUserId = sessionStorage.getItem(`player_${sessionCode}`) || '';
  const teamName = sessionStorage.getItem(`teamName_${sessionCode}`) || 'Unknown Team';

  // Get my player from the players object directly
  const myPlayer = odUserId ? players[odUserId] : null;

  // Get current question data
  const currentRound = quiz?.rounds[session?.currentRound || 0];
  const currentQuestion = currentRound?.questions[session?.currentQuestion || 0];

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setHasSubmitted(false);
  }, [session?.currentRound, session?.currentQuestion]);

  // Check if already answered (e.g., on page reload)
  useEffect(() => {
    if (session && odUserId) {
      const answered = hasPlayerAnswered(odUserId, session.currentRound, session.currentQuestion);
      if (answered) {
        setHasSubmitted(true);
        const answer = getPlayerAnswer(odUserId, session.currentRound, session.currentQuestion);
        if (answer) {
          setSelectedAnswer(answer.answerIndex);
        }
      }
    }
  }, [session, odUserId, hasPlayerAnswered, getPlayerAnswer]);

  const handleSubmitAnswer = async (answerIndex: number) => {
    if (!sessionCode || !session || !currentQuestion || !session.questionStartedAt) return;

    // Allow changing answer before submission is final
    setSelectedAnswer(answerIndex);

    const isCorrect = answerIndex === currentQuestion.correctIndex;
    const timeElapsed = (Date.now() - session.questionStartedAt) / 1000;
    const timeRemaining = Math.max(0, currentQuestion.timeLimit - timeElapsed);

    // Calculate points: 1000 base + up to 500 speed bonus
    const points = isCorrect
      ? 1000 + Math.floor(500 * (timeRemaining / currentQuestion.timeLimit))
      : 0;

    // Don't show points yet - will be revealed when answer is shown

    // Get current scores from Firebase directly
    const currentTotalScore = myPlayer?.totalScore || 0;
    const currentRoundScore = myPlayer?.scores?.[session.currentRound] || 0;

    // If already submitted, need to subtract old points first
    let oldPoints = 0;
    if (hasSubmitted) {
      const oldAnswer = getPlayerAnswer(odUserId, session.currentRound, session.currentQuestion);
      oldPoints = oldAnswer?.points || 0;
    }

    const newRoundScore = currentRoundScore - oldPoints + points;
    const newTotalScore = currentTotalScore - oldPoints + points;

    try {
      await submitAnswer(
        sessionCode,
        odUserId,
        session.currentRound,
        session.currentQuestion,
        answerIndex,
        isCorrect,
        points
      );

      await updatePlayerScore(sessionCode, odUserId, session.currentRound, newRoundScore, newTotalScore);

      setHasSubmitted(true);
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  };

  if (!sessionCode || !odUserId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Session Error</h2>
          <p className="text-gray-600 mb-4">Unable to find your game session.</p>
          <button
            onClick={() => navigate('/play')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Join a Game
          </button>
        </div>
      </div>
    );
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (sessionError || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Game Not Found</h2>
          <button
            onClick={() => navigate('/play')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Join Another Game
          </button>
        </div>
      </div>
    );
  }

  // Lobby state
  if (session.status === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center max-w-md w-full">
          <h1 className="text-3xl font-bold text-white mb-2">You're In!</h1>
          <p className="text-white/80 text-xl mb-6">{teamName}</p>

          <div className="bg-white/10 rounded-xl p-4 mb-6">
            <p className="text-white/60 text-sm mb-1">Game Code</p>
            <p className="text-3xl font-mono font-bold text-white tracking-widest">
              {sessionCode}
            </p>
          </div>

          <div className="animate-pulse">
            <p className="text-white/80">Waiting for host to start...</p>
          </div>
        </div>
      </div>
    );
  }

  // Game finished
  if (session.status === 'finished') {
    const myRank = playersList.findIndex((p) => p.odUserId === odUserId) + 1;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Game Over!</h1>
          {myRank === 1 && <p className="text-6xl">🏆</p>}
          {myRank === 2 && <p className="text-6xl">🥈</p>}
          {myRank === 3 && <p className="text-6xl">🥉</p>}
          <p className="text-white text-xl mt-4">
            You finished #{myRank} with {myPlayer?.totalScore?.toLocaleString() || 0} points!
          </p>
        </div>

        <div className="w-full max-w-md">
          <Leaderboard
            players={playersList}
            title="Final Standings"
            highlightPlayerId={odUserId}
          />
        </div>
      </div>
    );
  }

  // Round end leaderboard
  if (session.questionPhase === 'round_end') {
    const myRank = playersList.findIndex((p) => p.odUserId === odUserId) + 1;
    const myRoundScore = myPlayer?.scores?.[session.currentRound] || 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 to-pink-600 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            {currentRound?.name || `Round ${session.currentRound + 1}`} Complete!
          </h1>
          <p className="text-white/80 text-lg mb-2">
            Your round score: {myRoundScore.toLocaleString()} points
          </p>
          <p className="text-white/60">
            Position #{myRank} overall
          </p>
        </div>

        <div className="w-full max-w-md">
          <Leaderboard
            players={playersList}
            title="Round Standings"
            showRoundScore={session.currentRound}
            highlightPlayerId={odUserId}
          />
        </div>

        <div className="mt-4 text-center">
          <p className="text-white/40 text-sm">Total: {myPlayer?.totalScore?.toLocaleString() || 0} points</p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-white/60">Waiting for next round...</p>
        </div>
      </div>
    );
  }

  // Waiting for question
  if (session.questionPhase === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            {currentRound?.name || `Round ${session.currentRound + 1}`}
          </h2>
          <p className="text-white/80 text-lg">
            Question {session.currentQuestion + 1} coming up...
          </p>
          <div className="mt-4 animate-pulse">
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // Answering or revealed phase
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <div className="text-white text-xl">Loading question...</div>
      </div>
    );
  }

  const showResults = session.questionPhase === 'revealed';
  const answerLabels = ['A', 'B', 'C', 'D'];
  const canChangeAnswer = session.questionPhase === 'answering';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex flex-col p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-white">
          <p className="text-sm opacity-80">
            Round {session.currentRound + 1} • Q{session.currentQuestion + 1}
          </p>
          <p className="font-semibold">{teamName}</p>
        </div>
        {session.questionPhase === 'answering' && session.questionStartedAt && (
          <Timer
            startTime={session.questionStartedAt}
            duration={currentQuestion.timeLimit}
            size="small"
          />
        )}
      </div>

      {/* Question */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-white text-center">
          {currentQuestion.question}
        </h2>
      </div>

      {/* Answer status */}
      {hasSubmitted && !showResults && (
        <div className="bg-green-500/20 border border-green-400 rounded-xl p-4 mb-4 text-center">
          <p className="text-white font-semibold">Answer selected!</p>
          <p className="text-white/80 text-sm">Tap another option to change your answer</p>
        </div>
      )}

      {/* Points earned - only show after reveal */}
      {showResults && (() => {
        const myAnswer = getPlayerAnswer(odUserId, session.currentRound, session.currentQuestion);
        const points = myAnswer?.points || 0;
        return (
          <div
            className={`rounded-xl p-4 mb-4 text-center ${
              points > 0 ? 'bg-green-500/30' : 'bg-red-500/30'
            }`}
          >
            <p className="text-white font-bold text-2xl">
              {points > 0 ? `+${points} points!` : 'No points'}
            </p>
          </div>
        );
      })()}

      {/* Answers */}
      <div className="flex-1 flex flex-col gap-3">
        {currentQuestion.options.map((option, index) => (
          <AnswerButton
            key={index}
            label={answerLabels[index]}
            text={option}
            onClick={() => handleSubmitAnswer(index)}
            disabled={!canChangeAnswer}
            selected={selectedAnswer === index}
            correct={index === currentQuestion.correctIndex}
            showResult={showResults}
          />
        ))}
      </div>

      {/* Score */}
      <div className="mt-4 text-center text-white/80">
        Total: {myPlayer?.totalScore?.toLocaleString() || 0} points
      </div>
    </div>
  );
}
