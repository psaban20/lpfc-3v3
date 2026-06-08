import type { PresentGame } from "@/lib/present";

function ScoreOrStatus({ g }: { g: PresentGame }) {
  if (g.status === "final") {
    return (
      <span className="score">
        {g.homeScore}
        <span className="dash">&ndash;</span>
        {g.awayScore}
      </span>
    );
  }
  if (g.status === "forfeit") return <span className="badge b-ff">Forfeit</span>;
  if (g.status === "not_played") return <span className="badge b-np">Not played</span>;
  return <span className="b-sched">{g.time}</span>;
}

function Matchup({ g }: { g: PresentGame }) {
  const home = g.homeReady ? g.homeLabel : <span className="pending">{g.homeLabel}</span>;
  const away = g.awayReady ? g.awayLabel : <span className="pending">{g.awayLabel}</span>;
  return (
    <div>
      {g.stage !== "pool" && <div className="stagelabel">{g.stageLabel}</div>}
      <div className="matchup">
        {home}
        <span className="vs">vs</span>
        {away}
      </div>
      {g.winnerLabel && <div className="winnerline">&rarr; {g.winnerLabel} advances</div>}
    </div>
  );
}

export default function GameList({ games }: { games: PresentGame[] }) {
  return (
    <div className="card games">
      {games.map((g) => (
        <div className="game" key={g.id}>
          <span className="time">{g.time}</span>
          <Matchup g={g} />
          <ScoreOrStatus g={g} />
        </div>
      ))}
    </div>
  );
}
