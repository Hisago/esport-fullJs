import React, { useRef } from 'react'
import SegmentDropdown from './Lol/SegmentDropdown'
import { useSegment } from '@/Context/SegmentContext'

const Topbar = () => {
  const [isHovering, setIsHovering] = React.useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { selectedSegment, setSelectedSegment, viewMode, setViewMode } = useSegment()

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsHovering(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovering(false)
    }, 200)
  }

  const handleSelectSegment = (segmentId: string) => {
    setSelectedSegment(segmentId)
    setViewMode('segments')
    setIsHovering(false)
  }

  const handleSelectLeagues = () => {
    setSelectedSegment(null)
    setViewMode('leagues')
  }

  return (
    <div className="relative z-40 flex w-full items-center gap-6 bg-zinc-900 px-6 py-3 text-white">
      {/* Bloc de survol uniquement sur "Segments" */}
      <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <span className={`cursor-pointer text-lg font-semibold ${viewMode === 'segments' ? 'underline' : ''}`}>
          Segments
        </span>
        {isHovering && (
          <div className="absolute left-0 top-full z-50 mt-2">
            <SegmentDropdown onSelectSegment={handleSelectSegment} />
          </div>
        )}
      </div>

      {/* Onglet "Toutes les ligues" 
      <div>
        <span
          className={`cursor-pointer text-lg font-semibold ${viewMode === 'leagues' ? 'underline' : ''}`}
          onClick={handleSelectLeagues}
        >
          Autres ligues
        </span>
      </div>*/}
    </div>
  )
}

export default Topbar
