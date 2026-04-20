'use client'
import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { supabase } from '../../lib/supabase'

const QUESTIONS = [
  {
    id: 1, slug: 'depreciation-3-statements',
    title: "Walk me through the 3 statements effect of $10 depreciation increase",
    difficulty: "easy", category: "ib", type: "structured",
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
    difficulty: "medium", category: "ib", type: "structured",
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
    difficulty: "easy", category: "ib", type: "short",
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
    difficulty: "easy", category: "ib", type: "short",
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
    difficulty: "medium", category: "ib", type: "structured",
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
    difficulty: "medium", category: "ib", type: "short",
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
    difficulty: "hard", category: "pe", type: "structured",
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
    difficulty: "medium", category: "ib", type: "short",
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
  {
    id: 9, slug: 'revenue-recognition',
    title: "When should revenue be recognized under ASC 606?",
    difficulty: "medium", category: "ib", type: "short",
    prompt: "Explain the 5-step revenue recognition model under ASC 606 and give an example of how it applies to a software company.",
    answerStructure: [
      { num: "1", text: "Name the standard and what it replaced" },
      { num: "2", text: "Walk through all 5 steps in order" },
      { num: "3", text: "Apply to a software example (SaaS subscription)" },
      { num: "4", text: "Mention deferred revenue impact on the balance sheet" },
    ],
    rubric: [
      { item: "Identify the contract with the customer", keywords: ["identify contract","contract with customer","step 1","first step","agreement","enforceable","contract exists"], weight: 1, bullet: "Step 1: Identify the contract — must be enforceable with commercial substance." },
      { item: "Identify performance obligations", keywords: ["performance obligation","distinct","deliverable","separate obligation","identify obligations","step 2"], weight: 1, bullet: "Step 2: Identify distinct performance obligations — e.g. software license vs. support." },
      { item: "Determine transaction price", keywords: ["transaction price","total price","consideration","variable consideration","step 3","determine price"], weight: 1, bullet: "Step 3: Determine transaction price — include variable consideration if estimable." },
      { item: "Allocate price to performance obligations", keywords: ["allocate","allocation","relative","standalone selling price","step 4","apportion"], weight: 1, bullet: "Step 4: Allocate price to each obligation based on standalone selling prices." },
      { item: "Recognize revenue when obligation is satisfied", keywords: ["satisfied","transferred","control","step 5","recognize when","delivered","over time","point in time"], weight: 2, bullet: "Step 5: Recognize revenue when control transfers — over time or at a point in time." },
      { item: "Deferred revenue created when cash received before delivery", keywords: ["deferred revenue","unearned","liability","cash before","received upfront","prepaid","balance sheet liability","subscription"], weight: 2, bullet: "SaaS example: annual subscription paid upfront → deferred revenue recognized monthly." },
    ],
    idealAnswer: "ASC 606 5 steps: (1) Identify contract; (2) Identify performance obligations; (3) Determine transaction price; (4) Allocate price; (5) Recognize when obligation satisfied. SaaS example: $1,200 annual subscription → $100 recognized per month, $1,100 stays as deferred revenue on BS."
  },
  {
    id: 10, slug: 'merger-accretion-dilution',
    title: "Walk me through a merger accretion/dilution analysis",
    difficulty: "hard", category: "ib", type: "structured",
    prompt: "Acquirer has $500M net income, 100M shares, trades at 20x P/E. Target has $50M net income, acquired for $1B (50% stock, 50% cash) at 5% interest rate. Is the deal accretive or dilutive?",
    answerStructure: [
      { num: "1", text: "Calculate new shares issued (stock portion ÷ acquirer share price)" },
      { num: "2", text: "Calculate after-tax interest cost on cash portion" },
      { num: "3", text: "Calculate pro forma net income (acquirer + target – interest cost)" },
      { num: "4", text: "Calculate pro forma share count (old + new shares)" },
      { num: "5", text: "Compare pro forma EPS to standalone EPS → accretive or dilutive?" },
    ],
    rubric: [
      { item: "Acquirer share price = $100 (500M NI × 20x ÷ 100M shares)", keywords: ["share price","$100","100 dollars","20x","pe multiple","price per share","stock price","acquirer price"], weight: 2, bullet: "Acquirer EPS = $5, P/E = 20x → share price = $100." },
      { item: "New shares issued = 5M (500M stock ÷ $100)", keywords: ["new shares","5 million shares","shares issued","stock consideration","500 million","issued shares","dilution shares"], weight: 2, bullet: "Stock portion = $500M ÷ $100 = 5M new shares issued." },
      { item: "After-tax interest cost on $500M cash", keywords: ["interest cost","after tax interest","500 million cash","cash portion","interest expense","financing cost","debt interest","25 million","after-tax cost"], weight: 2, bullet: "Cash portion = $500M at 5% = $25M interest, after-tax at 25% = $18.75M cost." },
      { item: "Pro forma net income calculation", keywords: ["pro forma","combined","net income","adds target","550","531","total income","combined earnings","add earnings"], weight: 2, bullet: "Pro forma NI = $500M + $50M – $18.75M = $531.25M." },
      { item: "Deal is accretive to EPS", keywords: ["accretive","eps increases","higher eps","accretion","positive","eps goes up","per share increases","5.01","5.02","5.07"], weight: 2, bullet: "Pro forma EPS = $531.25M ÷ 105M shares = $5.06 vs $5.00 standalone → accretive." },
    ],
    idealAnswer: "Share price = $100. New shares = 5M. After-tax interest = $18.75M. Pro forma NI = $531.25M. Pro forma shares = 105M. Pro forma EPS = $5.06 vs $5.00 standalone → deal is accretive by ~1.2%."
  },
  {
    id: 11, slug: 'deferred-tax',
    title: "What are deferred tax assets and liabilities?",
    difficulty: "medium", category: "ib", type: "short",
    prompt: "Explain what deferred tax assets and liabilities are, what creates them, and how they flow through the financial statements.",
    answerStructure: [
      { num: "1", text: "Define the core concept — timing difference between book and tax" },
      { num: "2", text: "Give an example of a DTA (NOLs, warranty reserves)" },
      { num: "3", text: "Give an example of a DTL (accelerated depreciation)" },
      { num: "4", text: "Explain balance sheet and income statement impact" },
    ],
    rubric: [
      { item: "Timing difference between book and tax accounting", keywords: ["timing difference","temporary difference","book vs tax","gaap vs tax","accounting difference","recognition difference","book income","taxable income"], weight: 2, bullet: "DTAs/DTLs arise from temporary timing differences between GAAP and tax accounting." },
      { item: "DTA = will pay less tax in future (e.g. NOLs)", keywords: ["deferred tax asset","dta","pay less","future benefit","nol","net operating loss","warranty","overpaid tax","tax benefit","asset side","will save"], weight: 2, bullet: "DTA = you'll pay less tax in the future — e.g. NOL carryforwards, warranty reserves." },
      { item: "DTL = will pay more tax in future (e.g. accelerated depreciation)", keywords: ["deferred tax liability","dtl","pay more","accelerated depreciation","macrs","future obligation","will owe","tax timing","depreciation difference","liability side"], weight: 2, bullet: "DTL = you'll pay more tax later — e.g. accelerated depreciation for tax vs. straight-line for GAAP." },
      { item: "Impact on balance sheet and income statement", keywords: ["balance sheet","income statement","tax expense","effective tax rate","current vs deferred","tax provision","deferred portion","noncash","non-cash tax"], weight: 2, bullet: "Tax expense = current taxes paid + change in deferred taxes. DTL on BS = future tax obligation." },
    ],
    idealAnswer: "DTAs and DTLs arise from timing differences between GAAP and tax. DTA = future tax savings (e.g. NOL carryforward). DTL = future tax obligation (e.g. accelerated depreciation reduces taxes now, creates liability for later). Tax expense = current + deferred portions."
  },
  {
    id: 12, slug: 'comparable-company-analysis',
    title: "Walk me through a comparable company analysis",
    difficulty: "medium", category: "ib", type: "structured",
    prompt: "Explain how you would value a company using comparable company analysis (trading comps). What multiples would you use and what are the limitations?",
    answerStructure: [
      { num: "1", text: "Define what comps is trying to do (market-based relative valuation)" },
      { num: "2", text: "Walk through the steps: select peers, spread financials, calculate multiples" },
      { num: "3", text: "Name the key multiples (EV/EBITDA, EV/Revenue, P/E)" },
      { num: "4", text: "Apply to target: median multiple × target metric = implied value" },
      { num: "5", text: "State limitations" },
    ],
    rubric: [
      { item: "Select comparable companies (similar size, industry, growth)", keywords: ["comparable","peer","similar company","select peers","peer group","industry","same sector","benchmark","comp set","similar business"], weight: 2, bullet: "Select peers based on industry, size, growth profile, and geography." },
      { item: "Spread key financial metrics (EBITDA, revenue, earnings)", keywords: ["spread","financials","ebitda","revenue","earnings","metrics","financial data","calculate","ltm","last twelve months","ntm","forward"], weight: 2, bullet: "Spread LTM and NTM financials — EBITDA, revenue, net income, FCF." },
      { item: "Calculate trading multiples (EV/EBITDA, P/E)", keywords: ["ev/ebitda","multiple","p/e","price earnings","enterprise value","trading multiple","valuation multiple","ev/revenue","calculate multiple"], weight: 2, bullet: "Key multiples: EV/EBITDA (most common), EV/Revenue (for unprofitable), P/E (equity value)." },
      { item: "Apply median multiple to target to get implied value", keywords: ["apply","median","implied","target","implied value","implied ev","implied price","mean multiple","25th percentile","75th percentile","range"], weight: 2, bullet: "Apply median (or range) to target metric → implied EV, subtract net debt → equity value." },
      { item: "Limitations — market conditions, no truly identical companies", keywords: ["limitation","no identical","market conditions","cyclical","different accounting","not perfect","market sentiment","liquidity","minority discount","public market"], weight: 1, bullet: "Limitations: no two companies are identical, multiples reflect current market sentiment." },
    ],
    idealAnswer: "Comps: (1) Select peers by industry/size/growth; (2) Spread LTM/NTM financials; (3) Calculate EV/EBITDA, P/E, EV/Revenue; (4) Apply median multiple to target → implied EV; (5) Subtract net debt → equity value. Limitation: reflects public market sentiment, no two companies are identical."
  },
  {
    id: 13, slug: 'precedent-transactions',
    title: "How do precedent transactions differ from trading comps?",
    difficulty: "medium", category: "ib", type: "short",
    prompt: "Explain what precedent transaction analysis is, how it differs from comparable company analysis, and when you would use each.",
    answerStructure: [
      { num: "1", text: "Define precedent transactions" },
      { num: "2", text: "Explain the key difference — control premium" },
      { num: "3", text: "State when each is more appropriate" },
      { num: "4", text: "Name the key multiples used" },
    ],
    rubric: [
      { item: "Precedent transactions use M&A deal prices not public market prices", keywords: ["acquisition","deal price","transaction","m&a","paid in deal","takeover","bought","acquired","historical deal","past transaction","purchase price"], weight: 2, bullet: "Precedent transactions use prices paid in M&A deals, not public market trading prices." },
      { item: "Control premium — acquirers pay above market price", keywords: ["control premium","premium","above market","takeover premium","20%","30%","acquisition premium","pay more","higher than trading","premium over","bid premium"], weight: 3, bullet: "Key difference: deal prices include a control premium (typically 20–40% above trading price)." },
      { item: "Precedent transactions give higher valuation than trading comps", keywords: ["higher","more","greater value","above comps","higher multiple","premium to comps","deal multiples higher","transaction multiple"], weight: 2, bullet: "Precedent transaction multiples are typically higher than trading comps due to the control premium." },
      { item: "Use comps for current market value, precedents for M&A/sale context", keywords: ["when to use","sale process","selling","ipo","fairness opinion","m&a context","acquisition context","being sold","in a deal","banker"], weight: 1, bullet: "Use trading comps for current market value; use precedents when advising on a sale/acquisition." },
    ],
    idealAnswer: "Precedent transactions use M&A deal prices vs. trading comps which use public market prices. Key difference: deal prices include a control premium (20–40%), making transaction multiples higher. Use comps for current market value; use precedents when advising on a sale — they set the floor for what an acquirer should pay."
  },
  {
    id: 14, slug: 'lbo-paper-lbo',
    title: "Walk me through a paper LBO",
    difficulty: "hard", category: "pe", type: "structured",
    prompt: "A PE fund buys a company for $500M (5x EBITDA of $100M) with 60% debt. EBITDA grows 10% per year. All FCF pays down debt. Exit at 5x after 5 years. What is the MOIC and approximate IRR?",
    answerStructure: [
      { num: "1", text: "Calculate entry equity check ($500M × 40% = $200M)" },
      { num: "2", text: "Calculate exit EBITDA ($100M × 1.1^5 = ~$161M)" },
      { num: "3", text: "Calculate exit EV ($161M × 5x = $805M)" },
      { num: "4", text: "Calculate remaining debt (started at $300M, reduced by FCF)" },
      { num: "5", text: "Exit equity = EV – debt → MOIC = exit equity ÷ entry equity" },
    ],
    rubric: [
      { item: "Entry equity = $200M (40% of $500M)", keywords: ["200 million","equity check","entry equity","40%","200m","invested equity","equity contribution","sponsor equity","$200"], weight: 2, bullet: "Entry equity = $500M × 40% = $200M. Debt = $300M." },
      { item: "Exit EBITDA ~$161M (10% growth for 5 years)", keywords: ["161","162","160","exit ebitda","ebitda grows","10% growth","compounded","1.1 to the 5","five years growth","161m","grown ebitda"], weight: 2, bullet: "Exit EBITDA = $100M × 1.1^5 = ~$161M." },
      { item: "Exit EV = ~$805M (161M × 5x)", keywords: ["805","exit ev","exit enterprise value","161 times 5","5x exit","exit multiple","800 million","805m","exit value"], weight: 2, bullet: "Exit EV = $161M × 5x = ~$805M." },
      { item: "Debt paydown reduces leverage significantly", keywords: ["debt paydown","debt reduced","less debt","paid down","fcf pays","delever","debt decreases","remaining debt","lower debt","debt repaid"], weight: 2, bullet: "FCF pays down debt each year — remaining debt at exit is significantly less than $300M." },
      { item: "MOIC ~3x and IRR ~25%", keywords: ["moic","3x","2.5x","3.5x","irr","25%","20%","30%","return","multiple","money on money","cash on cash"], weight: 2, bullet: "Exit equity ≈ $505M+. MOIC ≈ 2.5–3x. IRR ≈ 20–25% over 5 years." },
    ],
    idealAnswer: "Entry equity = $200M. Exit EBITDA = $161M. Exit EV = $805M. Assume debt paid from ~$300M to ~$150M via FCF. Exit equity = $655M. MOIC = $655M ÷ $200M = 3.3x. IRR ≈ 27% over 5 years."
  },
  {
    id: 15, slug: 'stock-based-compensation',
    title: "How does stock-based compensation affect the 3 statements?",
    difficulty: "medium", category: "ib", type: "structured",
    prompt: "A company grants $10M in stock-based compensation. Walk through the impact on the income statement, cash flow statement, and balance sheet.",
    answerStructure: [
      { num: "1", text: "Income statement — SBC is an operating expense, reduces net income" },
      { num: "2", text: "Cash flow — added back as non-cash charge (like D&A)" },
      { num: "3", text: "Balance sheet — additional paid-in capital increases" },
      { num: "4", text: "Note: dilutive to EPS via higher share count" },
    ],
    rubric: [
      { item: "SBC reduces net income on income statement", keywords: ["operating expense","reduces net income","income statement","expense","lowers earnings","hits income","reduces profit","net income falls","compensation expense","opex"], weight: 2, bullet: "SBC is an operating expense — reduces pre-tax income by $10M, net income by $7.5M at 25% tax." },
      { item: "Added back on cash flow statement (non-cash)", keywords: ["add back","non-cash","cash flow","addback","not cash","no cash","operating activities","cfo","added back","cash flow statement","noncash"], weight: 2, bullet: "SBC is non-cash — added back on CFS just like D&A. No cash leaves the business." },
      { item: "APIC increases on balance sheet", keywords: ["apic","additional paid in capital","equity increases","paid in capital","shareholders equity","stockholders equity","equity section","capital increases","common stock","equity goes up"], weight: 2, bullet: "APIC increases by $10M on the balance sheet — offsetting the retained earnings decrease." },
      { item: "Dilutive to EPS — increases share count", keywords: ["dilutive","dilution","share count","more shares","eps decreases","eps dilution","denominator","options","restricted stock","rsu","diluted shares"], weight: 2, bullet: "SBC is dilutive — new shares issued reduce EPS even though no cash changes hands." },
    ],
    idealAnswer: "IS: SBC = $10M operating expense → Net income –$7.5M. CFS: Add back $10M (non-cash) → net cash impact = +$2.5M (tax shield). BS: Retained earnings –$7.5M, APIC +$10M → net equity +$2.5M. Also dilutive to EPS via higher share count."
  },
  {
    id: 16, slug: 'fcf-vs-ebitda',
    title: "What is the difference between EBITDA and Free Cash Flow?",
    difficulty: "easy", category: "ib", type: "short",
    prompt: "Explain the difference between EBITDA and Free Cash Flow. When would a company have high EBITDA but low or negative FCF?",
    answerStructure: [
      { num: "1", text: "Define both metrics and their formulas" },
      { num: "2", text: "Explain what EBITDA misses (capex, working capital, taxes, interest)" },
      { num: "3", text: "Give a real example of high EBITDA but negative FCF" },
      { num: "4", text: "State which is more useful and when" },
    ],
    rubric: [
      { item: "EBITDA formula and definition", keywords: ["earnings before","ebit plus","add back da","depreciation amortization","before interest tax","ebitda equals","operating profit","ebitda definition","ebitda formula"], weight: 1, bullet: "EBITDA = EBIT + D&A. Measures operating profitability before non-cash and financing items." },
      { item: "FCF formula (EBITDA – capex – taxes – interest – working capital)", keywords: ["free cash flow","fcf","capital expenditure","capex","taxes","working capital","cash available","actual cash","unlevered fcf","levered fcf","cash generated"], weight: 2, bullet: "FCF = EBITDA – Capex – Taxes – Interest – ΔWorking Capital." },
      { item: "EBITDA ignores capex and working capital changes", keywords: ["ignores capex","misses capex","working capital","doesn't include","excludes","overstates","misleading","capital intensive","heavy capex","reinvestment"], weight: 2, bullet: "EBITDA ignores capex and WC — overstates cash for capital-intensive or fast-growing businesses." },
      { item: "Example: capital intensive or high growth company", keywords: ["capital intensive","manufacturing","airline","telecom","high growth","fast growing","scaling","reinvesting","build out","infrastructure","expansion"], weight: 2, bullet: "Example: airline with $1B EBITDA but $800M capex → FCF is only $200M." },
      { item: "FCF is better for valuation and debt analysis", keywords: ["better for","more useful","valuation","lenders","debt","dcf uses fcf","lbo uses fcf","cash available","distributions","dividends","repay debt"], weight: 1, bullet: "FCF is better for valuation (DCF) and debt analysis — it's what's actually available to investors." },
    ],
    idealAnswer: "EBITDA = EBIT + D&A. FCF = EBITDA – Capex – Taxes – Interest – ΔWC. EBITDA ignores capex and working capital — an airline might have $1B EBITDA but only $200M FCF after $800M capex. FCF is better for DCF valuation and assessing debt repayment capacity."
  },
  {
    id: 17, slug: 'enterprise-value-equity-value',
    title: "What is the difference between Enterprise Value and Equity Value?",
    difficulty: "easy", category: "ib", type: "short",
    prompt: "Explain the difference between Enterprise Value and Equity Value. How do you bridge between the two?",
    answerStructure: [
      { num: "1", text: "Define Enterprise Value — value of the whole business" },
      { num: "2", text: "Define Equity Value — value to shareholders only" },
      { num: "3", text: "Walk through the bridge: EV = Equity Value + Debt – Cash" },
      { num: "4", text: "Give an intuitive example" },
    ],
    rubric: [
      { item: "Enterprise Value = value of entire business to all capital providers", keywords: ["enterprise value","whole business","entire business","all investors","debt and equity","total value","firm value","capital providers","ev represents","business value"], weight: 2, bullet: "EV = value of the entire business to all capital providers (debt + equity holders)." },
      { item: "Equity Value = value to shareholders only", keywords: ["equity value","shareholders","market cap","market capitalization","share price","equity holders","common stock","stockholders","owners","residual"], weight: 2, bullet: "Equity Value = market cap = share price × diluted shares. Belongs to equity holders only." },
      { item: "Bridge: EV = Equity Value + Debt – Cash", keywords: ["equity value plus debt","add debt","subtract cash","minus cash","bridge","net debt","ev equals","formula","ev to equity","equity to ev"], weight: 3, bullet: "Bridge: EV = Equity Value + Total Debt – Cash. Or: Equity Value = EV – Net Debt." },
      { item: "Intuitive example (buying a house)", keywords: ["example","house","home","analogy","car","business","purchase price","down payment","mortgage","debt assumed","intuitive"], weight: 1, bullet: "Like buying a house: EV = purchase price, Equity Value = your down payment, Debt = mortgage assumed." },
    ],
    idealAnswer: "EV = value of entire business to all capital providers. Equity Value = value to shareholders only (market cap). Bridge: EV = Equity Value + Total Debt – Cash. Example: company with $500M market cap, $200M debt, $50M cash → EV = $650M."
  },
  {
    id: 18, slug: 'synergies',
    title: "What are synergies in M&A and how are they valued?",
    difficulty: "medium", category: "ib", type: "short",
    prompt: "Explain what synergies are in an M&A context, the different types, and how a banker would value them.",
    answerStructure: [
      { num: "1", text: "Define synergies — value created by combining two companies" },
      { num: "2", text: "Revenue synergies vs. cost synergies — give examples of each" },
      { num: "3", text: "Explain why cost synergies are more credible" },
      { num: "4", text: "How to value: capitalize synergies at acquisition multiple" },
    ],
    rubric: [
      { item: "Synergies = value created by combining two companies", keywords: ["synergy","synergies","value created","combined","together","1 plus 1","greater than","combination","incremental value","merger benefit"], weight: 1, bullet: "Synergies = incremental value created by combining two companies that neither could achieve alone." },
      { item: "Revenue synergies (cross-selling, new markets)", keywords: ["revenue synergy","cross sell","cross-selling","new market","upsell","revenue growth","top line","expanded customer","distribution","new product","revenue upside"], weight: 2, bullet: "Revenue synergies: cross-selling, new geographies, expanded product offerings." },
      { item: "Cost synergies (headcount, procurement, facilities)", keywords: ["cost synergy","cost saving","headcount","layoff","redundant","procurement","overhead","facilities","back office","duplicate","eliminate","reduce cost"], weight: 2, bullet: "Cost synergies: eliminate redundant headcount, consolidate facilities, procurement savings." },
      { item: "Cost synergies more credible than revenue synergies", keywords: ["more credible","harder to achieve","revenue harder","cost more certain","cost easier","revenue uncertain","optimistic","conservative","cost synergies easier"], weight: 2, bullet: "Cost synergies are more credible — they're contractual. Revenue synergies are speculative." },
      { item: "Value synergies by capitalizing at deal multiple", keywords: ["capitalize","multiple","value synergies","synergy value","npv","present value","ebitda multiple","8x","10x","synergy multiple","discounted"], weight: 1, bullet: "Value synergies: multiply annual synergies by EV/EBITDA multiple (e.g. $50M × 10x = $500M)." },
    ],
    idealAnswer: "Synergies = incremental value from combining two companies. Revenue synergies: cross-selling, new markets. Cost synergies: headcount reduction, procurement savings. Cost synergies are more credible. Value: $50M annual synergies × 10x EBITDA multiple = $500M synergy value."
  },
  {
    id: 19, slug: 'ib-pitch-valuation-football-field',
    title: "What valuation methodologies would you use to value a company?",
    difficulty: "easy", category: "ib", type: "short",
    prompt: "An MD asks you to value a mid-size manufacturing company. What methodologies would you use and why? How would you present the results?",
    answerStructure: [
      { num: "1", text: "Name the 3 core methodologies upfront" },
      { num: "2", text: "Brief explanation of each and when it's most relevant" },
      { num: "3", text: "Explain the football field chart" },
      { num: "4", text: "State which typically gives highest/lowest value" },
    ],
    rubric: [
      { item: "Trading comps (comparable company analysis)", keywords: ["trading comps","comparable company","public comps","market multiple","trading multiple","peer group","comps","public market","trading at"], weight: 2, bullet: "Trading comps: what the market currently values similar public companies at." },
      { item: "Precedent transactions", keywords: ["precedent transaction","deal comps","acquisition multiple","transaction comps","m&a comps","prior deals","historical transaction","deal multiple","precedent"], weight: 2, bullet: "Precedent transactions: what acquirers have paid for similar companies — includes control premium." },
      { item: "DCF analysis", keywords: ["dcf","discounted cash flow","intrinsic value","fundamental value","wacc","terminal value","present value","cash flow based"], weight: 2, bullet: "DCF: intrinsic value based on future cash flows — most sensitive to assumptions." },
      { item: "Football field chart shows range of values across methodologies", keywords: ["football field","range","chart","valuation range","bar chart","shows range","different methods","spectrum","implied range","valuation output"], weight: 2, bullet: "Football field: horizontal bar chart showing implied valuation range for each methodology." },
      { item: "Precedents highest, DCF widest range, comps middle", keywords: ["precedents highest","highest value","deal premium","dcf wide","most sensitive","comps middle","ranking","order","highest to lowest"], weight: 1, bullet: "Typically: Precedents > Comps > DCF (though DCF has widest range due to assumption sensitivity)." },
    ],
    idealAnswer: "Three methodologies: (1) Trading comps — current market value; (2) Precedent transactions — M&A deal prices including control premium; (3) DCF — intrinsic value. Present in a football field chart. Precedents typically give highest value; DCF has widest range."
  },
  {
    id: 20, slug: 'pe-value-creation',
    title: "How does a PE firm create value in a portfolio company?",
    difficulty: "medium", category: "pe", type: "short",
    prompt: "Beyond financial engineering, how does a private equity firm actually create value in a portfolio company? Give specific examples.",
    answerStructure: [
      { num: "1", text: "Name the 3 main value creation levers" },
      { num: "2", text: "Operational improvements — be specific" },
      { num: "3", text: "Financial engineering — leverage and tax shield" },
      { num: "4", text: "Multiple expansion — how PE firms engineer this" },
    ],
    rubric: [
      { item: "Operational improvements (revenue growth, margin expansion)", keywords: ["operational","revenue growth","margin","cost cutting","efficiency","management","operations","organic growth","pricing power","expand margins","operational improvement","ebitda growth"], weight: 3, bullet: "Operational: new management, pricing optimization, cost reduction, geographic expansion." },
      { item: "Financial engineering (leverage amplifies returns)", keywords: ["leverage","debt","financial engineering","amplify","return on equity","tax shield","interest deduction","capital structure","debt financing","borrowed"], weight: 2, bullet: "Leverage amplifies equity returns and the interest tax shield reduces the effective cost." },
      { item: "Multiple expansion (buy low sell high)", keywords: ["multiple expansion","buy at","sell at","higher multiple","re-rate","arbitrage","entry multiple","exit multiple","bought cheap","valuation re-rating"], weight: 2, bullet: "Multiple expansion: buy at 7x, sell at 9x — often engineered via scale, professionalization, or sector tailwinds." },
      { item: "Add-on acquisitions (buy and build)", keywords: ["add-on","acquisition","bolt-on","buy and build","tuck-in","platform","consolidation","inorganic","acquire smaller","roll-up"], weight: 2, bullet: "Buy-and-build: acquire add-ons to increase scale, achieve synergies, and re-rate the multiple." },
    ],
    idealAnswer: "PE value creation: (1) Operations — new management, pricing, cost cuts, expansion; (2) Financial engineering — leverage amplifies returns, interest tax shield; (3) Multiple expansion — buy at 7x, professionalize, sell at 9x; (4) Add-on acquisitions — bolt-ons increase scale and EBITDA."
  },
  {
    id: 21, slug: 'wacc-components',
    title: "How do you calculate the cost of equity using CAPM?",
    difficulty: "medium", category: "ib", type: "short",
    prompt: "Explain the CAPM formula, what each component represents, and how you would estimate each input in practice.",
    answerStructure: [
      { num: "1", text: "State the CAPM formula: Ke = Rf + β × (Rm – Rf)" },
      { num: "2", text: "Define each component and typical values" },
      { num: "3", text: "Explain what beta measures and how to find it" },
      { num: "4", text: "Note limitations of CAPM" },
    ],
    rubric: [
      { item: "CAPM formula: Ke = Rf + β × (Rm – Rf)", keywords: ["capm","ke equals","risk free","beta","market premium","equity risk premium","erp","rf plus","cost of equity formula","capital asset pricing"], weight: 2, bullet: "CAPM: Ke = Rf + β × (Rm – Rf). Know this formula cold." },
      { item: "Risk-free rate = 10-year Treasury yield", keywords: ["risk free","treasury","10 year","government bond","t-bill","t-bond","riskless","risk free rate","10yr","sovereign"], weight: 2, bullet: "Rf = 10-year US Treasury yield (~4-5% currently)." },
      { item: "Beta measures systematic risk relative to market", keywords: ["beta","systematic risk","market risk","volatility","correlation","1.0","greater than 1","less than 1","market sensitivity","covariance","relative risk"], weight: 2, bullet: "Beta = systematic risk. β>1 = more volatile than market; β<1 = less volatile." },
      { item: "Equity risk premium = expected market return above risk-free", keywords: ["equity risk premium","erp","market premium","rm minus rf","expected return","market return","above risk free","excess return","historical premium","5%","6%"], weight: 2, bullet: "ERP = expected market return above Rf, historically ~5-6%." },
    ],
    idealAnswer: "CAPM: Ke = Rf + β × (Rm – Rf). Rf = 10-yr Treasury (~4.5%). β = company's systematic risk vs market (use unlevered industry beta, relever for target capital structure). ERP = ~5-6%. Example: Ke = 4.5% + 1.2 × 5.5% = 11.1%."
  },
  {
    id: 22, slug: 'dividend-recapitalization',
    title: "What is a dividend recapitalization?",
    difficulty: "hard", category: "pe", type: "short",
    prompt: "Explain what a dividend recapitalization is, why PE firms use it, and what the risks are.",
    answerStructure: [
      { num: "1", text: "Define dividend recap" },
      { num: "2", text: "Why PE firms use it (realize returns without full exit)" },
      { num: "3", text: "Impact on the portfolio company" },
      { num: "4", text: "Risks to the company and lenders" },
    ],
    rubric: [
      { item: "Dividend recap = taking on debt to pay dividend to PE sponsor", keywords: ["dividend recap","recapitalization","new debt","borrow","take on debt","pay dividend","sponsor dividend","cash out","extract cash","refinance"], weight: 2, bullet: "Dividend recap: portfolio company takes on new debt to pay a special dividend to the PE sponsor." },
      { item: "PE firm realizes returns without a full exit", keywords: ["partial exit","realize returns","without selling","no exit","monetize","cash out early","return capital","before exit","partial realization","without full sale"], weight: 2, bullet: "Allows PE to return capital to LPs without fully exiting — improves IRR by accelerating cash flows." },
      { item: "Increases leverage and financial risk at portfolio company", keywords: ["more debt","higher leverage","financial risk","weaker balance sheet","riskier","more levered","increased debt","leverage goes up","debt load"], weight: 2, bullet: "Increases leverage — portfolio company is now more financially fragile." },
      { item: "Risk: company may struggle to service increased debt", keywords: ["debt service","interest coverage","default risk","can't pay","financial distress","bankruptcy","covenant","coverage ratio","service the debt","debt burden"], weight: 2, bullet: "Risk: if business deteriorates, higher debt service could lead to distress or default." },
    ],
    idealAnswer: "Dividend recap: portfolio company takes on new debt to pay a special dividend to the PE sponsor. PE realizes returns without selling. Improves IRR by pulling forward cash flows. Risk: leaves portfolio company more leveraged and vulnerable to downturns — lenders hate it."
  },
  {
    id: 23, slug: 'walk-me-through-dcf',
    title: "Walk me through a DCF step by step with numbers",
    difficulty: "hard", category: "ib", type: "structured",
    prompt: "A company has $100M EBITDA, $20M D&A, $15M capex, $10M increase in working capital, 25% tax rate, 10% WACC, 3% terminal growth rate. Walk through a 1-year DCF.",
    answerStructure: [
      { num: "1", text: "Calculate EBIT and NOPAT (EBIT × (1-tax))" },
      { num: "2", text: "Build up to unlevered FCF: NOPAT + D&A – Capex – ΔNWC" },
      { num: "3", text: "Discount FCF to present value" },
      { num: "4", text: "Calculate terminal value using Gordon Growth" },
      { num: "5", text: "Add PV of FCF + PV of terminal value = Enterprise Value" },
    ],
    rubric: [
      { item: "EBIT = EBITDA – D&A = $80M", keywords: ["ebit","80 million","$80","ebitda minus","subtract da","100 minus 20","operating income","80m"], weight: 2, bullet: "EBIT = $100M – $20M D&A = $80M." },
      { item: "NOPAT = EBIT × (1 – tax rate) = $60M", keywords: ["nopat","net operating profit","60 million","$60","after tax","75%","tax rate","80 times","60m"], weight: 2, bullet: "NOPAT = $80M × (1 – 25%) = $60M." },
      { item: "Unlevered FCF = NOPAT + D&A – Capex – ΔNWC = $55M", keywords: ["unlevered fcf","free cash flow","55 million","$55","60 plus 20","minus 15","minus 10","add back da","55m","fcf equals"], weight: 2, bullet: "FCF = $60M + $20M – $15M – $10M = $55M." },
      { item: "Terminal value using Gordon Growth = FCF × (1+g) / (WACC-g)", keywords: ["terminal value","gordon growth","perpetuity","wacc minus","2 minus","growth rate","tv equals","807","800 million","terminal"], weight: 2, bullet: "TV = $55M × 1.03 / (10% – 3%) = $56.65M / 7% = ~$809M." },
      { item: "Discount to present value and sum for Enterprise Value", keywords: ["discount","present value","divide by","1.1","wacc","enterprise value","sum","total","pv of","735","50","ev equals"], weight: 2, bullet: "PV of FCF = $55M/1.1 = $50M. PV of TV = $809M/1.1 = $735M. EV = ~$785M." },
    ],
    idealAnswer: "EBIT = $80M. NOPAT = $60M. FCF = $60 + $20 – $15 – $10 = $55M. TV = $55M × 1.03 / (10% – 3%) = $809M. PV of FCF = $50M. PV of TV = $735M. Enterprise Value = ~$785M."
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

const catLabel: Record<string, string> = { ib: 'Investment Banking', pe: 'Private Equity', hf: 'Hedge Fund', general: 'General' }
const catColor: Record<string, string> = {
  ib: 'bg-blue-900/50 text-blue-400 border border-blue-800',
  pe: 'bg-violet-900/50 text-violet-400 border border-violet-800',
  hf: 'bg-amber-900/50 text-amber-400 border border-amber-800',
  general: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
}
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
      if (userId) {
        await supabase.from('solved_questions').upsert({
          user_id: userId,
          question_id: q.id,
          score: r.score,
          max_score: r.maxScore,
        }, { onConflict: 'user_id,question_id' })
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
        <span className={`text-[10px] font-mono rounded px-2 py-0.5 font-medium ${catColor[q.category]}`}>{catLabel[q.category]}</span>
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
const CATEGORIES = ['ib', 'pe', 'hf', 'general']

export default function ProblemsPage() {
  const [activeQ, setActiveQ] = useState<Question | null>(null)
  const [solved, setSolved] = useState<Set<number>>(new Set())
  const [selectedDiffs, setSelectedDiffs] = useState<Set<string>>(new Set())
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)

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
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-600 w-16">Role</span>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => toggleCat(c)}
                className={`text-[11px] font-mono rounded-full px-3 py-1 border transition-colors ${selectedCats.has(c) ? catColor[c] : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'}`}>
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
        <div className="grid grid-cols-[28px_1fr_140px_75px_72px] gap-3 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-600 mb-1">
          <div>#</div><div>Title</div><div>Role</div><div>Difficulty</div><div className="text-right">Status</div>
        </div>
        <div className="flex flex-col gap-1">
          {filtered.length === 0 && <div className="text-center py-10 text-zinc-600 text-[12px] font-mono">No questions match.</div>}
          {filtered.map((q, i) => (
            <button key={q.id} onClick={() => openQ(q)}
              className="grid grid-cols-[28px_1fr_140px_75px_72px] gap-3 items-center px-3 py-2.5 rounded-lg bg-zinc-900 border border-transparent hover:bg-zinc-800 hover:border-zinc-700 text-left transition-all w-full">
              <div className="font-mono text-[10px] text-zinc-600">{String(i + 1).padStart(2, '0')}</div>
              <div>
                <div className="text-[12px] font-medium text-zinc-100 leading-snug">{q.title}</div>
              </div>
              <div><span className={`text-[10px] font-mono rounded px-2 py-0.5 font-medium ${catColor[q.category]}`}>{catLabel[q.category]}</span></div>
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