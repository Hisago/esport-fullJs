import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useMatchesByTournament, useStandings } from '@/api/lol'
import MatchCard from '@/Components/Lol/MatchCard'
import MatchTypeToggle from '@/Components/Lol/MatchTypeToggle'
import BracketBlock from '@/Components/Lol/BracketBlock'
import TournamentStandings from '@/Components/Lol/TournamentStandings'

interface Props {
  selectedLeague?: string
  selectedSegment?: string
}

const phaseLabels: Record<string, string> = {
  regular: 'Saison régulière',
  group: 'Groupes',
  positioning: 'Positionnement',
  'play-in': 'Play-In',
  playoffs: 'Playoffs',
  other: 'Autres'
}

function formatTournamentName(slug: string): string {
  return slug
    .replace(/^league-of-legends-/, '')
    .replace(/-(playoffs|play-?in|group[a-z0-9-]*|positioning|regular|season|last-chance-qualifier)$/i, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .trim()
}

const getMatchCount = (block: any) =>
  (block.matches?.length ?? 0) + (block.upper?.length ?? 0) + (block.lower?.length ?? 0)

const LeagueOfLegendsMatches = ({ selectedLeague, selectedSegment }: Props) => {
  const { data: tournaments, isLoading, isError } = useMatchesByTournament(selectedSegment, selectedLeague)

  const getPhaseLabel = (slug: string): string => {
    if (/play[\s-]?in/i.test(slug)) return 'play-in'
    if (/group[\s-]?stage|group[\s-]?[a-z0-9]/i.test(slug)) return 'group'
    if (/positioning/i.test(slug)) return 'positioning'
    if (/playoff/i.test(slug)) return 'playoffs'
    if (/regular|season/i.test(slug)) return 'regular'
    return 'other'
  }

  const phaseOrder = ['regular', 'group', 'positioning', 'play-in', 'playoffs', 'other']

  const allPhases = useMemo(() => {
    const phaseSet = new Set<string>()
    tournaments?.forEach((block) => {
      const phase = getPhaseLabel(block.slug)
      if (getMatchCount(block) > 0) {
        phaseSet.add(phase)
      }
    })
    return phaseOrder.filter((phase) => phaseSet.has(phase))
  }, [tournaments])

  const [selectedPhase, setSelectedPhase] = useState<string>('playoffs')

  useEffect(() => {
    if (allPhases.length > 0 && !allPhases.includes(selectedPhase)) {
      setSelectedPhase(allPhases[0])
    }
  }, [allPhases, selectedPhase])

  const filtered = useMemo(() => {
    return tournaments?.filter((block) => getPhaseLabel(block.slug) === selectedPhase && getMatchCount(block) > 0) ?? []
  }, [tournaments, selectedPhase])

  if (isLoading) return <p className="p-6">Chargement des matchs...</p>
  if (isError || !tournaments) return <p className="p-6 text-red-500">Erreur lors du chargement.</p>

  return (
    <div className="space-y-10">
      {allPhases.length > 1 && (
        <div className="flex justify-end">
          <MatchTypeToggle selected={selectedPhase} options={allPhases} onChange={setSelectedPhase} />
        </div>
      )}

      {filtered.map((tournament) => {
        const hasBracket = (tournament.upper?.length ?? 0) > 0 || (tournament.lower?.length ?? 0) > 0
        const phase = getPhaseLabel(tournament.slug)

        return (
          <div key={tournament.slug}>
            <h2 className="mb-2 text-2xl font-bold">
              🏷️ {phaseLabels[phase] ?? phase} — {formatTournamentName(tournament.slug)}
            </h2>

            {!hasBracket ? (
              <div className="flex flex-col gap-6 lg:flex-row">
                <div className="flex-1 space-y-2">
                  {(tournament.matches ?? []).map((match, index) => (
                    <motion.div
                      key={match.match_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <MatchCard match={match} />
                    </motion.div>
                  ))}
                </div>

                {(phase === 'regular' || phase === 'group') && (
                  <div className="w-full shrink-0 lg:w-80">
                    <TournamentStandingsView tournamentId={tournament.id} />
                  </div>
                )}
              </div>
            ) : (
              <BracketBlock upper={tournament.upper} lower={tournament.lower} />
            )}
          </div>
        )
      })}

      {filtered.length === 0 && <p className="p-6 italic text-zinc-400">Aucun tournoi trouvé pour cette phase.</p>}
    </div>
  )
}

const TournamentStandingsView = ({ tournamentId }: { tournamentId: number }) => {
  console.log('🔍 tournamentId:', tournamentId)
  const { data, isLoading } = useStandings(tournamentId)
  if (isLoading || !data || data.length === 0) return null
  return <TournamentStandings standings={data} />
}

export default LeagueOfLegendsMatches
