import { getDb } from "../../db.js"

export async function getSegmentRangesFromDb(segment?: string) {
  const db = getDb()

  const specialSlugs = ["first-stand", "msi", "ewc", "worlds"]
  const specialRegexMap: Record<string, RegExp> = {
    "first-stand": /first.?stand/i,
    msi: /mid.?invitational/i,
    ewc: /esports.?world.?cup/i,
    worlds: /world.?championship/i,
  }

  const allTournaments = await new Promise<any[]>((resolve, reject) => {
    db.all(
      `SELECT slug, begin_at, end_at FROM Tournament
       WHERE game_id = (SELECT id FROM Game WHERE slug = 'league-of-legends')
       AND begin_at IS NOT NULL AND end_at IS NOT NULL`,
      [],
      (err, rows) => {
        if (err) return reject(err)
        resolve(rows)
      }
    )
  })

  let segmentYear = new Date().getUTCFullYear()
  if (segment && segment !== "segment-1") {
    const currentSpecial = allTournaments.find((t) =>
      specialRegexMap[segment]?.test(t.slug)
    )
    if (currentSpecial) {
      segmentYear = new Date(currentSpecial.begin_at).getUTCFullYear()
    }
  }

  const specialSegments: Record<string, { start: string; end: string }> = {}

  for (const slug of specialSlugs) {
    const regex = specialRegexMap[slug]
    const candidates = allTournaments
      .filter((t) => regex.test(t.slug))
      .sort(
        (a, b) =>
          new Date(a.begin_at).getTime() - new Date(b.begin_at).getTime()
      )

    const match = candidates.find(
      (t) => new Date(t.begin_at).getUTCFullYear() === segmentYear
    )

    if (match) {
      specialSegments[slug] = {
        start: match.begin_at,
        end: match.end_at,
      }
    }
  }

  const sortedSpecial = Object.entries(specialSegments).sort(
    (a, b) => new Date(a[1].start).getTime() - new Date(b[1].start).getTime()
  )

  const segmentRanges: Record<string, { start: string; end: string }> = {}
  segmentRanges["segment-1"] = {
    start: `${segmentYear}-01-01T00:00:00Z`,
    end: sortedSpecial[0][1].start,
  }

  for (let i = 0; i < sortedSpecial.length - 1; i++) {
    segmentRanges[`segment-${i + 2}`] = {
      start: sortedSpecial[i][1].end,
      end: sortedSpecial[i + 1][1].start,
    }
  }

  for (const [key, range] of sortedSpecial) {
    segmentRanges[key] = range
  }

  return segmentRanges
}
