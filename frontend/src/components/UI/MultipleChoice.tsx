interface MultipleChoiceProps {
  options: string[]
  onSelect: (option: string) => void
  selected: string | null
  correctAnswer?: string | null
  disabled?: boolean
}

export function MultipleChoice({ options, onSelect, selected, correctAnswer, disabled }: MultipleChoiceProps) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-md">
      {options.map((opt) => {
        let style = 'bg-slate-700 hover:bg-slate-600 border-slate-600'
        if (selected === opt) {
          if (correctAnswer === null || correctAnswer === undefined) {
            style = 'bg-amber-500 text-slate-900 border-amber-400'
          } else if (opt === correctAnswer) {
            style = 'bg-green-500 text-white border-green-400'
          } else {
            style = 'bg-red-500 text-white border-red-400'
          }
        } else if (correctAnswer && opt === correctAnswer && selected) {
          style = 'bg-green-500/30 border-green-400'
        }

        return (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            disabled={disabled || !!selected}
            className={`${style} border-2 rounded-xl p-4 text-xl font-bold transition-all duration-200 active:scale-95 min-h-[64px]`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}
