import { Match } from '@/types/lol'

interface Props {
  upper?: Match[]
  lower?: Match[]
  matches?: Match[] // ✅ ajouté pour les tournois de type "play-in"
}

const groupRounds = (matches: Match[], title: string) => {
  const rounds: { title: string; matches: Match[] }[] = []
  const roundSize = Math.ceil(matches.length / 4)

  for (let i = 0; i < matches.length; i += roundSize) {
    rounds.push({
      title: `${title} — Tour ${Math.floor(i / roundSize) + 1}`,
      matches: matches.slice(i, i + roundSize)
    })
  }

  return rounds
}

const BracketBlock = ({ upper = [], lower = [], matches = [] }: Props) => {
  // ✅ si pas d'upper explicite, on utilise matches (ex: play-in)
  const base = upper.length > 0 ? upper : matches
  const upperRounds = groupRounds(base, upper.length > 0 ? 'Bracket Supérieur' : 'Play-In')
  const lowerRounds = groupRounds(lower, 'Bracket Inférieur')

  // 🏆 On détecte la finale comme dernier match du upper bracket
  const finaleMatch = base.reduce<Match | undefined>((latest, match) => {
    if (!latest) return match
    return new Date(match.date) > new Date(latest.date) ? match : latest
  }, undefined)

  if (finaleMatch && upper.length > 0) {
    upperRounds.push({
      title: '🏆 Finale',
      matches: [finaleMatch]
    })
  }

  return (
    <div className="space-y-10 overflow-x-auto rounded-xl bg-zinc-900 p-6 text-white shadow-md">
      <div className="flex flex-col gap-10">
        <div className="flex gap-8">
          {upperRounds.map((round, index) => (
            <div key={`upper-${index}`} className="flex min-w-[240px] flex-col gap-4">
              <h3 className="mb-2 text-center text-sm font-semibold text-green-400">{round.title}</h3>
              {round.matches.map((match) => (
                <MatchCardBox key={match.match_id} match={match} />
              ))}
            </div>
          ))}
        </div>

        {lowerRounds.length > 0 && (
          <div className="flex gap-8">
            {lowerRounds.map((round, index) => (
              <div key={`lower-${index}`} className="flex min-w-[240px] flex-col gap-4">
                <h3 className="mb-2 text-center text-sm font-semibold text-red-400">{round.title}</h3>
                {round.matches.map((match) => (
                  <MatchCardBox key={match.match_id} match={match} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const MatchCardBox = ({ match, highlight = false }: { match: Match; highlight?: boolean }) => {
  return (
    <div className={`rounded-lg border ${highlight ? 'border-yellow-500' : 'border-zinc-700'} bg-zinc-800 p-3 text-sm`}>
      <div className="mb-1 text-xs text-gray-400">{new Date(match.date).toLocaleDateString()}</div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {match.team1_logo && <img src={match.team1_logo} alt={match.team1_name} className="h-5 w-5 object-contain" />}
          <span>{match.team1_name}</span>
        </div>
        <span className="font-bold">{match.score_team1 ?? '-'}</span>
      </div>

      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {match.team2_logo && <img src={match.team2_logo} alt={match.team2_name} className="h-5 w-5 object-contain" />}
          <span>{match.team2_name}</span>
        </div>
        <span className="font-bold">{match.score_team2 ?? '-'}</span>
      </div>
    </div>
  )
}

export default BracketBlock
