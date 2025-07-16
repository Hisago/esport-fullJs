// src/api/lol.ts
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { Segment, Match, Standing, TournamentMatchBlock } from '@/types/lol'

export const useLeagues = () =>
  useQuery({
    queryKey: ['lol-leagues'],
    queryFn: async () => {
      const res = await fetch('/api/lol/leagues')
      console.log('📡 /api/lol/leagues → status:', res.status)

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
  })

type UseMatchesOptions = {
  leagueSlug?: string
  segment?: string
}

export const useMatches = ({ leagueSlug, segment }: UseMatchesOptions = {}) =>
  useQuery<Record<string, Match[]>, Error>({
    queryKey: ['lol-matches', leagueSlug, segment],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (leagueSlug) params.set('league', leagueSlug)
      if (segment) params.set('segment', segment)
      else params.set('days', '30')

      const res = await fetch(`/api/lol/matches?${params}`)
      if (!res.ok) throw new Error('Failed to fetch matches')
      return res.json()
    },
    keepPreviousData: true
  } as UseQueryOptions<Record<string, Match[]>, Error>)

export const useTeamRanking = () =>
  useQuery({
    queryKey: ['lol-ranking'],
    queryFn: async () => {
      const res = await fetch('/api/lol/teams/rankings')
      if (!res.ok) throw new Error('Failed to fetch rankings')
      return res.json()
    }
  })

export const useSegments = () => {
  console.log('📡 useSegments lancé')
  return useQuery<Segment[]>({
    queryKey: ['lol-segments'],
    queryFn: async () => {
      const res = await fetch('/api/lol/segments')
      if (!res.ok) throw new Error('Failed to fetch segments')
      return res.json()
    }
  })
}

export const useMatchesByTournament = (segmentId?: string, leagueName?: string) =>
  useQuery<TournamentMatchBlock[]>({
    queryKey: ['lol-matches-by-tournament', segmentId, leagueName],
    queryFn: async () => {
      const params = new URLSearchParams()

      if (segmentId) params.set('segment', segmentId)
      if (leagueName) params.set('league', leagueName)

      console.log('📡 Fetching with params:', params.toString())

      const res = await fetch(`/api/lol/matches-by-tournament?${params}`)
      if (!res.ok) throw new Error('Failed to fetch matches by tournament')
      return res.json()
    },
    enabled: !!segmentId
  })

export const useStandings = (tournamentId?: number) =>
  useQuery<Standing[]>({
    queryKey: ['lol', 'standings', tournamentId],
    queryFn: async () => {
      if (!tournamentId) return []
      const res = await fetch(`/api/lol/standings?tournamentId=${tournamentId}`)
      if (!res.ok) throw new Error('Failed to fetch standings')
      return res.json()
    },
    enabled: !!tournamentId
  })
