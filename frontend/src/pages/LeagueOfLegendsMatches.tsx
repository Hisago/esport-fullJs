import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useMatchesByTournament, useMatchesByLeague, useStandings } from '@/api/lol'
import { TournamentMatchBlock } from '@/types/lol'
import MatchCard from '@/Components/Lol/MatchCard'
import MatchTypeToggle from '@/Components/Lol/MatchTypeToggle'
import BracketBlock from '@/Components/Lol/BracketBlock'
import TournamentStandings from '@/Components/Lol/TournamentStandings'

interface Props {
  selectedLeague?: string
  selectedSegment?: string
  customTournaments?: TournamentMatchBlock[]
}

const phaseLabels: Record<string, string> = {
  regular: 'Saison régulière',
  group: 'Groupes',
  positioning: 'Positionnement',
  placements: 'Placements',
  promotion: 'Promotion',
  'play-in': 'Play-In',
  playoffs: 'Playoffs',
  'last-chance': 'Last Chance',
  swiss: 'Swiss Stage',
  other: 'Autres'
}

function inferPhaseFromSlug(slug: string): string {
  if (slug.includes('last-chance')) return 'last-chance'
  if (slug.includes('swiss')) return 'swiss'
  if (slug.includes('playoffs')) return 'playoffs'
  if (slug.includes('play-in')) return 'play-in'
  if (slug.includes('group')) return 'group'
  if (slug.includes('regular')) return 'regular'
  if (slug.includes('positioning')) return 'positioning'
  if (slug.includes('promotion')) return 'promotion'
  if (slug.includes('placements')) return 'placements'
  return 'other'
}

function formatTournamentName(slug: string): string {
  const groupMatch = slug.match(/group-([a-z0-9-]+)/i)
  const groupSuffix = groupMatch ? ` — Groupe ${capitalize(groupMatch[1])}` : ''

  const baseName = slug
    .replace(/^league-of-legends-/, '')
    .replace(/-(playoffs|play-?in|group[a-z0-9-]*|positioning|regular|season|last-chance-qualifier|placements)$/i, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .trim()

  return baseName + groupSuffix
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function groupBy<T>(arr: T[], fn: (item: T) => string): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const key = fn(item)
      acc[key] = acc[key] ?? []
      acc[key].push(item)
      return acc
    },
    {} as Record<string, T[]>
  )
}

function getGroupKey(slug: string): string {
  const match = slug.match(/^(.*)-group-[a-z0-9-]+$/i)
  return match?.[1] || slug
}

const getMatchCount = (block: TournamentMatchBlock) =>
  (block.matches?.length ?? 0) + (block.upper?.length ?? 0) + (block.lower?.length ?? 0)

const LeagueOfLegendsMatches = ({ selectedLeague, selectedSegment, customTournaments }: Props) => {
  const isUsingCustom = !!customTournaments

  const {
    data: tournamentData,
    isLoading,
    isError
  } = !customTournaments
    ? selectedSegment
      ? useMatchesByTournament(selectedSegment, selectedLeague)
      : useMatchesByLeague(selectedLeague)
    : { data: customTournaments, isLoading: false, isError: false }

  const phaseOrder = [
    'regular',
    'placements',
    'promotion',
    'group',
    'positioning',
    'swiss',
    'last-chance',
    'play-in',
    'playoffs',
    'other'
  ]

  const allPhases = useMemo(() => {
    const phaseSet = new Set<string>()
    tournamentData?.forEach((block) => {
      const phase = inferPhaseFromSlug(block.slug)
      if (getMatchCount(block) > 0) {
        phaseSet.add(phase)
      }
    })
    return phaseOrder.filter((phase) => phaseSet.has(phase))
  }, [tournamentData])

  const [selectedPhase, setSelectedPhase] = useState<string>('playoffs')

  useEffect(() => {
    if (allPhases.length > 0 && !allPhases.includes(selectedPhase)) {
      setSelectedPhase(allPhases[0])
    }
  }, [allPhases, selectedPhase])

  const filtered = useMemo(() => {
    return (
      tournamentData?.filter((block) => inferPhaseFromSlug(block.slug) === selectedPhase && getMatchCount(block) > 0) ??
      []
    )
  }, [tournamentData, selectedPhase])

  const grouped = groupBy(filtered, (t) => getGroupKey(t.slug))

  if (isLoading) return <p className="p-6">Chargement des matchs...</p>
  if (isError || !tournamentData) return <p className="p-6 text-red-500">Erreur lors du chargement.</p>

  return (
    <div className="space-y-10">
      {allPhases.length > 1 && (
        <MatchTypeToggle selected={selectedPhase} options={allPhases} onChange={setSelectedPhase} />
      )}

      {Object.entries(grouped).map(([groupSlug, tournamentsInGroup]) => (
        <div key={groupSlug}>
          {tournamentsInGroup.map((tournament) => {
            const phase = inferPhaseFromSlug(tournament.slug)
            const hasBracket =
              ['playoffs', 'play-in', 'promotion'].includes(phase) &&
              ((tournament.upper?.length ?? 0) > 0 ||
                (tournament.lower?.length ?? 0) > 0 ||
                (tournament.matches?.length ?? 0) > 0)
            return (
              <div key={tournament.slug} className="mb-8">
                <h2 className="mb-2 text-2xl font-bold">
                  🏷️ {phaseLabels[phase] ?? phase} — {formatTournamentName(tournament.slug)}
                </h2>

                {hasBracket ? (
                  <BracketBlock upper={tournament.upper} lower={tournament.lower} matches={tournament.matches} />
                ) : (
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

                    {['regular', 'group', 'placements', 'swiss', 'last-chance'].includes(phase) && (
                      <div className="w-full shrink-0 lg:w-80">
                        <TournamentStandingsView tournamentId={tournament.id} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}

      {filtered.length === 0 && <p className="p-6 italic text-zinc-400">Aucun tournoi trouvé pour cette phase.</p>}
    </div>
  )
}

const TournamentStandingsView = ({ tournamentId }: { tournamentId: number }) => {
  const { data, isLoading } = useStandings(tournamentId)
  if (isLoading || !data || data.length === 0) return null
  return <TournamentStandings standings={data} />
}

export default LeagueOfLegendsMatches
