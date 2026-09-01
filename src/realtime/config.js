// ============================================================================
//  mehreenz + ali  —  private world config
// ============================================================================
//
//  1. each person has their OWN password. typing it logs you straight into
//     that person's account — no shared code, no "who are you?" step.
//       • mehreenz's password → VITE_CODE_MEHREENZ
//       • ali's password      → VITE_CODE_ALI
//
//  2. the FIREBASE CONFIG that makes the pet park / chat / gifts sync between
//     two different devices in realtime.
//
//     >>> HOW TO TURN ON CROSS-DEVICE REALTIME (one-time, ~3 minutes) <<<
//       a. go to https://console.firebase.google.com  and create a project
//          (any name, e.g. "mehreenz-ali").
//       b. in the left menu open  Build → Realtime Database → Create Database
//          (pick a location, start in "test mode" for now).
//       c. open  Project settings (gear icon) → General → "Your apps" →
//          click the </> web icon, register an app, and copy the config values
//          it shows you into FIREBASE_CONFIG below.
//       d. save this file. done — you two now share a live world.
//
//     until you fill this in, the app still works: everything syncs between
//     browser tabs on the SAME computer so you can preview it right away.
// ============================================================================

// env values (set in a .env file or your host's env vars) take priority, so you
// can deploy without editing this file. otherwise the hardcoded fallbacks win.
const env = (typeof import.meta !== 'undefined' && import.meta.env) || {}

export const IDENTITIES = ['mehreenz', 'ali']

// each person's private password. typing one logs straight into that account.
// set your own in .env (VITE_CODE_MEHREENZ / VITE_CODE_ALI).
export const IDENTITY_CODES = {
  mehreenz: env.VITE_CODE_MEHREENZ || 'mehreenz',
  ali: env.VITE_CODE_ALI || 'ali',
}

// which person (if any) a typed password belongs to.
export function identityForCode(entered) {
  const norm = String(entered || '').trim().toLowerCase()
  if (!norm) return null
  return IDENTITIES.find(
    (id) => String(IDENTITY_CODES[id]).trim().toLowerCase() === norm,
  ) || null
}

// both people share ONE world (so their pets/chat/park line up). the world id
// is fixed — it no longer comes from a password. defaults to the existing
// "mehralizzz" world so past data is kept.
export const WORLD_ID = worldIdFromCode(env.VITE_WORLD_ID || 'mehralizzz')

export const FIREBASE_CONFIG = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
}

// true once a real firebase project has been pasted in above.
export function isFirebaseConfigured() {
  return Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.databaseURL)
}

// turn the access code into a safe firebase path segment so only people who
// share the code share the same world.
export function worldIdFromCode(code) {
  const safe = String(code || 'world')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return safe || 'world'
}

export function partnerOf(identity) {
  return IDENTITIES.find((id) => id !== identity) || null
}
