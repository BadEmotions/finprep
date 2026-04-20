'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'
import { supabase } from '../../lib/supabase'

const QUESTIONS = [
  { id: 1, title: "Walk me through the 3 statements effect of $10 depreciation increase", difficulty: "easy", category: "ib" },
  { id: 2, title: "How does a $100M cash acquisition affect the acquirer's EPS?", difficulty: "medium", category: "ib" },
  { id: 3, title: "Explain the DCF valuation methodology", difficulty: "easy", category: "ib" },
  { id: 4, title: "What is EBITDA and why do investors use it?", difficulty: "easy", category: "ib" },
  { id: 5, title: "FCF impact when working capital increases by $20M", difficulty: "medium", category: "ib" },
  { id: 6, title: "What drives WACC and how does leverage affect it?", difficulty: "medium", category: "ib" },
  { id: 7, title: "LBO — what are the key drivers of returns?", difficulty: "hard", category: "pe" },
  { id: 8, title: "Goodwill: how is it created and when is it impaired?", difficulty: "medium", category: "ib" },
  { id: 9, title: "When should revenue be recognized under ASC 606?", difficulty: "medium", category: "ib" },
  { id: 10, title: "Walk me through a merger accretion/dilution analysis", difficulty: "hard", category: "ib" },
  { id: 11, title: "What are deferred tax assets and liabilities?", difficulty: "medium", category: "ib" },
  { id: 12, title: "Walk me through a comparable company analysis", difficulty: "medium", category: "ib" },
  { id: 13, title: "How do precedent transactions differ from trading comps?", difficulty: "medium", category: "ib" },
  { id: 14, title: "Walk me through a paper LBO", difficulty: "hard", category: "pe" },
  { id: 15, title: "How does stock-based compensation affect the 3 statements?", difficulty: "medium", category: "ib" },
  { id: 16, title: "What is the difference between EBITDA and Free Cash Flow?", difficulty: "easy", category: "ib" },
  { id: 17, title: "What is the difference between Enterprise Value and Equity Value?", difficulty: "easy", category: "ib" },
  { id: 18, title: "What are synergies in M&A and how are they valued?", difficulty: "medium", category: "ib" },
  { id: 19, title: "What valuation methodologies would you use to value a company?", difficulty: "easy", category: "ib" },
  { id: 20, title: "How does a PE firm create value in a portfolio company?", difficulty: "medium", category: "pe" },
  { id: 21, title: "How do you calculate the cost of equity using CAPM?", difficulty: "medium", category: "ib" },
  { id: 22, title: "What is a dividend recapitalization?", difficulty: "hard", category: "pe" },
  { id: 23, title: "Walk me through a DCF step by step with numbers", difficulty: "hard", category: "ib" },
]

const catLabel: Record<string, string> = { ib: 'Investment Banking', pe: 'Private Equity', hf: 'Hedge Fund', general: 'General' }
const catColor: Record<string, string> = {
  ib: 'text-blue-400 bg-blue-950/30 border-blue-800',
  pe: 'text-violet-400 bg-violet-950/30 border-violet-800',
  hf: 'text-amber-400 bg-amber-950/30 border-amber-800',
  general: 'text-zinc-400 bg-zinc-900 border-zinc-700',
}
const diffColor: Record<string, string> = {
  easy: 'text-emerald-400',
  medium: 'text-amber-400',
  hard: 'text-red-400',
}

type Attempt = {
  id: string
  question_id: number
  score: number
  max_score: number
  created_at: string
}

type SolvedQuestion = {
  question_id: number
  score: number
  max_score: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [username, setUsername] = useState<string | null>(null)
  const [solved, setSolved] = useState<SolvedQuestion[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const [profileRes, solvedRes, attemptsRes] = await Promise.all([
        supabase.from('profiles').select('username').eq('id', user.id).single(),
        supabase.from('solved_questions').select('question_id, score, max_score').eq('user_id', user.id),
        supabase.from('attempts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      ])

      if (profileRes.data) setUsername(profileRes.data.username)
      if (solvedRes.data) setSolved(solvedRes.data)
      if (attemptsRes.data) setAttempts(attemptsRes.data)
      setLoading(false)
    }
    load()
  }, [router])

  const solvedIds = new Set(solved.map(s => s.question_id))
  const totalSolved = solvedIds.size
  const totalQuestions = QUESTIONS.length
  const avgScore = solved.length > 0
    ? Math.round(solved.reduce((sum, s) => sum + (s.score / s.max_score) * 100, 0) / solved.length)
    : 0

  const categories = ['ib', 'pe']
  const categoryStats = categories.map(cat => {
    const catQuestions = QUESTIONS.filter(q => q.category === cat)
    const catSolved = catQuestions.filter(q => solvedIds.has(q.id))
    return { cat, total: catQuestions.length, solved: catSolved.length }
  })

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <Navbar active="dashboard" />
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-600 font-mono text-[13px]">Loading...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar active="dashboard" />
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-10">
          <div className="text-[12px] font-mono text-zinc-500 mb-1">Dashboard</div>
          <h1 style={{fontFamily:'Georgia,serif'}} className="text-3xl font-bold text-white">
            {username ? `@${username}` : 'Your progress'}
          </h1>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-2">Questions solved</div>
            <div style={{fontFamily:'Georgia,serif'}} className="text-4xl font-bold text-white mb-1">
              {totalSolved}<span className="text-zinc-600 text-xl">/{totalQuestions}</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full mt-3">
              <div className="h-1.5 bg-emerald-500 rounded-full transition-all" style={{width: `${(totalSolved/totalQuestions)*100}%`}} />
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-2">Avg score</div>
            <div style={{fontFamily:'Georgia,serif'}} className={`text-4xl font-bold mb-1 ${avgScore >= 75 ? 'text-emerald-400' : avgScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
              {avgScore}<span className="text-zinc-600 text-xl">%</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full mt-3">
              <div className="h-1.5 rounded-full transition-all" style={{width: `${avgScore}%`, background: avgScore >= 75 ? '#22c55e' : avgScore >= 50 ? '#f59e0b' : '#ef4444'}} />
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-2">Total attempts</div>
            <div style={{fontFamily:'Georgia,serif'}} className="text-4xl font-bold text-white mb-1">{attempts.length}</div>
            <div className="text-[11px] font-mono text-zinc-600 mt-3">across all questions</div>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-4">Progress by role</div>
          <div className="grid grid-cols-2 gap-3">
            {categoryStats.map(({ cat, total, solved }) => (
              <div key={cat} className={`border rounded-lg p-4 ${catColor[cat]}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium">{catLabel[cat]}</span>
                  <span className="text-[11px] font-mono">{solved}/{total}</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full">
                  <div className="h-1.5 rounded-full transition-all" style={{width: `${(solved/total)*100}%`, background: 'currentColor'}} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent attempts */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-4">Recent attempts</div>
          {attempts.length === 0 ? (
            <div className="text-center py-8 text-zinc-600 text-[13px] font-mono">
              No attempts yet — <a href="/problems" className="text-violet-400 hover:text-white">start practicing →</a>
            </div>
          ) : (
            <div className="space-y-2">
              {attempts.map((a) => {
                const q = QUESTIONS.find(q => q.id === a.question_id)
                const pct = Math.round((a.score / a.max_score) * 100)
                const date = new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                return (
                  <div key={a.id} className="flex items-center gap-3 py-2 border-b border-zinc-800 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] text-zinc-200 truncate">{q?.title ?? `Question ${a.question_id}`}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {q && <span className={`text-[10px] font-mono ${diffColor[q.difficulty]}`}>{q.difficulty}</span>}
                        {q && <span className="text-[10px] font-mono text-zinc-600">{catLabel[q.category]}</span>}
                        <span className="text-[10px] font-mono text-zinc-600">{date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-[11px] font-mono text-zinc-400">{a.score}/{a.max_score}</div>
                      <div className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded ${pct >= 75 ? 'text-emerald-400 bg-emerald-950/50' : pct >= 50 ? 'text-amber-400 bg-amber-950/50' : 'text-red-400 bg-red-950/50'}`}>
                        {pct}%
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}