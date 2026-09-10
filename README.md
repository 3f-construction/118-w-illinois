# 118 & 120 W Illinois — ComEd service record

A password-gated, single-page record of the ComEd permanent-service effort at Boylston
Lofts, built for building ownership. React + Vite, deployed to GitHub Pages.

**Live:** https://3f-construction.github.io/118-w-illinois/

## How the password works

This is a static site, so there is no server to check a password against. Instead the
record itself is encrypted and **the password is the decryption key**:

- `../private/content.json` (the timeline, the analysis, and the full text of all 47
  emails) is encrypted with AES-256-GCM into `public/data.enc`. The key is derived from the
  password with PBKDF2-SHA256, 310,000 iterations.
- Generated passwords carry **80 bits** of CSPRNG entropy (16 characters from a 32-symbol
  alphabet, formatted `XXXX-XXXX-XXXX-XXXX`). Since `data.enc` is public, the password is
  the only thing standing between an attacker and the record — a memorable-but-small
  passphrase is not good enough here. Custom passwords under 16 characters are refused.
- The password is **never printed** by the tooling and never appears in CI logs. Read it
  from `../private/password.txt` (mode 600).
- Only `data.enc` is published. The JavaScript bundle contains no email text, no names and
  no analysis — View Source shows nothing but ciphertext.
- The browser derives the key from what you type and tries to decrypt. Wrong password =
  the decryption fails; there is no "password check" to bypass.
- The derived key is kept in `sessionStorage`, so a refresh does not re-prompt but closing
  the tab locks it again. "Lock this record" clears it immediately.

The deliberate cost of PBKDF2 (~0.1–0.3s per attempt) is what makes guessing impractical.

### What this does *not* protect against

Anyone with the password can share it, and anyone who downloads `data.enc` keeps a copy
they can decrypt later if they learn the password. Rotate the password (below) if it
circulates further than intended. A GitHub Pages URL is public even when the repository is
private — the encryption, not the URL, is the protection.

## Updating the record

The plaintext source and the password live in **`../private/`** — outside this repository
and outside the directory the dev server serves, so `npm run dev` cannot hand them to a
browser. They are rebuilt from the Google Vault export, which also lives outside this repo.

```bash
# 1. rebuild content.json from the Vault export, then re-encrypt
npm run data

# 2. rebuild the site and check it locally
npm run build && npm run preview

# 3. publish — pushing to main deploys via GitHub Actions
git add public/data.enc && git commit -m "Update record" && git push
```

`npm run data` runs `../derived/build_site_data.py` then `../derived/build_content.py`,
which read `derived/messages.json` (the parsed project emails) and the extracted `.eml`
files. See `../CLAUDE.md` for how the
export is searched and parsed.

## Changing the password

```bash
npm run rotate                            # generate a fresh 80-bit password
# ...or set a specific one (16+ characters):
npm run encrypt -- "a long passphrase you chose"
npm run build
git add public/data.enc && git commit -m "Rotate access password" && git push
```

Everyone with the old password loses access to the newly published file at that point.

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
```

`npm run dev` needs `public/data.enc` to exist — run `npm run encrypt` first if you have
`../private/content.json`, or work against the committed `data.enc` with the current
password. The dev server is configured with `server.fs.strict` and deny rules so it will
not serve `content.json`, `password.txt` or anything under `private/` even by accident.

## Deployment

`.github/workflows/deploy.yml` builds on every push to `main` and deploys to GitHub Pages.
It needs no secrets: `data.enc` is already ciphertext and is committed. The workflow fails
the build if any readable project content is detected in the bundle.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions.**

## Layout

```
src/unlock.js               PBKDF2 + AES-GCM; the only thing standing between the
                            visitor and the record
src/components/Gate.jsx     password screen
src/components/Record.jsx   the record: title block, metrics, timeline, roles, findings
src/components/EmailModal.jsx  original email viewer (headers, body, quoted thread)
src/components/ActivityBand.jsx  the 673-day activity chart
scripts/encrypt.mjs         content.json -> public/data.enc
```
