import { useState, useEffect } from 'react'
import { useLeagues, useSegments } from '@/api/lol'
import { League } from '@/types/lol'
import LeagueOfLegendsMatches from './LeagueOfLegendsMatches'
import LeagueOfLegendsLeaguesTab from './LeagueOfLegendsLeaguesTab'
import LeagueListButton from '@/Components/Lol/LeagueListButton'
import { useSegment } from '@/Context/SegmentContext'
import { AnimatePresence, motion } from 'framer-motion'

const LeagueOfLegendsPage = () => {
  const [selectedLeague, setSelectedLeague] = useState<string>()
  const { selectedSegment, setSelectedSegment, viewMode, setViewMode } = useSegment()

  const { data: leagues, isLoading: loadingLeagues, isError: errorLeagues } = useLeagues()
  const { data: segments } = useSegments()

  useEffect(() => {
    if (!segments || selectedSegment || viewMode !== 'segments') return

    const running = segments.find((s) => s.status === 'active')
    if (running) {
      console.log('⚡ Segment en cours détecté :', running.name)
      setSelectedSegment(running.id)
      return
    }

    const lastDone = [...segments].filter((s) => s.status === 'done').at(-1)
    if (lastDone) {
      console.log('🕓 Dernier segment terminé sélectionné :', lastDone.name)
      setSelectedSegment(lastDone.id)
    }
  }, [segments, selectedSegment, viewMode, setSelectedSegment])

  const segment = segments?.find((s) => s.id === selectedSegment)
  const shouldShowLeagues = segment?.type === 'regional' && segment.leagues.length > 0
  const visibleLeagues = shouldShowLeagues ? segment.leagues : []

  if (loadingLeagues) return <p className="p-6">Chargement des données...</p>
  if (errorLeagues || !leagues) return <p className="p-6 text-red-500">Erreur lors du chargement des données.</p>

  return (
    <div className="space-y-8 p-6">
      {viewMode === 'segments' ? (
        <>
          {shouldShowLeagues && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <LeagueListButton
                  league={{ name: 'Toutes les ligues', slug: 'all', logo_url: '' } as League}
                  isActive={!selectedLeague}
                  onClick={() => setSelectedLeague(undefined)}
                />
                {visibleLeagues.map((league: League) => (
                  <LeagueListButton
                    key={league.slug}
                    league={league}
                    isActive={selectedLeague === league.name}
                    onClick={() => setSelectedLeague(league.name)}
                  />
                ))}
              </div>
            </div>
          )}

          <LeagueOfLegendsMatchesWrapper
            selectedLeague={selectedLeague}
            selectedSegment={selectedSegment ?? undefined}
          />
        </>
      ) : (
        <LeagueOfLegendsLeaguesTab />
      )}
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

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={leagueToSend ?? 'all'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <LeagueOfLegendsMatches selectedSegment={selectedSegment} selectedLeague={leagueToSend} />
      </motion.div>
    </AnimatePresence>
  )
}

export default LeagueOfLegendsPage
