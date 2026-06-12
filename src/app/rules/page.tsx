import Link from "next/link";

export const metadata = {
  title: "Tournament Rules \u00b7 LaPorte FC 3v3",
  description: "Official rules for the LaPorte FC 3v3 Tournament at Kesling Park.",
};

export default function RulesPage() {
  return (
    <>
      <header className="masthead">
        <div className="masthead-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="crest" src="/logo.png" alt="LaPorte FC crest" />
          <div>
            <h1>Tournament Rules</h1>
            <div className="sub">LaPorte FC 3v3 &middot; Kesling Park &middot; June 13, 2026</div>
          </div>
        </div>
      </header>
      <div className="wrap">
        <p className="backlink"><Link href="/">&larr; Back to the tournament</Link></p>

        <div className="card info">
          <p className="info-lead">All matches are played under the FIFA Laws of the Game, except as modified below. Anything these rules do not cover is left to the sole discretion of the tournament officials, whose decisions are final.</p>
          <div className="conduct-links">
            <a className="linkbtn" href="/field-map.png" target="_blank" rel="noopener">Field Map</a>
          </div>
        </div>

        <div className="section barred"><h2>Players, Rosters &amp; Registration</h2></div>
        <div className="card conduct-body">
          <ul>
            <li>Every team must have a coach at least 18 years old on the sideline at all times.</li>
            <li>All players must appear on the team&rsquo;s registration form before the tournament begins. Falsifying a player&rsquo;s age disqualifies the team. Proof of age (player card, birth certificate, or passport) must be available at check-in.</li>
            <li>Rosters freeze at check-in: 3&ndash;6 players per team, 3 on the field at a time. Fielding more than 6 players in any game disqualifies the team. A player may appear on only one roster per event.</li>
            <li>A team needs at least 2 field players to start or continue a game, or it is a forfeit.</li>
          </ul>
          <p><b>Age divisions:</b> High School Girls (8/1/2006&ndash;7/31/2010) &middot; 6/7/8 (8/1/2010&ndash;7/31/2013) &middot; 4/5 (8/1/2013&ndash;7/31/2015).</p>
        </div>

        <div className="section barred"><h2>Equipment &amp; Field</h2></div>
        <div className="card conduct-body">
          <ul>
            <li>Shin guards and soccer shoes (cleats or flats) are required &mdash; no football or baseball cleats. No jewelry or piercings. Casts may be allowed at the referee&rsquo;s discretion, and hard casts must be padded.</li>
            <li><b>Field:</b> 35 yards long by 20 yards wide. Goals are 4 ft high by 6 ft wide.</li>
            <li><b>Goal box:</b> 8 ft wide by 6 ft deep, directly in front of the goal. Any part of the ball or a player&rsquo;s body on the line counts as inside the box.</li>
          </ul>
        </div>

        <div className="section barred"><h2>Playing Rules</h2></div>
        <div className="card conduct-body">
          <ul>
            <li><b>Goal box:</b> no player may play the ball inside the box, though players may move through it. A defender who touches the ball in the box concedes a penalty kick; an attacker who touches it there gives the defense a goal kick. A ball that comes to rest in the box is a goal kick for the defense.</li>
            <li><b>Scoring:</b> a goal may be scored from a touch on the offensive half of the field.</li>
            <li><b>No offside</b> in 3v3.</li>
            <li><b>No slide tackling.</b> Players may slide to play the ball, but may not make contact with an opponent.</li>
            <li><b>Heading</b> is allowed.</li>
            <li><b>5-yard rule:</b> on all dead balls, defenders must be 5 yards from the ball. If the goal area is closer than 5 yards, the ball is placed 5 yards from the goal-area line.</li>
            <li><b>Kick-ins, not throw-ins:</b> the ball is kicked into play from the sideline and goal line.</li>
            <li><b>Indirect kicks:</b> all kick-ins, free kicks, and kick-offs. <b>Direct kicks:</b> corner kicks and penalty kicks.</li>
            <li><b>Goal kicks</b> may be taken from any point on the end line, outside the goal box.</li>
            <li><b>Penalty kicks</b> are awarded when, in the referee&rsquo;s judgment, an infraction nullified a scoring chance. Taken from midfield with all players behind the halfway line; if no goal is scored, the defense restarts with a goal kick. Penalty kicks are not live balls.</li>
            <li><b>Substitutions</b> may happen on any dead ball, called onto the field by the referee, entering and exiting at midfield only.</li>
            <li><b>Uniforms:</b> teams may wear their own matching jerseys; otherwise LPFC provides pinnies. On a color conflict, the away team (listed second on the schedule) changes or wears pinnies.</li>
          </ul>
        </div>

        <div className="section barred"><h2>Game Duration</h2></div>
        <div className="card conduct-body">
          <p>Two 12-minute halves with a 2-minute halftime, or the first team to lead by 12 goals &mdash; whichever comes first. A coin toss sets direction and possession. No timeouts. Pool-play games tied after regulation end in a tie; playoff games go to overtime. The referee keeps official time and may act against deliberate delay.</p>
        </div>

        <div className="section barred"><h2>Scoring &amp; Seeding</h2></div>
        <div className="card conduct-body">
          <p><b>Points:</b> Win = 3 &middot; Tie = 1 &middot; Loss = 0.</p>
          <p>If teams are level on points after pool play, seeding is decided by the steps below, in order &mdash; the first that separates them settles it.</p>
          <ol>
            <li><b>Head-to-head</b> &mdash; who won the pool game between the tied teams, if they played. Applies when exactly two teams are tied; with three or more level, this step is skipped.</li>
            <li><b>Goal differential</b> &mdash; goals for minus goals against across all pool games.</li>
            <li><b>Fewest goals allowed</b> &mdash; across all pool games.</li>
            <li><b>Most goals scored</b> &mdash; across all pool games.</li>
            <li><b>PK shootout</b> &mdash; three players per team alternate penalty kicks; the higher score after the first round wins. If still tied, the same three continue in sudden death until one team scores unanswered.</li>
          </ol>
          <p><b>Playoff overtime:</b> a sudden-death period of up to 3 minutes (coin toss for direction); the first goal wins. If still scoreless, a shootout decides it (coin toss for order), using the three players on the field at the end of overtime in the same alternating format. If a team finished a player short from a red card, a remaining roster player may take a kick; if none remain, a field player may kick twice.</p>
        </div>

        <div className="section barred"><h2>Forfeits, Protests &amp; Unplayed Games</h2></div>
        <div className="card conduct-body">
          <ul>
            <li><b>Forfeit</b> if a team cannot start within 10 minutes of kickoff, or if an ineligible player participates. A forfeit is scored 4&ndash;0.</li>
            <li><b>No protests.</b> All games are final; referee and tournament-director decisions are final.</li>
            <li><b>Games not played</b> for any reason are recorded as a 0&ndash;0 tie.</li>
          </ul>
        </div>

        <div className="section barred"><h2>Conduct &amp; Discipline</h2></div>
        <div className="card conduct-body">
          <p>Players and coaches must know and play by the Laws of the Game and treat coaches, teammates, opponents, and officials with respect. Profane or abusive language will not be tolerated. This is in addition to the <Link href="/conduct">Codes of Conduct</Link>, which everyone present agrees to.</p>
          <ul>
            <li><b>Yellow cards:</b> two in one game eject the player or coach from that game and suspend them for the next; if the carded player was on the field, the team plays a player short for the rest of that game. Three yellows across the tournament bring a one-game suspension (no exceptions).</li>
            <li><b>Red cards:</b> a referee may eject a player or coach for continued misconduct or a serious incident. The team plays on, a player short if the carded player was on the field. The ejected person is suspended for the next game and must leave the immediate playing area, including spectator and team areas.</li>
            <li><b>Spectators</b> are welcome to cheer positively. Do not coach or address players or officials negatively. Anyone ejected must leave the field area before play resumes, or the game is forfeited. Fighting, unsportsmanlike behavior, or physical violence brings automatic removal from the complex for the remainder of the event.</li>
          </ul>
        </div>

        <div className="section barred"><h2>Weather &amp; Cancellation</h2></div>
        <div className="card conduct-body">
          <p>Tournament officials may modify, shorten, reschedule, or cancel games due to weather or field conditions; no protests are allowed and entry fees are non-refundable. If the tournament is canceled before the first scheduled game, 50% of the entry fee is retained to cover startup costs and 50% is refunded. No refunds are given once the tournament begins, or if a team withdraws after acceptance. LaPorte Futbol Club, the tournament committee, its directors, and staff are not responsible for expenses incurred due to cancellation in whole or part.</p>
          <p className="info-lead" style={{ marginTop: "12px" }}>Situations these rules do not address are left to the sole discretion of the tournament officials.</p>
        </div>

        <div className="footer">La Porte Vers Le Futur &middot; <a className="adminlink" href="/">tournament home</a></div>
      </div>
    </>
  );
}