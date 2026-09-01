import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isValidWord, wordFromSeed } from '../utils/words'
import { wordleReward } from '../utils/rewards'
import { useRealtime, useWatch, usePartnerOnline } from '../realtime/RealtimeContext'
import {
  setWordleSession, setWordleCurrent, pushWordleGuess, clearWordleGuesses,
} from '../realtime/world'
import './games.css'

const ROWS = 6
const COLS = 5

const KB_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'del'],
]

function scoreGuess(guess, answer) {
  const result = Array(COLS).fill('absent')
  const answerArr = answer.split('')
  const used = Array(COLS).fill(false)

  for (let i = 0; i < COLS; i++) {
    if (guess[i] === answerArr[i]) {
      result[i] = 'correct'
      used[i] = true
    }
  }
  for (let i = 0; i < COLS; i++) {
    if (result[i] === 'correct') continue
    for (let j = 0; j < COLS; j++) {
      if (!used[j] && guess[i] === answerArr[j]) {
        result[i] = 'present'
        used[j] = true
        break
      }
    }
  }
  return result
}

// wordle is now co-op: both players share ONE board, see each other type, and
// solve the same word together. state lives under games/wordle/* in realtime.
export default function Wordle({ onExit, onFinish, highScore }) {
  const rt = useRealtime()
  const identity = rt.identity
  const partner = rt.partner
  const partnerOnline = usePartnerOnline()

  const session = useWatch('games/wordle/session')
  const currentShared = useWatch('games/wordle/current')
  const guessesRaw = useWatch('games/wordle/guesses')

  const seed = session ? session.seed : null
  const round = session ? (session.round || 0) : 0
  const answer = seed != null ? wordFromSeed(seed) : null

  const [current, setCurrent] = useState('')
  const [shake, setShake] = useState(false)
  const [revealRow, setRevealRow] = useState(-1)
  const [solved, setSolved] = useState(highScore || 0)

  const solvedRef = useRef(highScore || 0)
  const finishedRoundRef = useRef(-1)
  const playedRoundRef = useRef(-1)
  const prevLenRef = useRef(0)

  // the shared submitted guesses for THIS round, oldest first, scored.
  const guesses = useMemo(() => {
    if (!answer || !guessesRaw) return []
    return Object.values(guessesRaw)
      .filter((g) => g && g.round === round && typeof g.word === 'string')
      .sort((a, b) => (a.ts || 0) - (b.ts || 0))
      .map((g) => ({ word: g.word, by: g.by, result: scoreGuess(g.word, answer) }))
  }, [guessesRaw, answer, round])

  const status = useMemo(() => {
    if (!answer) return 'idle'
    if (guesses.some((g) => g.word === answer)) return 'won'
    if (guesses.length >= ROWS) return 'lost'
    return 'playing'
  }, [answer, guesses])

  // adopt the shared in-progress row when my PARTNER is the one typing, so I
  // watch their letters appear live. my own keystrokes stay local (snappy).
  useEffect(() => {
    if (!currentShared || currentShared.round !== round) return
    if (currentShared.by !== identity) setCurrent(currentShared.text || '')
  }, [currentShared, round, identity])

  // whenever a new round starts, clear my local row.
  useEffect(() => { setCurrent(''); prevLenRef.current = guesses.length }, [round]) // eslint-disable-line react-hooks/exhaustive-deps

  // reveal animation when a new guess lands (from either player).
  useEffect(() => {
    if (guesses.length > prevLenRef.current) setRevealRow(guesses.length - 1)
    prevLenRef.current = guesses.length
  }, [guesses.length])

  // remember rounds we actually played, so we don't collect a reward for a
  // board that was already finished when we walked in.
  useEffect(() => {
    if (status === 'playing') playedRoundRef.current = round
  }, [status, round])

  // fire the reward exactly once per round we played through.
  useEffect(() => {
    if (status !== 'won' && status !== 'lost') return
    if (playedRoundRef.current !== round) return
    if (finishedRoundRef.current === round) return
    finishedRoundRef.current = round
    const won = status === 'won'
    let count = solvedRef.current
    if (won) { count += 1; solvedRef.current = count; setSolved(count) }
    const isHigh = won && count > (highScore || 0)
    onFinish(wordleReward(won, guesses.length), count, isHigh)
  }, [status, round, guesses.length, highScore, onFinish])

  const keyStates = useMemo(() => {
    const next = {}
    const rank = { correct: 3, present: 2, absent: 1 }
    guesses.forEach((g) => g.word.split('').forEach((ch, i) => {
      const r = g.result[i]
      if (!next[ch] || rank[r] > rank[next[ch]]) next[ch] = r
    }))
    return next
  }, [guesses])

  const startRound = useCallback(() => {
    const nextRound = (session ? (session.round || 0) : 0) + 1
    const nextSeed = (Math.floor(Math.random() * 0xffffffff)) >>> 0
    clearWordleGuesses(rt)
    setWordleCurrent(rt, '', nextRound)
    setWordleSession(rt, { seed: nextSeed, round: nextRound, by: identity })
    setCurrent('')
    setRevealRow(-1)
  }, [rt, session, identity])

  const submitGuess = useCallback(() => {
    if (status !== 'playing') return
    if (current.length !== COLS || !isValidWord(current)) {
      setShake(true)
      setTimeout(() => setShake(false), 400)
      return
    }
    pushWordleGuess(rt, current, round)
    setWordleCurrent(rt, '', round)
    setCurrent('')
  }, [status, current, rt, round])

  const onKey = useCallback((key) => {
    if (status !== 'playing') return
    if (key === 'enter') {
      submitGuess()
    } else if (key === 'del') {
      const next = current.slice(0, -1)
      setCurrent(next)
      setWordleCurrent(rt, next, round)
    } else if (/^[a-z]$/.test(key) && current.length < COLS) {
      const next = current + key
      setCurrent(next)
      setWordleCurrent(rt, next, round)
    }
  }, [status, current, submitGuess, rt, round])

  useEffect(() => {
    const handler = (e) => {
      const k = e.key.toLowerCase()
      if (k === 'enter') { e.preventDefault(); onKey('enter') }
      else if (k === 'backspace') { e.preventDefault(); onKey('del') }
      else if (/^[a-z]$/.test(k)) onKey(k)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onKey])

  const partnerTyping = currentShared
    && currentShared.round === round
    && currentShared.by === partner
    && (currentShared.text || '').length > 0
    && status === 'playing'

  return (
    <div className="game-wrap screen-enter">
      <div className="game-header">
        <button className="back-btn" onClick={onExit}>‹ back</button>
        <span className="g-title">wordle · co-op</span>
        <span className="score-line"><b>{solved}</b> solved</span>
      </div>

      <p className="hint center">
        {status === 'idle'
          ? `solve one word together with ${partner}`
          : partnerTyping
            ? `${partner} is typing…`
            : partnerOnline
              ? `solving together with ${partner} — you both share this board`
              : `${partner} is away — they'll join live when they're back`}
      </p>

      <div className="wordle-board">
        {Array.from({ length: ROWS }).map((_, r) => {
          const guess = guesses[r]
          const isCurrent = r === guesses.length && status === 'playing'
          return (
            <div key={r} className={`wordle-row ${isCurrent && shake ? 'shake' : ''}`}>
              {Array.from({ length: COLS }).map((_, c) => {
                let letter = ''
                let cls = ''
                if (guess) {
                  letter = guess.word[c]
                  cls = `${guess.result[c]} ${r === revealRow ? 'reveal' : ''}`
                } else if (isCurrent) {
                  letter = current[c] || ''
                  cls = letter ? 'filled' : ''
                }
                return (
                  <div
                    key={c}
                    className={`wordle-tile ${cls}`}
                    style={r === revealRow ? { animationDelay: `${c * 0.12}s` } : undefined}
                  >
                    {letter}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {status === 'idle' && (
        <div className="game-over-card">
          <div className="go-title">co-op wordle</div>
          <div className="go-msg">
            one shared word, one shared board.<br />
            you both type and guess — see each other&apos;s letters live and crack it together.
          </div>
          <button className="btn btn-green mt-16" onClick={startRound}>start a word</button>
        </div>
      )}

      {status === 'won' && (
        <div className="game-over-card">
          <div className="go-title">you solved it together!</div>
          <div className="go-msg">the word was <b style={{ color: 'var(--green-2)' }}>{answer}</b>.<br />you both got happiness, food, xp and coins.</div>
          <button className="btn btn-green mt-16" onClick={startRound}>new word</button>
        </div>
      )}
      {status === 'lost' && (
        <div className="game-over-card">
          <div className="go-title">so close</div>
          <div className="go-msg">the word was <b style={{ color: 'var(--yellow)' }}>{answer}</b>.<br />try another one together.</div>
          <button className="btn btn-pink mt-16" onClick={startRound}>new word</button>
        </div>
      )}

      {status === 'playing' && (
        <div className="keyboard">
          {KB_ROWS.map((row, i) => (
            <div className="kb-row" key={i}>
              {row.map((k) => (
                <button
                  key={k}
                  className={`key ${k === 'enter' || k === 'del' ? 'wide' : ''} ${keyStates[k] || ''}`}
                  onClick={() => onKey(k)}
                >
                  {k === 'del' ? '⌫' : k}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
