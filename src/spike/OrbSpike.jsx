import Orb from '../orb/Orb'
import { useScrollProgress } from '../orb/hooks'
import './spike.css'

/* Phase-A throwaway spike: validate the structured data-globe + the central
 * mind-core that morphs (and shifts colour) once per section as you scroll. */
export default function OrbSpike() {
  const progressRef = useScrollProgress()
  return (
    <div className="spk">
      <div className="spk-bg" />
      <Orb progressRef={progressRef} />
      <div className="spk-top">JARVIS · ORB SPIKE — scroll to morph</div>

      <section className="spk-sec">
        <h1>The mind.</h1>
        <p>A data-globe with a core that reshapes as you move.</p>
        <span className="spk-tag">core · sphere</span>
      </section>
      <section className="spk-sec">
        <h2>It listens.</h2>
        <span className="spk-tag">core · ring</span>
      </section>
      <section className="spk-sec">
        <h2>It thinks.</h2>
        <span className="spk-tag">core · helix</span>
      </section>
      <section className="spk-sec">
        <h2>It reaches.</h2>
        <span className="spk-tag">core · data cloud</span>
      </section>
      <section className="spk-sec">
        <h2>It closes.</h2>
        <span className="spk-tag">core · sealed</span>
      </section>
      <section className="spk-sec end">
        <p>end of spike</p>
      </section>
    </div>
  )
}
