type Game = {
  id: number
  name: string
  slug: string
}

const GameCard: React.FC<{ game: Game }> = ({ game }) => {
  return (
    <div className="p-4 border rounded shadow-sm hover:shadow-md transition">
      <h3 className="text-xl font-medium">{game.name}</h3>
      <p className="text-sm text-gray-500">Slug: {game.slug}</p>
    </div>
  )
}

export default GameCard
