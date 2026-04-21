'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import { supabase } from '../../lib/supabase'

type AnswerStructure = { num: string; text: string }
type RubricItem = { item: string; keywords: string[]; weight: number; bullet: string }

type Question = {
  id: number
  slug: string
  title: string
  difficulty: string
  category: string
  type: string
  prompt: string
  ideal_answer: string
  answer_structure: AnswerStructure[]
  rubric: RubricItem[]
  time_limit: number | null
}

type RubricResult = { item: string; hit: boolean; bullet: string; weight: number }
type GradeResult = { score: number; maxScore: number; results: RubricResult[] }

const catLabel: Record<string, string> = { ib: 'Investment Banking', pe: 'Private Equity', hf: 'Hedge Fund', st: 'Sales & Trading', general: 'General' }
const catColor: Record<string, string> = {
  ib: 'text-blue-400 bg-blue-950/30 border-blue-800',
  pe: 'text-violet-400 bg-violet-950/30 border-violet-800',
  hf: 'text-amber-400 bg-amber-950/30 border-amber-800',
  st: 'text-emerald-400 bg-emerald-950/30 border-emerald-800',
  general: 'text-zinc-400 bg-zinc-900 border-zinc-700',
}
const diffColor: Record<string, string> = {
  easy: 'text-emerald-400',
  medium: 'text-amber-400',
  hard: 'text-red-400',
}

function DiffBadge({ d }: { d: string }) {
  return <span className={`inline-flex text-[10px] font-mono rounded-full bg-zinc-900 border border-zinc-800 px-2 py-0.5 font-medium ${diffColor[d]}`}>{d}</span>
}

function gradeAnswer(answer: string, rubric: RubricItem[]): GradeResult {
  const lower = answer.toLowerCase()
  const results: RubricResult[] = rubric.map(r => {
    const hit = r.keywords.some(k => lower.includes(k.toLowerCase()))
    return { item: r.item, hit, bullet: r.bullet, weight: r.weight }
  })
  const score = results.filter(r => r.hit).reduce((s, r) => s + r.weight, 0)
  const maxScore = rubric.reduce((s, r) => s + r.weight, 0)
  return { score, maxScore, results }
}

function ResultsPanel({ q, result, onReset, nextQ, onNext }: {
  q: Question; result: GradeResult; onReset: () => void;
  nextQ: Question | null; onNext: (q: Question) => void
}) {
  const [idealOpen, setIdealOpen] = useState(false)
  const [missExpanded, setMissExpanded] = useState(false)
  const pct = Math.round((result.score / result.maxScore) * 100)
  const hits = result.results.filter(r => r.hit)
  const misses = result.results.filter(r => !r.hit)
  const visibleMisses = missExpanded ? misses : misses.slice(0, 3)
  const ringColor = pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'
  const headline = pct >= 85 ? 'Interview-ready' : pct >= 70 ? 'Strong answer' : pct >= 50 ? 'Good foundation' : pct >= 30 ? 'Getting there' : 'Review this topic'
  const r = 25, circ = 2 * Math.PI * r, dash = (pct / 100) * circ

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={onReset} className="text-[11px] font-mono text-violet-400 border border-zinc-700 rounded-md px-3 py-1.5 hover:bg-zinc-800 transition-colors">↺ Try again</button>
        {nextQ && (
          <button onClick={() => onNext(nextQ)} className="text-[11px] font-mono text-emerald-400 border border-emerald-800 bg-emerald-950/30 rounded-md px-3 py-1.5 hover:bg-emerald-900/50 transition-colors">
            Next → {nextQ.title.slice(0, 35)}...
          </button>
        )}
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-4">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="32" cy="32" r={r} fill="none" stroke="#27272a" strokeWidth="6" />
            <circle cx="32" cy="32" r={r} fill="none" stroke={ringColor} strokeWidth="6"
              strokeDasharray={`${dash.toFixed(1)} ${circ.toFixed(1)}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[13px] font-bold text-white font-mono">{pct}%</span>
          </div>
        </div>
        <div>
          <div style={{fontFamily:'Georgia,serif'}} className="text-white font-bold text-[15px] mb-0.5">{headline}</div>
          <div className="text-zinc-500 text-[11px] font-mono">{result.score}/{result.maxScore} points</div>
        </div>
      </div>
      {hits.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-2">What you got right</div>
          <ul className="space-y-1">
            {hits.map((h, i) => <li key={i} className="flex items-start gap-2 text-[12px] text-zinc-300"><span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>{h.item}</li>)}
          </ul>
        </div>
      )}
      {misses.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-2">How to improve</div>
          <ul className="space-y-2">
            {visibleMisses.map((m, i) => <li key={i} className="flex items-start gap-2 text-[12px] text-zinc-300"><span className="text-amber-400 mt-0.5 flex-shrink-0">→</span>{m.bullet}</li>)}
          </ul>
          {misses.length > 3 && (
            <button onClick={() => setMissExpanded(!missExpanded)} className="mt-2 text-[11px] font-mono text-zinc-500 hover:text-zinc-300">
              {missExpanded ? '↑ Show less' : `↓ Show ${misses.length - 3} more`}
            </button>
          )}
        </div>
      )}
      {q.answer_structure && q.answer_structure.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-3">How to structure your answer</div>
          {q.answer_structure.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-[12px] text-purple-200 leading-relaxed">
              <span className="flex-shrink-0 text-[10px] font-mono bg-purple-900/50 text-purple-400 rounded px-1.5 py-0.5 mt-0.5">{s.num}</span>
              <span>{s.text}</span>
            </div>
          ))}
        </div>
      )}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
        <button onClick={() => setIdealOpen(o => !o)} className="w-full flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-500">
          <span>🟣 Strong answer</span>
          <span className="text-violet-400">{idealOpen ? 'Hide ↑' : 'Show ↓'}</span>
        </button>
        {idealOpen && (
          <div className="mt-3 pt-3 border-t border-zinc-800 text-[12px] text-zinc-400 leading-relaxed">{q.ideal_answer}</div>
        )}
      </div>
    </div>
  )
}

function SolvePage({ q, onBack, onSolved, userId, onNext, questions }: {
  q: Question; onBack: () => void;
  onSolved: (id: number, score: number, max: number) => void;
  userId: string | null; onNext: (q: Question) => void;
  questions: Question[]
}) {
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<GradeResult | null>(null)
  const [grading, setGrading] = useState(false)
  const currentIndex = questions.findIndex(q2 => q2.id === q.id)
  const nextQ = currentIndex < questions.length - 1 ? questions[currentIndex + 1] : null

  async function submit() {
    if (answer.trim().length < 10) return
    setGrading(true)
    await new Promise(r => setTimeout(r, 600))
    const res = gradeAnswer(answer, q.rubric)
    setResult(res)
    setGrading(false)
    onSolved(q.id, res.score, res.maxScore)
    if (userId) {
      const { data: existing } = await supabase.from('solved_questions').select('score').eq('user_id', userId).eq('question_id', q.id).single()
      if (!existing || res.score > existing.score) {
        await supabase.from('solved_questions').upsert({ user_id: userId, question_id: q.id, score: res.score, max_score: res.maxScore })
      }
      await supabase.from('attempts').insert({ user_id: userId, question_id: q.id, score: res.score, max_score: res.maxScore })
    }
  }

  function reset() { setAnswer(''); setResult(null) }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <button onClick={onBack} className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 mb-6 flex items-center gap-1">← Back to questions</button>
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${catColor[q.category]}`}>{catLabel[q.category]}</span>
        <DiffBadge d={q.difficulty} />
      </div>
      <h1 style={{fontFamily:'Georgia,serif'}} className="text-2xl font-bold text-white mb-4">{q.title}</h1>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6 text-[13px] text-zinc-300 leading-relaxed">{q.prompt}</div>
      {!result && (
        <>
          <div className="text-[10px] font-mono uppercase tracking-wider text-purple-400 mb-2">How to structure your answer</div>
          <div className="relative mb-4">
            {q.answer_structure.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-[12px] text-purple-200 leading-relaxed">
                <span className="flex-shrink-0 text-[10px] font-mono bg-purple-900/50 text-purple-400 rounded px-1.5 py-0.5 mt-0.5">{s.num}</span>
                <span>{s.text}</span>
              </div>
            ))}
          </div>
          <div className="relative mb-4">
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Write your answer here…"
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-violet-500 rounded-lg p-3 pr-28 text-[13px] text-zinc-200 placeholder-zinc-600 resize-none h-28 outline-none"
            />
            <button onClick={submit} disabled={grading || answer.trim().length < 10}
              className="absolute bottom-3 right-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-[12px] font-medium rounded-md px-3 py-1.5 transition-colors w-">
              {grading ? 'Grading…' : 'Grade →'}
            </button>
          </div>
        </>
      )}
      {result && <ResultsPanel q={q} result={result} onReset={reset} nextQ={nextQ} onNext={(q) => { reset(); onNext(q) }} />}
    </div>
  )
}

const DIFFICULTIES = ['easy', 'medium', 'hard']
const CATEGORIES = ['ib', 'pe', 'hf', 'st', 'general']

export default function ProblemsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [activeQ, setActiveQ] = useState<Question | null>(null)
  const [solved, setSolved] = useState<Set<number>>(new Set())
  const [selectedDiffs, setSelectedDiffs] = useState<Set<string>>(new Set())
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
  async function load() {
    const { data, error } = await supabase.from('questions').select('*').order('id')
if (error) console.error('Supabase error:', error)
    if (data) {
      setQuestions(data)
      const params = new URLSearchParams(window.location.search)
      const qParam = params.get('q')
      if (qParam) {
        const found = data.find((q: Question) => q.id === parseInt(qParam))
        if (found) setActiveQ(found)
      }
    }
    setLoading(false)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      const { data: solvedData } = await supabase.from('solved_questions').select('question_id').eq('user_id', user.id)
      if (solvedData) setSolved(new Set(solvedData.map((s: {question_id: number}) => s.question_id)))
    }
  }
  load()
}, [])

  function handleSolved(id: number, score: number, max: number) {
    setSolved(prev => new Set([...prev, id]))
  }

  function toggleDiff(d: string) {
    setSelectedDiffs(prev => { const n = new Set(prev); n.has(d) ? n.delete(d) : n.add(d); return n })
  }

  function toggleCat(c: string) {
    setSelectedCats(prev => { const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n })
  }

  const filtered = questions.filter(q => {
    if (selectedDiffs.size > 0 && !selectedDiffs.has(q.difficulty)) return false
    if (selectedCats.size > 0 && !selectedCats.has(q.category)) return false
    if (search && !q.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  if (activeQ) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <Navbar active="problems" />
        <SolvePage
          q={activeQ}
          onBack={() => setActiveQ(null)}
          onSolved={handleSolved}
          userId={userId}
          questions={filtered}
          onNext={(q) => { setActiveQ(q); window.scrollTo(0, 0) }}
        />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar active="problems" />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="text-[12px] font-mono text-zinc-500 mb-1">Question bank</div>
          <h1 style={{fontFamily:'Georgia,serif'}} className="text-3xl font-bold text-white">Practice questions</h1>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search questions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 focus:border-violet-500 rounded-lg px-4 py-2.5 text-[13px] text-zinc-200 placeholder-zinc-600 outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => toggleCat(c)}
              className={`text-[11px] font-mono px-3 py-1.5 rounded-md border transition-colors ${selectedCats.has(c) ? catColor[c] : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}>
              {catLabel[c]} ({questions.filter(q => q.category === c).length})
            </button>
          ))}
          <div className="w-px bg-zinc-700 mx-1" />
          {DIFFICULTIES.map(d => (
            <button key={d} onClick={() => toggleDiff(d)}
              className={`text-[11px] font-mono px-3 py-1.5 rounded-md border transition-colors ${selectedDiffs.has(d) ? 'border-zinc-400 bg-zinc-800 text-white' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}>
              {d}
            </button>
          ))}
        </div>

        {/* Question list */}
        {loading ? (
          <div className="text-zinc-600 font-mono text-[13px]">Loading questions...</div>
        ) : (
          <div className="space-y-2">
            {filtered.map(q => (
              <div key={q.id} onClick={() => setActiveQ(q)}
                className="group flex items-center gap-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-xl px-5 py-4 cursor-pointer transition-all">
                <div className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors"
                  style={{ borderColor: solved.has(q.id) ? '#22c55e' : '#3f3f46' }}>
                  {solved.has(q.id) && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-zinc-200 group-hover:text-white truncate">{q.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${catColor[q.category]}`}>{catLabel[q.category]}</span>
                    <DiffBadge d={q.difficulty} />
                    {q.time_limit && <span className="text-[10px] font-mono text-amber-400">⏱ {q.time_limit}s</span>}
                  </div>
                </div>
                <div className="text-zinc-600 group-hover:text-zinc-400 text-[13px]">→</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}