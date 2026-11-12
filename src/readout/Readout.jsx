import { useRef } from 'react'
import { usePlayback } from './usePlayback'

/* A pending figure still reserves a box at `ratio`, so the layout is finished
 * and verifiable before a screenshot exists. Once a real image is in, the
 * ratio comes off: the img's own width/height attributes give the intrinsic
 * ratio, and forcing one on the figure as well cropped the image inside
 * `overflow: hidden`. */
function Shot({ shot, ratio }) {
  const pending = !shot.src
  return (
    <figure className="shot is-on" style={pending ? { aspectRatio: ratio } : undefined}>
      {!pending ? (
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
        </div>
      </div>

      {/* The figures sit BELOW the track, in normal flow, not inside the
        * sticky stage. In the stage they shared 100vh with the readout, which
        * capped them at a 286px column -- a browser screenshot at 15% scale,
        * unreadable, and the exact bug the README already warns about. Out
        * here they have the full measure and no height ceiling. */}
      {m.shots.length > 0 && (
        <div className="figs" data-n={m.shots.length}>
          {m.shots.map((s, i) => (
            <Shot key={i} shot={s} ratio="16 / 10" />
          ))}
        </div>
      )}

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
