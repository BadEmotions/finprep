const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://mvtgtndxgfwlutrffbcz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dGd0bmR4Z2Z3bHV0cmZmYmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTgyNzMsImV4cCI6MjA5MjIzNDI3M30.CDJhnlDSULmepL7HTymfFs0mLDSBCcIZA7WFJhK9-7E'
)

const QUESTIONS = [
  {
    id: 1, slug: 'depreciation-3-statements',
    title: "Walk me through the 3 statements effect of $10 depreciation increase",
    difficulty: "easy", category: "ib", type: "structured",
    prompt: "A company increases depreciation by $10. Walk me through how this flows through the Income Statement, Balance Sheet, and Cash Flow Statement. Assume 25% tax rate.",
    answer_structure: [
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
    ideal_answer: "IS: Depreciation +$10 → EBIT –$10 → Net Income –$7.50 (tax shield = $2.50 at 25%). CFS: Net Income –$7.50, add back D&A +$10 → net cash +$2.50. BS: PP&E –$10, Cash +$2.50, Retained Earnings –$7.50 → balanced.",
    time_limit: null
  },
  {
    id: 2, slug: 'cash-acquisition-eps',
    title: "How does a $100M cash acquisition affect the acquirer's EPS?",
    difficulty: "medium", category: "ib", type: "structured",
    prompt: "An acquirer with 50M diluted shares and $200M net income acquires a target for $100M cash at 10x earnings. How does this affect EPS?",
    answer_structure: [
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
    ideal_answer: "Target earns $10M ($100M ÷ 10x). Lost interest: ~$3.75M after-tax. Net income: +$6.25M. No new shares → EPS: $206.25M ÷ 50M = $4.125 vs $4.00. Deal is EPS-accretive by ~3%.",
    time_limit: null
  },
  {
    id: 3, slug: 'dcf-methodology',
    title: "Explain the DCF valuation methodology",
    difficulty: "easy", category: "ib", type: "short",
    prompt: "Explain how a DCF works, walk through the key steps, and describe its main limitations.",
    answer_structure: [
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
    ideal_answer: "A DCF values a business by discounting future FCFs to present value. Steps: (1) Project FCFs; (2) Discount at WACC; (3) Add Terminal Value; (4) EV = Σ PV(FCFs) + PV(TV); (5) Equity Value = EV – Net Debt ÷ diluted shares. Key limitation: highly sensitive to WACC and terminal growth — TV often drives 60–80% of total value.",
    time_limit: null
  },
  {
    id: 4, slug: 'ebitda-explained',
    title: "What is EBITDA and why do investors use it?",
    difficulty: "easy", category: "ib", type: "short",
    prompt: "Explain what EBITDA is, how it is calculated, and why investors use it. What are its drawbacks?",
    answer_structure: [
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
    ideal_answer: "EBITDA = EBIT + D&A. Used because: (1) proxy for operating cash flow; (2) capital-structure agnostic; (3) EV/EBITDA is the standard M&A multiple. Drawback: ignores capex and working capital — a capital-intensive business can have high EBITDA but negative FCF.",
    time_limit: null
  },
  {
    id: 5, slug: 'working-capital-fcf',
    title: "FCF impact when working capital increases by $20M",
    difficulty: "medium", category: "ib", type: "structured",
    prompt: "AR increases $15M, inventory increases $10M, AP increases $5M. Net income unchanged. What is the impact on Free Cash Flow?",
    answer_structure: [
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
    ideal_answer: "AR +$15M = –$15M FCF; Inventory +$10M = –$10M FCF; AP +$5M = +$5M FCF. Net FCF = –$20M. Net income unchanged but cash fell $20M — scaling companies consume working capital even when profitable.",
    time_limit: null
  },
]

async function seed() {
  console.log('Seeding questions...')
  
  const { data, error } = await supabase
    .from('questions')
    .upsert(QUESTIONS, { onConflict: 'id' })
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Successfully seeded', QUESTIONS.length, 'questions!')
  }
}

seed()