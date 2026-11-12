import Moment from './readout/Readout'
import {
  LINKS, RECORD, SURFACES, TOOL_COUNT, STATS, GUARD, ROUTING, SOLID, GROWING,
} from './data/record'

/* -----------------------------------------------------------------------------
 *  The page is the machine's own record of three things it did.
 *
 *  That one decision answers the questions a page otherwise answers by
 *  default, which is where the generated look comes from:
 *
 *    What is a section?   A turn, or a set of turns, from the logs.
 *    What is a heading?   The same dim grey as the log. Emphasis is weight
 *                         and space; hue is reserved (see below).
 *    What gets colour?    Only what the daemon itself assigns meaning to: a
 *                         permission verdict, a refusal, the on-device tier.
 *                         Nothing decorative is coloured, anywhere.
 *    What is bright?      What I said. The machine's own output is dimmer
 *                         than my speech, which is the correct hierarchy for
 *                         a transcript.
 *    How do sections join? A timestamp. The record is continuous.
 *    What does scroll do?  Advances time through the record, and never
 *                         intercepts the scroll to do it.
 *
 *  There is no background element, no persistent canvas and no WebGL. The
 *  previous version of this page was built around an orb, and every layout
 *  decision in it was downstream of keeping text off the orb.
 *
 *  All copy, links and counts live in src/data/record.js.
 * -------------------------------------------------------------------------- */

function Nav() {
  return (
    <nav className="nav">
      <a className="brand" href="#top">JARVIS</a>
      <div className="nav-links">
        <a href="#bus">The record</a>
        <a href="#reach">Reach</a>
        <a href="#guard">The gate</a>
        <a href="#run">Run it</a>
      </div>
      <a className="nav-src" href={LINKS.github} target="_blank" rel="noreferrer">Source</a>
    </nav>
  )
}

function Hero() {
  return (
    <header className="hero" id="top">
      <h1>
        Ask your smart speaker when your bus leaves.
        <span className="hero-turn">It cannot tell you.</span>
      </h1>
      <p className="hero-lead">
        JARVIS is a daemon running on my own PC, so it has hands on it. It took four tries to find
        the right transit site, then wrote the right one down and has gone straight there since. It
        closed the app I did not want running. It read the mail and put the reply on my clipboard,
        because sending one is not its job.
      </p>
      <p className="hero-sub">
        Every call it makes is permission-checked and written to a log. Everything below is
        transcribed out of those logs.
      </p>
      <div className="hero-acts">
        <a className="act act-go" href="#bus">Read the record</a>
        <a className="act" href={LINKS.github} target="_blank" rel="noreferrer">Source on GitHub</a>
      </div>
    </header>
  )
}

function Reach() {
  return (
    <section className="band" id="reach">
      <p className="kicker"><span className="kicker-n">04</span>And the ordinary things too</p>
      <h2>Everything a speaker already does, it also does</h2>
      <p className="blurb">
        Lights, music, the TV, timers, the shopping it can reach. None of this is the interesting
        part, which is exactly why it is here rather than at the top: it is the floor, not the
        pitch. {TOOL_COUNT} tools across {SURFACES.length} surfaces.
      </p>

      <ul className="surfaces">
        {SURFACES.map((s) => (
          <li key={s.name}>
            <p className="surf-name">{s.name}</p>
            <p className="surf-ex">&ldquo;{s.ex}&rdquo;</p>
            <p className="surf-n">{s.tools.length} {s.tools.length === 1 ? 'tool' : 'tools'}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Guard() {
  return (
    <section className="band" id="guard">
      <p className="kicker"><span className="kicker-n">05</span>How it holds together</p>
      <h2>One gate, four tiers, and a log it cannot skip</h2>
      <p className="blurb">
        The record at the top of this page only exists because of the last item in this list. Every
        tool call writes itself down, with the verdict that let it through.
      </p>

      <ul className="guard-list ruled">
        {GUARD.map((g) => (
          <li key={g.t}>
            <p className="g-t">{g.t}</p>
            <p className="g-d">{g.d}</p>
          </li>
        ))}
      </ul>

      <h3 className="sub">Which model answers</h3>
      <ul className="routing">
        {ROUTING.map((r) => (
          <li key={r.model}>
            <span className={`tier tier-${r.tier}`}>{r.tier === 'local' ? 'on-device' : 'cloud'}</span>
            <span className="r-model">{r.model}</span>
            <span className="r-d">{r.d}</span>
          </li>
        ))}
      </ul>

      <ul className="stats ruled">
        {STATS.map((s) => (
          <li key={s.l}>
            <span className="stat-n">{s.n}</span>
            <span className="stat-l">{s.l}</span>
          </li>
        ))}
      </ul>

      <div className="honest">
        <div>
          <h3 className="sub">Solid</h3>
          <ul className="plain">
            {SOLID.map((x) => (
              <li key={x.t}><b>{x.t}</b><span>{x.d}</span></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="sub">Still growing</h3>
          <ul className="plain">
            {GROWING.map((x) => (
              <li key={x.t}><b>{x.t}</b><span>{x.d}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function Run() {
  return (
    <section className="band band-run" id="run">
      <p className="kicker"><span className="kicker-n">06</span>Run it</p>
      <h2>Two processes, one machine</h2>
      <pre className="cmd">
        <code>{`git clone https://github.com/AKAAKS/personal-assistant
cd personal-assistant
pip install -r requirements.txt

python -m jarvisd          # the brain
python -m clients.voice_client   # the ears`}</code>
      </pre>
      <p className="blurb">
        It needs a Windows PC, an Anthropic API key, and whichever of the {SURFACES.length} surfaces
        you actually want. The WebSocket stays on localhost. Setup, configuration and the security
        model are all in the repo.
      </p>
      <a className="act act-go" href={LINKS.github} target="_blank" rel="noreferrer">
        Source on GitHub
      </a>
    </section>
  )
}

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        {RECORD.map((m) => (
          <Moment key={m.id} m={m} />
        ))}
        <Reach />
        <Guard />
        <Run />
      </main>
      <footer className="foot">
        <span>JARVIS</span>
        <span>Built by Akshit Kartik</span>
        <a href={LINKS.github} target="_blank" rel="noreferrer">GitHub</a>
      </footer>
    </>
  )
}
