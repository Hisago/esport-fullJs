import React, { useEffect, useState } from "react"
import axios from "axios"

type Game = {
  id: number
  name: string
  slug: string
  teams: { id: number; name: string }[]
}

function App() {
  const [games, setGames] = useState<Game[]>([])

  useEffect(() => {
    axios
      .get("http://localhost:3001/api/games")
      .then((res) => setGames(res.data))
  }, [])

  return (
    <div>
      <h1>Esport Games</h1>
      <ul>
        {games.map((g) => (
          <li key={g.id}>
            {g.name} ({g.slug}) - {g.teams.length} teams
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
