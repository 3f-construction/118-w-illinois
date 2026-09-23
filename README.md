# 118 & 120 W Illinois — ComEd service record (ComEd-facing version)

A password-gated, single-page record of the ComEd permanent-service effort at
118–120 W Illinois Street, prepared for disclosure to ComEd. React + Vite, deployed to
GitHub Pages.

**This is the external, filtered version of the record.** The ownership version is a
separate repository with a separate Pages site and a separate password. Nothing here
links to it, and the two ciphertexts share no key.

## What this version contains

- **92 dated entries**, 3 Jul 2025 – 8 Sep 2026.
- **66 messages reproduced in full** — every message on which ComEd was a sender or a
  recipient. The remaining entries stay in the chronology and state plainly that they
  are not reproduced.
- **No interpretation.** The analysis written for the ownership record is removed, and
  headings are factual.

It mirrors `comed-production/` in the working repository, which produces the PDF of the
same record. Both take their headings from `derived/neutral-headings.json`, so the site
and the PDF cannot drift apart.

### Figures are recomputed, not inherited

Every number is measured against the 66 produced messages, so ComEd can check each one
against the entries either side of it:

| | |
|---|---|
| Intervals with no correspondence | 92 / 108 / 97 days — 297 in total |
| SR# 06667834 to end of record | 432 days |
| Switchgear approval to end of record | 384 days |
| Messages to ComEd : from ComEd | 45 : 21 |

Two figures in the ownership record were off by one and are corrected here: the second
interval is 108 days (5 Dec 2025 → 23 Mar 2026, not 107), and the switchgear span is
384 days (not 383).

## How the password works

The record itself is encrypted and **the password is the decryption key**:

- `../private/content-comed.json` is encrypted with AES-256-GCM into `public/data.enc`.
  The key is derived with PBKDF2-SHA256, 310,000 iterations.
- The password carries **80 bits** of CSPRNG entropy. Since `data.enc` is public, the
  password is the only thing protecting the record.
- It is **never printed** by the tooling and never appears in CI logs. Read it from
  `../private/password-comed.txt` (mode 600).
- Only `data.enc` is published. The JavaScript bundle contains no email text, no names
  and no analysis.

This version's password does **not** decrypt the ownership record, and the ownership
password does not decrypt this one.

### What this does *not* protect against

Anyone with the password can share it, and anyone who downloads `data.enc` keeps a copy
they can decrypt later if they learn the password. Rotate the password (below) if it
circulates further than intended. A GitHub Pages URL is public even when the repository
is private — the encryption, not the URL, is the protection.

## Updating the record

The plaintext and the password live in **`../private/`**, outside this repository:

```sh
npm run data      # rebuild content-comed.json from the export, then re-encrypt
npm run rotate    # issue a fresh password and re-encrypt
npm run build     # produce dist/
```

`npm run data` runs `derived/build_content_comed.py`, which applies the filtering and
recomputes every figure from the produced set. Do not hand-edit `content-comed.json` —
it is generated.

Commit `public/data.enc` and push; the workflow deploys it. CI needs no secrets, because
the plaintext and the password never leave the workstation.
