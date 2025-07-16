// src/layouts/AppLayout.tsx
import Sidebar from "@/Components/Sidebar"
import Topbar from "@/Components/Topbar"
import { SegmentProvider } from "@/Context/SegmentContext"

type Props = {
  children: React.ReactNode
  currentPage: string
}

export default function AppLayout({ children, currentPage }: Props) {
  return (
    <div className="flex h-screen bg-white text-black overflow-hidden">
      <Sidebar currentPage={currentPage} />
      <main className="flex-1 flex flex-col relative overflow-y-auto">
        <SegmentProvider>
          {currentPage === "league-of-legends" && <Topbar />}
          <div className="p-6">
            {children}
          </div>
        </SegmentProvider>
      </main>
    </div>
  )
}
