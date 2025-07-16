import MatchCard from "./MatchCard";
import { Match } from "@/types/lol";
import { motion } from "framer-motion";

interface Props {
  leagueName: string
  matches: Match[]
}

const LeagueSection: React.FC<Props> = ({ leagueName, matches }) => {
  return (
    <div className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">{leagueName}</h2>
      <div className="grid gap-4">
        {matches.map((match, index) => (
          <motion.div
            key={match.match_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <MatchCard key={match.match_id} match={match} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default LeagueSection
