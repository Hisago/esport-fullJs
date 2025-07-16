import React, { createContext, useContext, useState } from "react";

export type SegmentContextType = {
  selectedSegment: string | null;
  setSelectedSegment: (segment: string | null) => void;
};

const SegmentContext = createContext<SegmentContextType | undefined>(undefined);

export const SegmentProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  return (
    <SegmentContext.Provider value={{ selectedSegment, setSelectedSegment }}>
      {children}
    </SegmentContext.Provider>
  );
};

export const useSegment = () => {
  const context = useContext(SegmentContext);
  if (!context) throw new Error("useSegment must be used within a SegmentProvider");
  return context;
};
