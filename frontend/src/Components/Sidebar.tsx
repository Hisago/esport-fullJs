import { Link } from "react-router-dom"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import clsx from "clsx"

type SidebarProps = {
  currentPage: string
}

const games = [
  { name: "League of Legends", slug: "league-of-legends", icon: "🧙‍♂️" },
  { name: "Counter-Strike", slug: "counter-strike", icon: "🔫" },
  { name: "Dota 2", slug: "dota-2", icon: "🧟‍♂️" },
  { name: "Valorant", slug: "valorant", icon: "🎯" },
  { name: "Overwatch", slug: "overwatch", icon: "🛡️" },
  { name: "Rocket League", slug: "rocket-league", icon: "⚽" },
]

export default function Sidebar({ currentPage }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={clsx(
        "h-screen bg-[#15151D] overflow-hidden border-r border-gray-800 text-white transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4">
        <h2
          className={clsx(
            "text-lg font-bold whitespace-nowrap transition-all duration-300",
            collapsed ? "hidden" : ""
          )}
        >
          My Esport
        </h2>{" "}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all cursor-pointer"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="space-y-2 px-2">
        {games.map((game) => (
          <Link
            key={game.slug}
            to={`/${game.slug}`}
            className={clsx(
              "flex items-center gap-3 px-3 whitespace-nowrap py-2 rounded-md transition-all duration-200",
              currentPage === game.slug
                ? "bg-green-900 text-green-400 shadow-lg"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
          >
            <span className="text-xl">{game.icon}</span>
            {!collapsed && (
              <span
                className={clsx(
                  "font-medium transition-all",
                  collapsed ? "opacity-0" : "opacity-100"
                )}
              >
                {game.name}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
