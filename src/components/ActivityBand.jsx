const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const FILL = { prep: 'var(--gc)', active: 'var(--comed)', dead: 'var(--alarm)' }
const W = 1000
const PAD = 10
const BY = 62
const BH = 26

const day = (s) => Math.round(Date.parse(s + 'T00:00:00Z') / 86400000)

export default function ActivityBand({ band }) {
  const t0 = day(band.start)
  const span = day(band.end) - t0
  const iw = W - PAD * 2
  const x = (d) => PAD + (iw * (day(d) - t0)) / span

  const ticks = []
  let cur = new Date(band.start + 'T00:00:00Z')
  const last = new Date(band.end + 'T00:00:00Z')
  while (cur <= last) {
    const iso = cur.toISOString().slice(0, 10)
    const m = cur.getUTCMonth()
    ticks.push({ x: x(iso), major: m % 3 === 0, label: m === 0 ? `${MON[m]} ${cur.getUTCFullYear()}` : MON[m] })
    cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1))
  }

  return (
    <svg
      viewBox={`0 0 ${W} 132`}
      role="img"
      aria-label={band.ariaLabel}
    >
      {band.segments.map(([a, b, kind, label], i) => {
        const x0 = x(a)
        const w = Math.max(x(b) - x0, 2)
        return (
          <g key={i}>
            <rect x={x0} y={BY} width={w} height={BH} fill={FILL[kind]} opacity={kind === 'dead' ? 0.32 : 1} />
            {kind === 'dead' && w > 56 && (
              <text
                x={x0 + w / 2} y={BY + BH / 2 + 4} textAnchor="middle"
                fontFamily="IBM Plex Mono, monospace" fontSize="11.5" fontWeight="600" fill="var(--alarm)"
              >
                {label}
              </text>
            )}
          </g>
        )
      })}

      {ticks.map((t, i) => (
        <g key={`t${i}`}>
          <line x1={t.x} y1={BY + BH} x2={t.x} y2={BY + BH + (t.major ? 7 : 4)} stroke="var(--rule)" strokeWidth="1" />
          {t.major && (
            <text
              x={t.x} y={BY + BH + 22} textAnchor="middle"
              fontFamily="IBM Plex Mono, monospace" fontSize="10.5" fill="var(--ink-3)"
            >
              {t.label}
            </text>
          )}
        </g>
      ))}

      {band.milestones.map(([d, label, row], i) => {
        const xx = x(d)
        const ty = row === 0 ? 20 : 40
        const anchor = xx > W - 190 ? 'end' : 'start'
        return (
          <g key={`m${i}`}>
            <line x1={xx} y1={ty + 4} x2={xx} y2={BY} stroke="var(--ink-3)" strokeWidth="1" strokeDasharray="2 3" />
            <circle cx={xx} cy={BY} r="3" fill="var(--ink)" />
            <text
              x={anchor === 'end' ? xx - 6 : xx + 6} y={ty} textAnchor={anchor}
              fontFamily="IBM Plex Sans, sans-serif" fontSize="11.5" fontWeight="500" fill="var(--ink-2)"
            >
              {label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
