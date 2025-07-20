import { useState, useMemo, useEffect } from 'react'
import { useLeagues, useSegments, useMatchesByLeague } from '@/api/lol'
import LeagueListButton from '@/Components/Lol/LeagueListButton'
import MatchTypeToggle from '@/Components/Lol/MatchTypeToggle'
import LeagueOfLegendsMatches from './LeagueOfLegendsMatches'
import { League, TournamentMatchBlock } from '@/types/lol'
import { normalizeName, specialEventLeagues } from '@/utils/lol'

const extractSplit = (slug: string, allSlugs?: string[]): string => {
  const kickoff = slug.match(/kickoff-(\d{4})/i)
  if (kickoff) {
    return `Kickoff ${kickoff[1]}`
  }
  const groupLfl = slug.match(/lfl-(\d{4})-group/i)
  if (groupLfl) {
    const year = groupLfl[1]
    const hasKickoff = allSlugs?.some((s) => s.includes(`kickoff-${year}`) && s.includes('lfl'))
    return hasKickoff ? `Kickoff ${year}` : `Spring ${year}`
  }
  const div2Group = slug.match(/division-2-(\w+)-(\d{4})-group/i)
  if (div2Group) return `${capitalize(div2Group[1])} ${div2Group[2]}`
  const direct = slug.match(/(winter|spring|summer|autumn|fall)-(\d{4})/i)
  if (direct) return `${capitalize(direct[1])} ${direct[2]}`
  return 'Autre'
}

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()

const LeagueOfLegendsLeaguesTab = () => {
  const [selectedLeague, setSelectedLeague] = useState<string>()
  const [selectedSplit, setSelectedSplit] = useState<string>()

  const { data: allLeagues, isLoading } = useLeagues()
  const { data: segments } = useSegments()
  const { data: tournaments } = useMatchesByLeague(selectedLeague)

  const segmentLeagueNames = useMemo(() => {
    if (!segments) return new Set<string>()
    const names = segments.flatMap((s) => s.leagues?.map((l) => normalizeName(l.name)) ?? [])
    return new Set(names)
  }, [segments])

  const nonSegmentLeagues = useMemo(() => {
    if (!allLeagues) return []
    return allLeagues.filter((league: League) => {
      const norm = normalizeName(league.name)
      return !segmentLeagueNames.has(norm) && !specialEventLeagues.includes(norm)
    })
  }, [allLeagues, segmentLeagueNames])

  const allSlugs = tournaments?.map((t) => t.slug) ?? []

  const availableSplits = useMemo(() => {
    if (!tournaments) return []

    const unique = [...new Set(tournaments.map((t) => extractSplit(t.slug, allSlugs)))]

    return unique.sort((a, b) => {
      const [labelA, yearA] = a.split(' ')
      const [labelB, yearB] = b.split(' ')
      const order = ['Winter', 'Spring', 'Summer', 'Kickoff']
      const weightA = parseInt(yearA) * 10 + order.indexOf(labelA)
      const weightB = parseInt(yearB) * 10 + order.indexOf(labelB)
      return weightB - weightA
    })
  }, [tournaments])

  const filteredTournaments = useMemo(() => {
    if (!tournaments || !selectedSplit) return []
    const result = tournaments.filter((t) => extractSplit(t.slug, allSlugs) === selectedSplit)
    console.log('🎯 Split sélectionné :', selectedSplit)
    console.log(
      '🎟️ Tournois dans split :',
      result.map((t) => t.slug)
    )
    return result
  }, [tournaments, selectedSplit])

  useEffect(() => {
    if (availableSplits.length > 0) {
      setSelectedSplit((current) => (current && availableSplits.includes(current) ? current : availableSplits[0]))
    } else {
      setSelectedSplit(undefined)
    }
  }, [availableSplits])

  if (isLoading) return <p className="p-6">Chargement des ligues...</p>
  if (!nonSegmentLeagues || nonSegmentLeagues.length === 0) {
    return <p className="p-6 italic text-zinc-400">Aucune ligue hors segment.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {nonSegmentLeagues.map((league: League) => (
          <LeagueListButton
            key={league.slug}
            league={league}
            isActive={selectedLeague === league.name}
            onClick={() => setSelectedLeague(league.name)}
          />
        ))}
      </div>

      {availableSplits.length > 1 && selectedSplit && (
        <div className="flex flex-wrap items-center gap-3">
          <MatchTypeToggle
            options={availableSplits}
            selected={selectedSplit}
            onChange={setSelectedSplit}
            variant="split"
          />
        </div>
      )}

      {selectedLeague && selectedSplit && (
        <LeagueOfLegendsMatches
          selectedLeague={selectedLeague}
          selectedSegment={undefined}
          customTournaments={filteredTournaments as TournamentMatchBlock[]}
        />
      )}
    </div>
  )
}

export default LeagueOfLegendsLeaguesTab
