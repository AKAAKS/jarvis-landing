import { useEffect, useRef, useState } from 'react'

export function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduce(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduce
}

export function useIsMobile(bp = 820) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(`(max-width:${bp}px)`).matches)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${bp}px)`)
    const on = () => setM(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [bp])
  return m
}

// overall scroll progress 0..1 of the document, written to a ref (no re-render)
export function useScrollProgress() {
  const ref = useRef(0)
  useEffect(() => {
    let raf = 0
    const compute = () => {
      raf = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      ref.current = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(compute) }
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    compute()
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); if (raf) cancelAnimationFrame(raf) }
  }, [])
  return ref
}
