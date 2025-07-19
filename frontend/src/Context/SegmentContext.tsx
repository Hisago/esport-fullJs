import React, { createContext, useContext, useState } from 'react'

export type SegmentContextType = {
  selectedSegment: string | null
  setSelectedSegment: (segment: string | null) => void
  viewMode: 'segments' | 'leagues'
  setViewMode: (mode: 'segments' | 'leagues') => void
}

const SegmentContext = createContext<SegmentContextType | undefined>(undefined)

export const SegmentProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'segments' | 'leagues'>('segments')

  return (
    <SegmentContext.Provider value={{ selectedSegment, setSelectedSegment, viewMode, setViewMode }}>
      {children}
    </SegmentContext.Provider>
  )
}

export const useSegment = () => {
  const context = useContext(SegmentContext)
  if (!context) throw new Error('useSegment must be used within a SegmentProvider')
  return context
}
