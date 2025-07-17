import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { Segment, Match, Standing, TournamentMatchBlock } from '@/types/lol'

const API_BASE = import.meta.env.VITE_API_BASE || ''

const fetchJson = async (input: RequestInfo, options?: RequestInit) => {
  const res = await fetch(`${API_BASE}${input}`, options)
  console.log(`📡 ${input} → status:`, res.status)

  const text = await res.text()
  try {
    const json = JSON.parse(text)
    console.log('✅ Parsed JSON:', json)
    return json
  } catch (err) {
    console.error('❌ Failed to parse JSON:', err)
    throw new Error('Invalid JSON response')
  }
}

export const useLeagues = () =>
  useQuery({
    queryKey: ['lol-leagues'],
    queryFn: () => fetchJson('/api/lol/leagues')
  })

type UseMatchesOptions = {
  leagueSlug?: string
  segment?: string
}

export const useMatches = ({ leagueSlug, segment }: UseMatchesOptions = {}) =>
  useQuery<Record<string, Match[]>, Error>({
    queryKey: ['lol-matches', leagueSlug, segment],
    queryFn: () => {
      const params = new URLSearchParams()
      if (leagueSlug) params.set('league', leagueSlug)
      if (segment) params.set('segment', segment)
      else params.set('days', '30')

      return fetchJson(`/api/lol/matches?${params}`)
    },
    keepPreviousData: true
  } as UseQueryOptions<Record<string, Match[]>, Error>)

export const useTeamRanking = () =>
  useQuery({
    queryKey: ['lol-ranking'],
    queryFn: () => fetchJson('/api/lol/teams/rankings')
  })

export const useSegments = () => {
  console.log('📡 useSegments lancé')
  return useQuery<Segment[]>({
    queryKey: ['lol-segments'],
    queryFn: () => fetchJson('/api/lol/segments')
  })
}

export const useMatchesByTournament = (segmentId?: string, leagueName?: string) =>
  useQuery<TournamentMatchBlock[]>({
    queryKey: ['lol-matches-by-tournament', segmentId, leagueName],
    queryFn: () => {
      const params = new URLSearchParams()
      if (segmentId) params.set('segment', segmentId)
      if (leagueName) params.set('league', leagueName)

      console.log('📡 Fetching with params:', params.toString())
      return fetchJson(`/api/lol/matches-by-tournament?${params}`)
    },
    enabled: !!segmentId
  })

export const useStandings = (tournamentId?: number) =>
  useQuery<Standing[]>({
    queryKey: ['lol', 'standings', tournamentId],
    queryFn: () => {
      if (!tournamentId) return []
      return fetchJson(`/api/lol/standings?tournamentId=${tournamentId}`)
    },
    enabled: !!tournamentId
  })
