import React from 'react'
import ReactDOM from 'react-dom/client'

const root = ReactDOM.createRoot(document.getElementById('root'))

// Phase-A spike gate: /?spike renders just the orb for quality validation.
if (new URLSearchParams(window.location.search).has('spike')) {
  import('./spike/OrbSpike.jsx').then(({ default: OrbSpike }) => {
    root.render(<OrbSpike />)
  })
} else {
  Promise.all([import('./App.jsx'), import('./styles.css')]).then(([{ default: App }]) => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  })
}
