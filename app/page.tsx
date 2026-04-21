'use client'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from './components/Navbar'

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar active="home" />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-1.5 text-[12px] text-zinc-400 font-mono mb-8">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          Finance interview prep — free forever
        </div>
        <h1 style={{fontFamily:'Georgia,serif'}} className="text-5xl font-bold text-white mb-6 leading-tight">
          Crack your finance<br />interview with confidence
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Practice real interview questions for IB, PE, Hedge Funds, and S&T — with instant rubric-based grading and coaching feedback. Built for candidates targeting the most competitive roles in finance.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/problems" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-3 rounded-lg transition-colors text-[15px]">Start practicing free →</Link>
          <Link href="/login" className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium px-6 py-3 rounded-lg transition-colors text-[15px]">Sign up</Link>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-zinc-800 py-12">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          <div>
            <div style={{fontFamily:'Georgia,serif'}} className="text-4xl font-bold text-white mb-2">50+</div>
            <div className="text-zinc-400 text-[14px]">Finance questions</div>
          </div>
          <div>
            <div style={{fontFamily:'Georgia,serif'}} className="text-4xl font-bold text-white mb-2">4</div>
            <div className="text-zinc-400 text-[14px]">Role categories</div>
          </div>
          <div>
            <div style={{fontFamily:'Georgia,serif'}} className="text-4xl font-bold text-white mb-2">100%</div>
            <div className="text-zinc-400 text-[14px]">Free to use</div>
          </div>
        </div>
      </section>

      {/* What we offer */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <h2 style={{fontFamily:'Georgia,serif'}} className="text-3xl font-bold text-white text-center mb-4">Everything you need to prepare</h2>
        <p className="text-zinc-400 text-center mb-16 text-[15px]">Built for candidates targeting IB, PE, hedge funds, and S&T roles at top firms.</p>
        <div className="grid grid-cols-3 gap-6">
          {[
            { icon: '📊', title: 'Real interview questions', desc: 'Questions directly from IB, PE, hedge fund, and S&T interviews — technical, behavioral, and markets awareness.' },
            { icon: '⚡', title: 'Instant grading', desc: 'Submit your answer and get scored against a detailed rubric in seconds. No waiting, no subjectivity.' },
            { icon: '💡', title: 'Coaching feedback', desc: 'Miss a concept? Get targeted bullet-point feedback that tells you exactly what to add and how to say it.' },
            { icon: '🧩', title: 'Answer frameworks', desc: 'Every question has a step-by-step structure guide showing exactly how interviewers expect you to answer.' },
            { icon: '📈', title: 'Track progress', desc: 'See which questions you\'ve solved, your average score, and your attempt history over time.' },
            { icon: '🎯', title: 'Interview-ready answers', desc: 'Compare your answer to a model answer written the way you\'d actually say it in an interview room.' },
          ].map((f, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-600 transition-colors">
              <div className="text-2xl mb-4">{f.icon}</div>
              <div className="font-medium text-white text-[15px] mb-2">{f.title}</div>
              <div className="text-zinc-400 text-[13px] leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Role categories */}
      <section className="bg-zinc-900 border-y border-zinc-800 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <h2 style={{fontFamily:'Georgia,serif'}} className="text-3xl font-bold text-white text-center mb-4">Built for every front office role</h2>
          <p className="text-zinc-400 text-center mb-16 text-[15px]">Covering the technical and behavioral questions asked at the most competitive firms.</p>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Investment Banking', desc: 'Accounting, valuation, DCF, M&A, merger models, IPO process', color: 'border-blue-800 bg-blue-950/30', tag: 'IB' },
              { label: 'Private Equity', desc: 'LBO modeling, returns analysis, deal structure, fund mechanics', color: 'border-violet-800 bg-violet-950/30', tag: 'PE' },
              { label: 'Hedge Funds', desc: 'Stock pitches, portfolio construction, long/short equity, macro', color: 'border-amber-800 bg-amber-950/30', tag: 'HF' },
              { label: 'Sales & Trading', desc: 'Markets knowledge, options, rates, trader math, brain teasers', color: 'border-emerald-800 bg-emerald-950/30', tag: 'S&T' },
            ].map((c, i) => (
              <div key={i} className={`border rounded-xl p-5 ${c.color}`}>
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2">{c.tag}</div>
                <div className="font-medium text-white text-[15px] mb-2">{c.label}</div>
                <div className="text-zinc-400 text-[12px] leading-relaxed">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <h2 style={{fontFamily:'Georgia,serif'}} className="text-3xl font-bold text-white mb-4">Ready to start?</h2>
        <p className="text-zinc-400 mb-8 text-[15px]">Practice is free. No account required to get started.</p>
        <Link href="/problems" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-8 py-4 rounded-lg transition-colors text-[15px]">Browse all questions →</Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="FinPrep" width={24} height={24} className="rounded" />
            <span className="text-zinc-500 text-[13px]">FinPrep</span>
          </div>
          <div className="text-zinc-600 text-[12px] font-mono">finprep.academy</div>
        </div>
      </footer>
    </main>
  )
}