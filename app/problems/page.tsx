'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../components/Navbar'

const QUESTIONS = [
  {
    id: 1, slug: 'depreciation-3-statements',
    title: "Walk me through the 3 statements effect of $10 depreciation increase",
    difficulty: "easy", category: "accounting", type: "structured",
    prompt: "A company increases depreciation by $10. Walk me through how this flows through the Income Statement, Balance Sheet, and Cash Flow Statement. Assume 25% tax rate.",
    answerStructure: [
      { num: "1", text: "Income Statement — state what happens to EBIT and net income" },
      { num: "2", text: "Apply the tax rate — show the after-tax impact (don't forget the shield)" },
      { num: "3", text: "Cash Flow Statement — add back the non-cash charge, show net cash" },
      { num: "4", text: "Balance Sheet — name which line items change and by how much" },
      { num: "5", text: "Verify it balances: Assets = Liabilities + Equity" },
    ],
    rubric: [
      { item: "Net income falls (by $7.50 after tax)", keywords: ["net income","net profit","bottom line","earnings","profit falls","income falls","income decreases","income drops","income goes down","profit goes down","after-tax","7.50","7.5","reduce income","lower income","hurt earnings"], weight: 2, bullet: "Net income falls by $7.50, not $10 — always apply the tax rate." },
      { item: "Tax shield (depreciation saves taxes)", keywords: ["tax shield","tax benefit","tax saving","tax rate","25%","saves tax","reduces tax","tax impact","taxes decrease","tax effect","tax deductible","shields","tax break"], weight: 2, bullet: "Flag the tax shield explicitly — depreciation is tax-deductible, saving $2.50 at 25%." },
      { item: "Add back depreciation on the CFS (non-cash charge)", keywords: ["add back","non-cash","cash flow","operating activities","cfo","addback","add it back","depreciation back","cash flow statement","added back","non cash","noncash","not a cash"], weight: 2, bullet: "On the CFS, always add back depreciation because it's non-cash." },
      { item: "Net cash effect is +$2.50", keywords: ["cash increases","cash goes up","2.50","2.5","net cash","positive cash","cash effect","cash impact","cash improves","cash up","cash rises","more cash"], weight: 1, bullet: "Net cash = –$7.50 + $10 = +$2.50. State the number." },
      { item: "PP&E decreases on the Balance Sheet", keywords: ["pp&e","ppe","property plant","fixed asset","asset decreases","asset falls","balance sheet","accumulated depreciation","asset side","long-term asset","plant decreases"], weight: 1, bullet: "PP&E falls by $10 on the asset side." },
      { item: "Retained earnings decreases", keywords: ["retained earnings","equity","shareholders equity","book value","re falls","equity decreases","equity side","equity goes down","stockholders","owners equity","equity is lower"], weight: 1, bullet: "Retained Earnings falls by $7.50 — always confirm the balance sheet balances." },
    ],
    idealAnswer: "IS: Depreciation +$10 → EBIT –$10 → Net Income –$7.50 (tax shield = $2.50 at 25%). CFS: Net Income –$7.50, add back D&A +$10 → net cash +$2.50. BS: PP&E –$10, Cash +$2.50, Retained Earnings –$7.50 → balanced."
  },
  {
    id: 2, slug: 'cash-acquisition-eps',
    title: "How does a $100M cash acquisition affect the acquirer's EPS?",
    difficulty: "medium", category: "accounting", type: "structured",
    prompt: "An acquirer with 50M diluted shares and $200M net income acquires a target for $100M cash at 10x earnings. How does this affect EPS?",
    answerStructure: [
      { num: "1", text: "Calculate what the target earns (price ÷ PE multiple = $10M)" },
      { num: "2", text: "Estimate lost interest income on the deployed cash" },
      { num: "3", text: "State that no new shares are issued (cash deal = no dilution)" },
      { num: "4", text: "Net the earnings gain vs. interest loss" },
      { num: "5", text: "Conclude: is the deal accretive or dilutive to EPS?" },
    ],
    rubric: [
      { item: "Acquired earnings add ~$10M to net income", keywords: ["target earns","acquired earnings","10 million","$10m","earns $10","earnings add","contribute earnings","$10 earnings","earning $10","target profit","10m earnings","adds $10","gains $10"], weight: 2, bullet: "Start with target earnings: $100M ÷ 10x = $10M/year." },
      { item: "Lost interest income on the $100M cash", keywords: ["interest income","lost interest","opportunity cost","foregone interest","interest on cash","cash earns","return on cash","interest lost","losing interest","cost of cash"], weight: 2, bullet: "Deploying $100M means losing interest. At ~5%, that's ~$3.75M after-tax." },
      { item: "Cash deal — no new shares issued", keywords: ["no dilution","no new shares","cash deal","share count","same shares","50 million","shares unchanged","not issuing","denominator unchanged","paid in cash"], weight: 2, bullet: "Cash deals don't issue shares — EPS denominator stays at 50M." },
      { item: "Deal is accretive to EPS", keywords: ["accretive","accretion","eps increases","eps goes up","eps rises","positive impact","net benefit","earnings per share increases","eps accretive"], weight: 2, bullet: "Net income change ≈ +$6.25M with same share count → EPS goes from $4.00 to ~$4.13. State accretive." },
      { item: "Goodwill created if price exceeds book value", keywords: ["goodwill","intangible","premium over book","purchase price exceeds","book value","fair value","above book"], weight: 1, bullet: "Goodwill is created if price > FV of net assets. Not amortized under GAAP." },
    ],
    idealAnswer: "Target earns $10M ($100M ÷ 10x). Lost interest: ~$3.75M after-tax. Net income: +$6.25M. No new shares → EPS: $206.25M ÷ 50M = $4.125 vs $4.00. Deal is EPS-accretive by ~3%."
  },
  {
    id: 3, slug: 'dcf-methodology',
    title: "Explain the DCF valuation methodology",
    difficulty: "easy", category: "dcf", type: "short",
    prompt: "Explain how a DCF works, walk through the key steps, and describe its main limitations.",
    answerStructure: [
      { num: "1", text: "Define DCF in one sentence — what is it trying to do?" },
      { num: "2", text: "Step through: project FCF, discount at WACC, add terminal value" },
      { num: "3", text: "State the output: EV = PV(FCFs) + PV(TV), then subtract net debt" },
      { num: "4", text: "Flag the key limitation: sensitivity to assumptions" },
    ],
    rubric: [
      { item: "Project future cash flows over a forecast period", keywords: ["free cash flow","fcf","future cash","projected cash","cash the company generates","forecast cash","project cash","estimates cash","cash generation","future earnings","cash produced","projecting","forecast period"], weight: 2, bullet: "Define FCF clearly — EBIT×(1–T) + D&A – Capex – ΔNWC." },
      { item: "Discount cash flows at WACC", keywords: ["wacc","discount","cost of capital","weighted average","discount rate","discounting","present value","required return","discounted","pv of","risk-adjusted"], weight: 2, bullet: "FCFs are discounted at WACC to reflect the risk of those cash flows." },
      { item: "Terminal value captures value beyond the forecast", keywords: ["terminal value","tv","gordon growth","exit multiple","perpetuity","beyond forecast","long-term value","continuing value","residual value","terminal","end value","value beyond"], weight: 2, bullet: "Terminal value drives 60–80% of total value. Name the method: Gordon Growth or exit multiple." },
      { item: "EV = PV of FCFs + PV of terminal value", keywords: ["enterprise value","ev","sum of pv","add up","pv of fcf","present value of","total value","firm value","equals pv","value of firm","business value","company worth"], weight: 2, bullet: "State the output: EV = Σ PV(FCFs) + PV(Terminal Value)." },
      { item: "Subtract net debt to get equity value", keywords: ["equity value","net debt","subtract debt","bridge","add cash","remove debt","per share","share price","equity from ev","less debt"], weight: 1, bullet: "Equity Value = EV – Net Debt ÷ diluted shares = intrinsic value per share." },
      { item: "Sensitive to WACC and growth rate assumptions", keywords: ["sensitive","sensitivity","assumption","small change","wacc assumption","growth rate","terminal assumption","most sensitive","key risk","depends heavily","highly sensitive"], weight: 1, bullet: "Always flag sensitivity — a 0.5% move in WACC can swing value 20–30%." },
    ],
    idealAnswer: "A DCF values a business by discounting future FCFs to present value. Steps: (1) Project FCFs; (2) Discount at WACC; (3) Add Terminal Value; (4) EV = Σ PV(FCFs) + PV(TV); (5) Equity Value = EV – Net Debt ÷ diluted shares. Key limitation: highly sensitive to WACC and terminal growth — TV often drives 60–80% of total value."
  },
  {
    id: 4, slug: 'ebitda-explained',
    title: "What is EBITDA and why do investors use it?",
    difficulty: "easy", category: "valuation", type: "short",
    prompt: "Explain what EBITDA is, how it is calculated, and why investors use it. What are its drawbacks?",
    answerStructure: [
      { num: "1", text: "Define the acronym and state the formula (EBIT + D&A)" },
      { num: "2", text: "Explain the main use case: cash flow proxy, capital-structure agnostic" },
      { num: "3", text: "Name where it's used: EV/EBITDA multiple in M&A and LBOs" },
      { num: "4", text: "State the key drawback: ignores capex, overstates cash for heavy industries" },
    ],
    rubric: [
      { item: "Definition and formula (EBIT + D&A)", keywords: ["earnings before interest","before interest","interest taxes depreciation","ebitda stands","ebit plus","add back da","adding back","non-cash charges","before tax and interest","stands for","defined as"], weight: 1, bullet: "Define it: Earnings Before Interest, Taxes, Depreciation & Amortization = EBIT + D&A." },
      { item: "Proxy for operating cash flow", keywords: ["cash flow","cash generation","operating cash","approximate cash","cash proxy","cash earnings","represents cash","cash produced","cash from operations","measures cash","reflects cash","cash equivalent","like cash"], weight: 2, bullet: "EBITDA approximates cash from operations by stripping out non-cash items and financing costs." },
      { item: "Capital structure agnostic — enables comparisons", keywords: ["capital structure","compare","cross-company","removes leverage","different debt","agnostic","same basis","apples to apples","regardless of debt","ignores debt","exclude interest","normalize","comparable"], weight: 2, bullet: "Capital-structure agnostic — compare companies with different debt levels on the same basis." },
      { item: "Used in EV/EBITDA valuation multiple", keywords: ["ev/ebitda","ebitda multiple","valuation multiple","trading multiple","enterprise value","8x","10x","times ebitda","multiple of ebitda","lbo","acquisition","m&a","deal"], weight: 2, bullet: "EV/EBITDA is the standard deal multiple — know typical ranges by industry." },
      { item: "Ignores capex — not true FCF", keywords: ["ignores capex","capex","capital expenditure","not free cash flow","overstates cash","working capital","maintenance","misleading","doesn't include capex","excludes capital","misses capex","overstate"], weight: 2, bullet: "Key flaw: ignores capex and working capital — overstates cash for capital-intensive businesses." },
    ],
    idealAnswer: "EBITDA = EBIT + D&A. Used because: (1) proxy for operating cash flow; (2) capital-structure agnostic; (3) EV/EBITDA is the standard M&A multiple. Drawback: ignores capex and working capital — a capital-intensive business can have high EBITDA but negative FCF."
  },
  {
    id: 5, slug: 'working-capital-fcf',
    title: "FCF impact when working capital increases by $20M",
    difficulty: "medium", category: "accounting", type: "structured",
    prompt: "AR increases $15M, inventory increases $10M, AP increases $5M. Net income unchanged. What is the impact on Free Cash Flow?",
    answerStructure: [
      { num: "1", text: "State the rule: current asset ↑ = use of cash; current liability ↑ = source" },
      { num: "2", text: "Apply to AR (+$15M) and inventory (+$10M) → uses of cash" },
      { num: "3", text: "Apply to AP (+$5M) → source of cash" },
      { num: "4", text: "Net it: –$15M – $10M + $5M = –$20M FCF impact" },
      { num: "5", text: "Conclude: profitable ≠ cash generative" },
    ],
    rubric: [
      { item: "AR increase = use of cash (–$15M)", keywords: ["accounts receivable","ar increases","ar is use","receivable","use of cash","cash decreases","reduces cash","outflow","current asset increase","asset goes up","haven't collected"], weight: 2, bullet: "AR up = revenue recognized but cash not collected → use of cash, –$15M." },
      { item: "Inventory increase = use of cash (–$10M)", keywords: ["inventory","use of cash","cash decreases","reduces cash","outflow","bought inventory","stocking up","built inventory","current asset","inventory up","spending on inventory"], weight: 2, bullet: "Inventory up = cash spent to build stock → use of cash, –$10M." },
      { item: "AP increase = source of cash (+$5M)", keywords: ["accounts payable","ap increases","ap source","payable","source of cash","cash improves","inflow","current liability","liability increases","delaying payment","owe suppliers","haven't paid"], weight: 2, bullet: "AP up = goods received but not paid → source of cash, +$5M." },
      { item: "Net FCF impact = –$20M", keywords: ["net working capital","nwc","20m","$20","reduces fcf","fcf falls","fcf decreases","negative 20","net impact","total impact","fcf drops","down 20","decreases by 20"], weight: 2, bullet: "Net: –$15M – $10M + $5M = –$20M FCF. Net income flat but cash fell $20M." },
    ],
    idealAnswer: "AR +$15M = –$15M FCF; Inventory +$10M = –$10M FCF; AP +$5M = +$5M FCF. Net FCF = –$20M. Net income unchanged but cash fell $20M — scaling companies consume working capital even when profitable."
  },
  {
    id: 6, slug: 'wacc-leverage',
    title: "What drives WACC and how does leverage affect it?",
    difficulty: "medium", category: "dcf", type: "short",
    prompt: "Explain the components of WACC and what happens to WACC as a company increases financial leverage.",
    answerStructure: [
      { num: "1", text: "Write out the WACC formula with all components" },
      { num: "2", text: "Explain why debt is cheaper (tax-deductible interest)" },
      { num: "3", text: "Describe what happens initially as leverage rises (WACC falls)" },
      { num: "4", text: "Describe what happens beyond the optimal point (WACC rises)" },
    ],
    rubric: [
      { item: "WACC formula (cost of equity + after-tax cost of debt, weighted)", keywords: ["cost of equity","cost of debt","after-tax","weighted average","ke","kd","formula","e/v","d/v","equity and debt","blend of","combines cost","weighted by"], weight: 2, bullet: "State the formula: WACC = (E/V × Ke) + (D/V × Kd × (1–T))." },
      { item: "Debt is cheaper because interest is tax-deductible", keywords: ["tax deductible","tax shield","debt cheaper","interest deductible","cheaper than equity","after-tax cost","tax benefit of debt","tax saving","deductible","interest is tax","lower cost"], weight: 2, bullet: "Debt is cheaper than equity because interest is tax-deductible." },
      { item: "More debt initially lowers WACC", keywords: ["initially lower","lowers wacc","reduces wacc","decreases wacc","wacc falls","lower initially","moderate debt","benefit of leverage","wacc goes down","cheaper capital","adding debt helps"], weight: 2, bullet: "Substituting expensive equity with cheaper debt lowers the weighted average." },
      { item: "Excessive leverage raises WACC via distress risk", keywords: ["financial distress","too much debt","distress cost","cost of equity rises","bankruptcy","beyond optimal","risk increases","cost goes up","wacc rises","wacc increases","distress","over-levered"], weight: 2, bullet: "Beyond optimal, distress risk pushes Ke and Kd higher — WACC rises." },
    ],
    idealAnswer: "WACC = (E/V × Ke) + (D/V × Kd × (1–T)). Debt is cheaper because interest is tax-deductible. Adding moderate debt initially lowers WACC. Beyond the optimal structure, financial distress raises Ke and Kd, causing WACC to rise."
  },
  {
    id: 7, slug: 'lbo-return-drivers',
    title: "LBO — what are the key drivers of returns?",
    difficulty: "hard", category: "lbo", type: "structured",
    prompt: "A PE fund buys a company at 8x EBITDA with 60% debt. Exits at 9x after 5 years; EBITDA grows $100M → $150M. What are the three main return drivers?",
    answerStructure: [
      { num: "1", text: "Name all three drivers upfront" },
      { num: "2", text: "EBITDA growth: show the EV math ($150M × 9x = $1.35B vs $800M entry)" },
      { num: "3", text: "Multiple expansion: 8x entry vs 9x exit" },
      { num: "4", text: "Debt paydown: entry equity = $320M, FCF reduces debt, equity grows" },
      { num: "5", text: "Conclude with MOIC/IRR estimate" },
    ],
    rubric: [
      { item: "EBITDA growth / operational improvement", keywords: ["ebitda growth","operational","revenue growth","margin expansion","ebitda increases","grow ebitda","ebitda goes up","150","50% growth","improve operations","higher ebitda","ebitda improvement","increase ebitda"], weight: 3, bullet: "Quantify: $100M → $150M at 9x = $1.35B EV vs $800M entry. Show the math." },
      { item: "Multiple expansion (8x entry → 9x exit)", keywords: ["multiple expansion","8x to 9x","exit multiple","higher multiple","multiple arbitrage","re-rate","bought at 8","sell at 9","8 times","9 times","multiple goes up","entry multiple","exit at higher"], weight: 2, bullet: "Buying at 8x and exiting at 9x is a pure valuation gain on top of EBITDA growth." },
      { item: "Debt paydown grows equity value", keywords: ["debt paydown","deleveraging","pay down debt","debt repaid","debt decreases","debt reduced","leverage falls","equity increases","fcf to debt","cash flow pays debt","debt amortization","debt goes down","repay"], weight: 3, bullet: "With 60% debt, FCF pays down leverage — less debt on same EV = more equity." },
      { item: "IRR / MOIC to measure returns", keywords: ["irr","moic","multiple of invested","internal rate","annualized return","3x","4x","return multiple","hold period","5 years","time value","money on money","cash-on-cash"], weight: 1, bullet: "Close with MOIC and IRR: a 3–4x MOIC over 5 years ≈ 25–32% IRR." },
    ],
    idealAnswer: "Three drivers: (1) EBITDA Growth — $100M→$150M at 9x = $1.35B vs $800M entry. (2) Multiple Expansion — 8x→9x. (3) Debt Paydown — entry equity = $320M. If debt falls to ~$200M, exit equity = $1.15B. MOIC ≈ 3.6x → IRR ≈ 29%."
  },
  {
    id: 8, slug: 'goodwill',
    title: "Goodwill: how is it created and when is it impaired?",
    difficulty: "medium", category: "accounting", type: "short",
    prompt: "Explain how goodwill is created in M&A, what it represents, and when it must be impaired.",
    answerStructure: [
      { num: "1", text: "Define goodwill + give the formula (Purchase Price – FV of Net Identifiable Assets)" },
      { num: "2", text: "Give a quick number example ($500M – $300M = $200M)" },
      { num: "3", text: "State accounting treatment — not amortized, tested annually for impairment" },
      { num: "4", text: "Explain when impairment is triggered + financial impact (non-cash write-down)" },
    ],
    rubric: [
      { item: "Goodwill formula (Purchase Price – FV of Net Identifiable Assets)", keywords: ["purchase price minus","purchase price exceeds","fair value of net","identifiable assets","net assets","premium over","price paid minus","difference between price","goodwill equals","excess purchase"], weight: 2, bullet: "State the formula: Goodwill = Purchase Price – FV of Net Identifiable Assets. Give a number example." },
      { item: "Represents intangible premium (synergies, brand, reputation)", keywords: ["synergies","brand","assembled workforce","going concern","strategic","intangible","unidentifiable","premium paid","value of brand","anticipated synergies","relationships","customer base","reputation","extra value"], weight: 2, bullet: "Goodwill = synergies, brand equity, customer relationships — value you can't separately appraise." },
      { item: "Not amortized — tested annually for impairment", keywords: ["not amortized","no amortization","annual test","impairment test","gaap","annually","tested each year","impairment testing","not depreciated","doesn't amortize","annual impairment","sits on balance sheet"], weight: 2, bullet: "Goodwill is NOT amortized under GAAP. Tested annually for impairment." },
      { item: "Impairment = write-down when value drops (non-cash hit to earnings)", keywords: ["impairment","write down","write-down","loses value","reduced when","company does poorly","decline in value","impaired","write-off","non-cash","reporting unit","charge against earnings","hits income statement","reduces net income","underperform","falls below"], weight: 2, bullet: "When FV of reporting unit < carrying value → non-cash write-down, reduces NI but not cash." },
    ],
    idealAnswer: "Goodwill = Purchase Price – FV of Net Identifiable Assets. E.g., pay $500M for a company with $300M net assets → $200M goodwill. Represents synergies, brand, workforce. Under GAAP: not amortized, tested annually. Impairment = carrying value > FV of reporting unit → non-cash write-down."
  },
]

type Question = typeof QUESTIONS[0]
type RubricResult = { item: string; hit: boolean; weight: number; bullet: string }
type GradeResult = { results: RubricResult[]; score: number; maxScore: number }

function grade(q: Question, text: string): GradeResult {
  const lower = text.toLowerCase()
  let score = 0, maxScore = 0
  const results = q.rubric.map(r => {
    const hit = r.keywords.some(k => lower.includes(k.toLowerCase()))
    maxScore += r.weight
    if (hit) score += r.weight
    return { item: r.item, hit, weight: r.weight, bullet: r.bullet }
  })
  return { results, score, maxScore }
}

function getScoreContext(pct: number) {
  if (pct === 100) return "You nailed every concept — this is interview-ready."
  if (pct >= 80) return "You got the core ideas. Add the missing mechanics and this is a strong answer."
  if (pct >= 60) return "You understood the concept — now add the technical detail to make it interview-ready."
  if (pct >= 35) return "You got the gist, but an interviewer would want more precision."
  return "Review this topic and try again — use the structure guide to build your answer step by step."
}

const catLabel: Record<string, string> = { accounting: 'Accounting', valuation: 'Valuation', dcf: 'DCF', lbo: 'LBO' }
const diffColor: Record<string, string> = {
  easy: 'bg-emerald-900/50 text-emerald-400 border border-emerald-800',
  medium: 'bg-amber-900/50 text-amber-400 border border-amber-800',
  hard: 'bg-red-900/50 text-red-400 border border-red-800',
}

function DiffBadge({ d }: { d: string }) {
  return <span className={`inline-flex text-[10px] font-mono rounded px-2 py-0.5 font-medium ${diffColor[d]}`}>{d}</span>
}

function ResultsPanel({ q, result, onReset }: { q: Question; result: GradeResult; onReset: () => void }) {
  const [idealOpen, setIdealOpen] = useState(false)
  const [missExpanded, setMissExpanded] = useState(false)
  const pct = Math.round((result.score / result.maxScore) * 100)
  const hits = result.results.filter(r => r.hit)
  const misses = result.results.filter(r => !r.hit)
  const visibleMisses = missExpanded ? misses : misses.slice(0, 3)
  const ringColor = pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'
  const headline = pct >= 85 ? "Interview-ready" : pct >= 70 ? "Strong answer" : pct >= 50 ? "Good foundation" : pct >= 30 ? "Getting there" : "Review this topic"
  const r = 25, circ = 2 * Math.PI * r, dash = (pct / 100) * circ

  return (
    <div className="space-y-3">
      <button onClick={onReset} className="text-[11px] font-mono text-violet-400 border border-zinc-700 rounded-md px-3 py-1.5 hover:bg-zinc-800 transition-colors">↺ Try again</button>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-4">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="32" cy="32" r={r} fill="none" stroke="#27272a" strokeWidth="6" />
            <circle cx="32" cy="32" r={r} fill="none" stroke={ringColor} strokeWidth="6"
              strokeDasharray={`${dash.toFixed(1)} ${circ.toFixed(1)}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono text-sm font-medium text-white leading-none">{result.score}/{result.maxScore}</span>
            <span className="font-mono text-[9px] text-zinc-500 mt-0.5">{pct}%</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-serif text-base font-semibold text-white mb-1">{headline}</div>
          <div className="text-[11px] font-mono text-zinc-400 mb-1">{hits.length} of {result.results.length} concepts · {result.score}/{result.maxScore} pts</div>
          <div className="text-[11px] text-amber-400 mb-2 leading-snug">{getScoreContext(pct)}</div>
          <div className="h-1 bg-zinc-800 rounded-full w-full">
            <div className="h-1 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: ringColor }} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 mb-2">✓ What you got right</div>
          <div className="space-y-1.5">
            {hits.length === 0 ? <div className="text-[11px] font-mono text-zinc-600 italic">None matched — try again.</div>
              : hits.map((r, i) => (
                <div key={i} className="flex items-start gap-1.5 text-emerald-400 text-[11px] leading-snug">
                  <span className="flex-shrink-0 mt-0.5">✓</span>
                  <span className="flex-1">{r.item}</span>
                  <span className="flex-shrink-0 text-[9px] font-mono bg-zinc-800 border border-zinc-700 rounded px-1 py-0.5 text-zinc-500">{r.weight}pt</span>
                </div>
              ))}
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-red-400 mb-2">✗ What you missed</div>
          <div className="space-y-1.5">
            {misses.length === 0 ? <div className="text-[11px] font-mono text-emerald-400">Nothing — perfect!</div>
              : <>
                {visibleMisses.map((r, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-red-400 text-[11px] leading-snug">
                    <span className="flex-shrink-0 mt-0.5">✗</span>
                    <span className="flex-1">{r.item}</span>
                    <span className="flex-shrink-0 text-[9px] font-mono bg-zinc-800 border border-zinc-700 rounded px-1 py-0.5 text-zinc-500">{r.weight}pt</span>
                  </div>
                ))}
                {!missExpanded && misses.length > 3 && (
                  <button onClick={() => setMissExpanded(true)} className="text-[10px] font-mono text-violet-400 hover:text-white mt-1">+ {misses.length - 3} more →</button>
                )}
              </>}
          </div>
        </div>
      </div>
      {misses.length > 0 ? (
        <div className="bg-blue-950/50 border border-blue-900 rounded-lg p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-blue-400 mb-2">💡 How to improve</div>
          <div className="space-y-2">
            {misses.slice(0, 5).map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-[12px] text-blue-300 leading-relaxed">
                <span className="font-mono text-blue-500 flex-shrink-0 mt-0.5">–</span>
                <span>{r.bullet}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950/50 border border-emerald-800 rounded-lg p-3 text-[12px] text-emerald-400">
          🎯 You covered every concept. This is an interview-ready answer.
        </div>
      )}
      <div className="bg-purple-950/50 border border-purple-900 rounded-lg p-3">
        <div className="text-[10px] font-mono uppercase tracking-wider text-purple-400 mb-2">🧩 How to structure your answer</div>
        <div className="space-y-2">
          {q.answerStructure.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-[12px] text-purple-200 leading-relaxed">
              <span className="flex-shrink-0 text-[10px] font-mono bg-purple-900/50 text-purple-400 rounded px-1.5 py-0.5 mt-0.5">{s.num}</span>
              <span>{s.text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
        <button onClick={() => setIdealOpen(o => !o)} className="w-full flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">🧠 Strong answer</span>
          <span className="text-[11px] font-mono text-violet-400">{idealOpen ? 'Hide ↑' : 'Show ↓'}</span>
        </button>
        {idealOpen && (
          <div className="mt-3 pt-3 border-t border-zinc-800 text-[12px] text-zinc-400 leading-relaxed">{q.idealAnswer}</div>
        )}
      </div>
    </div>
  )
}

function SolvePage({ q, onBack, onSolved, userId }: { q: Question; onBack: () => void; onSolved: (id: number, score: number, max: number) => void; userId: string | null }) {
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<GradeResult | null>(null)
  const [grading, setGrading] = useState(false)

  async function submit() {
    if (answer.trim().length < 10) return
    setGrading(true)
    setTimeout(async () => {
      const r = grade(q, answer)
      setResult(r)
      setGrading(false)

     // Save to Supabase if logged in
      if (userId) {
        // Save/update solved status
        await supabase.from('solved_questions').upsert({
          user_id: userId,
          question_id: q.id,
          score: r.score,
          max_score: r.maxScore,
        }, { onConflict: 'user_id,question_id' })

        // Save every attempt for history
        await supabase.from('attempts').insert({
          user_id: userId,
          question_id: q.id,
          score: r.score,
          max_score: r.maxScore,
        })
      }

      onSolved(q.id, r.score, r.maxScore)
    }, 700)
  }

  function reset() {
    setAnswer('')
    setResult(null)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 hover:text-white mb-4 transition-colors">
        ← Back to questions
      </button>
      <div className="flex items-center gap-2 mb-2">
        <DiffBadge d={q.difficulty} />
        <span className="text-[10px] font-mono bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-zinc-400">{catLabel[q.category]}</span>
        <span className="text-[10px] font-mono bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-zinc-400">{q.type === 'structured' ? 'Structured' : 'Short Answer'}</span>
      </div>
      <h1 className="text-xl font-semibold text-white mb-4 leading-snug" style={{fontFamily:'Georgia,serif'}}>{q.title}</h1>
      <div className="bg-zinc-900 border-l-4 border-violet-600 border border-zinc-800 rounded-lg p-4 mb-4">
        <p className="text-[13px] text-zinc-200 leading-relaxed">{q.prompt}</p>
      </div>
      {!result && (
        <>
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2">Your answer</div>
          <div className="relative mb-4">
            <textarea value={answer} onChange={e => setAnswer(e.target.value)}
              placeholder="Write your answer here…"
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-violet-500 rounded-lg p-3 pr-28 text-[13px] text-zinc-200 placeholder-zinc-600 resize-none h-28 outline-none transition-colors font-sans" />
            <button onClick={submit} disabled={grading || answer.trim().length < 10}
              className="absolute bottom-3 right-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-[12px] font-medium rounded-md px-3 py-1.5 transition-colors whitespace-nowrap">
              {grading ? 'Grading…' : 'Grade →'}
            </button>
          </div>
        </>
      )}
      {result && <ResultsPanel q={q} result={result} onReset={reset} />}
    </div>
  )
}

const DIFFICULTIES = ['easy', 'medium', 'hard']
const CATEGORIES = ['accounting', 'valuation', 'dcf', 'lbo']

export default function ProblemsPage() {
  const [activeQ, setActiveQ] = useState<Question | null>(null)
  const [solved, setSolved] = useState<Set<number>>(new Set())
  const [selectedDiffs, setSelectedDiffs] = useState<Set<string>>(new Set())
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)

  // Load user and their solved questions on mount
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data } = await supabase
          .from('solved_questions')
          .select('question_id')
          .eq('user_id', user.id)
        if (data) {
          setSolved(new Set(data.map((r: { question_id: number }) => r.question_id)))
        }
      }
    }
    load()
  }, [])

  const filtered = QUESTIONS.filter(q => {
    const diffMatch = selectedDiffs.size === 0 || selectedDiffs.has(q.difficulty)
    const catMatch = selectedCats.size === 0 || selectedCats.has(q.category)
    return diffMatch && catMatch
  })

  function toggleDiff(d: string) {
    setSelectedDiffs(prev => { const next = new Set(prev); next.has(d) ? next.delete(d) : next.add(d); return next })
  }

  function toggleCat(c: string) {
    setSelectedCats(prev => { const next = new Set(prev); next.has(c) ? next.delete(c) : next.add(c); return next })
  }

  function openQ(q: Question) {
    setActiveQ(q)
    window.scrollTo(0, 0)
  }

  function handleSolved(id: number, score: number, max: number) {
    setSolved(prev => new Set([...prev, id]))
  }

  

  if (activeQ) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <Navbar active="problems" />
        <SolvePage q={activeQ} onBack={() => setActiveQ(null)} onSolved={handleSolved} userId={userId} />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar active="problems" />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-4 space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-600 w-16">Difficulty</span>
            {DIFFICULTIES.map(d => (
              <button key={d} onClick={() => toggleDiff(d)}
                className={`text-[11px] font-mono rounded-full px-3 py-1 border transition-colors ${selectedDiffs.has(d) ? diffColor[d] : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'}`}>
                {d}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-600 w-16">Category</span>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => toggleCat(c)}
                className={`text-[11px] font-mono rounded-full px-3 py-1 border transition-colors ${selectedCats.has(c) ? 'bg-violet-600 border-violet-600 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'}`}>
                {catLabel[c]}
              </button>
            ))}
          </div>
          {(selectedDiffs.size > 0 || selectedCats.size > 0) && (
            <button onClick={() => { setSelectedDiffs(new Set()); setSelectedCats(new Set()) }}
              className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors">
              × clear filters
            </button>
          )}
        </div>
        <div className="grid grid-cols-[28px_1fr_100px_75px_72px] gap-3 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-600 mb-1">
          <div>#</div><div>Title</div><div>Category</div><div>Difficulty</div><div className="text-right">Status</div>
        </div>
        <div className="flex flex-col gap-1">
          {filtered.length === 0 && <div className="text-center py-10 text-zinc-600 text-[12px] font-mono">No questions match.</div>}
          {filtered.map((q, i) => (
            <button key={q.id} onClick={() => openQ(q)}
              className="grid grid-cols-[28px_1fr_100px_75px_72px] gap-3 items-center px-3 py-2.5 rounded-lg bg-zinc-900 border border-transparent hover:bg-zinc-800 hover:border-zinc-700 text-left transition-all w-full">
              <div className="font-mono text-[10px] text-zinc-600">{String(i + 1).padStart(2, '0')}</div>
              <div>
                <div className="text-[12px] font-medium text-zinc-100 leading-snug">{q.title}</div>
                <div className="text-[10px] font-mono text-zinc-600 uppercase mt-0.5">{catLabel[q.category]}</div>
              </div>
              <div className="text-[10px] font-mono text-zinc-500">{q.type === 'structured' ? 'Structured' : 'Short Ans.'}</div>
              <div><DiffBadge d={q.difficulty} /></div>
              <div className="flex items-center justify-end gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${solved.has(q.id) ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
                <span className="text-[10px] font-mono text-zinc-600">{solved.has(q.id) ? '✓' : '–'}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}