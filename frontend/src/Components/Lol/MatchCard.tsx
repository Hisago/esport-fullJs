import { Match } from "@/types/lol";

interface Props {
  match: Match;
}

const MatchCard: React.FC<{ match: Match }> = ({ match }) => {
  const date = new Date(match.date);

  const isFinished = match.status === "finished";
  const isRunning = match.status === "running";
  const isUpcoming = match.status === "not_started" && date > new Date();

  const showScore =
    isFinished &&
    match.score_team1 != null &&
    match.score_team2 != null;

  function getMatchStatusLabel() {
    if (isRunning) return "🔴 En cours";
    if (isFinished) return "✅ Terminé";
    if (isUpcoming) return "🕒 À venir";
    return "⚠️ Non joué";
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-6 py-4 flex items-center justify-between shadow-sm text-black">
      <div className="grid grid-cols-[1fr_auto_auto_auto_1fr] gap-3 items-center flex-1">
        {/* Team 1 name */}
        <span className="text-right font-semibold truncate">
          {match.team1_name}
        </span>

        {/* Team 1 logo */}
        {match.team1_logo && (
          <img
            src={match.team1_logo}
            alt={match.team1_name}
            className="w-8 h-8 object-contain mx-auto"
          />
        )}

        {/* Score */}
        <div className="text-center font-bold text-lg min-w-[60px]">
          {showScore ? `${match.score_team1} - ${match.score_team2}` : "-"}
        </div>

        {/* Team 2 logo */}
        {match.team2_logo && (
          <img
            src={match.team2_logo}
            alt={match.team2_name}
            className="w-8 h-8 object-contain mx-auto"
          />
        )}

        {/* Team 2 name */}
        <span className="text-left font-semibold truncate">
          {match.team2_name}
        </span>
      </div>

      {/* Match status + date */}
      <p className="text-sm text-gray-400 ml-4 whitespace-nowrap">
        {getMatchStatusLabel()} –{" "}
        {date.toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).replace(",", " -")}
      </p>
    </div>
  );
};

export default MatchCard;
