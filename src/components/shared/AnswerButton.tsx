interface AnswerButtonProps {
  label: string;
  text: string;
  onClick: () => void;
  disabled?: boolean;
  selected?: boolean;
  correct?: boolean;
  showResult?: boolean;
}

const colorVariants: Record<string, { base: string; selected: string; correct: string; wrong: string }> = {
  A: {
    base: 'bg-red-500 hover:bg-red-600',
    selected: 'bg-red-600 ring-4 ring-red-300',
    correct: 'bg-green-500',
    wrong: 'bg-red-800',
  },
  B: {
    base: 'bg-blue-500 hover:bg-blue-600',
    selected: 'bg-blue-600 ring-4 ring-blue-300',
    correct: 'bg-green-500',
    wrong: 'bg-blue-800',
  },
  C: {
    base: 'bg-yellow-500 hover:bg-yellow-600',
    selected: 'bg-yellow-600 ring-4 ring-yellow-300',
    correct: 'bg-green-500',
    wrong: 'bg-yellow-800',
  },
  D: {
    base: 'bg-green-500 hover:bg-green-600',
    selected: 'bg-green-600 ring-4 ring-green-300',
    correct: 'bg-green-500',
    wrong: 'bg-green-800',
  },
};

export function AnswerButton({
  label,
  text,
  onClick,
  disabled = false,
  selected = false,
  correct,
  showResult = false,
}: AnswerButtonProps) {
  const colors = colorVariants[label] || colorVariants.A;

  let colorClass = colors.base;
  if (showResult) {
    colorClass = correct ? colors.correct : colors.wrong;
  } else if (selected) {
    colorClass = colors.selected;
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full p-4 rounded-xl text-white font-semibold text-lg
        flex items-center gap-4 transition-all
        ${colorClass}
        ${disabled && !showResult ? 'opacity-50 cursor-not-allowed' : ''}
        ${showResult && correct ? 'animate-pulse' : ''}
      `}
    >
      <span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
        {label}
      </span>
      <span className="flex-1 text-left">{text}</span>
      {showResult && correct && <span className="text-2xl">✓</span>}
      {showResult && selected && !correct && <span className="text-2xl">✗</span>}
    </button>
  );
}
