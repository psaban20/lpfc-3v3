export default function Masthead({ live = false }: { live?: boolean }) {
  return (
    <header className="masthead">
      <div className="masthead-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="crest" src="/logo.png" alt="LaPorte FC crest" />
        <div>
          <h1>3v3 Tournament</h1>
          <div className="sub">LaPorte FC &middot; Kesling Park</div>
        </div>
        {live && (
          <span className="live">
            <span className="dot" /> Live
          </span>
        )}
      </div>
    </header>
  );
}
