/* Regenerates public/og.png from the real landing frame.
 *
 * The card is a photograph of the page, not a second drawing of it. The orb is
 * seeded (src/orb/rng.js), so the shape in the card is the exact shape a
 * visitor sees — a hand-built SVG card would be a second copy of the same
 * object and would drift from the first one silently.
 *
 * Run it after anything that changes how the hero looks:
 *   npm run build && npm run preview    (one terminal)
 *   npm run og                          (another)
 *
 * Headless Chrome rather than Playwright or Puppeteer: Chrome is already on
 * the machine and this runs about once a month, which does not earn a 300MB
 * dependency.
 *
 * Adapted from the portfolio's scripts/make-og.mjs, deliberately keeping its
 * flags and Chrome-discovery list rather than re-deriving them.
 */
import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const URL = process.argv[2] || 'http://localhost:4173/'
const OUT = resolve('public/og.png')

/* 1200x630 is the Open Graph size every platform agrees on. Captured at 2x so
 * it stays sharp on retina displays, which is why the file is 2400x1260 while
 * the meta tags still say 1200x630 — the tags describe the layout size, not
 * the pixel count. */
const W = 1200
const H = 630

const CANDIDATES = [
  process.env.CHROME_PATH,
  /* Forward slashes on purpose. Node accepts them on Windows, and unlike
   * backslashes they survive being passed through a shell or a heredoc. */
  `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
  `${process.env.PROGRAMFILES}/Google/Chrome/Application/chrome.exe`,
  `${process.env['PROGRAMFILES(X86)']}/Google/Chrome/Application/chrome.exe`,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter((x) => x && !x.includes('undefined'))

const chrome = CANDIDATES.find((p) => existsSync(p))
if (!chrome) {
  console.error('No Chrome found. Set CHROME_PATH to its executable.')
  process.exit(1)
}

try {
  execFileSync(chrome, [
    '--headless=new',
    /* NOT --disable-gpu, unlike the portfolio's: that page is SVG and this
     * one is WebGL, and the GPU must stay on.
     *
     * Do not add --use-gl=swiftshader either. WebGL 2.0 is available under
     * SwiftShader (checked), and the orb's points and lines draw correctly,
     * but the <Bloom> pass from @react-three/postprocessing fails there and
     * takes the whole canvas with it — the capture comes back with perfect
     * type over an empty black field, which looks like "WebGL is off" and
     * sends you hunting in the wrong place. Chrome's default GPU path renders
     * it correctly. */
    '--hide-scrollbars',
    '--force-device-scale-factor=2',
    `--window-size=${W},${H}`,
    /* Fonts and the first WebGL frames both arrive after first paint, so the
     * shot has to wait or it captures fallback type over an empty canvas. */
    '--virtual-time-budget=12000',
    `--screenshot=${OUT}`,
    URL,
  ], { stdio: ['ignore', 'ignore', 'pipe'] })
} catch (e) {
  console.error(`Capture failed. Is the preview server up at ${URL}?`)
  process.exit(1)
}

console.log(`Wrote ${OUT} at ${W * 2}x${H * 2} from ${URL}`)
