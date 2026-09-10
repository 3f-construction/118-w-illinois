import { useState } from 'react'
import { unlockWithPassword } from '../unlock.js'

export default function Gate({ onUnlock }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!password.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      onUnlock(await unlockWithPassword(password.trim()))
    } catch (err) {
      setError(err.message)
      setPassword('')
      setBusy(false)
    }
  }

  return (
    <div className="gate">
      <div className="gate-card">
        <div className="gate-mark">
          <span className="bolt" aria-hidden="true">⚡</span>
          <span className="t">Boylston Lofts<br />118 &amp; 120 W Illinois St</span>
        </div>

        <h1>ComEd service record</h1>
        <p className="sub">
          The full email record of the ComEd permanent-service effort, prepared for
          building ownership. Enter the access password to open it.
        </p>

        <form onSubmit={submit}>
          <label htmlFor="pw">Access password</label>
          <input
            id="pw"
            type="password"
            value={password}
            autoFocus
            autoComplete="current-password"
            spellCheck="false"
            placeholder="••••••••••••"
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby={error ? 'pw-err' : undefined}
            aria-invalid={error ? 'true' : undefined}
          />
          {error && <p className="err" id="pw-err" role="alert">{error}</p>}
          <button type="submit" disabled={busy || !password.trim()}>
            {busy ? 'Unlocking…' : 'Open the record'}
          </button>
        </form>

        <p className="fine">
          The record is stored encrypted. The password is the decryption key — it is never
          sent anywhere and nothing on this page is readable without it. Unlocking takes a
          moment by design. Your browser remembers it until you close the tab.
        </p>
      </div>
    </div>
  )
}
