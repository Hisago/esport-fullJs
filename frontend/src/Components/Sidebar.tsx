import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

type SidebarProps = {
  currentPage: string
}

const games = [
  {
    name: 'League of Legends',
    slug: 'league-of-legends',
    icon: '/img/lol.png'
  },
  {
    name: 'Counter-Strike (a venir)',
    slug: 'counter-strike',
    icon: '/img/cs.png'
  }
]

export default function Sidebar({ currentPage }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={clsx(
        'flex h-screen flex-col overflow-hidden border-r border-gray-800 bg-[#15151D] text-white transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between p-4">
        <h2
          className={clsx('whitespace-nowrap text-lg font-bold transition-all duration-300', collapsed ? 'hidden' : '')}
        >
          My Esport
        </h2>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-gray-700 bg-gray-800 text-gray-400 transition-all hover:bg-gray-700 hover:text-white"
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
              'flex items-center gap-3 whitespace-nowrap rounded-md px-3 py-2 transition-all duration-200',
              currentPage === game.slug
                ? 'bg-green-900 text-green-400 shadow-lg'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            )}
          >
            <div className="flex h-12 w-12 items-center pl-2">
              <img
                src={game.icon}
                alt={game.name}
                className="h-8 min-h-[2rem] w-8 min-w-[2rem] rounded bg-white object-contain p-1"
                style={{ transition: 'none' }}
              />
            </div>
            {!collapsed && <span className="font-medium transition-opacity duration-200">{game.name}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
