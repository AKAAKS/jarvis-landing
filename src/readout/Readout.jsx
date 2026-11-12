import { useRef } from 'react'
import { usePlayback } from './usePlayback'

/* A pending figure still reserves its box, so the layout is finished and
 * verifiable before the screenshots exist. Aspect ratios are deliberate: the
 * browser-window shots are 16:10, the terminal shot is wider and shorter. */
function Shot({ shot, on, ratio }) {
  return (
    <figure className={`shot${on ? ' is-on' : ''}`} style={{ aspectRatio: ratio }}>
      {shot.src ? (
        <img src={shot.src} alt={shot.alt} width={shot.w} height={shot.h} loading="lazy" />
      ) : (
        <div className="shot-pending">
          <span className="shot-pending-tag">screenshot pending</span>
          <span className="shot-pending-alt">{shot.alt}</span>
        </div>
      )}
      <figcaption>{shot.cap}</figcaption>
    </figure>
  )
}

function Line({ l, on }) {
  // `gap` is the only line that is not log output: it is the page's own aside
  // between two turns. It gets no timestamp and no source, and it is set in
  // the body face rather than the mono one, so it can never be misread as
  // something the machine printed.
  if (l.k === 'gap') {
    return (
      <p className={`rl rl-gap${on ? ' is-on' : ''}`}>
        <span className="rl-gap-rule" aria-hidden="true" />
        {l.x}
      </p>
    )
  }

  let body
  if (l.k === 'heard') {
    body = (
      <>
        <span className="rl-key">Heard:</span> <span className="rl-said">{l.x}</span>
      </>
    )
  } else if (l.k === 'tool') {
    body = (
      <>
        <span className="rl-tool">{l.tool}</span> <span className="rl-args">{l.x}</span>
      </>
    )
  } else if (l.k === 'verdict') {
    body = <span className={`rl-verdict v-${l.v}`}>{l.x}</span>
  } else {
    body = <span className="rl-plain">{l.x}</span>
  }

  return (
    <p className={`rl rl-${l.k}${on ? ' is-on' : ''}`}>
      <span className="rl-t" aria-hidden={!l.t}>{l.t}</span>
      <span className="rl-src">{l.src}</span>
      <span className="rl-body">{body}</span>
    </p>
  )
}

export default function Moment({ m }) {
  const trackRef = useRef(null)
  const [shown, playing] = usePlayback(trackRef, m.lines.length)

  // Which figures have been reached. A figure is reached when the line that
  // produced it has been revealed.
  const shotOn = m.shots.map((_, si) => {
    const at = m.lines.findIndex((l) => l.shot === si)
    return at === -1 || at < shown
  })

  return (
    <section className="moment" id={m.id}>
      <header className="moment-head">
        <p className="kicker">
          <span className="kicker-n">{m.n}</span>
          {m.kicker}
        </p>
        <h2>{m.title}</h2>
        <p className="blurb">{m.blurb}</p>
      </header>

      <div className="track" ref={trackRef} data-playing={playing || undefined}>
        <div className="stage">
          <div className="readout" role="log" aria-label={`Log record: ${m.title}`}>
            {m.lines.map((l, i) => (
              <Line key={i} l={l} on={!playing || i < shown} />
            ))}
          </div>
          <div className="shots">
            {m.shots.map((s, i) => (
              <Shot key={i} shot={s} on={!playing || shotOn[i]} ratio={m.id === 'pc' ? '16 / 7' : '16 / 10'} />
            ))}
          </div>
        </div>
      </div>

      <footer className="moment-foot">
        <p className="moment-note">{m.note}</p>
        <p className="from">
          Transcribed from {m.from}. Every line is real; nothing on this page shows these two files
          merged except this page.
        </p>
      </footer>
    </section>
  )
}
