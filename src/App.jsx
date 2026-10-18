import { useEffect, useRef, useState } from 'react'
import {
  FiGithub, FiBookOpen, FiMic, FiHome, FiMusic, FiTv, FiMonitor,
  FiFolder, FiClock, FiZap, FiCpu, FiShield, FiVolume2, FiArrowRight,
  FiPlay, FiRotateCcw, FiCheck, FiDatabase, FiGitBranch, FiCoffee,
} from 'react-icons/fi'

/* -----------------------------------------------------------------------------
 *  EDIT ME. Copy and links. Repo/docs are private for now, so they point at '#'.
 *  The tool-call JSON and read_only/write verdicts below mirror the real
 *  shapes JARVIS writes to logs/audit.jsonl.
 * -------------------------------------------------------------------------- */
const LINKS = {
  github: 'https://github.com/AKAAKS/personal-assistant',
  docs: 'https://github.com/AKAAKS/personal-assistant#readme',
}

// Each command expands into the real pipeline: heard → routed → tool call(s)
// → guard verdict → result → spoken reply.
const COMMANDS = [
  {
    label: 'Play Die For You by The Weeknd',
    heard: 'play die for you by the weeknd',
    route: { tier: 'claude-haiku-4-5', why: 'media command · low complexity → cheap tier' },
    calls: [
      {
        tool: 'spotify_search',
        input: { query: 'Die For You The Weeknd', search_type: 'track' },
        verdict: 'read_only',
        result: '1 result → spotify:track:2Oehrcv4Kov0SuIgWyQY9e  (Die For You by The Weeknd)',
      },
      {
        tool: 'spotify_play',
        input: { uri: 'spotify:track:2Oehrcv4Kov0SuIgWyQY9e' },
        verdict: 'write',
        result: 'Now playing Die For You by The Weeknd on AK-LAPTOP.',
      },
    ],
    reply: 'Playing Die For You by The Weeknd.',
  },
  {
    label: 'Open Firefox on my PC',
    heard: 'open firefox on my pc',
    route: { tier: 'claude-haiku-4-5', why: 'single device action → cheap tier' },
    calls: [
      { tool: 'launch_app', input: { target: 'firefox' }, verdict: 'write', result: 'Launched firefox.' },
    ],
    reply: 'Firefox is open.',
  },
  {
    label: 'Dim the living room to 30%',
    heard: 'dim the living room lights to thirty percent',
    route: { tier: 'claude-haiku-4-5', why: 'Home Assistant action → cheap tier' },
    calls: [
      {
        tool: 'control_light',
        input: { target: 'living room', brightness_pct: 30 },
        verdict: 'write',
        result: 'Set Living Room to 30%.',
      },
    ],
    reply: 'Living room is at 30%.',
  },
  {
    label: 'Remind me to clean the bathroom at 11pm',
    heard: 'remind me to clean the bathroom at eleven pm',
    route: { tier: 'claude-sonnet-5', why: 'date/time reasoning → escalated tier' },
    calls: [
      {
        tool: 'set_reminder',
        input: { text: 'clean the bathroom', due: '2026-07-15T23:00' },
        verdict: 'write',
        result: 'Reminder #3 set for 2026-07-15T23:00.',
      },
    ],
    reply: 'Okay, I’ll remind you to clean the bathroom at 11pm.',
  },
]

// Build the ordered step list for a command.
function buildSteps(cmd) {
  const steps = [
    { kind: 'heard', text: cmd.heard },
    { kind: 'route', tier: cmd.route.tier, why: cmd.route.why },
  ]
  cmd.calls.forEach((c) => {
    steps.push({ kind: 'call', ...c })
    steps.push({ kind: 'verdict', verdict: c.verdict })
    steps.push({ kind: 'result', text: c.result })
  })
  steps.push({ kind: 'reply', text: cmd.reply })
  return steps
}

const INTEGRATIONS = [
  { Icon: FiHome, name: 'Home Assistant', tools: ['control_light', 'control_switch', 'control_media', 'set_thermostat', 'get_device_status', 'list_devices', 'send_notification'], ex: '“Dim the living room to 30%”' },
  { Icon: FiMusic, name: 'Spotify', tools: ['spotify_play', 'spotify_search', 'spotify_now_playing', 'spotify_playback_control', 'spotify_queue', 'spotify_devices'], ex: '“Play Die For You by The Weeknd”' },
  { Icon: FiTv, name: 'Android TV', tools: ['tv_power', 'tv_launch_app', 'tv_open_url', 'tv_search_youtube', 'tv_remote', 'tv_type_text', 'tv_status', 'tv_close_app'], ex: '“Put the F1 highlights on YouTube”' },
  { Icon: FiMonitor, name: 'This PC', tools: ['launch_app', 'close_app', 'open_url_browser', 'list_processes', 'system_info', 'run_script'], ex: '“Open Firefox”' },
  { Icon: FiFolder, name: 'Files', tools: ['search_files', 'read_document'], ex: '“Find my tax PDF and summarize it”' },
  { Icon: FiDatabase, name: 'Memory', tools: ['remember', 'recall'], ex: '“Remember I prefer metric units”' },
  { Icon: FiClock, name: 'Reminders', tools: ['set_reminder', 'list_reminders', 'cancel_reminder'], ex: '“Remind me to clean the bathroom at 11pm”' },
  { Icon: FiGitBranch, name: 'Automations', tools: ['add_trigger_rule', 'list_trigger_rules', 'delete_trigger_rule'], ex: '“If the door opens after 11pm, light the hall”' },
  { Icon: FiCoffee, name: 'Meals', tools: ['log_meal', 'meal_summary', 'export_meals'], ex: '“Log two eggs and toast”' },
  { Icon: FiZap, name: 'Suggestions', tools: ['list_proposals', 'accept_proposal', 'dismiss_proposal'], ex: '“Show suggestions”' },
]

function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const els = ref.current?.querySelectorAll('[data-reveal]') || []
    if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('in')); return }
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
      { threshold: 0.12 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return ref
}

const StageIcon = { heard: FiMic, route: FiGitBranch, call: FiCpu, verdict: FiShield, result: FiZap, reply: FiVolume2 }
const StageLabel = { heard: 'Heard · Whisper STT', route: 'Routed', call: 'Tool call', verdict: 'Security guard', result: 'Result', reply: 'Spoken · TTS' }

function Anatomy() {
  const [active, setActive] = useState(0)
  const [shown, setShown] = useState(0)
  const steps = buildSteps(COMMANDS[active])

  useEffect(() => {
    setShown(0)
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setShown(steps.length); return }
    let i = 0
    const id = setInterval(() => {
      i += 1
      setShown(i)
      if (i >= steps.length) clearInterval(id)
    }, 620)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  return (
    <div className="anatomy">
      <div className="cmd-chips">
        {COMMANDS.map((c, i) => (
          <button
            key={c.label}
            className={`cmd-chip ${i === active ? 'on' : ''}`}
            onClick={() => setActive(i)}
          >
            <FiMic /> {c.label}
          </button>
        ))}
        <button className="cmd-chip replay" onClick={() => setActive(active)} title="Replay">
          <FiRotateCcw /> Replay
        </button>
      </div>

      <div className="pipeline">
        {steps.map((s, i) => {
          const Icon = StageIcon[s.kind]
          const on = i < shown
          return (
            <div className={`stage ${s.kind} ${on ? 'in' : ''}`} key={i}>
              <div className="stage-rail"><span className="stage-ico"><Icon /></span></div>
              <div className="stage-body">
                <div className="stage-label">{StageLabel[s.kind]}</div>
                {s.kind === 'heard' && <div className="stage-heard">“{s.text}”</div>}
                {s.kind === 'route' && (
                  <div className="stage-route">
                    → <code>{s.tier}</code> <span className="muted">· {s.why}</span>
                  </div>
                )}
                {s.kind === 'call' && (
                  <pre className="stage-json">{`${s.tool}(${JSON.stringify(s.input, null, 2)})`}</pre>
                )}
                {s.kind === 'verdict' && (
                  <div className={`verdict ${s.verdict}`}>
                    <FiShield /> Allowed ({s.verdict})
                    <span className="muted">
                      {s.verdict === 'read_only' ? ' · safe, auto-passed' : ' · changes state, policy-checked'}
                    </span>
                  </div>
                )}
                {s.kind === 'result' && <div className="stage-result"><FiCheck /> {s.text}</div>}
                {s.kind === 'reply' && (
                  <div className="stage-reply">
                    <span className="wave"><i></i><i></i><i></i><i></i><i></i></span>
                    “{s.text}” <span className="muted">· say “hey jarvis” to cut in</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function App() {
  const ref = useReveal()
  return (
    <div ref={ref}>
      <header className="nav">
        <div className="container nav-inner">
          <a className="brand" href="#top"><span className="brand-mark"><FiMic /></span> JARVIS</a>
          <nav className="nav-links">
            <a href="#anatomy">Anatomy</a>
            <a href="#map">Integrations</a>
            <a href="#start">Get started</a>
          </nav>
          <a className="btn btn-dark" href={LINKS.github} target="_blank" rel="noreferrer"><FiGithub /> GitHub</a>
        </div>
      </header>

      {/* HERO */}
      <section className="hero" id="top">
        <div className="container hero-inner" data-reveal>
          <div className="orb" aria-hidden="true">
            <span className="orb-ring r3" />
            <span className="orb-ring r2" />
            <span className="orb-ring r1" />
            <span className="orb-core" />
            <span className="orb-wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
          </div>
          <span className="pill"><FiMic /> Always-on daemon · Claude tool-use</span>
          <h1 className="hero-h1">I said “play Die For You.”<br /><span className="grad">It did the rest.</span></h1>
          <p className="hero-sub">
            JARVIS is a personal assistant I built on Claude’s tool-use loop. It hears a plain-language
            request, routes it to the cheapest capable model, calls the right tool across my home, music,
            TV and PC, then speaks back, and you can cut in any time. Here’s what happens when you talk to it.
          </p>
          <div className="cta-row">
            <a className="btn btn-accent" href="#anatomy"><FiPlay /> See a command run</a>
            <a className="btn btn-ghost" href={LINKS.github} target="_blank" rel="noreferrer"><FiGithub /> View on GitHub</a>
          </div>
          <div className="stack">
            {['Python', 'Claude (Haiku + Sonnet)', 'local Ollama tier', 'Whisper STT', 'Home Assistant', '41 tools'].map((t) => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>

          <figure className="shot hero-shot">
            <div className="shot-bar"><span /><span /><span /> clients.cli</div>
            <img src="/cli.png" alt="A real JARVIS CLI session: play Die For You, open Firefox, and set a reminder" />
          </figure>
        </div>
      </section>

      {/* ANATOMY */}
      <section className="section alt" id="anatomy">
        <div className="container">
          <div className="section-head" data-reveal>
            <h2 className="section-title">Anatomy of a command</h2>
            <p className="section-sub">
              Pick a command and watch it decompose: the real tool-call JSON, the read-only or write
              guard verdict, and the spoken reply. This is the actual shape logged to <code>audit.jsonl</code>.
            </p>
          </div>
          <div data-reveal><Anatomy /></div>

          <figure className="shot" data-reveal style={{ marginTop: 30, maxWidth: 960, marginInline: 'auto' }}>
            <div className="shot-bar"><span /><span /><span /> logs/audit.jsonl</div>
            <div className="shot-scroll"><img src="/audit.png" alt="JARVIS audit log: each tool call recorded with a read-only or write verdict" /></div>
            <figcaption className="shot-cap">Not a mockup: every tool call JARVIS makes is recorded with a read-only or write security verdict.</figcaption>
          </figure>
        </div>
      </section>

      {/* INTEGRATION MAP */}
      <section className="section" id="map">
        <div className="container">
          <div className="section-head" data-reveal>
            <h2 className="section-title">What it’s wired into</h2>
            <p className="section-sub">One assistant, one conversation, ten surfaces. Every tool below is real.</p>
          </div>

          <div className="hub" data-reveal>
            <span className="hub-core"><FiMic /> JARVIS core · 41 tools</span>
          </div>

          <div className="map-grid">
            {INTEGRATIONS.map((it, i) => (
              <div className="map-card" data-reveal style={{ transitionDelay: `${i * 40}ms` }} key={it.name}>
                <div className="map-head">
                  <span className="map-ico"><it.Icon /></span>
                  <span className="map-name">{it.name}</span>
                  <span className="map-count">{it.tools.length}</span>
                </div>
                <div className="map-tools">
                  {it.tools.map((t) => <code key={t}>{t}</code>)}
                </div>
                <div className="map-ex">{it.ex}</div>
              </div>
            ))}
          </div>

          <figure className="shot" data-reveal style={{ marginTop: 30, maxWidth: 860, marginInline: 'auto' }}>
            <img src="/spotify.png" alt="Spotify playing Die For You by The Weeknd, started by JARVIS" />
            <figcaption className="shot-cap">“Play Die For You by The Weeknd,” and it’s actually playing.</figcaption>
          </figure>
        </div>
      </section>

      {/* GET STARTED */}
      <section className="section alt" id="start">
        <div className="container start-grid">
          <div data-reveal>
            <h2 className="section-title">Run your own</h2>
            <p className="section-sub">
              The brain (<code>jarvisd</code>) binds to localhost and talks to thin voice/CLI clients.
              Add your keys, run, and say “hey jarvis.” Full setup is in the docs.
            </p>
            <div className="cta-row">
              <a className="btn btn-accent" href={LINKS.github} target="_blank" rel="noreferrer"><FiGithub /> View on GitHub</a>
              <a className="btn btn-ghost" href={LINKS.docs} target="_blank" rel="noreferrer"><FiBookOpen /> Documentation</a>
            </div>
          </div>
          <div className="code" data-reveal>
            <div className="code-bar"><span /><span /><span /> setup</div>
            <pre>
{`pip install -r requirements.txt
cp .env.example .env     # ANTHROPIC_API_KEY, HA_TOKEN, ...

python -m jarvisd              # the brain (localhost:8765)
python -m clients.voice_client # "hey jarvis" voice mode`}
            </pre>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <span><FiMic /> JARVIS</span>
          <span>Built by Akshit Kartik · {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  )
}
