import { Standing } from '@/types/lol'

type Props = {
  standings: Standing[]
}

export default function TournamentStandings({ standings }: Props) {
  return (
    <div className="w-full max-w-xs rounded-xl bg-zinc-900 p-4 text-white shadow">
      <h2 className="mb-4 text-lg font-bold">🏆 Classement</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-700 text-sm text-zinc-400">
            <th className="py-1 text-left">#</th>
            <th className="py-1 text-left">Équipe</th>
            <th className="py-1 text-center">V</th>
            <th className="py-1 text-center">D</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team, index) => (
            <tr key={team.team_id} className="border-b border-zinc-800 hover:bg-zinc-800">
              <td className="py-1 text-sm font-medium">{index + 1}</td>
              <td className="py-1 text-sm">{team.name}</td>
              <td className="py-1 text-center">
                <span className="text-base font-bold text-green-400">{team.wins}</span>
              </td>
              <td className="py-1 text-center">
                <span className="text-base font-bold text-red-400">{team.losses}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
