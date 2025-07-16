import { useEffect, useState } from "react"
import { useSegments } from "@/api/lol"

export default function SegmentExplorer() {
  const { data: segments = [], isLoading, error } = useSegments()
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null)

  const selectedSegment = segments.find((s) => s.id === selectedSegmentId)

  useEffect(() => {
    if (segments.length && !selectedSegmentId) {
      setSelectedSegmentId(segments[0].id)
    }
  }, [segments])

  if (isLoading) return <p className="text-gray-400">Chargement...</p>
  if (error) return <p className="text-red-400">Erreur lors du chargement</p>

  return (
    <div className="flex gap-10 flex-wrap">
      {/* Timeline verticale */}
      <div className="flex flex-col gap-6 min-w-[180px]">
        {segments.map((segment) => {
          const isSelected = segment.id === selectedSegmentId
          const statusColor =
            segment.status === "active"
              ? "border-red-500"
              : segment.status === "upcoming"
              ? "border-yellow-400"
              : "border-white"

          return (
            <button
              key={segment.id}
              onClick={() => setSelectedSegmentId(segment.id)}
              className={`flex items-start gap-3 text-left transition-opacity ${
                isSelected ? "opacity-100" : "opacity-60 hover:opacity-100"
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 mt-1 flex items-center justify-center ${statusColor}`}>
                {segment.status === "active" && <div className="w-2 h-2 bg-red-500 rounded-full" />}
              </div>

              <div>
                <div className="text-white font-bold">{segment.name}</div>
                <div className="text-xs text-gray-400 uppercase">
                  {segment.type === "global"
                    ? "Événement mondial"
                    : segment.type === "event"
                    ? "Événement spécial"
                    : "Segment régional"}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Liste des ligues */}
      <div className="flex flex-col gap-4">
        {selectedSegment?.leagues.length ? (
          selectedSegment.leagues.map((league) => (
            <div key={league.id} className="flex items-center gap-3">
              {league.logo_url && (
                <img src={league.logo_url} className="w-6 h-6 object-contain" alt={league.name} />
              )}
              <span className="text-white font-semibold">{league.name}</span>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-400">Aucune ligue disponible</div>
        )}
      </div>
    </div>
  )
}
