// Quiz content types
export interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  timeLimit: number; // seconds, default 30
}

export interface Round {
  name: string;
  questions: Question[];
}

export interface Quiz {
  id: string;
  name: string;
  rounds: Round[];
}

// Game session types
export type SessionStatus = 'lobby' | 'playing' | 'finished';
export type QuestionPhase = 'waiting' | 'answering' | 'revealed' | 'round_end';

export interface Session {
  quizId: string;
  status: SessionStatus;
  currentRound: number;
  currentQuestion: number;
  questionPhase: QuestionPhase;
  questionStartedAt: number | null; // timestamp
  createdAt: number;
}

// Player types
export interface Player {
  odUserId: string;
  teamName: string;
  scores: Record<number, number>; // roundIndex -> score
  totalScore: number;
  joinedAt: number;
}

// Answer types
export interface Answer {
odUserId: string;
  answerIndex: number;
  answeredAt: number;
  correct: boolean;
  points: number;
}

// Helper type for realtime data with keys
export type PlayersMap = Record<string, Player>;
export type AnswersMap = Record<string, Answer>;
