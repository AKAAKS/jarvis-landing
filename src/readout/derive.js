/* Values READ BACK OUT of RECORD, never authored.
 *
 * Both the hero index and each moment's slug are views of the same data the
 * readouts render, so neither can drift from what it describes. If a line is
 * added to a moment, every count here moves with it. That is the whole reason
 * these are computed rather than written down. */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/* Dates only, never a time span. Moment 03 runs 17:01:34 -> 00:45:52 across
 * 30 October AND 12 November, so a span renders as though it goes backwards
 * and reads as a bug. The timestamps are in the readout for anyone who wants
 * them. */
export const datesOf = (from) =>
  (from.match(/\d{4}-\d{2}-\d{2}/g) || [])
    .map((d) => { const [, m, day] = d.split('-'); return `${+day} ${MONTHS[+m - 1]}` })
    .join(' + ')

/* src -> the file it was transcribed from. Two entries, because the readouts
 * use two files: no line on this page comes from voice_client.log. */
export const FILE_OF = { daemon: 'jarvisd.log', audit: 'audit.jsonl' }

/* Fixed order, so the slug reads the same way in every moment regardless of
 * which stream a given moment happens to open with. */
const ORDER = ['daemon', 'audit']

export function composition(m) {
  const by = {}
  for (const l of m.lines) if (l.src) by[l.src] = (by[l.src] || 0) + 1
  return {
    files: ORDER.filter((s) => by[s]).map((s) => ({ src: s, file: FILE_OF[s], n: by[s] })),
    gaps: m.lines.filter((l) => l.k === 'gap').length,
    total: m.lines.length,
    dates: datesOf(m.from),
  }
}
