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
  {
    id: 24, slug: 'purchase-price-allocation',
    title: "Walk me through a purchase price allocation in M&A",
    difficulty: "hard", category: "ib", type: "structured",
    prompt: "A company acquires a target for $500M. The target's book value of net assets is $200M. Walk through how you would allocate the purchase price.",
    answerStructure: [
      { num: "1", text: "Start with book value of net assets" },
      { num: "2", text: "Step up tangible assets to fair value" },
      { num: "3", text: "Identify and value intangible assets" },
      { num: "4", text: "Calculate goodwill as the remainder" },
      { num: "5", text: "Explain the tax and financial statement impact" },
    ],
    rubric: [
      { item: "Book value of net assets as starting point", keywords: ["book value","net assets","starting point","balance sheet","carrying value","historical cost","recorded value"], weight: 1, bullet: "Start with target's book value of net assets — what's already on the balance sheet." },
      { item: "Step up assets to fair value", keywords: ["step up","fair value","mark to market","revalue","write up","asset step up","fair market value","appraise"], weight: 2, bullet: "Step up tangible assets (PP&E, inventory) to fair value — creates deferred tax liability." },
      { item: "Identify intangible assets (brand, patents, customer relationships)", keywords: ["intangible","brand","patent","customer relationship","trademark","technology","trade name","license","intellectual property","identifiable intangible"], weight: 2, bullet: "Identify intangibles separately — customer lists, patents, brand names, technology." },
      { item: "Goodwill = purchase price minus fair value of net identifiable assets", keywords: ["goodwill","remainder","residual","purchase price minus","excess","plug","leftover","500 minus","300 million"], weight: 2, bullet: "Goodwill = $500M – FV of net identifiable assets. It's the plug — what can't be separately identified." },
      { item: "Deferred tax liability created from asset step-ups", keywords: ["deferred tax","dtl","tax liability","step up creates","tax impact","book vs tax","higher depreciation","tax shield","future tax"], weight: 2, bullet: "Asset step-ups create DTLs — higher book depreciation vs tax basis creates future tax obligation." },
    ],
    idealAnswer: "PPA: (1) Start with book value $200M; (2) Step up PP&E and inventory to FV — say $250M; (3) Identify intangibles (customer lists, brand) — say $100M; (4) Goodwill = $500M – $350M = $150M. Step-ups create DTLs. Goodwill not amortized under GAAP."
  },
  {
    id: 25, slug: 'lbo-debt-structure',
    title: "Explain the debt structure in a typical LBO",
    difficulty: "hard", category: "pe", type: "short",
    prompt: "Walk through the different layers of debt used in an LBO, their characteristics, and why PE firms use each.",
    answerStructure: [
      { num: "1", text: "Name the main debt tranches from senior to junior" },
      { num: "2", text: "Explain senior secured — term loan A/B, revolving credit" },
      { num: "3", text: "Explain high yield bonds and mezzanine" },
      { num: "4", text: "Explain why PE firms layer debt (maximize returns)" },
    ],
    rubric: [
      { item: "Senior secured debt — term loans and revolver", keywords: ["senior secured","term loan","revolver","revolving credit","tla","tlb","first lien","secured lender","senior debt","bank debt"], weight: 2, bullet: "Senior secured: Term Loan A/B and revolver — lowest cost, first priority claim on assets." },
      { item: "High yield bonds (unsecured, higher rate)", keywords: ["high yield","junk bond","unsecured","second lien","notes","bonds","8%","9%","10%","higher rate","below investment grade"], weight: 2, bullet: "High yield bonds: unsecured, higher interest rate, typically fixed, longer maturity." },
      { item: "Mezzanine / PIK (most expensive, equity-like)", keywords: ["mezzanine","mezz","pik","payment in kind","subordinated","most expensive","equity kicker","warrant","hybrid","junior"], weight: 2, bullet: "Mezz/PIK: most expensive, subordinated, often includes equity warrants — used when senior capacity is maxed." },
      { item: "Layering debt maximizes equity returns via leverage", keywords: ["leverage","amplify","return","maximize equity","more debt","less equity","higher return","financial leverage","amplifies irr","equity check smaller"], weight: 2, bullet: "Layering debt minimizes equity check → same EV gain = higher MOIC/IRR for the sponsor." },
    ],
    idealAnswer: "LBO debt stack: (1) Senior secured — TLA/TLB, revolver, lowest cost ~SOFR+300; (2) High yield bonds — unsecured, fixed rate ~8-10%; (3) Mezz/PIK — most expensive, equity kicker. Each tranche has different cost, seniority, and covenant package. More debt = smaller equity check = higher returns."
  },
  {
    id: 26, slug: 'nol-in-ma',
    title: "How do NOLs affect an M&A transaction?",
    difficulty: "hard", category: "ib", type: "short",
    prompt: "Explain what net operating losses are, how they create value in M&A, and what limitations apply to their use after an acquisition.",
    answerStructure: [
      { num: "1", text: "Define NOLs and how they arise" },
      { num: "2", text: "Explain why they're valuable in M&A (future tax shield)" },
      { num: "3", text: "Explain Section 382 limitation" },
      { num: "4", text: "State the impact on purchase price" },
    ],
    rubric: [
      { item: "NOLs are tax losses carried forward to offset future income", keywords: ["net operating loss","nol","loss carryforward","tax loss","carry forward","offset income","future taxable income","reduce taxes","tax asset"], weight: 2, bullet: "NOLs = cumulative tax losses that can be carried forward to offset future taxable income." },
      { item: "NOLs create value as a deferred tax asset", keywords: ["deferred tax asset","dta","future tax savings","tax shield","value","worth","npv","present value of nol","tax benefit"], weight: 2, bullet: "NOLs create value — a $100M NOL at 25% tax rate = $25M DTA (subject to realizability)." },
      { item: "Section 382 limits NOL usage after ownership change", keywords: ["section 382","382","ownership change","limitation","annual limit","restricted","cap","irs","change of control","50%"], weight: 3, bullet: "Section 382: if >50% ownership change, annual NOL usage is capped at the company's value × long-term tax-exempt rate." },
      { item: "NOLs can increase purchase price in negotiations", keywords: ["purchase price","higher price","bid","value nols","factor into price","buyer pays for","acquisition price","incremental value"], weight: 1, bullet: "Acquirer may pay a premium to capture the NOL benefit — modeled as PV of future tax savings." },
    ],
    idealAnswer: "NOLs = cumulative tax losses carried forward. In M&A they're valuable — $100M NOL at 25% = $25M tax asset. BUT Section 382 limits annual usage after >50% ownership change to: company value × AFR. Acquirer may pay up for NOLs but must model Section 382 haircut carefully."
  },
  {
    id: 27, slug: 'normalized-ebitda',
    title: "What is normalized EBITDA and why does it matter in M&A?",
    difficulty: "medium", category: "ib", type: "short",
    prompt: "Explain what normalized EBITDA is, what kinds of adjustments are made, and why buyers and sellers disagree on it.",
    answerStructure: [
      { num: "1", text: "Define normalized EBITDA" },
      { num: "2", text: "Common addbacks — one-time items, owner comp, SBC" },
      { num: "3", text: "Why sellers push for higher normalized EBITDA" },
      { num: "4", text: "Why buyers push back on aggressive addbacks" },
    ],
    rubric: [
      { item: "Normalized EBITDA removes one-time and non-recurring items", keywords: ["normalized","one-time","non-recurring","adjusted ebitda","addback","remove","strip out","clean ebitda","recurring","sustainable"], weight: 2, bullet: "Normalized EBITDA = EBITDA adjusted to reflect the true recurring earnings power of the business." },
      { item: "Common addbacks: restructuring, legal costs, owner comp, SBC", keywords: ["restructuring","legal","litigation","owner compensation","above market","sbc","stock comp","one time","non cash","write off","transaction cost","advisory fee"], weight: 2, bullet: "Common addbacks: restructuring charges, legal settlements, excess owner comp, one-time consulting fees." },
      { item: "Sellers want higher EBITDA to justify higher purchase price", keywords: ["seller","higher price","maximize","inflate","push for","aggressive","add more back","higher multiple","valuation","more addbacks"], weight: 2, bullet: "Sellers add back everything possible — each $1M addback at 10x = $10M more in purchase price." },
      { item: "Buyers scrutinize addbacks that may recur", keywords: ["buyer","pushback","scrutinize","may recur","not truly one-time","recurring","skeptical","quality of earnings","qoe","diligence"], weight: 2, bullet: "Buyers run quality of earnings (QoE) to challenge aggressive addbacks — key diligence step." },
    ],
    idealAnswer: "Normalized EBITDA strips out non-recurring items to show true earnings power. Common addbacks: restructuring, legal, excess owner comp, one-time costs. Sellers push for maximum addbacks — each $1M at 10x = $10M purchase price. Buyers counter with QoE analysis to challenge what's truly non-recurring."
  },
  {
    id: 28, slug: 'interest-coverage-leverage',
    title: "What are the key credit metrics used to evaluate LBO debt capacity?",
    difficulty: "medium", category: "pe", type: "short",
    prompt: "Walk through the key leverage and coverage ratios lenders use to assess how much debt a company can support in an LBO.",
    answerStructure: [
      { num: "1", text: "Name the key ratios upfront" },
      { num: "2", text: "Leverage ratio — Total Debt / EBITDA" },
      { num: "3", text: "Interest coverage — EBITDA / Interest Expense" },
      { num: "4", text: "Typical thresholds and what drives them" },
    ],
    rubric: [
      { item: "Total Debt / EBITDA leverage ratio", keywords: ["debt to ebitda","leverage ratio","total debt","turns","4x","5x","6x","levered","debt multiple","leverage multiple","debt capacity"], weight: 2, bullet: "Key metric: Total Debt/EBITDA. Most LBOs run 4–6x depending on industry and cash flow stability." },
      { item: "Interest coverage ratio — EBITDA / Interest Expense", keywords: ["interest coverage","coverage ratio","ebitda over interest","times interest earned","icr","ebitda to interest","coverage","service interest","1.5x","2x"], weight: 2, bullet: "Interest coverage = EBITDA / Interest Expense. Lenders want >1.5–2x to ensure debt can be serviced." },
      { item: "Debt / EBITDA decreases over time as debt is paid down", keywords: ["delever","debt paydown","reduces over time","improves","amortize","fcf pays","leverage falls","delevering","pay down"], weight: 2, bullet: "LBO thesis requires delevering — Debt/EBITDA should fall each year as FCF pays down debt." },
      { item: "Covenants set limits on leverage and coverage", keywords: ["covenant","maintenance","incurrence","limit","trigger","breach","financial covenant","lender requirement","test","compliance"], weight: 2, bullet: "Lenders set maintenance covenants — breach triggers default or accelerated repayment." },
    ],
    idealAnswer: "Key metrics: (1) Debt/EBITDA — most LBOs at 4–6x; (2) Interest Coverage (EBITDA/Interest) — lenders want >2x; (3) FCF/Debt Service. Lenders set covenants around these. Strong, stable cash flows support higher leverage. LBO works because EBITDA grows and debt pays down — improving all ratios over hold period."
  },
  {
    id: 29, slug: 'growth-equity-vs-buyout',
    title: "What is the difference between growth equity and a leveraged buyout?",
    difficulty: "medium", category: "pe", type: "short",
    prompt: "Compare and contrast growth equity investing with traditional leveraged buyouts. How do the return profiles, risk, and strategies differ?",
    answerStructure: [
      { num: "1", text: "Define both strategies" },
      { num: "2", text: "Key differences: leverage, ownership, stage" },
      { num: "3", text: "Return drivers for each" },
      { num: "4", text: "Risk profile of each" },
    ],
    rubric: [
      { item: "LBO uses significant leverage, growth equity uses little to none", keywords: ["leverage","debt","no debt","little debt","growth equity no leverage","lbo uses debt","unlevered","capital structure","financed"], weight: 2, bullet: "LBO: 50–70% debt financing. Growth equity: minimal or no debt — returns come from growth not leverage." },
      { item: "Growth equity is minority stake, LBO is typically control", keywords: ["minority","majority","control","minority stake","non-control","controlling interest","own majority","full buyout","partial ownership"], weight: 2, bullet: "Growth equity = minority stake (20–40%). LBO = majority/full control (>50%)." },
      { item: "Growth equity targets fast-growing companies, LBO targets stable cash flows", keywords: ["fast growing","high growth","stable","cash flow","recurring revenue","mature","proven","growth company","saas","technology","established"], weight: 2, bullet: "Growth equity: high-growth companies that need capital. LBO: mature, stable FCF businesses." },
      { item: "LBO returns driven by leverage + operations, growth equity by revenue growth", keywords: ["return driver","growth drives","revenue multiple","expansion","lbo returns","leverage amplifies","multiple expansion","revenue growth","top line"], weight: 2, bullet: "LBO returns: leverage + EBITDA growth + multiple expansion. Growth equity: pure revenue/earnings growth." },
    ],
    idealAnswer: "LBO: control buyout, 50-70% debt, mature stable businesses, returns from leverage+operations+multiple expansion. Growth equity: minority stake, no debt, high-growth companies, returns purely from revenue growth and multiple expansion. LBO has lower revenue risk but higher financial risk."
  },
  {
    id: 30, slug: 'carried-interest',
    title: "What is carried interest and how does the PE waterfall work?",
    difficulty: "hard", category: "pe", type: "structured",
    prompt: "Explain what carried interest is, how the distribution waterfall works in a PE fund, and why it's controversial.",
    answerStructure: [
      { num: "1", text: "Define carried interest" },
      { num: "2", text: "Walk through the waterfall: return of capital → preferred return → catch-up → carry" },
      { num: "3", text: "Typical terms (2 and 20, 8% hurdle)" },
      { num: "4", text: "Why it's controversial (tax treatment)" },
    ],
    rubric: [
      { item: "Carried interest = GP's share of profits (typically 20%)", keywords: ["carried interest","carry","20%","gp share","profit share","general partner","performance fee","incentive","20 percent","profits interest"], weight: 2, bullet: "Carried interest = GP's share of fund profits, typically 20%. The GP's main performance incentive." },
      { item: "Waterfall: return of capital first, then preferred return to LPs", keywords: ["return of capital","preferred return","hurdle","8%","lp first","capital back","invested capital","preferred","hurdle rate","minimum return"], weight: 2, bullet: "Waterfall: (1) Return LP capital; (2) Pay 8% preferred return to LPs; (3) GP catch-up; (4) 80/20 split." },
      { item: "2 and 20 fee structure — 2% management fee, 20% carry", keywords: ["2 and 20","2%","management fee","20% carry","fee structure","annual fee","two and twenty","mgmt fee"], weight: 2, bullet: "Standard terms: 2% annual management fee on committed capital + 20% carried interest." },
      { item: "Controversial because carry is taxed as capital gains not ordinary income", keywords: ["tax","capital gains","ordinary income","tax rate","loophole","controversial","lower rate","15%","20%","carried interest tax","tax treatment"], weight: 2, bullet: "Controversial: carry is taxed at capital gains rates (~20%) not ordinary income (~37%) — critics call it a loophole." },
    ],
    idealAnswer: "Carried interest = GP gets 20% of profits. Waterfall: (1) Return LP capital; (2) 8% preferred return to LPs; (3) GP catch-up to 20%; (4) 80/20 split thereafter. Fee structure = 2% mgmt fee + 20% carry. Controversial because carry is taxed at capital gains rates (~20%) not ordinary income (~37%)."
  },
  {
    id: 31, slug: 'irr-vs-moic',
    title: "IRR vs MOIC — which matters more in PE?",
    difficulty: "medium", category: "pe", type: "short",
    prompt: "Explain the difference between IRR and MOIC, when each is more useful, and how hold period affects both metrics.",
    answerStructure: [
      { num: "1", text: "Define both metrics with formulas" },
      { num: "2", text: "Key difference — IRR is time-sensitive, MOIC is not" },
      { num: "3", text: "When each matters more" },
      { num: "4", text: "Give an example showing the tension between them" },
    ],
    rubric: [
      { item: "MOIC = total cash returned / cash invested", keywords: ["moic","multiple","cash returned","cash invested","money on money","total return","2x","3x","multiple of invested capital","gross multiple"], weight: 2, bullet: "MOIC = total proceeds ÷ invested capital. Measures total value created regardless of time." },
      { item: "IRR = annualized return accounting for time value", keywords: ["irr","annualized","internal rate","time value","annual return","compounded","per year","rate of return","time weighted","annual irr"], weight: 2, bullet: "IRR = annualized return. Accounts for time value of money — when cash flows occur matters." },
      { item: "IRR is inflated by short hold periods", keywords: ["hold period","shorter","faster","time","quick exit","inflate irr","high irr short","3 years","2 years","time matters","hold period affects"], weight: 2, bullet: "Short hold periods inflate IRR. A 2x in 2 years = 41% IRR vs 2x in 5 years = 15% IRR." },
      { item: "LPs care about both — MOIC for wealth creation, IRR for fund performance", keywords: ["lp","limited partner","fund","benchmark","dpi","tvpi","wealth","capital","both matter","gp cares","fund irr","return capital"], weight: 2, bullet: "LPs use MOIC for wealth creation, IRR for benchmarking. PE firms often quote both." },
    ],
    idealAnswer: "MOIC = total proceeds ÷ invested capital (e.g. 3x). IRR = annualized return (e.g. 25%). Key tension: 3x in 2 years = 73% IRR; 3x in 5 years = 25% IRR — same MOIC, very different IRR. LPs care about both. PE firms optimize IRR via early exits and dividend recaps; LPs want high MOIC for absolute wealth creation."
  },
  {
    id: 32, slug: 'levered-unlevered-beta',
    title: "What is the difference between levered and unlevered beta?",
    difficulty: "hard", category: "ib", type: "short",
    prompt: "Explain what levered and unlevered beta are, how to convert between them, and when you would use each in a DCF.",
    answerStructure: [
      { num: "1", text: "Define beta and what it measures" },
      { num: "2", text: "Unlevered beta = pure business risk" },
      { num: "3", text: "Levered beta = business risk + financial risk" },
      { num: "4", text: "Hamada equation and when to use each" },
    ],
    rubric: [
      { item: "Beta measures systematic risk relative to the market", keywords: ["beta","systematic risk","market risk","volatility","relative","correlation","market movement","sensitivity","covariance"], weight: 1, bullet: "Beta = systematic risk of an asset relative to the market. β=1 moves with market." },
      { item: "Unlevered beta removes the effect of debt/capital structure", keywords: ["unlevered","asset beta","removes debt","capital structure","pure business","operating risk","no leverage","debt free","unlever","strip out debt"], weight: 2, bullet: "Unlevered beta = pure business/operating risk. Strips out financial leverage effect." },
      { item: "Levered beta increases with more debt (financial risk added)", keywords: ["levered","equity beta","more debt","higher beta","financial risk","leverage increases","capital structure","debt adds risk","relever","increases with debt"], weight: 2, bullet: "Levered beta = unlevered beta × (1 + (1-T) × D/E). More debt = higher equity beta." },
      { item: "Hamada equation to convert between levered and unlevered", keywords: ["hamada","formula","unlever","relever","1 plus","debt to equity","tax rate","convert","equation","d/e ratio","1-t"], weight: 2, bullet: "Hamada: βL = βU × (1 + (1–T) × D/E). Unlever peer betas → relever at target structure for WACC." },
      { item: "Process: unlever comps betas, take median, relever at target structure", keywords: ["unlever comps","peer betas","industry beta","median","relever","target structure","process","steps","comparable","apply to target"], weight: 2, bullet: "DCF process: unlever each comp's beta → take median unlevered beta → relever at target D/E → use in CAPM." },
    ],
    idealAnswer: "Unlevered beta = pure business risk (no debt). Levered beta = business + financial risk. Hamada: βL = βU × (1 + (1–T) × D/E). DCF process: (1) Find comp betas; (2) Unlever each using their D/E; (3) Take median unlevered beta; (4) Relever at target's capital structure; (5) Plug into CAPM for cost of equity."
  },
  {
    id: 33, slug: 'convertible-notes',
    title: "What is a convertible note and how does it work?",
    difficulty: "medium", category: "ib", type: "short",
    prompt: "Explain what a convertible note is, why companies issue them, and how the conversion mechanics work.",
    answerStructure: [
      { num: "1", text: "Define convertible note" },
      { num: "2", text: "Key terms: coupon, conversion price, maturity" },
      { num: "3", text: "Why issuers like them (cheaper financing)" },
      { num: "4", text: "Dilution impact when converted" },
    ],
    rubric: [
      { item: "Convertible note = debt that converts to equity at a set price", keywords: ["convertible","converts to equity","conversion","debt to equity","hybrid","convert","bondholder","equity option","convertible bond","convert at"], weight: 2, bullet: "Convertible note = debt instrument with embedded option to convert into equity at a set price." },
      { item: "Lower coupon than straight debt due to conversion option", keywords: ["lower coupon","cheaper","conversion premium","option value","lower interest","below market","coupon","interest rate","less expensive","cheaper debt"], weight: 2, bullet: "Issuer pays lower coupon because the conversion option has value to the holder." },
      { item: "Dilutive to existing shareholders upon conversion", keywords: ["dilutive","dilution","new shares","existing shareholders","share count increases","ownership diluted","convert to shares","ep dilution","more shares outstanding"], weight: 2, bullet: "Conversion creates new shares — dilutive to existing shareholders. Must model dilution impact." },
      { item: "Companies use converts when stock price is high or they want cheap financing", keywords: ["why issue","high stock price","cheap financing","growth companies","tech","avoid dilution now","defer dilution","strategic","financing tool"], weight: 2, bullet: "Popular when stock is volatile/rising — issuer gets cheap financing, investor gets upside participation." },
    ],
    idealAnswer: "Convertible note = debt with option to convert to equity at conversion price. Lower coupon than straight debt because conversion option has value. At conversion: debt disappears, new shares issued — dilutive to existing holders. Companies use converts for cheap financing; investors get downside protection + equity upside."
  },
  {
    id: 34, slug: 'minority-interest',
    title: "How does minority interest affect valuation and the 3 statements?",
    difficulty: "hard", category: "ib", type: "short",
    prompt: "Explain what minority interest (non-controlling interest) is, how it appears on the financial statements, and how it affects EV and equity value.",
    answerStructure: [
      { num: "1", text: "Define minority interest / NCI" },
      { num: "2", text: "Where it appears on each financial statement" },
      { num: "3", text: "How it affects the EV bridge" },
      { num: "4", text: "Why it matters in M&A" },
    ],
    rubric: [
      { item: "Minority interest = portion of subsidiary not owned by parent", keywords: ["minority interest","non-controlling interest","nci","subsidiary","not owned","partial ownership","third party","less than 100%","outside shareholders","consolidation"], weight: 2, bullet: "NCI = equity interest in a consolidated subsidiary not owned by the parent company." },
      { item: "Appears on balance sheet as equity, income statement below net income", keywords: ["balance sheet","equity section","income statement","below net income","consolidated","equity","after net income","separate line","financial statements"], weight: 2, bullet: "BS: NCI sits in equity section. IS: NCI appears below net income as allocation of earnings." },
      { item: "Must add NCI to equity value to get Enterprise Value", keywords: ["add nci","ev bridge","enterprise value","add to equity","bridge","ev includes","minority interest added","non-controlling","ev to equity","adjust ev"], weight: 3, bullet: "EV = Equity Value + Debt – Cash + NCI. Add NCI because EV represents 100% of consolidated operations." },
      { item: "In M&A must acquire minority stake separately", keywords: ["acquire minority","buy out","squeeze out","minority buyout","separate transaction","additional cost","purchase nci","full ownership","100%","m&a impact"], weight: 1, bullet: "To own 100% of subsidiary in M&A, acquirer must separately buy out the minority stake." },
    ],
    idealAnswer: "NCI = equity in consolidated subsidiary not owned by parent. BS: in equity section. IS: allocated below net income. EV bridge: EV = Equity Value + Debt – Cash + NCI. Why: EV reflects 100% of operations, so NCI must be added. In M&A, buying out NCI is a separate cost on top of purchasing the parent."
  },
  {
    id: 35, slug: 'operating-vs-financial-leverage',
    title: "What is the difference between operating and financial leverage?",
    difficulty: "medium", category: "ib", type: "short",
    prompt: "Explain operating leverage and financial leverage, how each affects risk and returns, and give an example of a high operating leverage business.",
    answerStructure: [
      { num: "1", text: "Define operating leverage — fixed vs variable costs" },
      { num: "2", text: "Define financial leverage — debt in capital structure" },
      { num: "3", text: "How each amplifies returns and risk" },
      { num: "4", text: "Give an example of each type" },
    ],
    rubric: [
      { item: "Operating leverage = high fixed costs relative to variable costs", keywords: ["operating leverage","fixed cost","variable cost","fixed vs variable","high fixed","cost structure","scalable","incremental margin","contribution margin","breakeven"], weight: 2, bullet: "Operating leverage = proportion of fixed vs variable costs. High fixed costs = high operating leverage." },
      { item: "Financial leverage = use of debt in capital structure", keywords: ["financial leverage","debt","capital structure","borrowed","interest","equity","debt financing","levered","borrowed capital","debt to equity"], weight: 2, bullet: "Financial leverage = debt in capital structure. Amplifies equity returns but adds financial risk." },
      { item: "Both amplify upside and downside", keywords: ["amplify","magnify","both ways","upside downside","double edged","risk return","amplifies both","good times bad times","volatile earnings"], weight: 2, bullet: "Both amplify returns in good times AND losses in bad times — double-edged sword." },
      { item: "Example: airlines, software, semiconductors for operating leverage", keywords: ["airline","software","semiconductor","saas","fixed cost example","high fixed","movies","streaming","example","manufacturing","pharmaceutical"], weight: 2, bullet: "High operating leverage: airlines (mostly fixed costs), SaaS (near-zero marginal cost per user)." },
    ],
    idealAnswer: "Operating leverage: high fixed costs mean small revenue changes cause large profit swings (e.g. airlines, SaaS). Financial leverage: debt amplifies equity returns — same EBITDA gain = bigger equity gain when levered. Both amplify upside AND downside. Companies with both are high risk/high reward."
  },
  {
    id: 36, slug: 'rising-rates-valuation',
    title: "How do rising interest rates affect company valuations?",
    difficulty: "medium", category: "ib", type: "short",
    prompt: "Walk through the mechanisms by which rising interest rates affect company valuations across DCF, multiples, and M&A activity.",
    answerStructure: [
      { num: "1", text: "DCF impact — higher WACC lowers present value" },
      { num: "2", text: "Multiple compression — why multiples fall" },
      { num: "3", text: "M&A impact — higher debt costs reduce LBO capacity" },
      { num: "4", text: "Which companies are most affected" },
    ],
    rubric: [
      { item: "Higher rates increase WACC and reduce DCF values", keywords: ["wacc","discount rate","higher wacc","present value falls","dcf lower","terminal value","cost of capital","risk free rate","higher discount"], weight: 2, bullet: "Higher rates → higher WACC → lower PV of future cash flows → lower DCF value." },
      { item: "Multiple compression — investors pay less for future earnings", keywords: ["multiple compression","multiples fall","p/e falls","ev/ebitda lower","compress","re-rate","lower multiple","valuation multiple","pays less","earnings less valuable"], weight: 2, bullet: "Higher rates = higher opportunity cost → investors pay lower multiples for same earnings." },
      { item: "LBO debt costs rise reducing returns and deal activity", keywords: ["lbo","debt cost","higher interest","financing cost","deal activity","fewer deals","harder to finance","leverage","spread","deal volume"], weight: 2, bullet: "Higher debt costs → lower LBO returns → fewer deals get done → M&A activity slows." },
      { item: "Long-duration assets (growth stocks, VC) hurt most", keywords: ["growth stock","long duration","far off","terminal value","tech","unprofitable","distant cash flows","growth company","most hurt","vc","high multiple"], weight: 2, bullet: "Long-duration assets hurt most — growth companies with cash flows far in the future see biggest valuation drops." },
    ],
    idealAnswer: "Rising rates: (1) Higher WACC → lower DCF values; (2) Multiple compression — investors pay less for future earnings; (3) Higher debt costs → LBO returns fall → M&A slows; (4) Growth stocks/long-duration assets hurt most. 2022 is the perfect case study — rates up 500bps, tech multiples fell 60-80%."
  },
  {
    id: 37, slug: 'leveraged-loan-vs-high-yield',
    title: "What is the difference between a leveraged loan and a high yield bond?",
    difficulty: "hard", category: "ib", type: "short",
    prompt: "Compare leveraged loans and high yield bonds — their structure, pricing, covenants, and when each is used in an LBO.",
    answerStructure: [
      { num: "1", text: "Define both instruments" },
      { num: "2", text: "Key differences: floating vs fixed, secured vs unsecured" },
      { num: "3", text: "Covenant differences" },
      { num: "4", text: "Which is used where in the LBO capital structure" },
    ],
    rubric: [
      { item: "Leveraged loans are floating rate, high yield bonds are fixed rate", keywords: ["floating rate","fixed rate","sofr","libor","variable","fixed coupon","floating","rate type","interest rate","sofr plus"], weight: 2, bullet: "Leveraged loans: floating rate (SOFR + spread). High yield bonds: fixed coupon — different interest rate risk." },
      { item: "Leveraged loans are secured, high yield bonds are typically unsecured", keywords: ["secured","unsecured","collateral","first lien","senior secured","asset backed","no collateral","subordinated","security","pledge"], weight: 2, bullet: "Loans: secured by company assets (first lien). HY bonds: typically unsecured — lower in capital structure." },
      { item: "Loans have maintenance covenants, bonds have incurrence covenants", keywords: ["maintenance covenant","incurrence covenant","tested quarterly","only tested","covenant","compliance","financial test","quarterly","breach","looser"], weight: 2, bullet: "Loans: maintenance covenants tested quarterly. Bonds: incurrence covenants (only tested on new actions) — bond-friendly." },
      { item: "Loans sit above bonds in LBO capital structure", keywords: ["senior","more senior","above bonds","first priority","paid first","priority","capital structure position","seniority","above high yield","senior to bonds"], weight: 2, bullet: "In LBO stack: Term Loans (senior secured) → HY Bonds (unsecured) → Mezz/Equity. Loans are safer." },
    ],
    idealAnswer: "Leveraged loans: floating rate, secured, maintenance covenants, bank market. HY bonds: fixed rate, unsecured, incurrence covenants, public market. In LBO: loans sit senior (Term Loan A/B), bonds sit junior (unsecured notes). Loans cheaper but have stricter covenants. Bonds give issuer more flexibility."
  },
  {
    id: 38, slug: 'dcf-sensitivity',
    title: "How do you build a DCF sensitivity analysis?",
    difficulty: "medium", category: "ib", type: "structured",
    prompt: "Explain how you would build a sensitivity analysis around a DCF, what variables you would stress test, and how to interpret the results.",
    answerStructure: [
      { num: "1", text: "Identify the most sensitive inputs (WACC and terminal growth)" },
      { num: "2", text: "Build a 2-variable data table (WACC vs terminal growth)" },
      { num: "3", text: "Interpret the output range" },
      { num: "4", text: "Explain what it tells you about the valuation" },
    ],
    rubric: [
      { item: "WACC and terminal growth rate are most sensitive inputs", keywords: ["wacc","terminal growth","most sensitive","key inputs","sensitivity","stress test","most impact","drives value","critical assumption","varies most"], weight: 2, bullet: "WACC and terminal growth rate drive 80%+ of DCF value variance — always sensitize these." },
      { item: "Two-way data table showing EV across WACC/growth combinations", keywords: ["data table","two way","matrix","range","grid","wacc on one axis","growth on other","combinations","sensitivity table","output range"], weight: 2, bullet: "Build 2-way table: WACC on one axis, terminal growth on other → implied EV at each combination." },
      { item: "Wide range signals high uncertainty in the valuation", keywords: ["wide range","uncertainty","wide spread","variation","not precise","imprecise","range of outcomes","valuation range","multiple scenarios","dispersion"], weight: 2, bullet: "Wide range = high uncertainty. DCF is an art — the range matters as much as the point estimate." },
      { item: "Use sensitivity to triangulate with comps and identify key assumptions to validate", keywords: ["triangulate","cross check","comps","validate","assumptions","check against","market","anchored","reality check","benchmark"], weight: 2, bullet: "Cross-check DCF range against trading comps — if DCF implies 20x and comps are 8x, revisit assumptions." },
    ],
    idealAnswer: "Sensitivity analysis: (1) Identify key inputs — WACC and terminal growth rate; (2) Build 2-way data table; (3) Read the range — e.g. EV of $700M–$1.1B; (4) Wide range = high sensitivity = less reliable point estimate. Always cross-check against comps. Present the range to the MD, not a single number."
  },
  {
    id: 39, slug: 'pre-revenue-startup-valuation',
    title: "How would you value a pre-revenue startup?",
    difficulty: "hard", category: "ib", type: "short",
    prompt: "A VC asks you to value a pre-revenue SaaS startup. Walk through the approaches you would use and their limitations.",
    answerStructure: [
      { num: "1", text: "Acknowledge traditional methods don't work well" },
      { num: "2", text: "Comparable transactions / recent funding rounds" },
      { num: "3", text: "Forward revenue multiples (EV/NTM Revenue)" },
      { num: "4", text: "VC method — work backwards from exit" },
    ],
    rubric: [
      { item: "Traditional DCF and EBITDA multiples don't work for pre-revenue", keywords: ["no revenue","pre-revenue","can't use dcf","no ebitda","traditional methods","no cash flow","negative ebitda","doesn't apply","limited use","not applicable"], weight: 1, bullet: "Traditional DCF and EBITDA multiples don't apply — no earnings or cash flows to discount." },
      { item: "Comparable transactions and funding rounds as benchmarks", keywords: ["comparable transaction","funding round","recent raise","series a","series b","precedent","similar companies","benchmark","comp","recent deal","raised at"], weight: 2, bullet: "Look at recent funding rounds for comparable companies — what did similar startups raise at?" },
      { item: "Forward revenue multiples (EV/NTM Revenue)", keywords: ["forward revenue","ev/revenue","revenue multiple","ntm revenue","next twelve months","top line","revenue based","ev to revenue","sales multiple","price to sales"], weight: 2, bullet: "Use EV/NTM Revenue — high-growth SaaS trades at 5–15x forward revenue depending on growth rate." },
      { item: "VC method: project exit value, discount back at target IRR", keywords: ["vc method","venture capital","exit value","work backwards","target irr","discount back","terminal value","exit multiple","ownership","post money"], weight: 3, bullet: "VC method: project exit value in 5–7 years → discount back at target IRR (30–40%) → implies today's valuation." },
    ],
    idealAnswer: "Pre-revenue startup: (1) DCF/EBITDA useless — no earnings; (2) Comp transactions — what did similar startups raise at?; (3) EV/NTM Revenue — SaaS comps at 5–15x; (4) VC method — project $500M exit in 5 years at 10x revenue, discount at 40% IRR → implies $130M post-money today. Art not science."
  },
  {
    id: 40, slug: 'why-investment-banking',
    title: "Why investment banking?",
    difficulty: "easy", category: "ib", type: "short",
    prompt: "This is one of the most common IB interview questions. Walk through how you would answer 'Why investment banking?' in a way that is compelling and specific.",
    answerStructure: [
      { num: "1", text: "Start with a genuine connection to finance/markets" },
      { num: "2", text: "Explain the specific appeal of IB (deals, clients, breadth)" },
      { num: "3", text: "Connect to your background/experience" },
      { num: "4", text: "Show awareness of what the job actually involves" },
    ],
    rubric: [
      { item: "Genuine interest in finance, markets, or transactions", keywords: ["finance","markets","transactions","deals","interest","passion","fascinated","drawn to","love","excited by","capital markets","corporate finance"], weight: 2, bullet: "Show genuine interest — not just prestige. Reference a deal, market event, or experience that sparked it." },
      { item: "Specific appeal of IB — breadth, client advisory, deal exposure", keywords: ["breadth","exposure","advisory","client","multiple industries","strategic","m&a","capital raising","deal","variety","learn quickly","front line"], weight: 2, bullet: "Be specific: IB's breadth of industry exposure, direct client advisory work, deal execution." },
      { item: "Personal experience connecting to IB", keywords: ["internship","experience","club","case competition","course","professor","project","analyzed","worked on","research","school","university","past"], weight: 2, bullet: "Connect to your own background — a specific experience that made you pursue IB over other finance paths." },
      { item: "Awareness of what IB actually involves (the hard parts too)", keywords: ["hours","demanding","fast paced","analytical","attention to detail","pressure","high stakes","execution","modeling","pitch","process","realistic"], weight: 2, bullet: "Show you know what the job is — long hours, execution-heavy, client-facing. Realism = credibility." },
    ],
    idealAnswer: "Strong answer: (1) Specific trigger — 'I analyzed the Microsoft/Activision deal and became obsessed with the strategic rationale'; (2) Why IB specifically — breadth, advisory role, deal exposure across industries; (3) Personal experience — relevant internship, finance club, coursework; (4) Realistic — acknowledge the demanding nature and show you've done your homework on the role."
  },
  {
    id: 41, slug: 'recent-ma-deal',
    title: "Tell me about a recent M&A deal you've been following",
    difficulty: "medium", category: "ib", type: "short",
    prompt: "Walk through a recent M&A transaction you find interesting. Cover the strategic rationale, valuation, and your view on whether it was a good deal.",
    answerStructure: [
      { num: "1", text: "Name the deal, buyer, target, and deal size" },
      { num: "2", text: "Explain the strategic rationale — why did the buyer want this?" },
      { num: "3", text: "Touch on valuation — was the price reasonable?" },
      { num: "4", text: "Give your view — was this a good deal? Why or why not?" },
    ],
    rubric: [
      { item: "Names a specific real deal with buyer, target, and price", keywords: ["acquirer","target","billion","deal","acquisition","merger","bought","acquired","price","deal size","transaction value","purchase"], weight: 2, bullet: "Name a specific deal — buyer, target, price. Vague answers signal you haven't been following the markets." },
      { item: "Explains strategic rationale clearly", keywords: ["strategic rationale","why","reason","synergies","market share","expand","diversify","technology","capabilities","vertical integration","cross sell","geographic","strategic fit"], weight: 3, bullet: "Nail the strategic rationale — why did the buyer want this specific target at this time?" },
      { item: "References valuation multiple or premium paid", keywords: ["multiple","premium","ev/ebitda","price to earnings","overpaid","fair value","expensive","cheap","valuation","x times","acquisition multiple","premium to market"], weight: 2, bullet: "Reference the valuation — 'they paid 12x EBITDA, a 30% premium to trading price.' Show you can evaluate price." },
      { item: "Has a clear opinion on whether it was a good deal", keywords: ["think","believe","view","opinion","good deal","bad deal","overpriced","makes sense","strategic","risky","creates value","destroys value","right price","my view"], weight: 2, bullet: "Have a clear view — interviewers want to know you can form and defend an opinion." },
    ],
    idealAnswer: "Strong answer: 'I've been following [specific deal]. [Buyer] acquired [target] for $Xbn at Yx EBITDA, a Z% premium. The rationale was [specific strategic reason]. I think it [was/wasn't] a good deal because [specific argument — synergies, overpaid, competitive threat etc.]. The main risk is [specific risk].'"
  },
  {
    id: 42, slug: 'pitch-a-stock',
    title: "Pitch me a stock",
    difficulty: "hard", category: "ib", type: "structured",
    prompt: "Walk through how you would structure a compelling stock pitch in an interview setting. What elements must it include and how do you make it stand out?",
    answerStructure: [
      { num: "1", text: "State your recommendation and target price upfront" },
      { num: "2", text: "Give 2-3 specific investment thesis points" },
      { num: "3", text: "Address valuation — why is it cheap or fairly valued?" },
      { num: "4", text: "State the key risks and why you're comfortable with them" },
    ],
    rubric: [
      { item: "Clear buy/sell recommendation with target price", keywords: ["buy","sell","short","long","recommend","target price","upside","downside","conviction","recommendation","rating","thesis"], weight: 2, bullet: "Lead with conviction: 'I recommend buying X with a 12-month target of $Y, implying Z% upside.'" },
      { item: "2-3 specific thesis drivers (not generic)", keywords: ["thesis","driver","catalyst","reason","specific","why","earnings growth","market share","new product","margin","expansion","undervalued","mispriced","catalyst"], weight: 3, bullet: "Thesis must be specific — not 'great management' but 'new product cycle drives 20% revenue CAGR through 2026.'" },
      { item: "Valuation support — multiple or DCF based", keywords: ["valuation","multiple","cheap","discount","ev/ebitda","p/e","dcf","intrinsic value","trading at","below peers","undervalued","historically low","relative"], weight: 2, bullet: "Anchor to valuation — 'trades at 8x vs 12x peer average, unwarranted given superior growth.'" },
      { item: "Identifies key risks and addresses them", keywords: ["risk","downside","bear case","what could go wrong","concern","threat","competition","regulatory","execution","macro","risk reward","mitigate"], weight: 2, bullet: "Always address risks — it shows intellectual honesty. 'Key risk is X but I'm comfortable because Y.'" },
    ],
    idealAnswer: "Structure: (1) 'Buy [Company] with 12-month target of $X (Y% upside)'; (2) 3 specific thesis points with data; (3) Valuation anchor — 'trades at Z discount to peers for no fundamental reason'; (4) Key risks acknowledged. Avoid generic statements. Best pitches have a non-consensus angle — something the market is missing."
  },
  {
    id: 43, slug: 'what-makes-good-lbo',
    title: "What makes a good LBO candidate?",
    difficulty: "medium", category: "pe", type: "short",
    prompt: "Walk through the characteristics that make a company an ideal LBO target. Give specific examples.",
    answerStructure: [
      { num: "1", text: "Strong, predictable free cash flow" },
      { num: "2", text: "Defensible market position" },
      { num: "3", text: "Low capex requirements" },
      { num: "4", text: "Operational improvement opportunity" },
    ],
    rubric: [
      { item: "Strong predictable FCF to service debt", keywords: ["free cash flow","predictable","stable","recurring","cash generation","debt service","service debt","consistent","reliable","cash flow visibility","contracted"], weight: 3, bullet: "Most important: strong, predictable FCF — company must generate enough cash to service the debt load." },
      { item: "Defensible market position / competitive moat", keywords: ["market position","moat","competitive","defensible","market share","brand","barriers to entry","pricing power","switching costs","dominant","leading"], weight: 2, bullet: "Defensible position — protects revenue base. Commodity businesses are risky LBO targets." },
      { item: "Low ongoing capex requirements", keywords: ["low capex","asset light","minimal capex","not capital intensive","maintenance capex","low reinvestment","asset light","little capex","capex requirements"], weight: 2, bullet: "Low capex = more FCF available for debt paydown. Asset-heavy businesses are tough LBO targets." },
      { item: "Operational improvement opportunity to grow EBITDA", keywords: ["operational improvement","ebitda growth","cost reduction","margin expansion","new management","efficiency","value creation","improve","optimize","operational upside"], weight: 2, bullet: "PE needs an angle to grow EBITDA — cost cuts, pricing, new markets, or buy-and-build." },
    ],
    idealAnswer: "Good LBO target: (1) Strong predictable FCF — must service 4–6x debt; (2) Defensible market position — protects revenue; (3) Low capex — more FCF for debt paydown; (4) Operational upside — PE needs an angle to grow EBITDA; (5) Reasonable entry price; (6) Clear exit path. Classic examples: enterprise software, healthcare services, consumer staples."
  },
  {
    id: 44, slug: 'pe-fund-structure',
    title: "How is a private equity fund structured?",
    difficulty: "medium", category: "pe", type: "short",
    prompt: "Explain the structure of a private equity fund — the key parties, economics, and how capital is raised and deployed.",
    answerStructure: [
      { num: "1", text: "GP vs LP — who they are and their roles" },
      { num: "2", text: "Fund economics — management fee and carry" },
      { num: "3", text: "Capital deployment — investment period and harvesting" },
      { num: "4", text: "Fund life cycle" },
    ],
    rubric: [
      { item: "GP manages the fund, LPs provide the capital", keywords: ["general partner","limited partner","gp","lp","manages","capital","investors","pension fund","endowment","sovereign wealth","institutional","family office"], weight: 2, bullet: "GP = fund manager (KKR, Blackstone). LPs = capital providers (pensions, endowments, family offices)." },
      { item: "2 and 20 economics — management fee plus carried interest", keywords: ["2 and 20","management fee","carried interest","carry","2%","20%","economics","fee","annual fee","performance"], weight: 2, bullet: "Economics: 2% annual management fee on committed capital + 20% carry on profits above hurdle." },
      { item: "Investment period typically 5 years, total fund life 10 years", keywords: ["investment period","5 years","10 years","fund life","deploy","harvesting","vintage","commitment period","hold period","lifecycle"], weight: 2, bullet: "Investment period = first 5 years (deploy capital). Hold + harvest = next 5 years. Total life = ~10 years." },
      { item: "Limited liability — LPs can only lose their investment", keywords: ["limited liability","limited partner","liability","lose investment","protected","not liable","limited exposure","downside capped","lp liability"], weight: 2, bullet: "LP = limited liability — can only lose committed capital. GP has unlimited liability (in theory)." },
    ],
    idealAnswer: "Structure: GP (fund manager) raises capital from LPs (pensions, endowments, family offices). Fund life = 10 years: 5-year investment period + 5-year harvest. Economics: 2% mgmt fee on committed capital + 20% carry above 8% hurdle. LPs have limited liability. GP commits 1–3% of fund (skin in the game)."
  },
  {
    id: 45, slug: 'ipo-process',
    title: "Walk me through the IPO process",
    difficulty: "medium", category: "ib", type: "structured",
    prompt: "A company has hired your bank to lead its IPO. Walk through the key steps in the process from mandate to listing.",
    answerStructure: [
      { num: "1", text: "Mandate and preparation (6-12 months before)" },
      { num: "2", text: "S-1 filing and SEC review" },
      { num: "3", text: "Roadshow and book building" },
      { num: "4", text: "Pricing and listing" },
    ],
    rubric: [
      { item: "Select underwriters and prepare S-1 registration statement", keywords: ["underwriter","s-1","registration","sec filing","prospectus","lead banker","bookrunner","file","registration statement","prepare"], weight: 2, bullet: "Step 1: Select underwriters, prepare S-1 registration statement with full financial disclosure." },
      { item: "SEC review and comment process", keywords: ["sec","review","comment letter","respond","deficiency","quiet period","sec review","registration effective","comments","regulator"], weight: 2, bullet: "SEC reviews S-1, issues comment letters — back and forth process, typically 2–3 rounds." },
      { item: "Roadshow — management presents to institutional investors", keywords: ["roadshow","investors","institutional","present","management","pitch","two weeks","marketing","investor meeting","book build","orders"], weight: 2, bullet: "Roadshow: 2-week sprint where management pitches to institutional investors across major cities." },
      { item: "Book building — determine demand and set price range", keywords: ["book building","demand","price range","order book","oversubscribed","allocation","set price","pricing","final price","institutional orders"], weight: 2, bullet: "Book building: collect investor orders, assess demand, set final price. Oversubscribed = price at top." },
      { item: "Pricing night and first day trading", keywords: ["pricing","listing","first day","opening trade","exchange","nyse","nasdaq","trading","debut","ipo price","pop","first trade"], weight: 1, bullet: "Price set night before listing. 15-20% first-day pop is considered successful." },
    ],
    idealAnswer: "IPO process: (1) Select underwriters, prepare S-1 (6–12 months); (2) File S-1 with SEC, respond to comment letters; (3) Roadshow — 2 weeks, management pitches to institutional investors; (4) Book building — collect orders, set price range; (5) Price night before, list on exchange. Total timeline: 12–18 months from kick-off to listing."
  },
  {
    id: 46, slug: 'yield-curve',
    title: "What is the yield curve and what does it tell us?",
    difficulty: "medium", category: "ib", type: "short",
    prompt: "Explain what the yield curve is, what an inverted yield curve means, and why it matters for the economy and financial markets.",
    answerStructure: [
      { num: "1", text: "Define the yield curve" },
      { num: "2", text: "Normal vs inverted yield curve" },
      { num: "3", text: "Why inversion predicts recession" },
      { num: "4", text: "Impact on banks, M&A, and LBOs" },
    ],
    rubric: [
      { item: "Yield curve plots interest rates across different maturities", keywords: ["yield curve","maturities","short term","long term","treasury","2 year","10 year","interest rates","plot","rates across","term structure"], weight: 2, bullet: "Yield curve: plots Treasury yields across maturities (3m, 2yr, 10yr, 30yr)." },
      { item: "Normal curve slopes upward — long rates higher than short rates", keywords: ["normal","upward sloping","long rates higher","positive slope","short term lower","long term higher","steep","upward","normal curve"], weight: 1, bullet: "Normal: upward sloping — long-term rates higher to compensate for time risk." },
      { item: "Inverted curve means short rates exceed long rates — recession signal", keywords: ["inverted","inversion","short higher than long","2s10s","negative spread","recession signal","predictor","flattening","2 year above 10 year","inverted yield"], weight: 3, bullet: "Inverted: short rates > long rates. Has preceded every US recession — markets expect rates to fall (i.e. economy to weaken)." },
      { item: "Inversion hurts bank profitability and dampens M&A/LBO activity", keywords: ["banks","net interest margin","nim","borrow short lend long","profitability","m&a","deal activity","financing cost","lbo","spread compression"], weight: 2, bullet: "Inverted curve: hurts banks (borrow short, lend long → margins squeezed), raises financing costs, slows M&A." },
    ],
    idealAnswer: "Yield curve plots Treasury rates across maturities. Normal = upward sloping. Inverted = short rates > long rates (2yr > 10yr) — reliable recession predictor. Why: market expects Fed to cut rates as economy weakens. Impact: banks' NIMs compressed, LBO financing costs rise, deal activity slows. 2022-2023 inversion is the most recent example."
  },
  {
    id: 47, slug: 'merger-model-walkthrough',
    title: "Walk me through how you would build a merger model",
    difficulty: "hard", category: "ib", type: "structured",
    prompt: "Explain the key steps in building a merger model from scratch, what the key outputs are, and what assumptions drive the analysis.",
    answerStructure: [
      { num: "1", text: "Set up standalone financials for acquirer and target" },
      { num: "2", text: "Model the transaction — sources and uses, purchase price" },
      { num: "3", text: "Combine financials and model synergies" },
      { num: "4", text: "Calculate accretion/dilution to EPS" },
    ],
    rubric: [
      { item: "Start with standalone financials for both companies", keywords: ["standalone","acquirer","target","separate","income statement","project","individual","before combination","each company","financials"], weight: 2, bullet: "Step 1: Project standalone IS for acquirer and target — revenue, EBITDA, net income, EPS." },
      { item: "Sources and uses — how is the deal financed", keywords: ["sources and uses","financing","cash","stock","debt","how financed","deal consideration","mix","equity","new debt","cash on hand"], weight: 2, bullet: "Sources and uses: where does the money come from (cash, stock, debt) and where does it go (purchase price, fees)." },
      { item: "Model transaction adjustments — goodwill, intangibles, financing costs", keywords: ["goodwill","intangibles","purchase price allocation","ppa","financing costs","interest expense","amortization","transaction adj","pro forma","adjustments"], weight: 2, bullet: "Transaction adjustments: create goodwill/intangibles, add new interest expense, remove target standalone taxes." },
      { item: "Calculate pro forma EPS and compare to standalone", keywords: ["pro forma","eps","accretive","dilutive","compare","standalone eps","combined eps","per share","accretion dilution","pro forma net income"], weight: 2, bullet: "Output: pro forma EPS vs standalone EPS → accretive or dilutive? By how much?" },
    ],
    idealAnswer: "Merger model: (1) Project standalone financials for both; (2) Sources & uses — cash/stock/debt mix; (3) PPA — create goodwill, step up assets, new D&A; (4) Add interest expense on new debt; (5) Combine income statements + synergies; (6) Calculate pro forma net income / diluted shares = pro forma EPS; (7) Compare to standalone EPS → accretion/dilution."
  },
  {
    id: 48, slug: 'management-rollover',
    title: "What is management rollover in an LBO?",
    difficulty: "hard", category: "pe", type: "short",
    prompt: "Explain what management rollover is in an LBO context, why PE firms require it, and how it affects deal economics.",
    answerStructure: [
      { num: "1", text: "Define management rollover" },
      { num: "2", text: "Why PE firms want management to roll equity" },
      { num: "3", text: "Typical rollover percentage" },
      { num: "4", text: "Impact on deal economics and alignment" },
    ],
    rubric: [
      { item: "Management rolls existing equity into new deal instead of cashing out", keywords: ["rollover","roll equity","reinvest","keep equity","don't cash out","retain stake","contribute equity","roll into","existing equity","continue owning"], weight: 2, bullet: "Rollover = management keeps a portion of their equity in the new deal rather than cashing out at close." },
      { item: "Aligns management incentives with PE sponsor", keywords: ["alignment","incentive","skin in the game","aligned","motivated","same interests","performance","upside","shared","committed","incentivized"], weight: 3, bullet: "Key benefit: aligns management with sponsor — both win on exit, both lose if deal underperforms." },
      { item: "Typically 5-20% of total equity in the new deal", keywords: ["5%","10%","15%","20%","typical","percentage","portion","how much","size","equity stake","management stake"], weight: 1, bullet: "Typical rollover: management owns 5–20% of the new equity, depending on deal size and management quality." },
      { item: "Reduces equity check for PE sponsor", keywords: ["reduces equity","less cash","smaller check","equity check","sponsor contribution","less from sponsor","offset","fund less","contribute less"], weight: 2, bullet: "Also reduces PE equity check — management's rollover offsets some of the sponsor's required investment." },
    ],
    idealAnswer: "Management rollover: management reinvests their existing equity into the new LBO structure instead of cashing out. Typical: 5–20% of equity. Benefits: (1) Aligns incentives — management and PE win/lose together; (2) Reduces sponsor equity check; (3) Signals management confidence in the business. PE firms view meaningful rollover as a positive signal."
  },
  {
    id: 49, slug: 'dcf-terminal-value',
    title: "What are the two methods for calculating terminal value in a DCF?",
    difficulty: "medium", category: "ib", type: "short",
    prompt: "Explain the Gordon Growth Model and Exit Multiple Method for terminal value, when to use each, and their key limitations.",
    answerStructure: [
      { num: "1", text: "Gordon Growth Model — formula and assumptions" },
      { num: "2", text: "Exit Multiple Method — formula and assumptions" },
      { num: "3", text: "When to use each" },
      { num: "4", text: "Sanity check — compare both to make sure they're consistent" },
    ],
    rubric: [
      { item: "Gordon Growth Model = FCF × (1+g) / (WACC – g)", keywords: ["gordon growth","perpetuity","fcf times","wacc minus g","1 plus g","terminal growth rate","perpetuity growth","in perpetuity","gordon","growth rate formula"], weight: 2, bullet: "Gordon Growth: TV = FCF × (1+g) / (WACC–g). Assumes company grows at 'g' forever." },
      { item: "Exit Multiple Method = EBITDA × multiple at exit", keywords: ["exit multiple","ebitda times","terminal multiple","ev/ebitda","exit at","trading multiple","multiple method","ebitda multiple","exit value"], weight: 2, bullet: "Exit Multiple: TV = Terminal Year EBITDA × assumed exit EV/EBITDA. Anchored to market multiples." },
      { item: "Gordon Growth better for stable mature businesses, exit multiple for M&A context", keywords: ["when to use","mature","stable","m&a","acquisition","context","gordon for stable","exit for deals","depends","appropriate"], weight: 2, bullet: "Gordon Growth: better for stable businesses. Exit Multiple: better when benchmarking to M&A transactions." },
      { item: "Always sanity check both methods against each other", keywords: ["sanity check","cross check","compare","consistent","both methods","triangulate","make sure","reasonable","same ballpark","validate"], weight: 2, bullet: "Always calculate both and cross-check — if they diverge significantly, revisit your assumptions." },
    ],
    idealAnswer: "Two methods: (1) Gordon Growth: TV = FCF×(1+g)/(WACC–g) — assumes perpetual growth, sensitive to 'g' assumption; (2) Exit Multiple: TV = Terminal EBITDA × EV/EBITDA multiple — anchored to market. Always calculate both and cross-check. Gordon Growth good for stable mature businesses; exit multiple better for transaction context."
  },
  {
    id: 50, slug: 'markets-right-now',
    title: "What is happening in the markets right now?",
    difficulty: "medium", category: "ib", type: "short",
    prompt: "This is a common interview question to test market awareness. Walk through how you would structure a compelling answer about current market conditions.",
    answerStructure: [
      { num: "1", text: "State the macro backdrop (rates, inflation, growth)" },
      { num: "2", text: "Comment on equity markets and valuations" },
      { num: "3", text: "Mention M&A or deal market conditions" },
      { num: "4", text: "Have a view — what are you watching closely?" },
    ],
    rubric: [
      { item: "Comments on interest rate environment", keywords: ["interest rates","fed","federal reserve","rate cuts","rate hikes","monetary policy","inflation","tightening","easing","rate environment","central bank","basis points"], weight: 2, bullet: "Always start with rates — the Fed's path drives almost everything else in markets right now." },
      { item: "Comments on equity market conditions and valuations", keywords: ["equity market","stock market","valuation","multiple","s&p","nasdaq","bull market","bear market","rally","correction","expensive","cheap","p/e"], weight: 2, bullet: "Reference equity markets — are valuations stretched? What sectors are leading or lagging?" },
      { item: "References M&A or credit market conditions", keywords: ["m&a","deal market","credit","spreads","deal volume","activity","financing","ipo market","leveraged finance","high yield","deal flow","strategic"], weight: 2, bullet: "M&A awareness is crucial for IB — comment on deal volumes, financing conditions, strategic themes." },
      { item: "Has a specific view or sector thesis", keywords: ["think","believe","watching","view","sector","opportunity","risk","specific","opinion","focused on","interesting","thesis","following"], weight: 2, bullet: "Have a specific view — one sector, trend, or macro theme you're watching. Shows genuine engagement." },
    ],
    idealAnswer: "Structure: (1) Macro — 'The Fed is [cutting/holding] rates as inflation [trends/concerns]'; (2) Equities — 'Markets are at [X multiple] — [stretched/reasonable] vs history'; (3) M&A — 'Deal activity is [picking up/slow] as financing costs [ease/remain elevated]'; (4) Your view — 'I'm particularly watching [sector/trend] because [specific reason].' Read WSJ, FT, and Dealbook daily before interviews."
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