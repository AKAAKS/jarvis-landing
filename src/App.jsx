import { useEffect, useRef, useState } from 'react'
import {
  FiGithub, FiMic, FiHome, FiMusic, FiTv, FiMonitor,
  FiFolder, FiClock, FiZap, FiCpu, FiShield, FiVolume2,
  FiPlay, FiRotateCcw, FiCheck, FiDatabase, FiGitBranch, FiCoffee,
  FiLock, FiActivity, FiDollarSign, FiAlertTriangle,
  FiMail, FiCalendar, FiCloud,
} from 'react-icons/fi'
import Orb from './orb/Orb'
import { useScrollProgress } from './orb/hooks'

/* -----------------------------------------------------------------------------
 *  EDIT ME. Copy and links.
 *  The tool-call JSON and read_only/write verdicts below mirror the real
 *  shapes JARVIS writes to logs/audit.jsonl.
 *
 *  Counts are measured, not estimated. Last verified 2026-11-11 against
 *  personal-assistant@bc914ea (master):
 *    tests  1092  — `python -m pytest --collect-only -q`; full run is
 *                   1092 passing (a local run shows 3 failures only when the
 *                   live daemon already holds 127.0.0.1:8765)
 *    tools    72  — sum of len(TOOLS) over jarvisd/tools/*.py, imported.
 *                   Do NOT grep for '"name":' — nested JSON-schema properties
 *                   also carry a name key and that overcounts to 88.
 *    surfaces 13  — the INTEGRATIONS list below; 20 tool modules grouped into
 *                   the surfaces a person would actually name.
 *  Re-measure before changing any of these.
 * -------------------------------------------------------------------------- */
const LINKS = {
  github: 'https://github.com/AKAAKS/personal-assistant',
}

// The reminder demo used to carry a hardcoded date, which quietly went stale
// four months after it was written — on the one section whose whole claim is
// "this is the real shape logged to audit.jsonl". Computed instead, so tonight
// is always tonight.
const TONIGHT_11PM = (() => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T23:00`
})()

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
        input: { text: 'clean the bathroom', due: TONIGHT_11PM },
        verdict: 'write',
        result: `Reminder #3 set for ${TONIGHT_11PM}.`,
      },
    ],
    reply: 'Okay, I’ll remind you to clean the bathroom at 11pm.',
  },
]

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

// Every name below is copied from jarvisd/tools/*.py on master. The surfaces
// group the 20 tool modules the way a person would name them — "This PC" is
// system + terminal + clipboard, "Meals" is the whole nutrition stack
// (meals + food + pantry + meal_log + suggest + prep).
// The tool counts here sum to 72; the STATS row must agree.
const INTEGRATIONS = [
  { Icon: FiHome, name: 'Home Assistant', tools: ['list_devices', 'get_device_status', 'control_light', 'control_switch', 'control_media', 'set_thermostat', 'send_notification'], ex: '“Dim the living room to 30%”' },
  { Icon: FiMusic, name: 'Spotify', tools: ['spotify_search', 'spotify_play', 'spotify_playback_control', 'spotify_queue', 'spotify_now_playing', 'spotify_devices'], ex: '“Play Die For You by The Weeknd”' },
  { Icon: FiTv, name: 'Android / Google TV', tools: ['tv_launch_app', 'tv_close_app', 'tv_remote', 'tv_type_text', 'tv_open_url', 'tv_search_youtube', 'tv_status', 'tv_power'], ex: '“Put the F1 highlights on YouTube”' },
  { Icon: FiMonitor, name: 'This PC', tools: ['launch_app', 'close_app', 'list_processes', 'open_url_browser', 'system_info', 'open_terminal', 'run_command', 'scan_unsaved_work', 'system_power', 'get_clipboard', 'set_clipboard'], ex: '“Open Firefox”' },
  { Icon: FiCoffee, name: 'Meals & pantry', tools: ['log_meal', 'log_estimated_meal', 'day_status', 'meal_summary', 'meal_trends', 'set_nutrition_targets', 'export_meals', 'lookup_food', 'pantry_add', 'pantry_list', 'pantry_set_quantity', 'pantry_remove', 'check_dish', 'suggest_meals', 'plan_prep', 'cook_meal', 'list_planned_meals'], ex: '“Log two eggs and toast”' },
  { Icon: FiClock, name: 'Reminders', tools: ['set_reminder', 'set_timer', 'list_reminders', 'cancel_reminder'], ex: '“Remind me to clean the bathroom at 11pm”' },
  { Icon: FiMail, name: 'Gmail', tools: ['gmail_search', 'gmail_read', 'gmail_draft'], ex: '“Did the landlord reply?”' },
  { Icon: FiCalendar, name: 'Calendar', tools: ['calendar_list_events', 'calendar_get_day', 'calendar_create_event', 'calendar_delete_event'], ex: '“What’s on tomorrow?”' },
  { Icon: FiGitBranch, name: 'Automations', tools: ['add_trigger_rule', 'list_trigger_rules', 'delete_trigger_rule'], ex: '“If the door opens after 11pm, light the hall”' },
  { Icon: FiFolder, name: 'Files', tools: ['search_files', 'read_document', 'run_script'], ex: '“Find my tax PDF and summarize it”' },
  { Icon: FiZap, name: 'Suggestions', tools: ['list_proposals', 'accept_proposal', 'dismiss_proposal'], ex: '“Show suggestions”' },
  { Icon: FiDatabase, name: 'Memory', tools: ['remember', 'recall'], ex: '“Remember I prefer metric units”' },
  { Icon: FiCloud, name: 'Weather', tools: ['get_weather'], ex: '“Do I need a coat?”' },
]

const TOOL_COUNT = INTEGRATIONS.reduce((n, i) => n + i.tools.length, 0) // 72

const LISTEN = [
  { Icon: FiMic, t: 'Wake word', d: '“hey jarvis”, detected locally with openWakeWord. Nothing leaves the room until it fires.' },
  { Icon: FiActivity, t: 'Speech', d: 'Whisper STT turns what you said into text on-device.' },
  { Icon: FiVolume2, t: 'Voice', d: 'Offline-first SAPI5 by default; neural edge-tts when there’s a connection.' },
  { Icon: FiZap, t: 'Barge-in', d: 'Talk over it mid-sentence and it stops, listens, and re-plans.' },
  { Icon: FiRotateCcw, t: 'Follow-up', d: 'A hands-free window after each reply, so you can keep going.' },
  { Icon: FiCpu, t: 'Persona', d: 'Dry, brief and literal.' },
]

const GUARD = [
  { Icon: FiLock, t: 'One choke-point', d: 'Every tool call funnels through a single guard before it runs.' },
  { Icon: FiShield, t: 'Four permission tiers', d: 'read_only · write · destructive · forbidden. Today that’s 24 read-only tools, 34 write, 4 destructive.' },
  { Icon: FiRotateCcw, t: 'Turn-bounded confirmation', d: 'The model can’t approve its own destructive call inside one loop, which closes a live prompt-injection hole.' },
  { Icon: FiDollarSign, t: 'Financial block', d: 'Money and transfer keywords are denied outright, never negotiated.' },
  { Icon: FiFolder, t: 'Fenced access', d: 'File access is allowlisted; shell commands run against a denylist.' },
  { Icon: FiMail, t: 'Gmail reads and drafts', d: 'It can search, read and draft. It cannot send.' },
  { Icon: FiDatabase, t: 'Append-only audit', d: 'Every call is logged with its verdict to audit.jsonl.' },
]

const SOLID = [
  { t: '1,092 tests passing', d: 'The loop, the router, every integration, and the guard are covered.' },
  { t: 'Offline-first voice', d: 'Wake, STT, TTS and a local Ollama tier work with no internet.' },
  { t: 'The security gate', d: 'Audited, turn-bounded and fail-closed, not bolted on after.' },
  { t: 'Cost-engineered', d: 'Cheapest capable model per request, under a hard $20/month cap.' },
]

const GROWING = [
  { t: 'One machine', d: 'Runs on a single Windows PC today; multi-host is future work.' },
  { t: 'Loopback only', d: 'The WebSocket has no auth, so it stays bound to localhost, not the network.' },
  { t: 'Voice barge-in', d: 'Interruption works, but it lives on a branch awaiting a live-mic acceptance pass.' },
  { t: 'Pi voice-satellite', d: 'A remote mic puck is design intent, not shipped.' },
]

const STATS = [
  { n: '1,092', l: 'tests' },
  { n: String(TOOL_COUNT), l: 'tools' },
  { n: String(INTEGRATIONS.length), l: 'surfaces' },
  { n: '$20', l: '/ month cap' },
]

const StageIcon = { heard: FiMic, route: FiGitBranch, call: FiCpu, verdict: FiShield, result: FiZap, reply: FiVolume2 }
const StageLabel = { heard: 'Heard · Whisper STT', route: 'Routed', call: 'Tool call', verdict: 'Security guard', result: 'Result', reply: 'Spoken · TTS' }

function Anatomy() {
  const [active, setActive] = useState(0)
  const [shown, setShown] = useState(0)
  // Replay used to be setActive(active). React bails out when state is set to an
  // identical value, so the effect below never re-ran and the button did nothing.
  // The nonce gives the effect something that always changes.
  const [replay, setReplay] = useState(0)
  // The pipeline is ~14 steps at 620ms, so it used to finish ~9s before a reader
  // could scroll to it and they arrived at a static list. Hold until it's seen.
  const [seen, setSeen] = useState(false)
  const hostRef = useRef(null)
  const steps = buildSteps(COMMANDS[active])

  useEffect(() => {
    const el = hostRef.current
    if (!el) return
    if (!('IntersectionObserver' in window)) { setSeen(true); return }
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { setSeen(true); io.disconnect() }
    }, { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!seen) return
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
  }, [active, replay, seen])

  return (
    <div className="anatomy" ref={hostRef}>
      <div className="cmd-chips">
        {COMMANDS.map((c, i) => (
          <button key={c.label} className={`cmd-chip ${i === active ? 'on' : ''}`} onClick={() => setActive(i)}>
            <FiMic /> {c.label}
          </button>
        ))}
        <button className="cmd-chip replay" onClick={() => setReplay((n) => n + 1)} title="Replay">
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
                  <div className="stage-route">→ <code>{s.tier}</code> <span className="muted">· {s.why}</span></div>
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

/* useReveal() used to live here: an IntersectionObserver over every panel that
 * added a class to fade each one up 22px over 0.7s on scroll. It is gone, not
 * disabled — the effect carried no meaning, delayed the content behind an
 * animation nobody asked for, and the orb moving between beats is already the
 * page's motion. Deleting it also takes an observer over seven panels off the
 * scroll path. */

function Beat({ id, align = 'center', bare = false, eyebrow, children }) {
  return (
    <section className={`beat beat-${align}`} id={id}>
      <div className={`panel ${bare ? 'bare' : ''}`}>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        {children}
      </div>
    </section>
  )
}

const BEAT_IDS = ['top', 'listen', 'act', 'reach', 'guard', 'state', 'open']

function useActiveBeat() {
  const beatRef = useRef(0)
  useEffect(() => {
    let raf = 0
    const measure = () => {
      raf = 0
      const mid = window.innerHeight / 2
      let best = 0, bd = Infinity
      BEAT_IDS.forEach((id, i) => {
        const el = document.getElementById(id)
        if (!el) return
        const r = el.getBoundingClientRect()
        const d = Math.abs(r.top + r.height / 2 - mid)
        if (d < bd) { bd = d; best = i }
      })
      beatRef.current = best
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(measure) }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return beatRef
}

export default function App() {
  const progressRef = useScrollProgress()
  const beatRef = useActiveBeat()
  return (
    <div className="page">
      <div className="page-bg" />
      <Orb progressRef={progressRef} beatRef={beatRef} />

      <header className="nav">
        <div className="container nav-inner">
          <a className="brand" href="#top"><span className="brand-mark"><FiMic /></span> JARVIS</a>
          <nav className="nav-links">
            <a href="#act">The loop</a>
            <a href="#reach">Reach</a>
            <a href="#guard">The gate</a>
            <a href="#open">Run it</a>
          </nav>
          <a className="btn btn-dark" href={LINKS.github} target="_blank" rel="noreferrer"><FiGithub /> GitHub</a>
        </div>
      </header>

      {/* 00 — HERO */}
      <Beat id="top" align="center" bare>
        <span className="pill"><FiMic /> Always‑on daemon · Claude tool‑use</span>
        <h1 className="hero-h1">I talk to my house<br /><span className="grad">and it answers.</span></h1>
        <p className="lead">
          JARVIS is a daemon on Claude’s tool-use loop that runs my lights, music, TV and PC by voice.
          Every request picks the cheapest model that can handle it, passes a security gate that can
          refuse it, and speaks the result back. You can cut in mid-sentence.
        </p>
        <div className="cta-row center">
          <a className="btn btn-accent" href="#act"><FiPlay /> See a command run</a>
          <a className="btn btn-ghost" href={LINKS.github} target="_blank" rel="noreferrer"><FiGithub /> View on GitHub</a>
        </div>
        <div className="stack">
          {['Python', 'Claude (Haiku + Sonnet)', 'local Ollama tier', 'Whisper STT', 'Home Assistant', `${TOOL_COUNT} tools`].map((t) => (
            <span key={t} className="tag">{t}</span>
          ))}
        </div>
      </Beat>

      {/* 01 — LISTEN */}
      <Beat id="listen" align="left" eyebrow="01 — Voice">
        <h2 className="beat-h2">It listens, and you can cut in.</h2>
        <p className="beat-sub">
          Wake word, speech and the default voice all run on the machine. Nothing is sent anywhere
          until “hey jarvis” fires.
        </p>
        <div className="feat-grid">
          {LISTEN.map((f) => (
            <div className="feat" key={f.t}>
              <span className="feat-ico"><f.Icon /></span>
              <div><div className="feat-t">{f.t}</div><div className="feat-d">{f.d}</div></div>
            </div>
          ))}
        </div>
      </Beat>

      {/* 02 — ACT */}
      <Beat id="act" align="wide" eyebrow="02 — The loop">
        <h2 className="beat-h2">Hears you. Picks the cheapest model that can do it. Acts.</h2>
        <p className="beat-sub">
          Every request runs the same loop: route to the cheapest capable tier (local Ollama → Haiku →
          Sonnet) under a hard $20/month budget, call the right tools, speak the result. Pick a command
          and watch it decompose into the shape JARVIS writes to <code>audit.jsonl</code>.
        </p>
        <Anatomy />
        <figure className="shot">
          <div className="shot-bar"><span /><span /><span /> clients.cli</div>
          <img src="/cli.png" loading="lazy" decoding="async" width="745" height="285" alt="A real JARVIS CLI session: play Die For You, open Firefox, and set a reminder" />
          <figcaption className="shot-cap">A real session — not a mockup.</figcaption>
        </figure>
      </Beat>

      {/* 03 — REACH */}
      <Beat id="reach" align="wide" eyebrow="03 — Reach">
        <h2 className="beat-h2">One conversation. Every surface.</h2>
        <p className="beat-sub">
          {TOOL_COUNT} tools across {INTEGRATIONS.length} surfaces. Every name below is a tool in the
          registry, spelled the way the code spells it.
        </p>
        <div className="map-grid">
          {INTEGRATIONS.map((it) => (
            <div className="map-card" key={it.name}>
              <div className="map-head">
                <span className="map-ico"><it.Icon /></span>
                <span className="map-name">{it.name}</span>
                <span className="map-count">{it.tools.length}</span>
              </div>
              <div className="map-tools">{it.tools.map((t) => <code key={t}>{t}</code>)}</div>
              <div className="map-ex">{it.ex}</div>
            </div>
          ))}
        </div>
        <figure className="shot narrow">
          <img src="/spotify.jpg" loading="lazy" decoding="async" width="1520" height="851" alt="Spotify playing Die For You by The Weeknd, started by JARVIS" />
          <figcaption className="shot-cap">“Play Die For You by The Weeknd,” and it’s actually playing.</figcaption>
        </figure>
      </Beat>

      {/* 04 — GUARD */}
      <Beat id="guard" align="right" eyebrow="04 — The gate">
        <h2 className="beat-h2">Every action goes through one gate.</h2>
        <p className="beat-sub">
          An assistant that can act on your behalf needs a choke-point. JARVIS has exactly one, and
          everything funnels through it.
        </p>
        <div className="feat-grid">
          {GUARD.map((f) => (
            <div className="feat" key={f.t}>
              <span className="feat-ico"><f.Icon /></span>
              <div><div className="feat-t">{f.t}</div><div className="feat-d">{f.d}</div></div>
            </div>
          ))}
        </div>
        <figure className="shot">
          <div className="shot-bar"><span /><span /><span /> logs/audit.jsonl</div>
          <div className="shot-scroll"><img src="/audit.png" loading="lazy" decoding="async" width="1905" height="375" alt="JARVIS audit log: each tool call recorded with a read-only or write verdict" /></div>
          <figcaption className="shot-cap">Every tool call, recorded with its verdict.</figcaption>
        </figure>
      </Beat>

      {/* 05 — STATE */}
      <Beat id="state" align="wide" eyebrow="05 — Honest state">
        <h2 className="beat-h2">What’s solid, and what’s still growing.</h2>
        <div className="stat-row">
          {STATS.map((s) => (
            <div className="stat" key={s.l}><div className="stat-n">{s.n}</div><div className="stat-l">{s.l}</div></div>
          ))}
        </div>
        <div className="two-col">
          <div className="col-card solid">
            <div className="col-head"><FiCheck /> Solid</div>
            {SOLID.map((x) => (
              <div className="col-row" key={x.t}><div className="col-t">{x.t}</div><div className="col-d">{x.d}</div></div>
            ))}
          </div>
          <div className="col-card growing">
            <div className="col-head"><FiAlertTriangle /> Still growing</div>
            {GROWING.map((x) => (
              <div className="col-row" key={x.t}><div className="col-t">{x.t}</div><div className="col-d">{x.d}</div></div>
            ))}
          </div>
        </div>
      </Beat>

      {/* 06 — OPEN */}
      <Beat id="open" align="center" eyebrow="06 — Run it">
        <h2 className="beat-h2">Run your own.</h2>
        <p className="lead">
          The brain (<code>jarvisd</code>) binds to localhost and talks to thin voice and CLI clients.
          Add your keys, run it, and say “hey jarvis.” It’s MIT-licensed.
        </p>
        <div className="code">
          <div className="code-bar"><span /><span /><span /> setup</div>
          <pre>
{`pip install -r requirements.txt
cp .env.example .env     # ANTHROPIC_API_KEY, HA_TOKEN, ...

python -m jarvisd              # the brain (localhost:8765)
python -m clients.voice_client # "hey jarvis" voice mode`}
          </pre>
        </div>
        <div className="cta-row center">
          <a className="btn btn-accent" href={LINKS.github} target="_blank" rel="noreferrer"><FiGithub /> View on GitHub</a>
        </div>
      </Beat>

      <footer className="footer">
        <div className="container footer-inner">
          <span className="brand"><span className="brand-mark"><FiMic /></span> JARVIS</span>
          <span className="muted">Built by Akshit Kartik · {new Date().getFullYear()} · MIT</span>
        </div>
      </footer>
    </div>
  )
}
