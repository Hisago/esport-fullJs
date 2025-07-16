import clsx from "clsx"
import { League } from "@/types/lol"

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
        "flex items-center gap-2 px-4 py-2 rounded-full border text-sm whitespace-nowrap transition",
        isActive
          ? "bg-white border-gray-300 shadow-sm"
          : "bg-gray-200 border-transparent hover:bg-gray-200"
      )}
    >
      {league.logo_url && (
        <img
          src={league.logo_url}
          alt={league.name}
          className="w-5 h-5 object-contain"
        />
      )}
      <span className="font-medium truncate">{league.name}</span>
    </button>
  )
}
