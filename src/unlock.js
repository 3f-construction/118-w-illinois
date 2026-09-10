// Password → PBKDF2 key → AES-GCM decrypt. Nothing readable exists until this succeeds.

const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

async function deriveKey(password, salt, iterations) {
  const material = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    true,
    ['decrypt']
  )
}

async function decrypt(blob, key) {
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64(blob.iv) }, key, b64(blob.ct)
  )
  return JSON.parse(new TextDecoder().decode(plain))
}

let blobPromise = null
function loadBlob() {
  if (!blobPromise) {
    blobPromise = fetch(`${import.meta.env.BASE_URL}data.enc`, { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(`Could not load the record (HTTP ${r.status}).`)
        return r.json()
      })
  }
  return blobPromise
}

const SESSION_KEY = 'boylston.k'

/** Try a password. Resolves with the content, or throws with a readable message. */
export async function unlockWithPassword(password) {
  const blob = await loadBlob()
  const key = await deriveKey(password, b64(blob.salt), blob.iterations)
  let content
  try {
    content = await decrypt(blob, key)
  } catch {
    throw new Error('That password does not match. Check for stray spaces, then try again.')
  }
  try {
    const jwk = await crypto.subtle.exportKey('jwk', key)
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(jwk))
  } catch { /* private mode — the tab just won't remember */ }
  return content
}

/** Re-open with the key held for this tab, if there is one. */
export async function unlockFromSession() {
  let jwk
  try {
    jwk = sessionStorage.getItem(SESSION_KEY)
  } catch { return null }
  if (!jwk) return null
  try {
    const key = await crypto.subtle.importKey(
      'jwk', JSON.parse(jwk), { name: 'AES-GCM', length: 256 }, true, ['decrypt']
    )
    return await decrypt(await loadBlob(), key)
  } catch {
    lock()
    return null
  }
}

export function lock() {
  try { sessionStorage.removeItem(SESSION_KEY) } catch { /* no-op */ }
}
