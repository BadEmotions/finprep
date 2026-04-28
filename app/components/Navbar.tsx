'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Navbar({ active }: { active: 'home' | 'problems' | 'login' | 'dashboard' | 'trader' | 'modeling' }) {
  const router = useRouter()
  const pathname = usePathname()
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load user on mount
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single()
        if (data) setUsername(data.username)
      } else {
        setUsername(null)
      }
      setLoading(false)
    }
    loadUser()

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single()
        if (data) setUsername(data.username)
      } else {
        setUsername(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [pathname])

  async function signOut() {
    await supabase.auth.signOut()
    setUsername(null)
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="border-b border-zinc-800 px-6 py-4">
      <div className="max-w-5xl mx-auto flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="FinPrep" width={32} height={32} className="rounded" />
          <span style={{fontFamily:'Georgia,serif'}} className="text-lg font-bold text-white">FinPrep</span>
        </Link>

        <div className="flex items-center gap-1 ml-2">
          <Link href="/" className={`text-[13px] px-4 py-2 rounded-lg transition-colors ${active === 'home' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
            Home
          </Link>
          <Link href="/problems" className={`text-[13px] px-4 py-2 rounded-lg transition-colors ${active === 'problems' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
            Questions
          </Link>
          <Link href="/trader-math" className={`text-[13px] px-4 py-2 rounded-lg transition-colors ${active === 'trader' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>
          Trader Math
          </Link>
          <Link href="/modeling" className={`text-[13px] px-4 py-2 rounded-lg transition-colors ${active === 'modeling' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>
  Modeling
</Link>
          {username && (
            <Link href="/dashboard" className={`text-[13px] px-4 py-2 rounded-lg transition-colors ${active === 'dashboard' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
              Dashboard
            </Link>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-8 bg-zinc-800 rounded-lg animate-pulse" />
          ) : username ? (
            <>
              <span className="text-[13px] font-mono text-violet-400 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1">
                @{username}
              </span>
              <button onClick={signOut}
                className="text-[13px] px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className={`text-[13px] px-4 py-2 rounded-lg transition-colors ${active === 'login' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}