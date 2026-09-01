// firebase realtime-database client. exposes the exact same interface as
// LocalClient so the rest of the app never needs to know which one is running.

import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  getDatabase, ref, onValue, set, update, push, remove, runTransaction,
} from 'firebase/database'
import { FIREBASE_CONFIG } from './config'

export class FirebaseClient {
  constructor() {
    // reuse the existing app if one was already created (e.g. after a
    // logout/login cycle) so initializeApp is never called twice.
    this.app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG)
    this.db = getDatabase(this.app)
  }

  watch(path, cb) {
    const r = ref(this.db, path)
    const unsub = onValue(r, (snap) => cb(snap.val()))
    return unsub
  }

  // firebase exposes a special ".info/connected" path that flips to true once
  // the client actually reaches the database — real proof the keys work.
  watchConnection(cb) {
    const r = ref(this.db, '.info/connected')
    return onValue(r, (snap) => cb(snap.val() === true))
  }

  set(path, value) {
    return set(ref(this.db, path), value ?? null)
  }

  update(path, partial) {
    return update(ref(this.db, path), partial)
  }

  push(path, value) {
    const r = push(ref(this.db, path), value)
    return r.key
  }

  remove(path) {
    return remove(ref(this.db, path))
  }

  increment(path, delta) {
    return runTransaction(ref(this.db, path), (cur) => (Number(cur) || 0) + delta)
  }
}
