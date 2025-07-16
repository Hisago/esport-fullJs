// src/components/Topbar.tsx
import React, { useRef } from "react"
import SegmentDropdown from "./Lol/SegmentDropdown"
import { useSegment } from "@/Context/SegmentContext"

const Topbar = () => {
  const [isHovering, setIsHovering] = React.useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { selectedSegment, setSelectedSegment } = useSegment()

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
    setIsHovering(false)
  }

  return (
    <div className="bg-zinc-900 text-white px-6 py-3 flex items-center w-full relative z-40">
      {/* Bloc de survol uniquement sur "Segments" */}
      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className="cursor-pointer text-lg font-semibold">Segments</span>
        {isHovering && (
          <div className="absolute top-full left-0 mt-2 z-50">
            <SegmentDropdown onSelectSegment={handleSelectSegment} />
          </div>
        )}
      </div>
    </div>
  )
}

export default Topbar
