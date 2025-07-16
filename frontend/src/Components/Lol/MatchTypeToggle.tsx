import clsx from 'clsx'

type Props = {
  selected: string
  options: string[]
  onChange: (value: string) => void
}

const labelMap: Record<string, string> = {
  regular: 'Saison régulière',
  playoffs: 'Playoffs',
  'play-in': 'Play-In',
  group: 'Group Stage',
  positioning: 'Positioning',
  other: 'Autre'
}

const MatchTypeToggle = ({ selected, onChange, options }: Props) => {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={clsx(
            'rounded-full border px-4 py-1 text-sm font-medium',
            selected === opt ? 'border-white bg-zinc-800 text-white' : 'border-transparent bg-zinc-200 text-zinc-700'
          )}
        >
          {labelMap[opt] ?? opt}
        </button>
      ))}
    </div>
  )
}

export default MatchTypeToggle
