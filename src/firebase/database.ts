import {
  ref,
  set,
  get,
  push,
  update,
  onValue,
  off,
} from 'firebase/database';
import { database, isFirebaseConfigured } from './config';
import type { Quiz, Session, Player, Answer } from '../types';

// Helper to check database is available
const getDb = () => {
  if (!database) {
    throw new Error('Firebase is not configured. Please set up your .env.local file.');
  }
  return database;
};

// Generate a short session code (6 characters)
export const generateSessionCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0, O, 1, I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Generate a unique player ID
export const generatePlayerId = (): string => {
  if (!database) return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return push(ref(database)).key || `player_${Date.now()}`;
};

// ============ Quiz Operations ============

export const saveQuiz = async (quiz: Quiz): Promise<void> => {
  const db = getDb();
  await set(ref(db, `quizzes/${quiz.id}`), quiz);
};

export const getQuiz = async (quizId: string): Promise<Quiz | null> => {
  const db = getDb();
  const snapshot = await get(ref(db, `quizzes/${quizId}`));
  return snapshot.val();
};

// ============ Session Operations ============

export const createSession = async (quizId: string): Promise<string> => {
  const db = getDb();
  const sessionCode = generateSessionCode();
  const session: Session = {
    quizId,
    status: 'lobby',
    currentRound: 0,
    currentQuestion: 0,
    questionPhase: 'waiting',
    questionStartedAt: null,
    createdAt: Date.now(),
  };
  await set(ref(db, `sessions/${sessionCode}`), session);
  return sessionCode;
};

export const getSession = async (sessionCode: string): Promise<Session | null> => {
  const db = getDb();
  const snapshot = await get(ref(db, `sessions/${sessionCode}`));
  return snapshot.val();
};

export const updateSession = async (
  sessionCode: string,
  updates: Partial<Session>
): Promise<void> => {
  const db = getDb();
  await update(ref(db, `sessions/${sessionCode}`), updates);
};

// Reset session for a new game (clears players and answers, resets session state)
export const resetSession = async (sessionCode: string): Promise<void> => {
  const db = getDb();
  // Clear players and answers
  await set(ref(db, `players/${sessionCode}`), null);
  await set(ref(db, `answers/${sessionCode}`), null);
  // Reset session to lobby state
  await update(ref(db, `sessions/${sessionCode}`), {
    status: 'lobby',
    currentRound: 0,
    currentQuestion: 0,
    questionPhase: 'waiting',
    questionStartedAt: null,
  });
};

export const subscribeToSession = (
  sessionCode: string,
  callback: (session: Session | null) => void
): (() => void) => {
  const db = getDb();
  const sessionRef = ref(db, `sessions/${sessionCode}`);
  onValue(sessionRef, (snapshot) => {
    callback(snapshot.val());
  });
  return () => off(sessionRef);
};

// ============ Player Operations ============

export const joinSession = async (
  sessionCode: string,
  odUserId: string,
  teamName: string
): Promise<void> => {
  const db = getDb();
  const player: Player = {
    odUserId,
    teamName,
    scores: {},
    totalScore: 0,
    joinedAt: Date.now(),
  };
  await set(ref(db, `players/${sessionCode}/${odUserId}`), player);
};

export const getPlayers = async (
  sessionCode: string
): Promise<Record<string, Player> | null> => {
  const db = getDb();
  const snapshot = await get(ref(db, `players/${sessionCode}`));
  return snapshot.val();
};

export const getPlayer = async (
  sessionCode: string,
  odUserId: string
): Promise<Player | null> => {
  const db = getDb();
  const snapshot = await get(ref(db, `players/${sessionCode}/${odUserId}`));
  return snapshot.val();
};

export const subscribeToPlayers = (
  sessionCode: string,
  callback: (players: Record<string, Player> | null) => void
): (() => void) => {
  const db = getDb();
  const playersRef = ref(db, `players/${sessionCode}`);
  onValue(playersRef, (snapshot) => {
    callback(snapshot.val());
  });
  return () => off(playersRef);
};

export const updatePlayerScore = async (
  sessionCode: string,
  odUserId: string,
  roundIndex: number,
  roundScore: number,
  totalScore: number
): Promise<void> => {
  const db = getDb();
  await update(ref(db, `players/${sessionCode}/${odUserId}`), {
    [`scores/${roundIndex}`]: roundScore,
    totalScore,
  });
};

// ============ Answer Operations ============

export const submitAnswer = async (
  sessionCode: string,
  odUserId: string,
  roundIndex: number,
  questionIndex: number,
  answerIndex: number,
  correct: boolean,
  points: number
): Promise<void> => {
  const db = getDb();
  const answerKey = `${odUserId}_${roundIndex}_${questionIndex}`;
  const answer: Answer = {
    odUserId,
    answerIndex,
    answeredAt: Date.now(),
    correct,
    points,
  };
  await set(ref(db, `answers/${sessionCode}/${answerKey}`), answer);
};

export const getAnswersForQuestion = async (
  sessionCode: string,
  roundIndex: number,
  questionIndex: number
): Promise<Record<string, Answer>> => {
  const db = getDb();
  const snapshot = await get(ref(db, `answers/${sessionCode}`));
  const allAnswers = snapshot.val() || {};
  const filtered: Record<string, Answer> = {};

  const prefix = `_${roundIndex}_${questionIndex}`;
  for (const key in allAnswers) {
    if (key.endsWith(prefix)) {
      filtered[key] = allAnswers[key];
    }
  }
  return filtered;
};

export const subscribeToAnswers = (
  sessionCode: string,
  callback: (answers: Record<string, Answer> | null) => void
): (() => void) => {
  const db = getDb();
  const answersRef = ref(db, `answers/${sessionCode}`);
  onValue(answersRef, (snapshot) => {
    callback(snapshot.val());
  });
  return () => off(answersRef);
};

export const hasPlayerAnswered = async (
  sessionCode: string,
  odUserId: string,
  roundIndex: number,
  questionIndex: number
): Promise<boolean> => {
  const db = getDb();
  const answerKey = `${odUserId}_${roundIndex}_${questionIndex}`;
  const snapshot = await get(ref(db, `answers/${sessionCode}/${answerKey}`));
  return snapshot.exists();
};

export { isFirebaseConfigured };
