import clsx from 'clsx'
import { League } from '@/types/lol'

type Props = {
  league: League
  isActive: boolean
  onClick: () => void
}

export default function LeagueListButton({ league, isActive, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2 whitespace-nowrap rounded-2xl border px-5 py-2.5 text-sm font-semibold transition',
        isActive
          ? 'border-black bg-black text-white shadow'
          : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
      )}
    >
      {league.logo_url && <img src={league.logo_url} alt={league.name} className="h-5 w-5 object-contain" />}
      <span className="truncate">{league.name}</span>
    </button>
  )
}
