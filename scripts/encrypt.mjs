#!/usr/bin/env node
/**
 * Encrypts content.json into public/data.enc.
 *
 * The published site contains ONLY this ciphertext. Without the password there
 * is nothing readable in the bundle — no email text, no names, no analysis.
 *
 *   node scripts/encrypt.mjs                 # uses password.txt (creates one if missing)
 *   node scripts/encrypt.mjs "new password"  # sets a new password and rewrites password.txt
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { randomBytes, pbkdf2Sync, createCipheriv } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ITERATIONS = 310000 // PBKDF2-SHA256; ~0.3s per guess in a browser

// Four words from a 1,700-word list ≈ 45 bits — fine when each guess costs 310k hashes.
function makePassphrase() {
  const w = ['anchor','ballast','beacon','bracket','caliper','conduit','cornice','dowel','ferrule','gantry',
    'girder','gasket','hoist','joist','lintel','mortise','parapet','pilaster','plumb','purlin','rafter','rebar',
    'sheave','soffit','spandrel','stanchion','stringer','transom','trestle','truss','turnbuckle','vault']
  const pick = () => w[randomBytes(2).readUInt16BE(0) % w.length]
  return [pick(), pick(), pick(), randomBytes(2).readUInt16BE(0) % 9000 + 1000].join('-')
}

const argPassword = process.argv[2]
const pwFile = resolve(ROOT, 'password.txt')
let password
if (argPassword) {
  password = argPassword.trim()
  writeFileSync(pwFile, password + '\n')
  console.log('Password set and written to password.txt (gitignored).')
} else if (existsSync(pwFile)) {
  password = readFileSync(pwFile, 'utf8').trim()
} else {
  password = makePassphrase()
  writeFileSync(pwFile, password + '\n')
  console.log('No password.txt found — generated one.')
}
if (!password) { console.error('Empty password. Aborting.'); process.exit(1) }

const contentPath = resolve(ROOT, 'content.json')
if (!existsSync(contentPath)) {
  console.error('content.json not found. Run: python3 ../derived/build_content.py')
  process.exit(1)
}
const plaintext = Buffer.from(readFileSync(contentPath, 'utf8'), 'utf8')

const salt = randomBytes(16)
const iv = randomBytes(12)
const key = pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256')
const cipher = createCipheriv('aes-256-gcm', key, iv)
const ct = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()])

mkdirSync(resolve(ROOT, 'public'), { recursive: true })
writeFileSync(resolve(ROOT, 'public/data.enc'), JSON.stringify({
  v: 1, kdf: 'PBKDF2-SHA256', iterations: ITERATIONS, cipher: 'AES-256-GCM',
  salt: salt.toString('base64'), iv: iv.toString('base64'), ct: ct.toString('base64'),
}))

console.log(`Encrypted ${(plaintext.length / 1024).toFixed(0)} KB → public/data.enc (${(ct.length / 1024).toFixed(0)} KB)`)
console.log(`Password: ${password}`)
