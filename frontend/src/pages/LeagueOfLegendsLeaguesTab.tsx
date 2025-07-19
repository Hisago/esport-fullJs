import { useState, useMemo } from 'react'
import { useLeagues, useSegments } from '@/api/lol'
import LeagueListButton from '@/Components/Lol/LeagueListButton'
import LeagueOfLegendsMatches from './LeagueOfLegendsMatches'
import { League } from '@/types/lol'

const LeagueOfLegendsLeaguesTab = () => {
  const [selectedLeague, setSelectedLeague] = useState<string>()

  const { data: allLeagues, isLoading } = useLeagues()
  const { data: segments } = useSegments()

  const segmentLeagueNames = useMemo(() => {
    if (!segments) return new Set<string>()
    const names = segments.flatMap((s) => s.leagues?.map((l) => l.name) ?? [])
    return new Set(names.map((name) => name.toLowerCase()))
  }, [segments])

  const nonSegmentLeagues = useMemo(() => {
    if (!allLeagues) return []
    return allLeagues.filter((league: League) => !segmentLeagueNames.has(league.name.toLowerCase()))
  }, [allLeagues, segmentLeagueNames])

  if (isLoading) return <p className="p-6">Chargement des ligues...</p>
  if (!nonSegmentLeagues || nonSegmentLeagues.length === 0) {
    return <p className="p-6 italic text-zinc-400">Aucune ligue hors segment.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {nonSegmentLeagues.map((league: League) => (
          <LeagueListButton
            key={league.slug}
            league={league}
            isActive={selectedLeague === league.name}
            onClick={() => setSelectedLeague(league.name)}
          />
        ))}
      </div>

      {selectedLeague && <LeagueOfLegendsMatches selectedLeague={selectedLeague} />}
    </div>
  )
}

export default LeagueOfLegendsLeaguesTab
