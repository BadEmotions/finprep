'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="FinPrep" width={32} height={32} className="rounded" />
            <span style={{fontFamily:'Georgia,serif'}} className="text-lg font-bold text-white">FinPrep</span>
          </Link>
          <div className="flex items-center gap-1 ml-2">
            <Link href="/" className="text-[13px] px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">Home</Link>
            <Link href="/problems" className="text-[13px] px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">Questions</Link>
            <Link href="/login" className="text-[13px] px-4 py-2 rounded-lg bg-zinc-800 text-white font-medium">Sign In</Link>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center min-h-[calc(100vh-73px)] px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Image src="/logo.png" alt="FinPrep" width={48} height={48} className="rounded-lg mx-auto mb-4" />
            <h1 style={{fontFamily:'Georgia,serif'}} className="text-2xl font-bold text-white mb-2">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-zinc-400 text-[14px]">
              {mode === 'signin' ? 'Sign in to track your progress' : 'Start practicing finance interviews for free'}
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
            <div className="flex bg-zinc-800 rounded-lg p-1 mb-6">
              <button onClick={() => setMode('signin')}
                className={`flex-1 text-[13px] font-medium py-2 rounded-md transition-colors ${mode === 'signin' ? 'bg-zinc-950 text-white' : 'text-zinc-400 hover:text-white'}`}>
                Sign in
              </button>
              <button onClick={() => setMode('signup')}
                className={`flex-1 text-[13px] font-medium py-2 rounded-md transition-colors ${mode === 'signup' ? 'bg-zinc-950 text-white' : 'text-zinc-400 hover:text-white'}`}>
                Sign up
              </button>
            </div>

            <div className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-[12px] font-mono text-zinc-400 uppercase tracking-wider mb-2">Full name</label>
                    <input value={name} onChange={e => setName(e.target.value)}
                      placeholder="John Smith"
                      className="w-full bg-zinc-800 border border-zinc-700 focus:border-emerald-600 rounded-lg px-4 py-3 text-[14px] text-white placeholder-zinc-600 outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-mono text-zinc-400 uppercase tracking-wider mb-2">Username</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-[14px]">@</span>
                      <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="johnsmith"
                        className="w-full bg-zinc-800 border border-zinc-700 focus:border-emerald-600 rounded-lg pl-8 pr-4 py-3 text-[14px] text-white placeholder-zinc-600 outline-none transition-colors" />
                    </div>
                    <p className="text-[11px] text-zinc-600 mt-1 font-mono">Letters, numbers, underscores only</p>
                  </div>
                </>
              )}
              <div>
                <label className="block text-[12px] font-mono text-zinc-400 uppercase tracking-wider mb-2">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)}
                  type="email" placeholder="you@example.com"
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-emerald-600 rounded-lg px-4 py-3 text-[14px] text-white placeholder-zinc-600 outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-[12px] font-mono text-zinc-400 uppercase tracking-wider mb-2">Password</label>
                <input value={password} onChange={e => setPassword(e.target.value)}
                  type="password" placeholder="••••••••"
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-emerald-600 rounded-lg px-4 py-3 text-[14px] text-white placeholder-zinc-600 outline-none transition-colors" />
              </div>
              <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg transition-colors text-[14px] mt-2">
                {mode === 'signin' ? 'Sign in →' : 'Create account →'}
              </button>
            </div>

            <p className="text-center text-zinc-500 text-[12px] mt-6">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="text-emerald-500 hover:text-emerald-400">
                {mode === 'signin' ? 'Sign up free' : 'Sign in'}
              </button>
            </p>
          </div>

          <p className="text-center text-zinc-600 text-[12px] mt-6 font-mono">
            No account needed to practice — <Link href="/problems" className="text-zinc-400 hover:text-white">start now →</Link>
          </p>
        </div>
      </div>
    </main>
  )
}