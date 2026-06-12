import Link from "next/link";

export const metadata = {
  title: "Codes of Conduct \u00b7 LaPorte FC 3v3",
  description: "LaPorte FC Coach and Parent & Spectator Codes of Conduct.",
};

export default function ConductPage() {
  return (
    <>
      <header className="masthead">
        <div className="masthead-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="crest" src="/logo.png" alt="LaPorte FC crest" />
          <div>
            <h1>Codes of Conduct</h1>
            <div className="sub">LaPorte FC &middot; Kesling Park &middot; June 13, 2026</div>
          </div>
        </div>
      </header>
      <div className="wrap">
        <p className="backlink">
          <Link href="/">&larr; Back to the tournament</Link>
        </p>

        <div className="notice-wrap">
          <p className="notice">
            <b>Zero tolerance.</b> By attending or participating in any LaPorte FC event, everyone
            &mdash; players, coaches, parents, and spectators &mdash; agrees to abide by these Codes
            of Conduct in addition to the tournament rules. LaPorte FC enforces a zero-tolerance
            policy for Code of Conduct infractions. No warning is required before removal from the
            tournament; the posting of these codes is the warning.
          </p>
        </div>

        <div className="section barred" id="coach">
          <h2>Coach Code of Conduct</h2>
        </div>
        <div className="card conduct-body">
          <p>
            Part of LaPorte FC&rsquo;s mission is to provide a safe environment for our youth
            athletes to thrive and succeed. The adults involved in club events and activities have
            the responsibility and opportunity to create this environment, and at the same time the
            ability to undermine and destroy it. To that end, LaPorte FC&rsquo;s Coach Code of
            Conduct requires your pledge to practice and promote the code itself.
          </p>
          <p>I further understand and accept:</p>
          <ul>
            <li>
              The club has a <b>zero-tolerance</b> policy for yelling, bullying, and mistreating or
              confronting referees, coaches, kids, parents, or any other person volunteering,
              attending, or participating in a club event or activity.
            </li>
            <li>Will manage emotions during the game, avoiding aggressive behavior, profanity, trash-talking, or inappropriate gestures.</li>
            <li>Never intentionally isolate, shame, or single out a player in a destructive or harmful way.</li>
            <li>Will encourage players to play by the rules of the game and exhibit good sportsmanship, and help them accept decisions made by referees without arguing or showing dissent.</li>
            <li>Will demand a sports environment for all participating that is free of drugs, tobacco, and alcohol, and will refrain from their use at all LaPorte FC events.</li>
            <li>Will cooperate with the league in the enforcement of rules and regulations, and will report all suspected violations of any rules, regulations, and/or policies.</li>
          </ul>
          <p>
            I also agree that if I fail to abide by these rules and guidelines, I will be subject to
            disciplinary actions that could include, but are not limited to: a verbal and/or written
            warning from the league, game forfeiture, game suspension, season suspension, and loss
            of future coaching privileges.
          </p>
        </div>

        <div className="section barred" id="parent">
          <h2>Parent &amp; Spectator Code of Conduct</h2>
        </div>
        <div className="card conduct-body">
          <p>
            Part of LaPorte FC&rsquo;s mission is to provide a safe environment for our youth
            athletes to thrive and succeed. The adults involved in club events and activities have
            the responsibility and opportunity to create this environment, and at the same time the
            ability to undermine and destroy it. To that end, LaPorte FC&rsquo;s Code of Conduct
            requires your pledge to practice and promote the code itself.
          </p>
          <p>
            I hereby pledge to provide support, care, and encouragement for my child participating
            in a LaPorte FC program by following the Parental Code of Conduct:
          </p>
          <ul>
            <li>Encourage and support my child&rsquo;s experience and play on the field.</li>
            <li>Encourage good sportsmanship by demonstrating positive support for all players, coaches, and officials at every game and/or practice.</li>
            <li>Never yell at, harass, or argue with referees on or off the field.</li>
            <li>Never engage in any kind of unsportsmanlike conduct with a coach, player, parent, or spectator.</li>
            <li>Under no circumstances will I enter the field of play, unless asked to do so by a referee or coach.</li>
            <li>Will demand a sports environment for my child that is free of drugs, tobacco, and alcohol, and will refrain from their use at all LaPorte FC events.</li>
            <li>Will ensure my child treats other players, coaches, spectators, and referees with respect.</li>
          </ul>
          <p>I further understand and accept:</p>
          <ul>
            <li>The club has a <b>zero-tolerance</b> policy for yelling, bullying, mistreating, or confronting referees, coaches, kids, or any other person volunteering, attending, or participating in a club event or activity.</li>
            <li>Parents or guardians are responsible for their guests&rsquo; behavior and must inform their guests of the applicable rules of conduct, and ensure their guests abide by these rules.</li>
            <li>Any parent, guardian, guest, or spectator who fails to adhere to these standards will be required to leave the playing area, and play will be suspended until they do so.</li>
            <li>LaPorte FC reserves the right to suspend or terminate a player&rsquo;s enrollment for his or her guardian&rsquo;s misconduct or failure to abide by this Code of Conduct.</li>
            <li>LaPorte FC reserves the right to cancel games and practices as a means to enforce this Code of Conduct, without refund.</li>
          </ul>
        </div>

        <div className="footer">
          La Porte Vers Le Futur &middot; <a className="adminlink" href="/">tournament home</a>
        </div>
      </div>
    </>
  );
}
