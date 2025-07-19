import { useState, useEffect } from 'react'
import { useLeagues, useSegments } from '@/api/lol'
import { League } from '@/types/lol'
import LeagueOfLegendsMatches from './LeagueOfLegendsMatches'
import LeagueListButton from '@/Components/Lol/LeagueListButton'
import { useSegment } from '@/Context/SegmentContext'

const LeagueOfLegendsPage = () => {
  const [selectedLeague, setSelectedLeague] = useState<string>()

  const { data: leagues, isLoading: loadingLeagues, isError: errorLeagues } = useLeagues()

  const { selectedSegment, setSelectedSegment } = useSegment()
  const { data: segments } = useSegments()
  useEffect(() => {
    if (!segments || selectedSegment) return

    // 1. Prend le segment "running" s'il existe
    const running = segments.find((s) => s.status === 'active')
    if (running) {
      console.log('⚡ Segment en cours détecté :', running.name)
      setSelectedSegment(running.id)
      return
    }

    // 2. Sinon, prend le dernier "done" dans la liste (qui semble être triée)
    const lastDone = [...segments].filter((s) => s.status === 'done').at(-1)

    if (lastDone) {
      console.log('🕓 Dernier segment terminé sélectionné :', lastDone.name)
      setSelectedSegment(lastDone.id)
    }
  }, [segments, selectedSegment, setSelectedSegment])

  const segment = segments?.find((s) => s.id === selectedSegment)

  const shouldShowLeagues = segment?.type === 'regional' && segment.leagues.length > 0

  const visibleLeagues = shouldShowLeagues ? segment.leagues : []

  // 🔍 Logs de debug
  console.log(
    '📋 Ligues du segment :',
    segment?.leagues.map((l) => l.slug)
  )
  console.log('🎯 selectedLeague =', selectedLeague)

  if (loadingLeagues) {
    return <p className="p-6">Chargement des données...</p>
  }

  if (errorLeagues || !leagues) {
    return <p className="p-6 text-red-500">Erreur lors du chargement des données.</p>
  }

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-3xl font-bold">League of Legends</h1>

      {/* 🔹 Filtre de ligues (uniquement si segment régional) */}
      {shouldShowLeagues && (
        <div className="flex flex-wrap gap-3">
          <LeagueListButton
            league={{ name: 'Toutes les ligues', slug: 'all', logo_url: '' } as League}
            isActive={!selectedLeague}
            onClick={() => setSelectedLeague(undefined)}
          />
          {visibleLeagues.map((league) => (
            <LeagueListButton
              key={league.slug}
              league={league}
              isActive={selectedLeague === league.name}
              onClick={() => setSelectedLeague(league.name)} // ✅ now using league.name
            />
          ))}
        </div>
      )}

      {/* 🔹 Matchs */}
      <LeagueOfLegendsMatchesWrapper selectedLeague={selectedLeague} selectedSegment={selectedSegment ?? undefined} />
    </div>
  )
}

const LeagueOfLegendsMatchesWrapper = ({
  selectedLeague,
  selectedSegment
}: {
  selectedLeague?: string
  selectedSegment?: string
}) => {
  const defaultLeagueBySegment: Record<string, string> = {
    msi: 'Mid-Season Invitational',
    'first-stand': 'First Stand',
    worlds: 'World Championship',
    ewc: 'Esports World Cup'
  }

  const normalizedSegment = (selectedSegment ?? '').toLowerCase()
  const leagueToSend = defaultLeagueBySegment[normalizedSegment] || selectedLeague

  return <LeagueOfLegendsMatches selectedSegment={selectedSegment} selectedLeague={leagueToSend} />
}

export default LeagueOfLegendsPage
