// src/types/lol.ts

export type MatchType = 'regular' | 'playoffs'

export type Match = {
  match_id: number
  date: string
  league_name: string
  league_slug: string
  team1_name: string
  team1_logo: string
  team2_name: string
  team2_logo: string
  status: string
  score_team1?: number | null
  score_team2?: number | null
}

export type League = {
  id: number
  name: string
  slug: string
  region: string
  logo_url: string | null
}

export type SegmentType = 'regional' | 'global' | 'event'

export type SegmentStatus = 'done' | 'active' | 'upcoming'

export type Segment = {
  id: string
  name: string
  status: SegmentStatus
  type: SegmentType
  leagues: League[]
}

export type Standing = {
  team_id: number
  name: string
  wins: number
  losses: number
}

export type TournamentMatchBlock = {
  id: number
  slug: string
  type: MatchType | 'group' | 'play-in' | 'positioning' | 'other'
  matches?: Match[]
  upper?: Match[]
  lower?: Match[]
}
