import { useState, useEffect } from 'react';
import { getQuiz } from '../firebase/database';
import type { Quiz } from '../types';

export function useQuiz(quizId: string | null) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quizId) {
      setQuiz(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getQuiz(quizId)
      .then((data) => {
        setQuiz(data);
        setLoading(false);
        if (!data) {
          setError('Quiz not found');
        }
      })
      .catch(() => {
        setError('Failed to load quiz');
        setLoading(false);
      });
  }, [quizId]);

  return { quiz, loading, error };
}
