import type { Quiz } from '../types';

export const sampleQuiz: Quiz = {
  id: 'sample-quiz-1',
  name: 'General Knowledge Showdown',
  rounds: [
    {
      name: 'Round 1: Science & Nature',
      questions: [
        {
          question: 'What planet is known as the Red Planet?',
          options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
          correctIndex: 1,
          timeLimit: 30,
        },
        {
          question: 'What is the chemical symbol for gold?',
          options: ['Go', 'Gd', 'Au', 'Ag'],
          correctIndex: 2,
          timeLimit: 30,
        },
        {
          question: 'How many bones are in the adult human body?',
          options: ['186', '206', '226', '246'],
          correctIndex: 1,
          timeLimit: 30,
        },
        {
          question: 'What is the largest mammal in the world?',
          options: ['African Elephant', 'Blue Whale', 'Giraffe', 'Polar Bear'],
          correctIndex: 1,
          timeLimit: 30,
        },
      ],
    },
    {
      name: 'Round 2: Pop Culture & Entertainment',
      questions: [
        {
          question: 'Which movie features the quote "I\'ll be back"?',
          options: ['Robocop', 'Die Hard', 'The Terminator', 'Predator'],
          correctIndex: 2,
          timeLimit: 30,
        },
        {
          question: 'What is the name of the fictional country in Black Panther?',
          options: ['Wakanda', 'Zamunda', 'Genovia', 'Latveria'],
          correctIndex: 0,
          timeLimit: 30,
        },
        {
          question: 'Which band performed "Bohemian Rhapsody"?',
          options: ['The Beatles', 'Led Zeppelin', 'Queen', 'Pink Floyd'],
          correctIndex: 2,
          timeLimit: 30,
        },
        {
          question: 'In Friends, what is the name of Ross\'s second wife?',
          options: ['Rachel', 'Emily', 'Carol', 'Mona'],
          correctIndex: 1,
          timeLimit: 30,
        },
      ],
    },
  ],
};
