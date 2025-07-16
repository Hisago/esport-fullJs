import { Match } from '@/types/lol'

type Props = {
  tournamentSlug: string
  matches?: Match[] // si pas de bracket split
  upper?: Match[] // si bracket split
  lower?: Match[]
}

const groupMatchesByBracketRound = (matches: Match[]): Match[][] => {
  const rounds: Match[][] = []
  const roundSize = Math.ceil(matches.length / 4)

  for (let i = 0; i < matches.length; i += roundSize) {
    rounds.push(matches.slice(i, i + roundSize))
  }

  return rounds
}

const renderBracket = (label: string, matches: Match[]) => {
  const rounds = groupMatchesByBracketRound(matches)

  return (
    <div className="overflow-x-auto rounded-xl bg-zinc-900 p-6 text-white shadow-md">
      <h3 className="mb-4 text-xl font-bold text-white">{label}</h3>
      {matches.length === 0 ? (
        <p className="text-gray-400">Aucun match à afficher.</p>
      ) : (
        <div className="flex gap-6">
          {rounds.map((roundMatches, roundIndex) => (
            <div key={roundIndex} className="flex min-w-[220px] flex-col gap-4">
              <h4 className="mb-2 text-lg font-medium">Round {roundIndex + 1}</h4>
              {roundMatches.map((match) => (
                <div key={match.match_id} className="rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-sm">
                  <div className="mb-1 text-xs text-gray-400">{new Date(match.date).toLocaleDateString()}</div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {match.team1_logo && (
                        <img src={match.team1_logo} alt={match.team1_name} className="h-5 w-5 object-contain" />
                      )}
                      <span>{match.team1_name}</span>
                    </div>
                    <span className="font-bold">{match.score_team1 ?? '-'}</span>
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {match.team2_logo && (
                        <img src={match.team2_logo} alt={match.team2_name} className="h-5 w-5 object-contain" />
                      )}
                      <span>{match.team2_name}</span>
                    </div>
                    <span className="font-bold">{match.score_team2 ?? '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const PlayoffsBracketBlock = ({ tournamentSlug, matches, upper, lower }: Props) => {
  const isSplit = !!upper || !!lower

  if (isSplit) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {upper && renderBracket('Upper Bracket', upper)}
        {lower && renderBracket('Lower Bracket', lower)}
      </div>
    )
  }

  return renderBracket('Bracket', matches ?? [])
}

export default PlayoffsBracketBlock
