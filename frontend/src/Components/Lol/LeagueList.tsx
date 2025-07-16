import { useLeagues } from "@/api/lol"
import { Match, League } from "@/types/lol"

interface Props {
  onSelect: (slug: string) => void
}

const LeagueList: React.FC<Props> = ({ onSelect }) => {
  const { data: leagues, isLoading, isError } = useLeagues()

  if (isLoading) return <p>Chargement des ligues...</p>
  if (isError || !leagues) return <p>Erreur lors du chargement.</p>

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      {(leagues as League[]).map((league) => (
        <button
          key={league.slug}
          onClick={() => onSelect(league.slug)}
          className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded shadow"
        >
          {league.name}
        </button>
      ))}
    </div>
  )
}

export default LeagueList
