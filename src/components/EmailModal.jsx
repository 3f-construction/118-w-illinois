import { useEffect, useRef } from 'react'

export default function EmailModal({ event, ui, onClose, onPrev, onNext, index, total }) {
  const closeRef = useRef(null)
  const bodyRef = useRef(null)
  const restoreTo = useRef(null)

  useEffect(() => {
    restoreTo.current = document.activeElement
    document.body.classList.add('modal-open')
    closeRef.current?.focus()
    return () => {
      document.body.classList.remove('modal-open')
      if (restoreTo.current instanceof HTMLElement) restoreTo.current.focus()
    }
  }, [])

  // Scroll back to the top when stepping to another message.
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = 0 }, [event.id])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      if (e.key === 'ArrowLeft' && onPrev) onPrev()
      if (e.key === 'ArrowRight' && onNext) onNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onPrev, onNext])

  return (
    <div
      className="backdrop"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div className="sheet-head">
          <div className="row">
            <h3 id="sheet-title">{event.subjectRaw || event.subject}</h3>
            <button ref={closeRef} className="x" onClick={onClose} aria-label="Close message">✕</button>
          </div>
          <dl className="hdrs">
            <dt>From</dt><dd><b>{event.from}</b></dd>
            <dt>To</dt><dd>{event.to || '—'}</dd>
            {event.cc && <><dt>Cc</dt><dd>{event.cc}</dd></>}
            <dt>Sent</dt>
            <dd>{event.wd} {event.dateLabel}, {event.time} <span style={{ color: 'var(--ink-3)' }}>(Chicago)</span></dd>
            {event.att.length > 0 && <><dt>Files</dt><dd>{event.att.join(' · ')}</dd></>}
          </dl>
        </div>

        <div className="sheet-body" ref={bodyRef}>
          <pre className="mailtext">{event.text || '(This message had no text body — see the attachments listed above.)'}</pre>

          {event.thread && (
            <details className="threadwrap">
              <summary>Show the quoted thread below this message ({Math.round(event.thread.length / 1000)}k characters)</summary>
              <pre className="mailtext">{event.thread}</pre>
            </details>
          )}
        </div>

        <div className="sheet-foot">
          <span>
            {ui.sideLabels[event.side]} · {ui.provenance} {event.mailbox}
            {event.holders.length > 1 && ` (+${event.holders.length - 1} other mailbox${event.holders.length > 2 ? 'es' : ''})`}
          </span>
          <span className="navbtns">
            <button onClick={onPrev} disabled={!onPrev}>← Previous</button>
            <span style={{ alignSelf: 'center', fontFamily: 'IBM Plex Mono, monospace' }}>{index + 1} / {total}</span>
            <button onClick={onNext} disabled={!onNext}>Next →</button>
          </span>
        </div>
      </div>
    </div>
  )
}
