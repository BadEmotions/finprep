'use client'
import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import { supabase } from '../../lib/supabase'

type Mode = 'easy' | 'hard'
type Screen = 'home' | 'playing' | 'gameover' | 'leaderboard'

type Question = {
  question: string
  answer: number
  tolerance?: number
  explanation: string
}

type ScoreEntry = {
  id: string
  username: string
  mode: string
  score: number
  correct: number
  avg_time_seconds: number
  created_at: string
}

// ─── EASY QUESTIONS ───────────────────────────────────────────────────────────
function generateEasyQuestion(): Question {
  const type = Math.floor(Math.random() * 5)

  if (type === 0) {
    // Multiplication — friendly numbers
    const pairs = [[25,12],[15,8],[50,14],[20,35],[25,16],[40,15],[12,15],[25,24],[30,14],[16,25],[50,22],[20,45]]
    const [a, b] = pairs[Math.floor(Math.random() * pairs.length)]
    return { question: `${a} × ${b} = ?`, answer: a * b, explanation: `${a} × ${b} = ${a * b}` }
  }
  if (type === 1) {
    // Division — clean results
    const pairs = [[840,4],[750,25],[360,12],[480,8],[900,15],[650,25],[720,9],[450,18],[840,7],[560,14]]
    const [a, b] = pairs[Math.floor(Math.random() * pairs.length)]
    return { question: `${a} ÷ ${b} = ?`, answer: a / b, explanation: `${a} ÷ ${b} = ${a / b}` }
  }
  if (type === 2) {
    // Percentages — clean numbers
    const pcts = [[15,200],[20,350],[25,160],[10,430],[5,600],[15,400],[20,250],[25,240],[10,870],[30,200]]
    const [p, n] = pcts[Math.floor(Math.random() * pcts.length)]
    const ans = (p / 100) * n
    return { question: `${p}% of ${n} = ?`, answer: ans, explanation: `${p}% × ${n} = ${ans}` }
  }
  if (type === 3) {
    // Fractions to %
    const fracs: [number, number, number][] = [[1,4,25],[3,4,75],[1,8,12.5],[3,8,37.5],[1,5,20],[2,5,40],[3,5,60],[1,2,50],[7,8,87.5],[1,10,10]]
    const [n, d, ans] = fracs[Math.floor(Math.random() * fracs.length)]
    return { question: `${n}/${d} as a percentage = ?`, answer: ans, tolerance: 0.1, explanation: `${n}/${d} = ${ans}%` }
  }
  // Rule of 72
  const rates = [6, 8, 9, 12, 4, 3, 6, 8]
  const rate = rates[Math.floor(Math.random() * rates.length)]
  const ans = Math.round(72 / rate)
  return { question: `Rule of 72: at ${rate}% annual return, how many years to double?`, answer: ans, tolerance: 1, explanation: `72 ÷ ${rate} = ${ans} years` }
}

// ─── HARD QUESTIONS ───────────────────────────────────────────────────────────
function generateHardQuestion(): Question {
  const type = Math.floor(Math.random() * 6)

  if (type === 0) {
    // Harder multiplication
    const pairs = [[17,23],[19,21],[13,27],[16,24],[18,22],[14,26],[23,17],[27,13],[34,15],[45,12],[36,14],[28,25]]
    const [a, b] = pairs[Math.floor(Math.random() * pairs.length)]
    return { question: `${a} × ${b} = ?`, answer: a * b, explanation: `${a} × ${b} = ${a * b}` }
  }
  if (type === 1) {
    // Harder division
    const safePairs = [[391,17],[483,21],[672,24],[525,15],[646,17],[374,22],[432,18],[510,15]]
    const [a, b] = safePairs[Math.floor(Math.random() * safePairs.length)]
    return { question: `${a} ÷ ${b} = ?`, answer: a / b, tolerance: 0.5, explanation: `${a} ÷ ${b} = ${a / b}` }
  }
  if (type === 2) {
    // Probability — coin flips
    const scenarios: [string, number, string][] = [
      ['exactly 2 heads in 3 flips', 37.5, '3 ways (HHT,HTH,THH) out of 8 = 3/8 = 37.5%'],
      ['exactly 3 heads in 4 flips', 25, 'C(4,3)/16 = 4/16 = 25%'],
      ['at least 1 head in 2 flips', 75, '1 - P(0 heads) = 1 - 1/4 = 75%'],
      ['exactly 2 heads in 4 flips', 37.5, 'C(4,2)/16 = 6/16 = 37.5%'],
      ['0 heads in 3 flips', 12.5, '(1/2)³ = 1/8 = 12.5%'],
      ['at least 2 heads in 3 flips', 50, 'P(2H) + P(3H) = 3/8 + 1/8 = 4/8 = 50%'],
    ]
    const [scenario, ans, explanation] = scenarios[Math.floor(Math.random() * scenarios.length)]
    return { question: `Fair coin: P(${scenario}) = ? (answer as %)`, answer: ans, tolerance: 0.5, explanation }
  }
  if (type === 3) {
    // Probability — dice
    const scenarios: [string, number, string][] = [
      ['rolling a sum of 7 with 2 dice', 16.7, '6 ways out of 36 = 1/6 ≈ 16.7%'],
      ['rolling a sum of 6 with 2 dice', 13.9, '5 ways out of 36 ≈ 13.9%'],
      ['rolling doubles with 2 dice', 16.7, '6 ways out of 36 = 1/6 ≈ 16.7%'],
      ['rolling a sum > 9 with 2 dice', 16.7, '6 ways (10,11,12) out of 36 ≈ 16.7%'],
      ['rolling at least one 6 with 2 dice', 30.6, '1 - (5/6)² = 11/36 ≈ 30.6%'],
    ]
    const [scenario, ans, explanation] = scenarios[Math.floor(Math.random() * scenarios.length)]
    return { question: `2 dice: P(${scenario}) = ? (answer as %)`, answer: ans, tolerance: 1, explanation }
  }
  if (type === 4) {
    // Expected value
    const evs: [string, number, string][] = [
      ['A bet pays $150 if you roll a 6 (1 die), costs $20 to play. EV = $?', 5, 'EV = (1/6 × $150) - (5/6 × $20) = $25 - $16.67 = $8.33... closest: $5 — use: (150/6) - 20 = 25 - 20 = $5'],
      ['A coin flip pays $80 for heads, you lose $40 for tails. EV = $?', 20, 'EV = 0.5×$80 + 0.5×(-$40) = $40 - $20 = $20'],
      ['30% chance of winning $100, 70% chance of losing $30. EV = $?', 9, 'EV = 0.3×$100 + 0.7×(-$30) = $30 - $21 = $9'],
      ['40% chance of winning $60, 60% chance of losing $25. EV = $?', 9, 'EV = 0.4×$60 + 0.6×(-$25) = $24 - $15 = $9'],
    ]
    const [q, ans, explanation] = evs[Math.floor(Math.random() * evs.length)]
    return { question: q, answer: ans, tolerance: 2, explanation }
  }
  // Percentage change
  const changes: [number, number][] = [[40,47],[50,60],[80,92],[100,115],[200,230],[60,75],[120,138]]
  const [from, to] = changes[Math.floor(Math.random() * changes.length)]
  const ans = Math.round(((to - from) / from) * 100)
  return { question: `Stock goes from $${from} to $${to}. What % gain? (whole number)`, answer: ans, tolerance: 1, explanation: `(${to}-${from})/${from} × 100 = ${ans}%` }
}

// ─── TIMER COMPONENT ──────────────────────────────────────────────────────────
function CountdownTimer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [timeLeft, setTimeLeft] = useState(seconds)
  const ref = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    setTimeLeft(seconds)
  }, [seconds])

  useEffect(() => {
    if (timeLeft <= 0) { onExpire(); return }
    ref.current = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(ref.current)
  }, [timeLeft])

  const pct = (timeLeft / seconds) * 100
  const color = timeLeft > 15 ? '#22c55e' : timeLeft > 8 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-2 rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[13px] font-mono font-bold" style={{ color }}>{timeLeft}s</span>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function TraderMathPage() {
  const [screen, setScreen] = useState<Screen>('home')
  const [mode, setMode] = useState<Mode>('easy')
  const [question, setQuestion] = useState<Question | null>(null)
  const [input, setInput] = useState('')
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [streak, setStreak] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [questionTimes, setQuestionTimes] = useState<number[]>([])
  const [questionStart, setQuestionStart] = useState<number>(0)
  const [timerKey, setTimerKey] = useState(0)
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([])
  const [username, setUsername] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [scoreSaved, setScoreSaved] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        supabase.from('profiles').select('username').eq('id', user.id).single().then(({ data }) => {
          if (data) setUsername(data.username)
        })
      }
    })
  }, [])

  function nextQuestion() {
    const q = mode === 'easy' ? generateEasyQuestion() : generateHardQuestion()
    setQuestion(q)
    setInput('')
    setFeedback(null)
    setQuestionStart(Date.now())
    setTimerKey(k => k + 1)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function startGame(m: Mode) {
    setMode(m)
    setLives(3)
    setScore(0)
    setCorrect(0)
    setWrong(0)
    setStreak(0)
    setQuestionTimes([])
    setScoreSaved(false)
    setFeedback(null)
    setScreen('playing')
    const q = m === 'easy' ? generateEasyQuestion() : generateHardQuestion()
    setQuestion(q)
    setInput('')
    setQuestionStart(Date.now())
    setTimerKey(k => k + 1)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  function handleTimerExpire() {
    handleWrong()
  }

  function handleCorrect() {
    const elapsed = (Date.now() - questionStart) / 1000
    setQuestionTimes(prev => [...prev, elapsed])
    const newStreak = streak + 1
    setStreak(newStreak)
    setCorrect(c => c + 1)
    let pts = mode === 'hard' ? 200 : 100
    if (elapsed < 5) pts = Math.round(pts * 2)
    else if (elapsed < 10) pts = Math.round(pts * 1.5)
    else if (elapsed < 15) pts = Math.round(pts * 1.25)
    if (newStreak >= 3) pts += 50
    setScore(s => s + pts)
    setFeedback('correct')
    setTimeout(() => nextQuestion(), 800)
  }

  function handleWrong() {
    const elapsed = (Date.now() - questionStart) / 1000
    setQuestionTimes(prev => [...prev, elapsed])
    const newLives = lives - 1
    setLives(newLives)
    setWrong(w => w + 1)
    setStreak(0)
    setFeedback('wrong')
    if (newLives <= 0) {
      setTimeout(() => endGame(), 900)
    } else {
      setTimeout(() => nextQuestion(), 1000)
    }
  }

  async function endGame() {
    setScreen('gameover')
    if (userId && username) {
      const avgTime = questionTimes.length > 0
        ? questionTimes.reduce((a, b) => a + b, 0) / questionTimes.length
        : 0
      await supabase.from('trader_scores').insert({
        user_id: userId,
        username,
        mode,
        score,
        correct,
        wrong,
        avg_time_seconds: Math.round(avgTime * 10) / 10
      })
      setScoreSaved(true)
    }
  }

  function submitAnswer() {
    if (!question || feedback) return
    const val = parseFloat(input)
    if (isNaN(val)) return
    const tolerance = question.tolerance ?? 0
    if (Math.abs(val - question.answer) <= tolerance) {
      handleCorrect()
    } else {
      handleWrong()
    }
  }

  async function loadLeaderboard() {
    const { data } = await supabase
      .from('trader_scores')
      .select('*')
      .eq('mode', mode)
      .order('score', { ascending: false })
      .limit(10)
    if (data) setLeaderboard(data)
    setScreen('leaderboard')
  }

  const avgTime = questionTimes.length > 0
    ? (questionTimes.reduce((a, b) => a + b, 0) / questionTimes.length).toFixed(1)
    : '0'

  // ── HOME ────────────────────────────────────────────────────────────────────
  if (screen === 'home') return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar active="trader" />
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="text-[12px] font-mono text-zinc-500 mb-2">Trader Math</div>
        <h1 style={{fontFamily:'Georgia,serif'}} className="text-4xl font-bold text-white mb-4">Mental Math Trainer</h1>
        <p className="text-zinc-400 text-[14px] mb-10 leading-relaxed">
          Practice the mental math and probability questions asked in S&T interviews. 3 wrong answers ends the game.
        </p>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-left hover:border-emerald-700 transition-colors cursor-pointer" onClick={() => startGame('easy')}>
            <div className="text-2xl mb-3">🧮</div>
            <div style={{fontFamily:'Georgia,serif'}} className="text-white font-bold text-lg mb-2">Easy Mode</div>
            <div className="text-zinc-400 text-[12px] leading-relaxed mb-4">Clean arithmetic — multiplication, division, percentages, fractions. No timer.</div>
            <div className="text-[11px] font-mono text-emerald-400">No time limit · 3 lives</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-left hover:border-red-700 transition-colors cursor-pointer" onClick={() => startGame('hard')}>
            <div className="text-2xl mb-3">📊</div>
            <div style={{fontFamily:'Georgia,serif'}} className="text-white font-bold text-lg mb-2">Hard Mode</div>
            <div className="text-zinc-400 text-[12px] leading-relaxed mb-4">Probability, expected value, harder arithmetic. 30 second timer per question.</div>
            <div className="text-[11px] font-mono text-red-400">30s timer · 3 lives</div>
          </div>
        </div>
        <button onClick={loadLeaderboard} className="text-[12px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors">
          View leaderboard →
        </button>
      </div>
    </main>
  )

  // ── PLAYING ─────────────────────────────────────────────────────────────────
  if (screen === 'playing') return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar active="trader" />
      <div className="max-w-lg mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-1">
            {[1,2,3].map(i => (
              <span key={i} className="text-xl">{i <= lives ? '❤️' : '🖤'}</span>
            ))}
          </div>
          <div className="text-center">
            <div className="text-[11px] font-mono text-zinc-500">SCORE</div>
            <div style={{fontFamily:'Georgia,serif'}} className="text-2xl font-bold text-white">{score}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-mono text-zinc-500">STREAK</div>
            <div className="text-[18px] font-bold text-amber-400">{streak > 0 ? `🔥 ${streak}` : '–'}</div>
          </div>
        </div>

        {/* Timer (hard mode only) */}
        {mode === 'hard' && question && (
          <div className="mb-6">
            <CountdownTimer key={timerKey} seconds={30} onExpire={handleTimerExpire} />
          </div>
        )}

        {/* Question */}
        {question && (
          <div className={`bg-zinc-900 border rounded-xl p-8 mb-6 text-center transition-colors ${
            feedback === 'correct' ? 'border-emerald-500 bg-emerald-950/20' :
            feedback === 'wrong' ? 'border-red-500 bg-red-950/20' :
            'border-zinc-800'
          }`}>
            <div style={{fontFamily:'Georgia,serif'}} className="text-xl font-bold text-white mb-2 leading-relaxed">{question.question}</div>
            {feedback === 'correct' && <div className="text-emerald-400 text-[13px] font-mono mt-3">✓ Correct! +points</div>}
            {feedback === 'wrong' && <div className="text-red-400 text-[13px] font-mono mt-3">✗ {question.explanation}</div>}
          </div>
        )}

        {/* Input */}
        {!feedback && (
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="number"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitAnswer()}
              placeholder="Your answer..."
              className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-violet-500 rounded-lg px-4 py-3 text-[15px] text-zinc-200 placeholder-zinc-600 outline-none font-mono"
            />
            <button onClick={submitAnswer}
              className="bg-violet-600 hover:bg-violet-700 text-white font-medium px-6 py-3 rounded-lg transition-colors text-[14px]">
              Submit
            </button>
          </div>
        )}

        {/* Stats bar */}
        <div className="flex items-center justify-center gap-6 mt-6 text-[11px] font-mono text-zinc-600">
          <span>✓ {correct} correct</span>
          <span>✗ {wrong} wrong</span>
          <span>mode: {mode}</span>
        </div>
      </div>
    </main>
  )

  // ── GAME OVER ───────────────────────────────────────────────────────────────
  if (screen === 'gameover') return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar active="trader" />
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="text-5xl mb-4">💀</div>
        <h1 style={{fontFamily:'Georgia,serif'}} className="text-3xl font-bold text-white mb-2">Game Over</h1>
        <p className="text-zinc-400 text-[14px] mb-8">3 wrong answers — better luck next time</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-[11px] font-mono text-zinc-500 mb-1">SCORE</div>
            <div style={{fontFamily:'Georgia,serif'}} className="text-3xl font-bold text-white">{score}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-[11px] font-mono text-zinc-500 mb-1">CORRECT</div>
            <div style={{fontFamily:'Georgia,serif'}} className="text-3xl font-bold text-emerald-400">{correct}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-[11px] font-mono text-zinc-500 mb-1">AVG TIME</div>
            <div style={{fontFamily:'Georgia,serif'}} className="text-3xl font-bold text-amber-400">{avgTime}s</div>
          </div>
        </div>

        {!userId && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 mb-6 text-[13px] text-zinc-400">
            <a href="/login" className="text-violet-400 hover:text-violet-300">Sign in</a> to save your score to the leaderboard
          </div>
        )}
        {scoreSaved && (
          <div className="bg-emerald-950/30 border border-emerald-800 rounded-xl p-4 mb-6 text-[13px] text-emerald-400">
            ✓ Score saved to leaderboard!
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button onClick={() => startGame(mode)}
            className="bg-violet-600 hover:bg-violet-700 text-white font-medium px-6 py-3 rounded-lg transition-colors text-[14px]">
            Play again
          </button>
          <button onClick={() => startGame(mode === 'easy' ? 'hard' : 'easy')}
            className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium px-6 py-3 rounded-lg transition-colors text-[14px]">
            Try {mode === 'easy' ? 'Hard' : 'Easy'} mode
          </button>
          <button onClick={loadLeaderboard}
            className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium px-6 py-3 rounded-lg transition-colors text-[14px]">
            Leaderboard
          </button>
        </div>
      </div>
    </main>
  )

  // ── LEADERBOARD ─────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar active="trader" />
      <div className="max-w-lg mx-auto px-6 py-10">
        <button onClick={() => setScreen('home')} className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 mb-6 flex items-center gap-1">← Back</button>
        <div className="flex items-center justify-between mb-6">
          <h1 style={{fontFamily:'Georgia,serif'}} className="text-2xl font-bold text-white">Leaderboard</h1>
          <div className="flex gap-2">
            {(['easy','hard'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); loadLeaderboard() }}
                className={`text-[11px] font-mono px-3 py-1.5 rounded-md border transition-colors ${mode === m ? 'border-violet-500 text-violet-400 bg-violet-950/30' : 'border-zinc-700 text-zinc-400'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {leaderboard.length === 0 && (
            <div className="text-center text-zinc-600 font-mono text-[13px] py-12">No scores yet — be the first!</div>
          )}
          {leaderboard.map((entry, i) => (
            <div key={entry.id} className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
              <div className={`text-[13px] font-mono font-bold w-6 text-center ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-amber-700' : 'text-zinc-600'}`}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
              </div>
              <div className="flex-1">
                <div className="text-[13px] text-zinc-200 font-medium">@{entry.username}</div>
                <div className="text-[11px] font-mono text-zinc-600">{entry.correct} correct · {entry.avg_time_seconds}s avg</div>
              </div>
              <div style={{fontFamily:'Georgia,serif'}} className="text-xl font-bold text-white">{entry.score}</div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <button onClick={() => startGame(mode)} className="bg-violet-600 hover:bg-violet-700 text-white font-medium px-6 py-3 rounded-lg transition-colors text-[14px]">
            Play {mode} mode →
          </button>
        </div>
      </div>
    </main>
  )
}