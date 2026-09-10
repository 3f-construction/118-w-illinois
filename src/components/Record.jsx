import { useMemo, useState } from 'react'
import ActivityBand from './ActivityBand.jsx'
import EmailModal from './EmailModal.jsx'

const SIDE_LABEL = {
  comed: 'ComEd', '3f': '3F Construction', design: 'Architect / MEP',
  owner: 'Owner / Monroe', trade: 'Switch Electric',
}
const FILTERS = [
  ['all', 'All events'], ['comed', 'ComEd'], ['3f', '3F Construction'],
  ['design', 'Architect & MEP'], ['owner', 'Owner / Monroe'], ['trade', 'Switch Electric'],
]
const html = (s) => ({ __html: s })

export default function Record({ content, onLock }) {
  const { meta, metrics, band, gaps, gapNote, phases, events, roles, panels, footer } = content
  const [filter, setFilter] = useState('all')
  const [openId, setOpenId] = useState(null)

  const shown = useMemo(
    () => (filter === 'all' ? events : events.filter((e) => e.side === filter)),
    [events, filter]
  )
  const openIdx = shown.findIndex((e) => e.id === openId)

  return (
    <div className="wrap">
      <div className="topbar">
        <button className="lockbtn" onClick={onLock}>Lock this record</button>
      </div>

      <header className="tb">
        <div className="tb-top">
          <h1>{meta.project}<span>{meta.subtitle}</span></h1>
          <div className="stamp">{meta.stamp}</div>
        </div>
        <dl className="fields">
          {meta.fields.map(([k, v]) => (
            <div className="field" key={k}>
              <dt>{k}</dt>
              <dd dangerouslySetInnerHTML={html(v)} />
            </div>
          ))}
        </dl>
      </header>

      <p className="lede" dangerouslySetInnerHTML={html(meta.lede)} />

      <div className="metrics">
        {metrics.map(([n, l, warn]) => (
          <div className="metric" key={l}>
            <div className={warn ? 'n warn' : 'n'}>{n}</div>
            <div className="l">{l}</div>
          </div>
        ))}
      </div>

      <section>
        <div className="sec-head">
          <h2>Where the 673 days went</h2>
          <div className="note">contact with ComEd, by month</div>
        </div>
        <div className="band">
          <ActivityBand band={band} />
          <div className="legend">
            <span><i style={{ background: 'var(--comed)' }} />Active correspondence with ComEd</span>
            <span><i style={{ background: 'var(--gc)' }} />Application prepared internally, no ComEd contact yet</span>
            <span><i style={{ background: 'var(--alarm)', opacity: 0.35 }} />Dormant — no contact in either direction</span>
          </div>
        </div>
        <div className="gaps">
          {gaps.map(([days, range, text]) => (
            <div className="gap-row" key={range}>
              <span className="d">{days} days</span>
              <span className="t"><b>{range}</b> — <span dangerouslySetInnerHTML={html(text)} /></span>
            </div>
          ))}
        </div>
        <p className="subnote">{gapNote}</p>
      </section>

      <section>
        <div className="sec-head">
          <h2>The record</h2>
          <div className="note">{events.length} events · open any entry to read the original email</div>
        </div>

        <div className="filters" role="group" aria-label="Filter the record by party">
          {FILTERS.map(([key, label]) => (
            <button
              key={key} className="chip" aria-pressed={filter === key}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
          <span className="count">{shown.length} of {events.length} shown</span>
        </div>

        {shown.length === 0 && <p className="empty">No events for this party.</p>}

        {phases.map((ph, pi) => {
          const evs = shown.filter((e) => e.phase === pi)
          if (!evs.length) return null
          return (
            <div key={pi}>
              <div className="phase">
                <span className="num">PHASE {String(pi + 1).padStart(2, '0')}</span>
                <h3>{ph.title}</h3>
                <span className="rng">{ph.range}</span>
              </div>
              {ph.gap && filter === 'all' && (
                <div className="gapbar">
                  <span className="n">{ph.gap.days} days</span>
                  <span>{ph.gap.text}</span>
                </div>
              )}
              {evs.map((e) => (
                <article className={`ev side-${e.side}`} key={e.id}>
                  <div className="when">
                    <span className="dd">{e.dateLabel}</span>
                    <span>{e.wd} {e.time}</span>
                  </div>
                  <div className="evbody">
                    <span className="who"><span className="dot" />{e.actor} · {SIDE_LABEL[e.side]}</span>
                    <h4>{e.head}</h4>
                    <p className="txt">{e.body}</p>
                    {e.quote && <blockquote>{e.quote}</blockquote>}
                    <div className="meta">
                      <span className="subj">{e.subject}</span>
                      <button className="gm" onClick={() => setOpenId(e.id)}>
                        Read the email →
                      </button>
                      {e.att.length > 0 && (
                        <span className="att"><b>Attached:</b> {e.att.join(', ')}</span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )
        })}
      </section>

      <section>
        <div className="sec-head">
          <h2>Who did what</h2>
          <div className="note">by volume of ComEd-facing email in the export</div>
        </div>
        <div className="rolewrap">
          <table className="roles">
            <thead>
              <tr><th>Person</th><th>Role</th><th>What the record shows</th></tr>
            </thead>
            <tbody>
              {roles.map(([name, addr, role, what]) => (
                <tr key={addr}>
                  <td>{name}<span className="addr">{addr}</span></td>
                  <td>{role}</td>
                  <td dangerouslySetInnerHTML={html(what)} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="sec-head"><h2>What to do with this</h2></div>
        <div className="cols">
          {panels.map(([title, items]) => (
            <div className="panel" key={title}>
              <h3>{title}</h3>
              <ul>
                {items.map((it, i) => <li key={i} dangerouslySetInnerHTML={html(it)} />)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <footer>
        {footer.map((p, i) => <p key={i} dangerouslySetInnerHTML={html(p)} />)}
      </footer>

      {openIdx >= 0 && (
        <EmailModal
          event={shown[openIdx]}
          index={openIdx}
          total={shown.length}
          onClose={() => setOpenId(null)}
          onPrev={openIdx > 0 ? () => setOpenId(shown[openIdx - 1].id) : null}
          onNext={openIdx < shown.length - 1 ? () => setOpenId(shown[openIdx + 1].id) : null}
        />
      )}
    </div>
  )
}
