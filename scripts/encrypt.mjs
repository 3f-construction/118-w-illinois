#!/usr/bin/env node
/**
 * Encrypts the record into public/data.enc.
 *
 * The published site contains ONLY this ciphertext. Without the password there
 * is nothing readable in the bundle — no email text, no names, no analysis.
 *
 * The plaintext record and the password live OUTSIDE this repository and outside
 * the directory the dev server serves, in ../private/ :
 *
 *   ../private/content.json   the record, rebuilt by ../derived/build_content.py
 *   ../private/password.txt   the access password
 *
 *   node scripts/encrypt.mjs                 # uses the existing password
 *   node scripts/encrypt.mjs --new           # generates a fresh 80-bit password
 *   node scripts/encrypt.mjs "my password"   # sets a specific password
 *
 * The password is never printed. Read ../private/password.txt to see it.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from 'node:fs'
import { randomBytes, pbkdf2Sync, createCipheriv } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PRIVATE = resolve(ROOT, '..', 'private')
const CONTENT = resolve(PRIVATE, 'content.json')
const PW_FILE = resolve(PRIVATE, 'password.txt')

const ITERATIONS = 310000 // PBKDF2-SHA256
const MIN_CUSTOM_LENGTH = 16

/**
 * 80 bits of CSPRNG entropy, formatted as 4 groups of 4.
 *
 * The alphabet is exactly 32 characters, so each 5-bit slice maps to one
 * character with no modulo bias. Ambiguous glyphs (0/O, 1/I/L, U) are excluded
 * so the password survives being read aloud or copied off a screen.
 *
 * 2^80 candidates against 310k PBKDF2 iterations per guess is out of reach of
 * offline cracking even with the ciphertext in hand — which it is, since
 * data.enc is published.
 */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ#@'
function generatePassword() {
  const bytes = randomBytes(16) // 128 bits drawn, 80 consumed
  let out = ''
  for (let i = 0; i < 16; i++) {
    out += ALPHABET[bytes[i] & 31]
    if (i % 4 === 3 && i < 15) out += '-'
  }
  return out
}

function writePassword(value) {
  mkdirSync(PRIVATE, { recursive: true })
  writeFileSync(PW_FILE, value + '\n', { mode: 0o600 })
  try { chmodSync(PW_FILE, 0o600) } catch { /* best effort */ }
}

const arg = process.argv[2]
let password
let rotated = false

if (arg === '--new') {
  password = generatePassword()
  writePassword(password)
  rotated = true
} else if (arg && !arg.startsWith('--')) {
  password = arg.trim()
  if (password.length < MIN_CUSTOM_LENGTH && process.argv[3] !== '--force') {
    console.error(
      `Refusing a ${password.length}-character password. data.enc is published, so a short\n` +
      `password can be cracked offline. Use at least ${MIN_CUSTOM_LENGTH} characters, run with --new for a\n` +
      `generated one, or append --force if you accept the risk.`
    )
    process.exit(1)
  }
  writePassword(password)
  rotated = true
} else if (existsSync(PW_FILE)) {
  password = readFileSync(PW_FILE, 'utf8').trim()
} else {
  password = generatePassword()
  writePassword(password)
  rotated = true
  console.log('No password file found — generated one.')
}

if (!password) {
  console.error(`${PW_FILE} is empty. Aborting.`)
  process.exit(1)
}

if (!existsSync(CONTENT)) {
  console.error(`${CONTENT} not found. Run: npm run data`)
  process.exit(1)
}
const plaintext = Buffer.from(readFileSync(CONTENT, 'utf8'), 'utf8')

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
if (rotated) {
  console.log('Password rotated. Read it from private/password.txt — it is not printed here.')
  console.log('Anyone holding a previously downloaded data.enc keeps access to that older copy.')
} else {
  console.log('Re-encrypted with the existing password in private/password.txt.')
}
