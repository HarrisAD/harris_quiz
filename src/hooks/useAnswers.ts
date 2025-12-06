import { useState, useEffect } from 'react';
import { subscribeToAnswers } from '../firebase/database';
import type { Answer } from '../types';

export function useAnswers(sessionCode: string | null) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionCode) {
      setAnswers({});
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToAnswers(sessionCode, (data) => {
      setAnswers(data || {});
      setLoading(false);
    });

    return unsubscribe;
  }, [sessionCode]);

  // Get answers for a specific question
  const getQuestionAnswers = (roundIndex: number, questionIndex: number) => {
    const suffix = `_${roundIndex}_${questionIndex}`;
    const filtered: Record<string, Answer> = {};
    for (const key in answers) {
      if (key.endsWith(suffix)) {
        filtered[key] = answers[key];
      }
    }
    return filtered;
  };

  // Check if a player has answered a specific question
  const hasPlayerAnswered = (
    odUserId: string,
    roundIndex: number,
    questionIndex: number
  ): boolean => {
    const key = `${odUserId}_${roundIndex}_${questionIndex}`;
    return key in answers;
  };

  // Get a player's answer for a specific question
  const getPlayerAnswer = (
    odUserId: string,
    roundIndex: number,
    questionIndex: number
  ): Answer | null => {
    const key = `${odUserId}_${roundIndex}_${questionIndex}`;
    return answers[key] || null;
  };

  // Get all answers (for admin history view)
  const getAllAnswers = () => answers;

  return {
    answers,
    loading,
    getQuestionAnswers,
    hasPlayerAnswered,
    getPlayerAnswer,
    getAllAnswers,
  };
}
