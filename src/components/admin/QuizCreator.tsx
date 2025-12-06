import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveQuiz, createSession } from '../../firebase/database';
import type { Quiz } from '../../types';

interface QuestionForm {
  question: string;
  options: string[];
  correctIndex: number;
  timeLimit: number;
}

interface RoundForm {
  name: string;
  questions: QuestionForm[];
}

const emptyQuestion = (): QuestionForm => ({
  question: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  timeLimit: 30,
});

const emptyRound = (): RoundForm => ({
  name: '',
  questions: [emptyQuestion()],
});

// Parse CSV content into rounds and questions
// Expected format: Round,Question,OptionA,OptionB,OptionC,OptionD,CorrectAnswer,TimeLimit
const parseCSV = (content: string): RoundForm[] => {
  const lines = content.split('\n').filter(line => line.trim());

  // Skip header row if it looks like a header
  const startIndex = lines[0]?.toLowerCase().includes('round') ? 1 : 0;

  const roundsMap = new Map<string, QuestionForm[]>();

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    // Handle CSV with quoted fields
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current.trim());

    if (parts.length < 7) continue;

    const [roundName, question, optA, optB, optC, optD, correct, timeLimit] = parts;

    // Determine correct index (A=0, B=1, C=2, D=3)
    let correctIndex = 0;
    const correctUpper = correct.toUpperCase().trim();
    if (correctUpper === 'B' || correctUpper === '1') correctIndex = 1;
    else if (correctUpper === 'C' || correctUpper === '2') correctIndex = 2;
    else if (correctUpper === 'D' || correctUpper === '3') correctIndex = 3;

    const questionData: QuestionForm = {
      question: question.trim(),
      options: [optA.trim(), optB.trim(), optC.trim(), optD.trim()],
      correctIndex,
      timeLimit: parseInt(timeLimit) || 30,
    };

    const rName = roundName.trim() || 'Round 1';
    if (!roundsMap.has(rName)) {
      roundsMap.set(rName, []);
    }
    roundsMap.get(rName)!.push(questionData);
  }

  return Array.from(roundsMap.entries()).map(([name, questions]) => ({
    name,
    questions,
  }));
};

export function QuizCreator() {
  const navigate = useNavigate();
  const [quizName, setQuizName] = useState('');
  const [rounds, setRounds] = useState<RoundForm[]>([emptyRound()]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        const parsedRounds = parseCSV(content);
        if (parsedRounds.length === 0) {
          setError('No valid questions found in CSV');
          return;
        }
        setRounds(parsedRounds);
        setCurrentRoundIndex(0);
        setCurrentQuestionIndex(0);
        setError('');
      } catch {
        setError('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = `Round,Question,OptionA,OptionB,OptionC,OptionD,CorrectAnswer,TimeLimit
Round 1: General Knowledge,What is the capital of France?,London,Paris,Berlin,Madrid,B,30
Round 1: General Knowledge,Which planet is known as the Red Planet?,Venus,Earth,Mars,Jupiter,C,30
Round 2: Science,What is H2O commonly known as?,Salt,Water,Sugar,Oil,B,20
Round 2: Science,How many legs does a spider have?,6,8,10,12,B,15`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentRound = rounds[currentRoundIndex];
  const currentQuestion = currentRound?.questions[currentQuestionIndex];

  const updateQuestion = (field: keyof QuestionForm, value: any) => {
    const newRounds = [...rounds];
    newRounds[currentRoundIndex].questions[currentQuestionIndex] = {
      ...currentQuestion,
      [field]: value,
    };
    setRounds(newRounds);
  };

  const updateOption = (optionIndex: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[optionIndex] = value;
    updateQuestion('options', newOptions);
  };

  const addQuestion = () => {
    const newRounds = [...rounds];
    newRounds[currentRoundIndex].questions.push(emptyQuestion());
    setRounds(newRounds);
    setCurrentQuestionIndex(newRounds[currentRoundIndex].questions.length - 1);
  };

  const removeQuestion = (index: number) => {
    if (currentRound.questions.length <= 1) return;
    const newRounds = [...rounds];
    newRounds[currentRoundIndex].questions.splice(index, 1);
    setRounds(newRounds);
    if (currentQuestionIndex >= newRounds[currentRoundIndex].questions.length) {
      setCurrentQuestionIndex(newRounds[currentRoundIndex].questions.length - 1);
    }
  };

  const addRound = () => {
    const newRounds = [...rounds, emptyRound()];
    setRounds(newRounds);
    setCurrentRoundIndex(newRounds.length - 1);
    setCurrentQuestionIndex(0);
  };

  const removeRound = (index: number) => {
    if (rounds.length <= 1) return;
    const newRounds = rounds.filter((_, i) => i !== index);
    setRounds(newRounds);
    if (currentRoundIndex >= newRounds.length) {
      setCurrentRoundIndex(newRounds.length - 1);
    }
    setCurrentQuestionIndex(0);
  };

  const updateRoundName = (name: string) => {
    const newRounds = [...rounds];
    newRounds[currentRoundIndex].name = name;
    setRounds(newRounds);
  };

  const validateQuiz = (): string | null => {
    if (!quizName.trim()) return 'Please enter a quiz name';

    for (let r = 0; r < rounds.length; r++) {
      const round = rounds[r];
      if (!round.name.trim()) return `Round ${r + 1} needs a name`;

      for (let q = 0; q < round.questions.length; q++) {
        const question = round.questions[q];
        if (!question.question.trim()) {
          return `Round ${r + 1}, Question ${q + 1} is empty`;
        }
        if (question.options.some(opt => !opt.trim())) {
          return `Round ${r + 1}, Question ${q + 1} has empty options`;
        }
      }
    }
    return null;
  };

  const handleSaveAndStart = async () => {
    const validationError = validateQuiz();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const quizId = `quiz_${Date.now()}`;
      const quiz: Quiz = {
        id: quizId,
        name: quizName,
        rounds: rounds.map(r => ({
          name: r.name,
          questions: r.questions.map(q => ({
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            timeLimit: q.timeLimit,
          })),
        })),
      };

      await saveQuiz(quiz);
      const sessionCode = await createSession(quizId);
      navigate(`/admin/${sessionCode}`);
    } catch (err) {
      console.error('Failed to save quiz:', err);
      setError('Failed to save quiz. Please try again.');
      setSaving(false);
    }
  };

  const totalQuestions = rounds.reduce((acc, r) => acc + r.questions.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="text-white/80 hover:text-white"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-white">Create Quiz</h1>
          <div className="w-16" />
        </div>

        {/* Quiz Name */}
        <div className="bg-white rounded-2xl p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quiz Name
          </label>
          <input
            type="text"
            value={quizName}
            onChange={(e) => setQuizName(e.target.value)}
            placeholder="My Awesome Quiz"
            className="w-full px-4 py-3 text-xl border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
          />
          <p className="text-gray-500 text-sm mt-2">
            {rounds.length} round{rounds.length !== 1 ? 's' : ''} • {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}
          </p>
        </div>

        {/* CSV Upload */}
        <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-2xl p-6 mb-6">
          <div className="text-center">
            <h3 className="font-semibold text-blue-800 mb-2">Bulk Upload Questions</h3>
            <p className="text-blue-600 text-sm mb-4">
              Upload a CSV file to add multiple questions at once
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={downloadTemplate}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                Download Template
              </button>
              <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                Upload CSV
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-blue-500 text-xs mt-3">
              Format: Round, Question, OptionA, OptionB, OptionC, OptionD, CorrectAnswer (A/B/C/D), TimeLimit
            </p>
          </div>
        </div>

        {/* Rounds Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {rounds.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentRoundIndex(index);
                setCurrentQuestionIndex(0);
              }}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                currentRoundIndex === index
                  ? 'bg-white text-purple-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Round {index + 1}
              {rounds.length > 1 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRound(index);
                  }}
                  className="ml-2 text-red-400 hover:text-red-600"
                >
                  ×
                </span>
              )}
            </button>
          ))}
          <button
            onClick={addRound}
            className="px-4 py-2 rounded-lg font-medium bg-green-500/20 text-green-100 hover:bg-green-500/30 whitespace-nowrap"
          >
            + Add Round
          </button>
        </div>

        {/* Round Editor */}
        <div className="bg-white rounded-2xl p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Round Name
          </label>
          <input
            type="text"
            value={currentRound?.name || ''}
            onChange={(e) => updateRoundName(e.target.value)}
            placeholder="Round 1: General Knowledge"
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none mb-4"
          />

          {/* Questions Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {currentRound?.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`px-3 py-1 rounded font-medium text-sm transition-colors ${
                  currentQuestionIndex === index
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Q{index + 1}
                {currentRound.questions.length > 1 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      removeQuestion(index);
                    }}
                    className="ml-1 text-red-400 hover:text-red-600"
                  >
                    ×
                  </span>
                )}
              </button>
            ))}
            <button
              onClick={addQuestion}
              className="px-3 py-1 rounded font-medium text-sm bg-green-100 text-green-700 hover:bg-green-200"
            >
              + Add
            </button>
          </div>

          {/* Question Editor */}
          {currentQuestion && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question
                </label>
                <textarea
                  value={currentQuestion.question}
                  onChange={(e) => updateQuestion('question', e.target.value)}
                  placeholder="What is the capital of France?"
                  rows={2}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {['A', 'B', 'C', 'D'].map((label, index) => (
                  <div key={label} className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuestion('correctIndex', index)}
                      className={`w-10 h-10 rounded-full font-bold flex items-center justify-center transition-colors ${
                        currentQuestion.correctIndex === index
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                    <input
                      type="text"
                      value={currentQuestion.options[index]}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${label}`}
                      className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-500">
                Click the letter button to mark the correct answer (currently: {['A', 'B', 'C', 'D'][currentQuestion.correctIndex]})
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Limit (seconds)
                </label>
                <input
                  type="number"
                  value={currentQuestion.timeLimit}
                  onChange={(e) => updateQuestion('timeLimit', parseInt(e.target.value) || 30)}
                  min={5}
                  max={120}
                  className="w-24 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSaveAndStart}
          disabled={saving}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white font-bold py-4 rounded-xl text-xl transition-colors"
        >
          {saving ? 'Creating...' : 'Save & Start Game'}
        </button>
      </div>
    </div>
  );
}
