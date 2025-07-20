import { FastifyInstance } from "fastify"
import { getDb } from "../db.js"
import { getSegmentRangesFromDb } from "../lib/lol/segments.js"

type MatchRow = {
  match_id: number
  date: string
  league_name: string
  league_slug: string
  team1_name: string
  team1_logo: string | null
  team2_name: string
  team2_logo: string | null
}

type TeamRow = {
  name: string
  logo_url: string | null
  data: string | null
}

export async function lolRoutes(app: FastifyInstance) {
  // 🔹 /api/lol/leagues
  app.get("/api/lol/leagues", async (req, reply) => {
    try {
      const db = getDb()
      if (!db) {
        console.error("❌ db is null or undefined")
        return reply.status(500).send({ error: "Database not connected" })
      }

      const rows = await new Promise<any[]>((resolve, reject) => {
        db.all(
          `
        SELECT id, name, slug, region, logo_url
        FROM League
        WHERE game_id = (SELECT id FROM Game WHERE slug = 'league-of-legends')
        ORDER BY name
      `,
          [],
          (err, result) => {
            if (err) return reject(err)
            resolve(result)
          }
        )
      })

      return reply.type("application/json").send(rows)
    } catch (err) {
      console.error("❌ Erreur SQL ligues:", err)
      return reply.status(500).send({ error: "Erreur SQL" })
    }
  })

  // 🔹 /api/lol/matches
  app.get("/api/lol/matches", async (req, reply) => {
    const db = getDb()

    const {
      limit = "10",
      league,
      segment,
    } = req.query as {
      limit?: string
      league?: string
      segment?: string
    }

    const parsedLimit = parseInt(limit, 10)
    const now = new Date()
    const params: any[] = []

    let query = `
    SELECT 
      m.id AS match_id,
      m.date,
      l.name AS league_name,
      l.slug AS league_slug,
      t1.name AS team1_name,
      t1.logo_url AS team1_logo,
      t2.name AS team2_name,
      t2.logo_url AS team2_logo,
      m.score_team1,
      m.score_team2,
      m.status
    FROM Match m
    JOIN League l ON m.league_id = l.id
    JOIN Team t1 ON m.team1_id = t1.id
    JOIN Team t2 ON m.team2_id = t2.id
    WHERE 1 = 1
  `

    // 🔍 Récupérer tous les slugs de ligues LoL
    const allLeagueSlugs: string[] = await new Promise((resolve, reject) => {
      db.all(
        `
    SELECT slug FROM League
    WHERE game_id = (SELECT id FROM Game WHERE slug = 'league-of-legends')
    `,
        [],
        (err, rows: { slug: string }[]) => {
          if (err) return reject(err)
          resolve(rows.map((r) => r.slug))
        }
      )
    })

    // 🔍 Matchers dynamiques pour les segments spéciaux
    const specialSegmentMatchers: Record<string, RegExp> = {
      "first-stand": /league-of-legends-first-stand/i,
      msi: /league-of-legends-mid.?invitational/i,
      worlds: /league-of-legends-world.?championship/i,
    }

    const specialSegments: Record<string, string[]> = Object.fromEntries(
      Object.entries(specialSegmentMatchers).map(([key, regex]) => [
        key,
        allLeagueSlugs.filter((slug) => regex.test(slug)),
      ])
    )

    // 🔹 Segment spécial → filtrer sur les ligues correspondantes
    if (
      segment &&
      specialSegments[segment] &&
      specialSegments[segment].length > 0
    ) {
      const slugs = specialSegments[segment]
      query += ` AND l.slug IN (${slugs.map(() => "?").join(", ")})`
      params.push(...slugs)
      console.log("🔍 Segment spécial dynamique :", segment, "→", slugs)
    } else {
      // 🔸 Segment temporel (segment-1, segment-2, etc.) → utiliser Tournament

      const tournaments = await new Promise<any[]>((resolve, reject) => {
        db.all(
          `
        SELECT slug, begin_at, end_at FROM Tournament
        WHERE game_id = (SELECT id FROM Game WHERE slug = 'league-of-legends')
        AND begin_at IS NOT NULL AND end_at IS NOT NULL
      `,
          [],
          (err, rows) => {
            if (err) return reject(err)
            resolve(rows)
          }
        )
      })

      const firstStandTournaments = tournaments.filter((t) =>
        /first.?stand/i.test(t.slug)
      )

      const firstStandBegin = firstStandTournaments
        .map((t) => new Date(t.begin_at))
        .sort((a, b) => a.getTime() - b.getTime())[0]

      const firstStandEnd = firstStandTournaments
        .map((t) => new Date(t.end_at))
        .sort((a, b) => b.getTime() - a.getTime())[0]

      const firstStand = tournaments.find((t) => /first.?stand/i.test(t.slug))
      const msi = tournaments.find((t) => /mid.?invitational/i.test(t.slug))
      const worlds = tournaments.find((t) =>
        /world.?championship/i.test(t.slug)
      )

      const segmentRanges: Record<string, { start?: string; end?: string }> = {
        "segment-1": {
          start: "2000-01-01",
          end: firstStand?.begin_at || msi?.begin_at || worlds?.begin_at,
        },
        "first-stand": {
          start: firstStandBegin?.toISOString(),
          end: firstStandEnd?.toISOString(),
        },
        "segment-2": {
          start: firstStand?.end_at,
          end: msi?.begin_at || worlds?.begin_at,
        },
        msi: {
          start: msi?.begin_at,
          end: msi?.end_at,
        },
        "segment-3": {
          start: msi?.end_at,
          end: worlds?.begin_at,
        },
        worlds: {
          start: worlds?.begin_at,
          end: worlds?.end_at || "2100-01-01",
        },
      }

      // Sélection de la plage temporelle
      let rangeStart: string | undefined
      let rangeEnd: string | undefined

      if (segment && segment in segmentRanges) {
        const selected = segmentRanges[segment]
        rangeStart = selected.start
        rangeEnd = selected.end ?? "2100-01-01"
      } else {
        const fallback = tournaments.find(
          (t) => now >= new Date(t.begin_at) && now <= new Date(t.end_at)
        )
        rangeStart = fallback?.begin_at
        rangeEnd = fallback?.end_at
      }

      console.log("📆 Plage appliquée :", rangeStart, "→", rangeEnd)

      if (!rangeStart || !rangeEnd) {
        return reply.status(400).send({ error: "Plage de segment introuvable" })
      }

      query += ` AND m.date BETWEEN ? AND ?`
      params.push(rangeStart, rangeEnd)
    }

    if (league) {
      query += ` AND l.slug = ?`
      params.push(league)
    }

    query += ` ORDER BY m.date DESC`

    try {
      const rows = await new Promise<any[]>((resolve, reject) => {
        db.all(query, params, (err, result) => {
          if (err) return reject(err)
          resolve(result)
        })
      })

      console.log("📦 Matchs trouvés :", rows.length)

      const grouped = rows.reduce<Record<string, any[]>>((acc, match) => {
        if (!acc[match.league_name]) acc[match.league_name] = []
        acc[match.league_name].push(match)
        return acc
      }, {})

      // Appliquer la limite seulement en mode "Toutes les ligues"
      if (!league && (!segment || !(segment in specialSegments))) {
        for (const key of Object.keys(grouped)) {
          grouped[key] = grouped[key].slice(0, parsedLimit)
        }
      }

      if (segment && specialSegments[segment]) {
        const slugs = specialSegments[segment]
        if (!slugs || slugs.length === 0) {
          console.warn("⛔ Aucune ligue détectée pour le segment :", segment)
          return reply
            .status(400)
            .send({ error: "Aucune ligue détectée pour ce segment" })
        }
        console.log("🎯 Ligues ciblées pour segment spécial :", slugs)
      }
      reply.type("application/json").send(grouped)
    } catch (err) {
      console.error("❌ DB Error:", err)
      reply.status(500).send({ error: "Erreur SQL" })
    }
  })

  // 🔹 /api/lol/tournaments
  app.get("/api/lol/tournaments", async (req, reply) => {
    const db = getDb()
    db.all(
      `
      SELECT id, name, slug, begin_at, end_at, location, logo_url
      FROM Tournament
      WHERE game_id = (SELECT id FROM Game WHERE slug = 'league-of-legends')
      ORDER BY begin_at DESC
    `,
      [],
      (err, rows) => {
        if (err) return reply.status(500).send(err)
        reply.send(rows)
      }
    )
  })

  // 🔹 /api/lol/teams/rankings
  app.get("/api/lol/teams/rankings", async (req, reply) => {
    const db = getDb()
    db.all(
      `
    SELECT name, logo_url, data
    FROM Team
    WHERE game_id = (SELECT id FROM Game WHERE slug = 'league-of-legends')
  `,
      [],
      (err, rows) => {
        if (err) return reply.status(500).send(err)

        const typedRows = rows as TeamRow[]

        const parsed = typedRows.map((team) => ({
          name: team.name,
          logo_url: team.logo_url,
          ...JSON.parse(team.data || "{}"),
        }))

        reply.send(parsed)
      }
    )
  })

  // 🔹 /api/lol/matches-with-segment
  app.get("/api/lol/matches-with-segment", async (req, reply) => {
    const db = getDb()

    const query = `
      SELECT 
        m.id AS match_id,
        m.date,
        m.stage,
        l.name AS league_name,
        l.slug AS league_slug,
        t1.name AS team1_name,
        t1.logo_url AS team1_logo,
        t2.name AS team2_name,
        t2.logo_url AS team2_logo,
        m.score_team1,
        m.score_team2,
        m.status
      FROM Match m
      JOIN League l ON m.league_id = l.id
      JOIN Team t1 ON m.team1_id = t1.id
      JOIN Team t2 ON m.team2_id = t2.id
      WHERE l.game_id = (SELECT id FROM Game WHERE slug = 'league-of-legends')
      ORDER BY m.date ASC
    `

    try {
      const rows = await new Promise<any[]>((resolve, reject) => {
        db.all(query, [], (err, result) => {
          if (err) return reject(err)
          resolve(result)
        })
      })

      const getSegmentId = (date: string, stage: string): string => {
        const d = new Date(date)

        if (/first stand/i.test(stage)) return "first-stand"
        if (/msi/i.test(stage)) return "msi"
        if (/world/i.test(stage)) return "worlds"

        if (d < findFirstDate(rows, /first stand/i)) return "segment-1"
        if (
          d > findLastDate(rows, /first stand/i) &&
          d < findFirstDate(rows, /msi/i)
        )
          return "segment-2"
        if (d > findLastDate(rows, /msi/i) && d < findFirstDate(rows, /world/i))
          return "segment-3"

        return "unknown"
      }

      const findFirstDate = (rows: any[], regex: RegExp): Date => {
        const match = rows.find((r) => regex.test(r.stage))
        return match ? new Date(match.date) : new Date("9999-12-31")
      }

      const findLastDate = (rows: any[], regex: RegExp): Date => {
        const match = [...rows].reverse().find((r) => regex.test(r.stage))
        return match ? new Date(match.date) : new Date("0000-01-01")
      }

      const matchesWithSegment = rows.map((match) => ({
        ...match,
        segment_id: getSegmentId(match.date, match.stage || ""),
      }))

      reply.send(matchesWithSegment)
    } catch (err) {
      console.error("❌ Erreur matches-with-segment:", err)
      reply.status(500).send({ error: "Erreur SQL" })
    }
  })

  // 🔹 /api/lol/segments (dynamique)
  app.get("/api/lol/segments", async (req, reply) => {
    const db = getDb()

    try {
      // 📦 Tous les matchs
      const matchRows = await new Promise<any[]>((resolve, reject) => {
        db.all(
          `SELECT 
          m.id AS match_id,
          m.date,
          m.stage,
          l.id AS league_id,
          l.name AS league_name,
          l.slug AS league_slug,
          l.logo_url AS league_logo
        FROM Match m
        JOIN League l ON m.league_id = l.id
        WHERE l.game_id = (SELECT id FROM Game WHERE slug = 'league-of-legends')
        ORDER BY m.date ASC`,
          [],
          (err, result) => {
            if (err) return reject(err)
            resolve(result)
          }
        )
      })

      // 📦 Tous les tournois
      const tournaments = await new Promise<any[]>((resolve, reject) => {
        db.all(
          `SELECT slug, begin_at, end_at FROM Tournament
         WHERE game_id = (SELECT id FROM Game WHERE slug = 'league-of-legends')
         AND begin_at IS NOT NULL AND end_at IS NOT NULL`,
          [],
          (err, result) => {
            if (err) return reject(err)
            resolve(result)
          }
        )
      })

      const getRangeForEvent = (
        regex: RegExp
      ): { start: Date | null; end: Date | null } => {
        const filtered = tournaments.filter((t) => regex.test(t.slug))

        if (filtered.length === 0) return { start: null, end: null }

        const start = new Date(
          Math.min(...filtered.map((t) => new Date(t.begin_at).getTime()))
        )
        const end = new Date(
          Math.max(...filtered.map((t) => new Date(t.end_at).getTime()))
        )

        return { start, end }
      }

      const firstStand = getRangeForEvent(/first.?stand/i)
      const msi = getRangeForEvent(/mid.?invitational/i)
      const worlds = getRangeForEvent(/world.?championship/i)
      const ewc = getRangeForEvent(/esports.?world.?cup/i)

      const now = new Date()

      const getStatus = (
        start: Date | null,
        end: Date | null
      ): "done" | "active" | "upcoming" => {
        if (start && now < start) return "upcoming"
        if (start && end && now >= start && now <= end) return "active"
        if (end && now > end) return "done"
        return "upcoming"
      }

      const segmentsMap: Record<
        string,
        {
          id: string
          name: string
          type: string
          status: "done" | "active" | "upcoming"
          leagues: any[]
        }
      > = {
        "segment-1": {
          id: "segment-1",
          name: "Segment 1",
          type: "regional",
          status: getStatus(null, firstStand.start),
          leagues: [],
        },
        "first-stand": {
          id: "first-stand",
          name: "First Stand",
          type: "event",
          status: getStatus(firstStand.start, firstStand.end),
          leagues: [],
        },
        "segment-2": {
          id: "segment-2",
          name: "Segment 2",
          type: "regional",
          status: getStatus(firstStand.end, msi.start),
          leagues: [],
        },
        msi: {
          id: "msi",
          name: "MSI",
          type: "global",
          status: getStatus(msi.start, msi.end),
          leagues: [],
        },
        ewc: {
          id: "ewc",
          name: "EWC",
          type: "global",
          status: getStatus(ewc.start, ewc.end),
          leagues: [],
        },
        "segment-3": {
          id: "segment-3",
          name: "Segment 3",
          type: "regional",
          status: getStatus(msi.end, worlds.start),
          leagues: [],
        },
        worlds: {
          id: "worlds",
          name: "Worlds",
          type: "global",
          status: getStatus(worlds.start, worlds.end || new Date("2100-01-01")),
          leagues: [],
        },
      }

      const allowedRegionalPatterns = [
        /league-of-legends-lec/i,
        /league-of-legends-lta/i,
        /league-of-legends-lpl/i,
        /league-of-legends-lck/i,
        /league-of-legends-lcp/i,
      ]

      const getSegmentId = (date: string, league_slug: string): string => {
        const d = new Date(date)

        if (/first.?stand/i.test(league_slug)) return "first-stand"
        if (/mid.?invitational/i.test(league_slug)) return "msi"
        if (/world.?championship/i.test(league_slug)) return "worlds"

        if (!firstStand.start || d < firstStand.start) return "segment-1"
        if (
          firstStand.end &&
          d > firstStand.end &&
          (!msi.start || d < msi.start)
        )
          return "segment-2"
        if (msi.end && d > msi.end && (!worlds.start || d < worlds.start))
          return "segment-3"

        return "unknown"
      }

      const added = new Set<string>()

      for (const row of matchRows) {
        const segmentId = getSegmentId(row.date, row.league_slug)
        const segment = segmentsMap[segmentId]
        if (!segment) continue

        const leagueKey = `${row.league_id}`
        const isGlobal = /mid.?invitational|world.?championship/i.test(
          row.league_slug
        )
        const isEvent = /first.?stand/i.test(row.league_slug)
        const isMainRegional = allowedRegionalPatterns.some((regex) =>
          regex.test(row.league_slug)
        )

        const shouldInclude =
          (segment.type === "regional" && isMainRegional) ||
          (segment.type === "global" && isGlobal) ||
          (segment.type === "event" && isEvent)

        if (!shouldInclude) continue

        if (!added.has(segment.id + leagueKey)) {
          segment.leagues.push({
            id: row.league_id,
            name: row.league_name,
            slug: row.league_slug,
            logo_url: row.league_logo,
          })
          added.add(segment.id + leagueKey)
        }
      }

      const segments = Object.values(segmentsMap)
      reply.send(segments)
    } catch (err) {
      console.error("❌ Erreur segments dynamiques:", err)
      reply.status(500).send({ error: "Erreur SQL" })
    }
  })

  app.get("/api/lol/matches-by-tournament", async (req, reply) => {
    const db = getDb()
    const { segment, league } = req.query as {
      segment?: string
      league?: string
    }

    const segmentRanges = await getSegmentRangesFromDb(segment)
    const range = segmentRanges[segment ?? "segment-1"]

    if (!range) return reply.send([])

    const rangeStartDate = new Date(range.start)
    const rangeEndDate = new Date(range.end)
    const isSpecialSegment = ["msi", "first-stand", "worlds", "ewc"].includes(
      (segment ?? "").toLowerCase()
    )

    const tournaments = await new Promise<any[]>((resolve, reject) => {
      db.all(
        `SELECT slug, begin_at, end_at, league_id FROM Tournament
       WHERE game_id = (SELECT id FROM Game WHERE slug = 'league-of-legends')
       AND begin_at IS NOT NULL AND end_at IS NOT NULL`,
        [],
        (err, rows) => {
          if (err) return reject(err)
          resolve(rows)
        }
      )
    })

    let filteredTournaments: any[] = []

    if (league) {
      const leagueRows = await new Promise<{ id: number; name: string }[]>(
        (resolve, reject) => {
          db.all(
            `SELECT id, name FROM League WHERE game_id = (SELECT id FROM Game WHERE slug = 'league-of-legends')`,
            [],
            (err, rows) => {
              if (err) return reject(err)
              resolve(rows as { id: number; name: string }[])
            }
          )
        }
      )

      const leagueMatch = leagueRows.find(
        (l) =>
          l.name.toLowerCase().replace(/[-\s]/g, "") ===
          league.toLowerCase().replace(/[-\s]/g, "")
      )
      if (!leagueMatch) return reply.send([])

      filteredTournaments = tournaments.filter((t) => {
        const begin = new Date(t.begin_at)
        const end = new Date(t.end_at)
        const matchesDate = isSpecialSegment
          ? true
          : begin <= rangeEndDate && end >= rangeStartDate
        const matchesLeague = t.league_id === leagueMatch.id

        const matchesSlug =
          (segment === "msi" && /mid.?invitational/i.test(t.slug)) ||
          (segment === "first-stand" && /first.?stand/i.test(t.slug)) ||
          (segment === "worlds" && /world.?championship/i.test(t.slug)) ||
          (segment === "ewc" && /esports.?world.?cup/i.test(t.slug))

        return (
          matchesDate &&
          (isSpecialSegment ? matchesLeague || matchesSlug : matchesLeague)
        )
      })
    } else {
      const specialRegex =
        /(first.?stand|mid.?invitational|world.?championship|esports.?world.?cup)/i

      filteredTournaments = tournaments.filter((t) => {
        const begin = new Date(t.begin_at)
        const end = new Date(t.end_at)
        const overlaps = begin <= rangeEndDate && end >= rangeStartDate
        if (!overlaps) return false

        if (segment === "first-stand") return /first.?stand/i.test(t.slug)
        if (segment === "msi") return /mid.?invitational/i.test(t.slug)
        if (segment === "worlds") return /world.?championship/i.test(t.slug)
        if (segment === "ewc") return /esports.?world.?cup/i.test(t.slug)

        return !specialRegex.test(t.slug)
      })
    }

    const result = []

    for (const t of filteredTournaments) {
      const slug = t.slug

      const type = slug.includes("placements")
        ? /last-chance/i.test(slug)
          ? "promotion"
          : "placements"
        : /playoff/i.test(slug)
        ? "playoffs"
        : /play-?in/i.test(slug)
        ? "play-in"
        : /group/i.test(slug)
        ? "group"
        : /positioning/i.test(slug)
        ? "positioning"
        : /regular|season/i.test(slug)
        ? "regular"
        : "other"

      const tournamentRow = await new Promise<any>((resolve, reject) => {
        db.get(
          `SELECT id FROM Tournament WHERE slug = ?`,
          [t.slug],
          (err, row) => {
            if (err) return reject(err)
            resolve(row)
          }
        )
      })
      if (!tournamentRow) continue

      const tournamentId = tournamentRow.id
      const matches = await new Promise<any[]>((resolve, reject) => {
        db.all(
          `SELECT 
          m.id AS match_id,
          m.date,
          l.name AS league_name,
          l.slug AS league_slug,
          t1.name AS team1_name,
          t1.logo_url AS team1_logo,
          t2.name AS team2_name,
          t2.logo_url AS team2_logo,
          m.score_team1,
          m.score_team2,
          m.status,
          m.bracket
        FROM Match m
        JOIN League l ON m.league_id = l.id
        JOIN Team t1 ON m.team1_id = t1.id
        JOIN Team t2 ON m.team2_id = t2.id
        WHERE m.tournament_id = ?
        ORDER BY m.date ASC`,
          [tournamentId],
          (err, rows) => {
            if (err) return reject(err)
            resolve(rows)
          }
        )
      })

      const upper = matches.filter((m) => m.bracket === "upper")
      const lower = matches.filter((m) => m.bracket === "lower")

      result.push({
        id: tournamentId,
        slug: t.slug,
        type,
        matches,
        upper,
        lower,
      })
    }

    reply.send(result)
  })

  // 🔹 /api/lol/standings
  app.get("/api/lol/standings", async (req, reply) => {
    const db = getDb()
    const { tournamentId } = req.query as { tournamentId?: string }

    if (!tournamentId) {
      return reply.status(400).send({ error: "Missing tournamentId" })
    }

    try {
      const matches = await new Promise<any[]>((resolve, reject) => {
        db.all(
          `SELECT m.*, 
                t1.name AS team1_name, 
                t2.name AS team2_name,
                m.score_team1 AS score1, 
                m.score_team2 AS score2,
                t1.id AS team1_id, 
                t2.id AS team2_id
         FROM Match m
         JOIN Team t1 ON m.team1_id = t1.id
         JOIN Team t2 ON m.team2_id = t2.id
         WHERE m.tournament_id = ? AND m.status = 'finished'`,
          [tournamentId],
          (err, rows) => {
            if (err) return reject(err)
            resolve(rows)
          }
        )
      })

      // DEBUG
      console.log(
        `📊 ${matches.length} matchs trouvés pour le tournoi ${tournamentId}`
      )
      matches.forEach((m) => {
        console.log(
          `🆚 ${m.team1_name} (${m.score1}) vs ${m.team2_name} (${m.score2})`
        )
      })

      const standings: Record<string, any> = {}

      for (const match of matches) {
        const { team1_id, team2_id, team1_name, team2_name, score1, score2 } =
          match

        if (score1 == null || score2 == null) continue

        for (const [id, name] of [
          [team1_id, team1_name],
          [team2_id, team2_name],
        ]) {
          if (!standings[id]) {
            standings[id] = {
              team_id: id,
              name,
              wins: 0,
              losses: 0,
            }
          }
        }

        if (score1 > score2) {
          standings[team1_id].wins++
          standings[team2_id].losses++
        } else {
          standings[team2_id].wins++
          standings[team1_id].losses++
        }
      }

      const result = Object.values(standings).sort((a, b) => b.wins - a.wins)

      // DEBUG
      console.log("📈 Classement généré :", result)

      reply.send(result)
    } catch (err) {
      console.error("❌ Erreur standings:", err)
      reply.status(500).send({ error: "Erreur SQL" })
    }
  })

  app.get("/api/lol/matches-by-league", async (req, reply) => {
    const db = getDb()
    const { league } = req.query as { league?: string }

    if (!league)
      return reply.code(400).send({ error: "Missing league parameter" })

    const leagues = await new Promise<any[]>((resolve, reject) => {
      db.all(
        `SELECT id, name FROM League WHERE game_id = (SELECT id FROM Game WHERE slug = 'league-of-legends')`,
        [],
        (err, rows) => {
          if (err) return reject(err)
          resolve(rows)
        }
      )
    })

    const leagueMatch = leagues.find(
      (l) =>
        l.name.toLowerCase().replace(/[-\s]/g, "") ===
        league.toLowerCase().replace(/[-\s]/g, "")
    )

    if (!leagueMatch) return reply.send([])

    const tournaments = await new Promise<any[]>((resolve, reject) => {
      db.all(
        `SELECT id, slug, begin_at, end_at FROM Tournament
       WHERE league_id = ? AND begin_at IS NOT NULL AND end_at IS NOT NULL`,
        [leagueMatch.id],
        (err, rows) => {
          if (err) return reject(err)
          resolve(rows)
        }
      )
    })

    const result = []

    for (const t of tournaments) {
      const slug = t.slug

      const type = slug.includes("placements")
        ? /last-chance/i.test(slug)
          ? "promotion"
          : "placements"
        : /playoff/i.test(slug)
        ? "playoffs"
        : /play-?in/i.test(slug)
        ? "play-in"
        : /swiss/i.test(slug)
        ? "swiss"
        : /(group|groupe)/i.test(slug)
        ? "group"
        : /positioning/i.test(slug)
        ? "positioning"
        : /regular|season/i.test(slug)
        ? "regular"
        : "other"

      const tournamentId = t.id

      const matches = await new Promise<any[]>((resolve, reject) => {
        db.all(
          `SELECT 
          m.id AS match_id,
          m.date,
          l.name AS league_name,
          l.slug AS league_slug,
          t1.name AS team1_name,
          t1.logo_url AS team1_logo,
          t2.name AS team2_name,
          t2.logo_url AS team2_logo,
          m.score_team1,
          m.score_team2,
          m.status,
          m.bracket
        FROM Match m
        JOIN League l ON m.league_id = l.id
        JOIN Team t1 ON m.team1_id = t1.id
        JOIN Team t2 ON m.team2_id = t2.id
        WHERE m.tournament_id = ?
        ORDER BY m.date ASC`,
          [tournamentId],
          (err, rows) => {
            if (err) return reject(err)
            resolve(rows)
          }
        )
      })

      const upper = matches.filter((m) => m.bracket === "upper")
      const lower = matches.filter((m) => m.bracket === "lower")

      result.push({
        id: tournamentId,
        slug: t.slug,
        type,
        matches,
        upper,
        lower,
      })
    }

    reply.send(result)
  })
}
