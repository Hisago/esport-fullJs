import { useTeamRanking } from "@/api/lol"

type Team = {
  name: string
  logo_url: string
  esl_rank?: number
  esl_points?: number
}

const TeamRanking: React.FC = () => {
  const { data: teams, isLoading, isError } = useTeamRanking()

  if (isLoading) return <p>Chargement du classement...</p>
  if (isError || !teams) return <p>Erreur lors du chargement des équipes.</p>

  const rankedTeams = (teams as Team[])
    .filter((t) => t.esl_rank !== undefined)
    .sort((a, b) => (a.esl_rank ?? 9999) - (b.esl_rank ?? 9999))

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Classement des équipes</h2>
      <ul className="space-y-2">
        {rankedTeams.map((team) => (
          <li
            key={team.name}
            className="flex items-center gap-3 bg-gray-100 p-2 rounded"
          >
            <span className="w-6 text-right">{team.esl_rank}</span>
            <img
              src={team.logo_url}
              alt={team.name}
              className="w-6 h-6 object-contain"
            />
            <span className="flex-1">{team.name}</span>
            {team.esl_points && (
              <span className="text-sm text-gray-500">
                {team.esl_points} pts
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TeamRanking
