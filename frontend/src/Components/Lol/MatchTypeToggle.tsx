interface MatchTypeToggleProps {
  options: string[]
  selected: string
  onChange: (value: string) => void
  variant?: 'split' | 'phase'
}

const MatchTypeToggle = ({ options, selected, onChange, variant = 'phase' }: MatchTypeToggleProps) => {
  return (
    <div
      className={`inline-flex items-center rounded-full bg-zinc-100 px-2 py-1 shadow-sm ${
        variant === 'split' ? 'text-sm' : 'text-xs'
      }`}
    >
      {options.map((option) => {
        const isActive = selected === option

        return (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`rounded-full px-3 py-1.5 font-semibold transition-colors duration-150 ${
              isActive ? 'bg-black text-white' : 'text-zinc-600 hover:text-black'
            }`}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

export default MatchTypeToggle
