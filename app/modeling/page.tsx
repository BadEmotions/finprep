'use client'
import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import HyperFormula from 'hyperformula'

type ModelType = '3-statement' | 'lbo' | 'dcf-simple' | 'dcf-full'
type Screen = 'home' | 'modeling' | 'results'

type CellDef = {
  row: number
  col: number
  expected: number
  label: string
  explanation: string
}

type ModelScenario = {
  type: ModelType
  title: string
  assumptions: Record<string, number>
  grid: (string | number | null)[][]
  editableCells: Set<string>
  gradedCells: CellDef[]
  columnHeaders: string[]
}

function cellKey(r: number, c: number) { return `${r}-${c}` }

function round(n: number, decimals = 1): number {
  return Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

function round2(n: number): number { return round(n, 2) }

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return ''
  if (Math.abs(n) >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 1 })
  return n.toFixed(1)
}

function fmt2(n: number): string { return n.toFixed(2) }

// ─── 3-STATEMENT GENERATOR ───────────────────────────────────────────────────
function generate3Statement(): ModelScenario {
  const revenue = pickRandom([100, 150, 200, 250, 300, 400, 500, 750, 1000])
  const revenueGrowth = pickRandom([5, 8, 10, 12, 15]) / 100
  const ebitdaMargin = pickRandom([20, 25, 28, 30, 35]) / 100
  const daPercent = pickRandom([3, 4, 5, 6, 7]) / 100
  const taxRate = pickRandom([20, 25, 28, 30]) / 100
  const capexPercent = pickRandom([4, 5, 6, 8, 10]) / 100
  const nwcChange = pickRandom([2, 3, 5, 8, 10])
  const interestRate = pickRandom([4, 5, 6, 7]) / 100
  const debtBalance = pickRandom([50, 100, 150, 200, 250])
  const cashBalance = pickRandom([20, 30, 40, 50])
  const ppeStart = pickRandom([80, 100, 150, 200, 250])
  const nwcStart = pickRandom([10, 15, 20, 25, 30])

  const rev1 = round(revenue * (1 + revenueGrowth), 1)
  const ebitda1 = round(rev1 * ebitdaMargin, 1)
  const da1 = round(rev1 * daPercent, 1)
  const ebit1 = round(ebitda1 - da1, 1)
  const interestExp1 = round(debtBalance * interestRate, 1)
  const ebt1 = round(ebit1 - interestExp1, 1)
  const taxes1 = round(ebt1 * taxRate, 1)
  const netIncome1 = round(ebt1 - taxes1, 1)
  const cfo1 = round(netIncome1 + da1 - nwcChange, 1)
  const capex1 = round(rev1 * capexPercent, 1)
  const fcf1 = round(cfo1 - capex1, 1)
  const cashEnd = round(cashBalance + fcf1, 1)
  const nwcEnd = round(nwcStart + nwcChange, 1)
  const ppeEnd = round(ppeStart - da1 + capex1, 1)
  const y0TotalAssets = round(cashBalance + nwcStart + ppeStart, 1)
  const y0Equity = round(y0TotalAssets - debtBalance, 1)
  const totalEquityEnd = round(y0Equity + netIncome1, 1)
  const totalLEEnd = round(debtBalance + totalEquityEnd, 1)

  const grid: (string | number | null)[][] = [
    ['INCOME STATEMENT', '', 'Year 0', 'Year 1'],
    ['Revenue', '', revenue, null],
    ['Revenue Growth %', '', '', `${(revenueGrowth * 100).toFixed(0)}%`],
    ['EBITDA Margin %', '', '', `${(ebitdaMargin * 100).toFixed(0)}%`],
    ['EBITDA', '', '', null],
    ['D&A (% of Revenue)', '', '', `${(daPercent * 100).toFixed(0)}%`],
    ['D&A', '', '', null],
    ['EBIT', '', '', null],
    ['Interest Rate', '', '', `${(interestRate * 100).toFixed(0)}%`],
    ['Interest Expense', '', '', null],
    ['EBT (Pre-tax Income)', '', '', null],
    ['Tax Rate', '', '', `${(taxRate * 100).toFixed(0)}%`],
    ['Taxes', '', '', null],
    ['Net Income', '', '', null],
    ['', '', '', ''],
    ['CASH FLOW STATEMENT', '', '', 'Year 1'],
    ['Net Income', '', '', null],
    ['(+) D&A', '', '', null],
    ['(-) Change in NWC', '', '', nwcChange],
    ['Capex (% of Revenue)', '', '', `${(capexPercent * 100).toFixed(0)}%`],
    ['Cash from Operations', '', '', null],
    ['(-) Capital Expenditures', '', '', null],
    ['Free Cash Flow', '', '', null],
    ['', '', '', ''],
    ['BALANCE SHEET', '', 'Year 0', 'Year 1'],
    ['Cash', '', cashBalance, null],
    ['Net Working Capital', '', nwcStart, null],
    ['PP&E, net', '', ppeStart, null],
    ['Total Assets', '', y0TotalAssets, null],
    ['', '', '', ''],
    ['Debt', '', debtBalance, debtBalance],
    ['Beginning Equity', '', '', y0Equity],
    ['(+) Net Income (Retained)', '', '', null],
    ['Total Equity', '', y0Equity, null],
    ['Total Liabilities + Equity', '', y0TotalAssets, null],
    ['', '', '', ''],
    ['✓ Balance Check (Assets - L&E)', '', '', null],
  ]

  const editableCells = new Set<string>()
  const gradedCells: CellDef[] = []

  const addCell = (r: number, c: number, expected: number, label: string, explanation: string) => {
    editableCells.add(cellKey(r, c))
    gradedCells.push({ row: r, col: c, expected, label, explanation })
  }

  addCell(1, 3, rev1, 'Revenue Y1', `${revenue} × (1 + ${(revenueGrowth*100).toFixed(0)}%) = ${fmt(rev1)}`)
  addCell(4, 3, ebitda1, 'EBITDA', `${fmt(rev1)} × ${(ebitdaMargin*100).toFixed(0)}% = ${fmt(ebitda1)}`)
  addCell(6, 3, da1, 'D&A', `${fmt(rev1)} × ${(daPercent*100).toFixed(0)}% = ${fmt(da1)}`)
  addCell(7, 3, ebit1, 'EBIT', `EBITDA ${fmt(ebitda1)} - D&A ${fmt(da1)} = ${fmt(ebit1)}`)
  addCell(9, 3, interestExp1, 'Interest Expense', `Debt ${debtBalance} × ${(interestRate*100).toFixed(0)}% = ${fmt(interestExp1)}`)
  addCell(10, 3, ebt1, 'EBT', `EBIT ${fmt(ebit1)} - Interest ${fmt(interestExp1)} = ${fmt(ebt1)}`)
  addCell(12, 3, taxes1, 'Taxes', `EBT ${fmt(ebt1)} × ${(taxRate*100).toFixed(0)}% = ${fmt(taxes1)}`)
  addCell(13, 3, netIncome1, 'Net Income', `EBT ${fmt(ebt1)} - Taxes ${fmt(taxes1)} = ${fmt(netIncome1)}`)
  addCell(16, 3, netIncome1, 'CFS: Net Income', `Links from Income Statement = ${fmt(netIncome1)}`)
  addCell(17, 3, da1, 'CFS: D&A Add-back', `Non-cash charge added back = ${fmt(da1)}`)
  addCell(20, 3, cfo1, 'Cash from Operations', `NI ${fmt(netIncome1)} + D&A ${fmt(da1)} - ΔNWC ${nwcChange} = ${fmt(cfo1)}`)
  addCell(21, 3, capex1, 'Capital Expenditures', `Revenue ${fmt(rev1)} × ${(capexPercent*100).toFixed(0)}% = ${fmt(capex1)}`)
  addCell(22, 3, fcf1, 'Free Cash Flow', `CFO ${fmt(cfo1)} - Capex ${fmt(capex1)} = ${fmt(fcf1)}`)
  addCell(25, 3, cashEnd, 'Cash Y1', `Beginning ${cashBalance} + FCF ${fmt(fcf1)} = ${fmt(cashEnd)}`)
  addCell(26, 3, nwcEnd, 'Net Working Capital Y1', `Beginning NWC ${nwcStart} + ΔNWC ${nwcChange} = ${fmt(nwcEnd)}`)
  addCell(27, 3, ppeEnd, 'PP&E Y1', `Beginning ${ppeStart} - D&A ${fmt(da1)} + Capex ${fmt(capex1)} = ${fmt(ppeEnd)}`)
  addCell(28, 3, round(cashEnd + nwcEnd + ppeEnd, 1), 'Total Assets Y1', `Cash ${fmt(cashEnd)} + NWC ${fmt(nwcEnd)} + PP&E ${fmt(ppeEnd)} = ${fmt(round(cashEnd + nwcEnd + ppeEnd, 1))}`)
  addCell(32, 3, netIncome1, 'Retained Earnings', `Net Income flows to equity = ${fmt(netIncome1)}`)
  addCell(33, 3, totalEquityEnd, 'Total Equity Y1', `Beginning Equity ${fmt(y0Equity)} + Net Income ${fmt(netIncome1)} = ${fmt(totalEquityEnd)}`)
  addCell(34, 3, totalLEEnd, 'Total L+E Y1', `Debt ${debtBalance} + Total Equity ${fmt(totalEquityEnd)} = ${fmt(totalLEEnd)}`)
  addCell(36, 3, 0, 'Balance Check', `Total Assets ${fmt(round(cashEnd + nwcEnd + ppeEnd, 1))} - Total L+E ${fmt(totalLEEnd)} = 0 (balanced!)`)

  return {
    type: '3-statement',
    title: '3-Statement Model',
    assumptions: { revenue, revenueGrowth, ebitdaMargin, daPercent, taxRate, capexPercent, nwcChange, interestRate, debtBalance, cashBalance, ppeStart, nwcStart },
    grid, editableCells, gradedCells,
    columnHeaders: ['', '', 'Year 0', 'Year 1'],
  }
}

// ─── LBO GENERATOR ───────────────────────────────────────────────────────────
function generateLBO(): ModelScenario {
  const ebitda = pickRandom([50, 75, 100, 125, 150, 200])
  const entryMultiple = pickRandom([6, 7, 8, 9, 10])
  const debtPercent = pickRandom([50, 55, 60, 65]) / 100
  const interestRate = pickRandom([5, 6, 7, 8]) / 100
  const ebitdaGrowth = pickRandom([5, 8, 10, 12]) / 100
  const exitMultiple = pickRandom([7, 8, 9, 10, 11])
  const taxRate = pickRandom([25, 28, 30]) / 100
  const capexPercent = pickRandom([3, 4, 5]) / 100
  const daPercent = pickRandom([3, 4, 5]) / 100

  const entryEV = ebitda * entryMultiple
  const entryDebt = round(entryEV * debtPercent, 1)
  const entryEquity = round(entryEV - entryDebt, 1)

  const years: { ebitda: number; da: number; ebit: number; interest: number; ebt: number; taxes: number; ni: number; capex: number; fcf: number; debtEnd: number }[] = []
  let currentDebt = entryDebt

  for (let y = 1; y <= 5; y++) {
    const yEbitda = round(ebitda * Math.pow(1 + ebitdaGrowth, y), 1)
    const yDa = round(yEbitda * daPercent, 1)
    const yEbit = round(yEbitda - yDa, 1)
    const yInterest = round(currentDebt * interestRate, 1)
    const yEbt = round(yEbit - yInterest, 1)
    const yTaxes = round(Math.max(yEbt * taxRate, 0), 1)
    const yNi = round(yEbt - yTaxes, 1)
    const yCapex = round(yEbitda * capexPercent, 1)
    const yFcf = round(yNi + yDa - yCapex, 1)
    const yDebtEnd = round(currentDebt - yFcf, 1)
    years.push({ ebitda: yEbitda, da: yDa, ebit: yEbit, interest: yInterest, ebt: yEbt, taxes: yTaxes, ni: yNi, capex: yCapex, fcf: yFcf, debtEnd: yDebtEnd })
    currentDebt = yDebtEnd
  }

  const exitEbitda = years[4].ebitda
  const exitEV = round(exitEbitda * exitMultiple, 1)
  const exitDebt = years[4].debtEnd
  const exitEquity = round(exitEV - exitDebt, 1)
  const moic = round(exitEquity / entryEquity, 2)
  const irr = round((Math.pow(exitEquity / entryEquity, 1/5) - 1) * 100, 1)

  const grid: (string | number | null)[][] = [
    ['LBO MODEL', '', 'Entry', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Exit'],
    ['EBITDA', '', ebitda, null, null, null, null, null, null],
    ['EBITDA Growth %', '', '', `${(ebitdaGrowth*100).toFixed(0)}%`, `${(ebitdaGrowth*100).toFixed(0)}%`, `${(ebitdaGrowth*100).toFixed(0)}%`, `${(ebitdaGrowth*100).toFixed(0)}%`, `${(ebitdaGrowth*100).toFixed(0)}%`, ''],
    ['D&A (% of EBITDA)', '', '', `${(daPercent*100).toFixed(0)}%`, `${(daPercent*100).toFixed(0)}%`, `${(daPercent*100).toFixed(0)}%`, `${(daPercent*100).toFixed(0)}%`, `${(daPercent*100).toFixed(0)}%`, ''],
    ['Capex (% of EBITDA)', '', '', `${(capexPercent*100).toFixed(0)}%`, `${(capexPercent*100).toFixed(0)}%`, `${(capexPercent*100).toFixed(0)}%`, `${(capexPercent*100).toFixed(0)}%`, `${(capexPercent*100).toFixed(0)}%`, ''],
    ['Tax Rate', '', '', `${(taxRate*100).toFixed(0)}%`, `${(taxRate*100).toFixed(0)}%`, `${(taxRate*100).toFixed(0)}%`, `${(taxRate*100).toFixed(0)}%`, `${(taxRate*100).toFixed(0)}%`, ''],
    ['', '', '', '', '', '', '', '', ''],
    ['TRANSACTION', '', '', '', '', '', '', '', ''],
    ['Entry Multiple', '', `${entryMultiple}x`, '', '', '', '', '', ''],
    ['Exit Multiple', '', '', '', '', '', '', '', `${exitMultiple}x`],
    ['Enterprise Value', '', null, '', '', '', '', '', null],
    ['Debt %', '', `${(debtPercent*100).toFixed(0)}%`, '', '', '', '', '', ''],
    ['Entry Debt', '', null, '', '', '', '', '', ''],
    ['Entry Equity', '', null, '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['INCOME STATEMENT', '', '', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', ''],
    ['EBITDA', '', '', null, null, null, null, null, ''],
    ['(-) D&A', '', '', null, null, null, null, null, ''],
    ['EBIT', '', '', null, null, null, null, null, ''],
    ['(-) Interest Expense', '', '', null, null, null, null, null, ''],
    ['EBT', '', '', null, null, null, null, null, ''],
    ['(-) Taxes', '', '', null, null, null, null, null, ''],
    ['Net Income', '', '', null, null, null, null, null, ''],
    ['', '', '', '', '', '', '', '', ''],
    ['DEBT SCHEDULE', '', '', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', ''],
    ['Beginning Debt', '', '', null, null, null, null, null, ''],
    ['Interest Rate', '', '', `${(interestRate*100).toFixed(0)}%`, `${(interestRate*100).toFixed(0)}%`, `${(interestRate*100).toFixed(0)}%`, `${(interestRate*100).toFixed(0)}%`, `${(interestRate*100).toFixed(0)}%`, ''],
    ['(-) FCF (Debt Paydown)', '', '', null, null, null, null, null, ''],
    ['Ending Debt', '', '', null, null, null, null, null, ''],
    ['', '', '', '', '', '', '', '', ''],
    ['RETURNS', '', '', '', '', '', '', '', 'Exit'],
    ['Exit EBITDA', '', '', '', '', '', '', '', null],
    ['Exit Enterprise Value', '', '', '', '', '', '', '', null],
    ['(-) Remaining Debt', '', '', '', '', '', '', '', null],
    ['Exit Equity', '', '', '', '', '', '', '', null],
    ['MOIC', '', '', '', '', '', '', '', null],
    ['IRR %', '', '', '', '', '', '', '', null],
  ]

  const editableCells = new Set<string>()
  const gradedCells: CellDef[] = []

  const addCell = (r: number, c: number, expected: number, label: string, explanation: string) => {
    editableCells.add(cellKey(r, c))
    gradedCells.push({ row: r, col: c, expected, label, explanation })
  }

  addCell(10, 2, entryEV, 'Entry EV', `EBITDA ${ebitda} × ${entryMultiple}x = ${entryEV}`)
  addCell(12, 2, entryDebt, 'Entry Debt', `EV ${entryEV} × ${(debtPercent*100).toFixed(0)}% = ${fmt(entryDebt)}`)
  addCell(13, 2, entryEquity, 'Entry Equity', `EV ${entryEV} - Debt ${fmt(entryDebt)} = ${fmt(entryEquity)}`)

  for (let y = 0; y < 5; y++) {
    const col = y + 3
    const yr = years[y]
    const prevDebt = y === 0 ? entryDebt : years[y-1].debtEnd
    const prevEbitda = y === 0 ? ebitda : years[y-1].ebitda

    addCell(16, col, yr.ebitda, `Y${y+1} EBITDA`, `${fmt(prevEbitda)} × (1 + ${(ebitdaGrowth*100).toFixed(0)}%) = ${fmt(yr.ebitda)}`)
    addCell(17, col, yr.da, `Y${y+1} D&A`, `EBITDA ${fmt(yr.ebitda)} × ${(daPercent*100).toFixed(0)}% = ${fmt(yr.da)}`)
    addCell(18, col, yr.ebit, `Y${y+1} EBIT`, `EBITDA ${fmt(yr.ebitda)} - D&A ${fmt(yr.da)} = ${fmt(yr.ebit)}`)
    addCell(19, col, yr.interest, `Y${y+1} Interest`, `Beg Debt ${fmt(prevDebt)} × ${(interestRate*100).toFixed(0)}% = ${fmt(yr.interest)}`)
    addCell(20, col, yr.ebt, `Y${y+1} EBT`, `EBIT ${fmt(yr.ebit)} - Interest ${fmt(yr.interest)} = ${fmt(yr.ebt)}`)
    addCell(21, col, yr.taxes, `Y${y+1} Taxes`, `EBT ${fmt(yr.ebt)} × ${(taxRate*100).toFixed(0)}% = ${fmt(yr.taxes)}`)
    addCell(22, col, yr.ni, `Y${y+1} Net Income`, `EBT ${fmt(yr.ebt)} - Taxes ${fmt(yr.taxes)} = ${fmt(yr.ni)}`)
    addCell(25, col, prevDebt, `Y${y+1} Beg Debt`, y === 0 ? `Entry debt = ${fmt(entryDebt)}` : `Prior ending debt = ${fmt(prevDebt)}`)
    addCell(27, col, yr.fcf, `Y${y+1} FCF`, `NI ${fmt(yr.ni)} + D&A ${fmt(yr.da)} - Capex ${fmt(yr.capex)} = ${fmt(yr.fcf)}`)
    addCell(28, col, yr.debtEnd, `Y${y+1} End Debt`, `Beg ${fmt(prevDebt)} - FCF ${fmt(yr.fcf)} = ${fmt(yr.debtEnd)}`)
  }

  addCell(31, 8, exitEbitda, 'Exit EBITDA', `Year 5 EBITDA = ${fmt(exitEbitda)}`)
  addCell(10, 8, exitEV, 'Exit EV (top)', `${fmt(exitEbitda)} × ${exitMultiple}x = ${fmt(exitEV)}`)
  addCell(32, 8, exitEV, 'Exit EV', `${fmt(exitEbitda)} × ${exitMultiple}x = ${fmt(exitEV)}`)
  addCell(33, 8, exitDebt, 'Remaining Debt', `Year 5 ending debt = ${fmt(exitDebt)}`)
  addCell(34, 8, exitEquity, 'Exit Equity', `Exit EV ${fmt(exitEV)} - Debt ${fmt(exitDebt)} = ${fmt(exitEquity)}`)
  addCell(35, 8, moic, 'MOIC', `Exit Equity ${fmt(exitEquity)} / Entry Equity ${fmt(entryEquity)} = ${moic}x`)
  addCell(36, 8, irr, 'IRR %', `(${moic}x)^(1/5) - 1 = ${irr}%`)

  return {
    type: 'lbo',
    title: 'Paper LBO Model',
    assumptions: { ebitda, entryMultiple, debtPercent, interestRate, ebitdaGrowth, exitMultiple, taxRate, capexPercent, daPercent },
    grid, editableCells, gradedCells,
    columnHeaders: ['', '', 'Entry', 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Exit'],
  }
}

// ─── SIMPLE DCF GENERATOR ────────────────────────────────────────────────────
function generateSimpleDCF(): ModelScenario {
  const revenue = pickRandom([100, 150, 200, 250, 300, 400, 500])
  const revenueGrowth = pickRandom([5, 8, 10, 12, 15]) / 100
  const ebitdaMargin = pickRandom([20, 25, 28, 30, 35]) / 100
  const daPercent = pickRandom([3, 4, 5, 6]) / 100
  const taxRate = pickRandom([20, 25, 28, 30]) / 100
  const capexPercent = pickRandom([4, 5, 6, 8]) / 100
  const nwcPercent = pickRandom([1, 2, 3]) / 100
  const wacc = pickRandom([8, 9, 10, 11, 12]) / 100
  const terminalGrowth = pickRandom([2, 2.5, 3, 3.5]) / 100
  const exitMultiple = pickRandom([8, 9, 10, 11, 12])
  const netDebt = pickRandom([50, 100, 150, 200, 250])
  const sharesOut = pickRandom([10, 20, 25, 50, 100])

  // Build 5-year FCF projections
  const fcfs: number[] = []
  const revenues: number[] = []
  const ebitdas: number[] = []
  const nopats: number[] = []

  for (let y = 1; y <= 5; y++) {
    const rev = round(revenue * Math.pow(1 + revenueGrowth, y), 1)
    const ebitda = round(rev * ebitdaMargin, 1)
    const da = round(rev * daPercent, 1)
    const ebit = round(ebitda - da, 1)
    const nopat = round(ebit * (1 - taxRate), 1)
    const capex = round(rev * capexPercent, 1)
    const nwcChangeAmt = round(rev * nwcPercent, 1)
    const fcf = round(nopat + da - capex - nwcChangeAmt, 1)
    revenues.push(rev)
    ebitdas.push(ebitda)
    nopats.push(nopat)
    fcfs.push(fcf)
  }

  // Discount factors
  const dfs = [1,2,3,4,5].map(y => round2(1 / Math.pow(1 + wacc, y)))
  const pvFcfs = fcfs.map((f, i) => round(f * dfs[i], 1))
  const sumPvFcfs = round(pvFcfs.reduce((a, b) => a + b, 0), 1)

  // Terminal Value — Gordon Growth
  const fcf5 = fcfs[4]
  const tvGG = round(fcf5 * (1 + terminalGrowth) / (wacc - terminalGrowth), 1)
  const pvTvGG = round(tvGG * dfs[4], 1)
  const evGG = round(sumPvFcfs + pvTvGG, 1)

  // Terminal Value — Exit Multiple
  const ebitda5 = ebitdas[4]
  const tvEM = round(ebitda5 * exitMultiple, 1)
  const pvTvEM = round(tvEM * dfs[4], 1)
  const evEM = round(sumPvFcfs + pvTvEM, 1)

  // Equity Value
  const equityGG = round(evGG - netDebt, 1)
  const priceGG = round(equityGG / sharesOut, 2)
  const equityEM = round(evEM - netDebt, 1)
  const priceEM = round(equityEM / sharesOut, 2)

  const colHeaders = ['', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']

  const grid: (string | number | null)[][] = [
    // Row 0: Header
    ['DCF MODEL (SIMPLE)', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
    // Row 1: Revenue
    ['Revenue', revenues[0], revenues[1], revenues[2], revenues[3], revenues[4]],
    // Row 2: Revenue Growth
    ['Revenue Growth %', `${(revenueGrowth*100).toFixed(0)}%`, `${(revenueGrowth*100).toFixed(0)}%`, `${(revenueGrowth*100).toFixed(0)}%`, `${(revenueGrowth*100).toFixed(0)}%`, `${(revenueGrowth*100).toFixed(0)}%`],
    // Row 3: EBITDA Margin
    ['EBITDA Margin %', `${(ebitdaMargin*100).toFixed(0)}%`, `${(ebitdaMargin*100).toFixed(0)}%`, `${(ebitdaMargin*100).toFixed(0)}%`, `${(ebitdaMargin*100).toFixed(0)}%`, `${(ebitdaMargin*100).toFixed(0)}%`],
    // Row 4: EBITDA
    ['EBITDA', null, null, null, null, null],
    // Row 5: D&A %
    ['D&A %', `${(daPercent*100).toFixed(0)}%`, `${(daPercent*100).toFixed(0)}%`, `${(daPercent*100).toFixed(0)}%`, `${(daPercent*100).toFixed(0)}%`, `${(daPercent*100).toFixed(0)}%`],
    // Row 6: EBIT
    ['EBIT (= EBITDA - D&A)', null, null, null, null, null],
    // Row 7: Tax Rate
    ['Tax Rate', `${(taxRate*100).toFixed(0)}%`, `${(taxRate*100).toFixed(0)}%`, `${(taxRate*100).toFixed(0)}%`, `${(taxRate*100).toFixed(0)}%`, `${(taxRate*100).toFixed(0)}%`],
    // Row 8: NOPAT
    ['NOPAT (= EBIT × (1-Tax))', null, null, null, null, null],
    // Row 9: D&A addback
    ['(+) D&A', null, null, null, null, null],
    // Row 10: Capex
    ['(-) Capex %', `${(capexPercent*100).toFixed(0)}%`, `${(capexPercent*100).toFixed(0)}%`, `${(capexPercent*100).toFixed(0)}%`, `${(capexPercent*100).toFixed(0)}%`, `${(capexPercent*100).toFixed(0)}%`],
    // Row 11: Capex amount
    ['(-) Capex', null, null, null, null, null],
    // Row 12: NWC change %
    ['(-) Change in NWC %', `${(nwcPercent*100).toFixed(0)}%`, `${(nwcPercent*100).toFixed(0)}%`, `${(nwcPercent*100).toFixed(0)}%`, `${(nwcPercent*100).toFixed(0)}%`, `${(nwcPercent*100).toFixed(0)}%`],
    // Row 13: NWC change amount
    ['(-) Change in NWC', null, null, null, null, null],
    // Row 14: Unlevered FCF
    ['Unlevered Free Cash Flow', null, null, null, null, null],
    // Row 15: blank
    ['', '', '', '', '', ''],
    // Row 16: Discount section
    ['DISCOUNTING', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
    // Row 17: WACC
    ['WACC', `${(wacc*100).toFixed(0)}%`, `${(wacc*100).toFixed(0)}%`, `${(wacc*100).toFixed(0)}%`, `${(wacc*100).toFixed(0)}%`, `${(wacc*100).toFixed(0)}%`],
    // Row 18: Discount factors
    ['Discount Factor (1/(1+WACC)^t)', null, null, null, null, null],
    // Row 19: PV of FCF
    ['PV of FCF', null, null, null, null, null],
    // Row 20: Sum of PV FCFs
    ['Sum of PV(FCFs)', null, null, null, null, null],
    // Row 21: blank
    ['', '', '', '', '', ''],
    // Row 22: Terminal value section
    ['TERMINAL VALUE', '', '', '', '', ''],
    // Row 23: Gordon Growth inputs
    ['Terminal Growth Rate', `${(terminalGrowth*100).toFixed(1)}%`, '', '', '', ''],
    // Row 24: TV Gordon Growth
    ['TV — Gordon Growth = FCF5 × (1+g) / (WACC-g)', null, '', '', '', ''],
    // Row 25: PV of TV (GG)
    ['PV of Terminal Value (Gordon Growth)', null, '', '', '', ''],
    // Row 26: EV (Gordon Growth)
    ['Enterprise Value (Gordon Growth)', null, '', '', '', ''],
    // Row 27: blank
    ['', '', '', '', '', ''],
    // Row 28: Exit Multiple
    ['Exit Multiple', `${exitMultiple}x`, '', '', '', ''],
    // Row 29: TV Exit Multiple
    ['TV — Exit Multiple = EBITDA5 × Multiple', null, '', '', '', ''],
    // Row 30: PV of TV (EM)
    ['PV of Terminal Value (Exit Multiple)', null, '', '', '', ''],
    // Row 31: EV (Exit Multiple)
    ['Enterprise Value (Exit Multiple)', null, '', '', '', ''],
    // Row 32: blank
    ['', '', '', '', '', ''],
    // Row 33: Bridge section
    ['EQUITY VALUE BRIDGE', '', '', '', '', ''],
    // Row 34: Net debt
    ['(-) Net Debt', netDebt, '', '', '', ''],
    // Row 35: Shares
    ['Diluted Shares Outstanding', sharesOut, '', '', '', ''],
    // Row 36: Equity Value GG
    ['Equity Value (Gordon Growth)', null, '', '', '', ''],
    // Row 37: Price per share GG
    ['Implied Share Price (Gordon Growth)', null, '', '', '', ''],
    // Row 38: Equity Value EM
    ['Equity Value (Exit Multiple)', null, '', '', '', ''],
    // Row 39: Price per share EM
    ['Implied Share Price (Exit Multiple)', null, '', '', '', ''],
  ]

  const editableCells = new Set<string>()
  const gradedCells: CellDef[] = []

  const addCell = (r: number, c: number, expected: number, label: string, explanation: string) => {
    editableCells.add(cellKey(r, c))
    gradedCells.push({ row: r, col: c, expected, label, explanation })
  }

  const da = revenues.map(r => round(r * daPercent, 1))
  const ebit = ebitdas.map((e, i) => round(e - da[i], 1))
  const capexAmts = revenues.map(r => round(r * capexPercent, 1))
  const nwcAmts = revenues.map(r => round(r * nwcPercent, 1))

  // FCF projection cells
  for (let y = 0; y < 5; y++) {
    const col = y + 1
    addCell(4, col, ebitdas[y], `Y${y+1} EBITDA`, `${fmt(revenues[y])} × ${(ebitdaMargin*100).toFixed(0)}% = ${fmt(ebitdas[y])}`)
    addCell(6, col, ebit[y], `Y${y+1} EBIT`, `EBITDA ${fmt(ebitdas[y])} - D&A ${fmt(da[y])} = ${fmt(ebit[y])}`)
    addCell(8, col, nopats[y], `Y${y+1} NOPAT`, `EBIT ${fmt(ebit[y])} × (1 - ${(taxRate*100).toFixed(0)}%) = ${fmt(nopats[y])}`)
    addCell(9, col, da[y], `Y${y+1} D&A Addback`, `${fmt(revenues[y])} × ${(daPercent*100).toFixed(0)}% = ${fmt(da[y])}`)
    addCell(11, col, capexAmts[y], `Y${y+1} Capex`, `${fmt(revenues[y])} × ${(capexPercent*100).toFixed(0)}% = ${fmt(capexAmts[y])}`)
    addCell(13, col, nwcAmts[y], `Y${y+1} NWC Change`, `${fmt(revenues[y])} × ${(nwcPercent*100).toFixed(0)}% = ${fmt(nwcAmts[y])}`)
    addCell(14, col, fcfs[y], `Y${y+1} Unlevered FCF`, `NOPAT ${fmt(nopats[y])} + D&A ${fmt(da[y])} - Capex ${fmt(capexAmts[y])} - NWC ${fmt(nwcAmts[y])} = ${fmt(fcfs[y])}`)
    addCell(18, col, dfs[y], `Y${y+1} Discount Factor`, `1 / (1 + ${(wacc*100).toFixed(0)}%)^${y+1} = ${fmt2(dfs[y])}`)
    addCell(19, col, pvFcfs[y], `Y${y+1} PV of FCF`, `FCF ${fmt(fcfs[y])} × ${fmt2(dfs[y])} = ${fmt(pvFcfs[y])}`)
  }

  addCell(20, 1, sumPvFcfs, 'Sum of PV(FCFs)', `Sum of all discounted FCFs = ${fmt(sumPvFcfs)}`)
  addCell(24, 1, tvGG, 'TV (Gordon Growth)', `FCF5 ${fmt(fcf5)} × (1 + ${(terminalGrowth*100).toFixed(1)}%) / (${(wacc*100).toFixed(0)}% - ${(terminalGrowth*100).toFixed(1)}%) = ${fmt(tvGG)}`)
  addCell(25, 1, pvTvGG, 'PV of TV (Gordon Growth)', `TV ${fmt(tvGG)} × ${fmt2(dfs[4])} = ${fmt(pvTvGG)}`)
  addCell(26, 1, evGG, 'EV (Gordon Growth)', `Sum PV FCFs ${fmt(sumPvFcfs)} + PV TV ${fmt(pvTvGG)} = ${fmt(evGG)}`)
  addCell(29, 1, tvEM, 'TV (Exit Multiple)', `EBITDA5 ${fmt(ebitda5)} × ${exitMultiple}x = ${fmt(tvEM)}`)
  addCell(30, 1, pvTvEM, 'PV of TV (Exit Multiple)', `TV ${fmt(tvEM)} × ${fmt2(dfs[4])} = ${fmt(pvTvEM)}`)
  addCell(31, 1, evEM, 'EV (Exit Multiple)', `Sum PV FCFs ${fmt(sumPvFcfs)} + PV TV ${fmt(pvTvEM)} = ${fmt(evEM)}`)
  addCell(36, 1, equityGG, 'Equity Value (GG)', `EV ${fmt(evGG)} - Net Debt ${netDebt} = ${fmt(equityGG)}`)
  addCell(37, 1, priceGG, 'Share Price (GG)', `Equity ${fmt(equityGG)} / ${sharesOut}M shares = $${fmt2(priceGG)}`)
  addCell(38, 1, equityEM, 'Equity Value (EM)', `EV ${fmt(evEM)} - Net Debt ${netDebt} = ${fmt(equityEM)}`)
  addCell(39, 1, priceEM, 'Share Price (EM)', `Equity ${fmt(equityEM)} / ${sharesOut}M shares = $${fmt2(priceEM)}`)

  return {
    type: 'dcf-simple',
    title: 'DCF Model (Simple)',
    assumptions: { revenue, revenueGrowth, ebitdaMargin, daPercent, taxRate, capexPercent, nwcPercent, wacc, terminalGrowth, exitMultiple, netDebt, sharesOut },
    grid, editableCells, gradedCells,
    columnHeaders: colHeaders,
  }
}

// ─── FULL DCF GENERATOR ──────────────────────────────────────────────────────
function generateFullDCF(): ModelScenario {
  const revenue = pickRandom([100, 150, 200, 250, 300, 400, 500])
  const revenueGrowth = pickRandom([5, 8, 10, 12, 15]) / 100
  const ebitdaMargin = pickRandom([20, 25, 28, 30, 35]) / 100
  const daPercent = pickRandom([3, 4, 5, 6]) / 100
  const taxRate = pickRandom([20, 25, 28, 30]) / 100
  const capexPercent = pickRandom([4, 5, 6, 8]) / 100
  const nwcPercent = pickRandom([1, 2, 3]) / 100
  const terminalGrowth = pickRandom([2, 2.5, 3, 3.5]) / 100
  const exitMultiple = pickRandom([8, 9, 10, 11, 12])
  const netDebt = pickRandom([50, 100, 150, 200, 250])
  const sharesOut = pickRandom([10, 20, 25, 50, 100])

  // WACC inputs
  const riskFreeRate = pickRandom([4.0, 4.5, 5.0]) / 100
  const beta = pickRandom([0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4])
  const erp = pickRandom([5.0, 5.5, 6.0]) / 100
  const costOfDebt = pickRandom([5, 6, 7, 8]) / 100
  const debtWeight = pickRandom([20, 25, 30, 35, 40]) / 100
  const equityWeight = round2(1 - debtWeight)

  // Calculate WACC
  const costOfEquity = round2(riskFreeRate + beta * erp)
  const afterTaxCostOfDebt = round2(costOfDebt * (1 - taxRate))
  const wacc = round2(equityWeight * costOfEquity + debtWeight * afterTaxCostOfDebt)

  // Build FCF projections (same as simple)
  const fcfs: number[] = []
  const revenues: number[] = []
  const ebitdas: number[] = []
  const nopats: number[] = []

  for (let y = 1; y <= 5; y++) {
    const rev = round(revenue * Math.pow(1 + revenueGrowth, y), 1)
    const ebitda = round(rev * ebitdaMargin, 1)
    const da = round(rev * daPercent, 1)
    const ebit = round(ebitda - da, 1)
    const nopat = round(ebit * (1 - taxRate), 1)
    const capex = round(rev * capexPercent, 1)
    const nwcChangeAmt = round(rev * nwcPercent, 1)
    const fcf = round(nopat + da - capex - nwcChangeAmt, 1)
    revenues.push(rev)
    ebitdas.push(ebitda)
    nopats.push(nopat)
    fcfs.push(fcf)
  }

  const dfs = [1,2,3,4,5].map(y => round2(1 / Math.pow(1 + wacc, y)))
  const pvFcfs = fcfs.map((f, i) => round(f * dfs[i], 1))
  const sumPvFcfs = round(pvFcfs.reduce((a, b) => a + b, 0), 1)

  const fcf5 = fcfs[4]
  const ebitda5 = ebitdas[4]
  const tvGG = round(fcf5 * (1 + terminalGrowth) / (wacc - terminalGrowth), 1)
  const pvTvGG = round(tvGG * dfs[4], 1)
  const evGG = round(sumPvFcfs + pvTvGG, 1)
  const tvEM = round(ebitda5 * exitMultiple, 1)
  const pvTvEM = round(tvEM * dfs[4], 1)
  const evEM = round(sumPvFcfs + pvTvEM, 1)
  const equityGG = round(evGG - netDebt, 1)
  const priceGG = round(equityGG / sharesOut, 2)
  const equityEM = round(evEM - netDebt, 1)
  const priceEM = round(equityEM / sharesOut, 2)

  const da = revenues.map(r => round(r * daPercent, 1))
  const ebit = ebitdas.map((e, i) => round(e - da[i], 1))
  const capexAmts = revenues.map(r => round(r * capexPercent, 1))
  const nwcAmts = revenues.map(r => round(r * nwcPercent, 1))

  const grid: (string | number | null)[][] = [
    // Row 0: WACC section
    ['WACC CALCULATION', '', '', '', '', ''],
    // Row 1: Risk free rate
    ['Risk-Free Rate (Rf)', riskFreeRate * 100, '', '', '', ''],
    // Row 2: Beta
    ['Beta (β)', beta, '', '', '', ''],
    // Row 3: ERP
    ['Equity Risk Premium (ERP)', erp * 100, '', '', '', ''],
    // Row 4: Cost of equity
    ['Cost of Equity = Rf + β × ERP', null, '', '', '', ''],
    // Row 5: Cost of debt
    ['Pre-Tax Cost of Debt', costOfDebt * 100, '', '', '', ''],
    // Row 6: Tax rate
    ['Tax Rate', taxRate * 100, '', '', '', ''],
    // Row 7: After-tax cost of debt
    ['After-Tax Cost of Debt = Kd × (1-T)', null, '', '', '', ''],
    // Row 8: Weights
    ['Equity Weight', equityWeight * 100, '', '', '', ''],
    // Row 9: Debt weight
    ['Debt Weight', debtWeight * 100, '', '', '', ''],
    // Row 10: WACC
    ['WACC = Ke × E% + Kd(1-T) × D%', null, '', '', '', ''],
    // Row 11: blank
    ['', '', '', '', '', ''],
    // Row 12: FCF section
    ['FCF PROJECTIONS', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
    ['Revenue', revenues[0], revenues[1], revenues[2], revenues[3], revenues[4]],
    ['EBITDA Margin %', `${(ebitdaMargin*100).toFixed(0)}%`, `${(ebitdaMargin*100).toFixed(0)}%`, `${(ebitdaMargin*100).toFixed(0)}%`, `${(ebitdaMargin*100).toFixed(0)}%`, `${(ebitdaMargin*100).toFixed(0)}%`],
    ['EBITDA', null, null, null, null, null],
    ['D&A %', `${(daPercent*100).toFixed(0)}%`, `${(daPercent*100).toFixed(0)}%`, `${(daPercent*100).toFixed(0)}%`, `${(daPercent*100).toFixed(0)}%`, `${(daPercent*100).toFixed(0)}%`],
    ['EBIT', null, null, null, null, null],
    ['NOPAT', null, null, null, null, null],
    ['(+) D&A', null, null, null, null, null],
    ['(-) Capex %', `${(capexPercent*100).toFixed(0)}%`, `${(capexPercent*100).toFixed(0)}%`, `${(capexPercent*100).toFixed(0)}%`, `${(capexPercent*100).toFixed(0)}%`, `${(capexPercent*100).toFixed(0)}%`],
    ['(-) Capex', null, null, null, null, null],
    ['(-) NWC Change %', `${(nwcPercent*100).toFixed(0)}%`, `${(nwcPercent*100).toFixed(0)}%`, `${(nwcPercent*100).toFixed(0)}%`, `${(nwcPercent*100).toFixed(0)}%`, `${(nwcPercent*100).toFixed(0)}%`],
    ['(-) NWC Change', null, null, null, null, null],
    ['Unlevered Free Cash Flow', null, null, null, null, null],
    ['', '', '', '', '', ''],
    ['DISCOUNTING', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
    ['Discount Factor', null, null, null, null, null],
    ['PV of FCF', null, null, null, null, null],
    ['Sum of PV(FCFs)', null, '', '', '', ''],
    ['', '', '', '', '', ''],
    ['TERMINAL VALUE', '', '', '', '', ''],
    ['Terminal Growth Rate', `${(terminalGrowth*100).toFixed(1)}%`, '', '', '', ''],
    ['TV — Gordon Growth', null, '', '', '', ''],
    ['PV of TV (Gordon Growth)', null, '', '', '', ''],
    ['EV (Gordon Growth)', null, '', '', '', ''],
    ['', '', '', '', '', ''],
    ['Exit Multiple', `${exitMultiple}x`, '', '', '', ''],
    ['TV — Exit Multiple', null, '', '', '', ''],
    ['PV of TV (Exit Multiple)', null, '', '', '', ''],
    ['EV (Exit Multiple)', null, '', '', '', ''],
    ['', '', '', '', '', ''],
    ['EQUITY VALUE BRIDGE', '', '', '', '', ''],
    ['(-) Net Debt', netDebt, '', '', '', ''],
    ['Diluted Shares Outstanding', sharesOut, '', '', '', ''],
    ['Equity Value (Gordon Growth)', null, '', '', '', ''],
    ['Implied Share Price (GG)', null, '', '', '', ''],
    ['Equity Value (Exit Multiple)', null, '', '', '', ''],
    ['Implied Share Price (EM)', null, '', '', '', ''],
  ]

  const editableCells = new Set<string>()
  const gradedCells: CellDef[] = []

  const addCell = (r: number, c: number, expected: number, label: string, explanation: string) => {
    editableCells.add(cellKey(r, c))
    gradedCells.push({ row: r, col: c, expected, label, explanation })
  }

  // WACC cells
  addCell(4, 1, costOfEquity * 100, 'Cost of Equity', `Rf ${(riskFreeRate*100).toFixed(1)}% + β ${beta} × ERP ${(erp*100).toFixed(1)}% = ${(costOfEquity*100).toFixed(2)}%`)
  addCell(7, 1, afterTaxCostOfDebt * 100, 'After-Tax Cost of Debt', `${(costOfDebt*100).toFixed(0)}% × (1 - ${(taxRate*100).toFixed(0)}%) = ${(afterTaxCostOfDebt*100).toFixed(2)}%`)
  addCell(10, 1, wacc * 100, 'WACC', `${(equityWeight*100).toFixed(0)}% × ${(costOfEquity*100).toFixed(2)}% + ${(debtWeight*100).toFixed(0)}% × ${(afterTaxCostOfDebt*100).toFixed(2)}% = ${(wacc*100).toFixed(2)}%`)

  // FCF cells (rows 15-26 = grid rows 15+12=27... use direct row numbers)
  for (let y = 0; y < 5; y++) {
    const col = y + 1
    addCell(15, col, ebitdas[y], `Y${y+1} EBITDA`, `${fmt(revenues[y])} × ${(ebitdaMargin*100).toFixed(0)}% = ${fmt(ebitdas[y])}`)
    addCell(17, col, ebit[y], `Y${y+1} EBIT`, `EBITDA ${fmt(ebitdas[y])} - D&A ${fmt(da[y])} = ${fmt(ebit[y])}`)
    addCell(18, col, nopats[y], `Y${y+1} NOPAT`, `EBIT ${fmt(ebit[y])} × (1 - ${(taxRate*100).toFixed(0)}%) = ${fmt(nopats[y])}`)
    addCell(19, col, da[y], `Y${y+1} D&A Addback`, `${fmt(revenues[y])} × ${(daPercent*100).toFixed(0)}% = ${fmt(da[y])}`)
    addCell(21, col, capexAmts[y], `Y${y+1} Capex`, `${fmt(revenues[y])} × ${(capexPercent*100).toFixed(0)}% = ${fmt(capexAmts[y])}`)
    addCell(23, col, nwcAmts[y], `Y${y+1} NWC Change`, `${fmt(revenues[y])} × ${(nwcPercent*100).toFixed(0)}% = ${fmt(nwcAmts[y])}`)
    addCell(24, col, fcfs[y], `Y${y+1} FCF`, `NOPAT ${fmt(nopats[y])} + D&A ${fmt(da[y])} - Capex ${fmt(capexAmts[y])} - NWC ${fmt(nwcAmts[y])} = ${fmt(fcfs[y])}`)
    addCell(27, col, dfs[y], `Y${y+1} Discount Factor`, `1 / (1 + ${(wacc*100).toFixed(2)}%)^${y+1} = ${fmt2(dfs[y])}`)
    addCell(28, col, pvFcfs[y], `Y${y+1} PV of FCF`, `FCF ${fmt(fcfs[y])} × ${fmt2(dfs[y])} = ${fmt(pvFcfs[y])}`)
  }

  addCell(29, 1, sumPvFcfs, 'Sum of PV(FCFs)', `Sum of discounted FCFs = ${fmt(sumPvFcfs)}`)
  addCell(32, 1, tvGG, 'TV (Gordon Growth)', `FCF5 ${fmt(fcf5)} × (1 + ${(terminalGrowth*100).toFixed(1)}%) / (${(wacc*100).toFixed(2)}% - ${(terminalGrowth*100).toFixed(1)}%) = ${fmt(tvGG)}`)
  addCell(33, 1, pvTvGG, 'PV of TV (Gordon Growth)', `TV ${fmt(tvGG)} × ${fmt2(dfs[4])} = ${fmt(pvTvGG)}`)
  addCell(34, 1, evGG, 'EV (Gordon Growth)', `${fmt(sumPvFcfs)} + ${fmt(pvTvGG)} = ${fmt(evGG)}`)
  addCell(37, 1, tvEM, 'TV (Exit Multiple)', `EBITDA5 ${fmt(ebitda5)} × ${exitMultiple}x = ${fmt(tvEM)}`)
  addCell(38, 1, pvTvEM, 'PV of TV (Exit Multiple)', `TV ${fmt(tvEM)} × ${fmt2(dfs[4])} = ${fmt(pvTvEM)}`)
  addCell(39, 1, evEM, 'EV (Exit Multiple)', `${fmt(sumPvFcfs)} + ${fmt(pvTvEM)} = ${fmt(evEM)}`)
  addCell(42, 1, equityGG, 'Equity Value (GG)', `EV ${fmt(evGG)} - Net Debt ${netDebt} = ${fmt(equityGG)}`)
  addCell(43, 1, priceGG, 'Share Price (GG)', `Equity ${fmt(equityGG)} / ${sharesOut}M shares = $${fmt2(priceGG)}`)
  addCell(44, 1, equityEM, 'Equity Value (EM)', `EV ${fmt(evEM)} - Net Debt ${netDebt} = ${fmt(equityEM)}`)
  addCell(45, 1, priceEM, 'Share Price (EM)', `Equity ${fmt(equityEM)} / ${sharesOut}M shares = $${fmt2(priceEM)}`)

  return {
    type: 'dcf-full',
    title: 'DCF Model (Full — with WACC)',
    assumptions: { revenue, revenueGrowth, ebitdaMargin, daPercent, taxRate, capexPercent, nwcPercent, terminalGrowth, exitMultiple, netDebt, sharesOut, riskFreeRate, beta, erp, costOfDebt, debtWeight },
    grid, editableCells, gradedCells,
    columnHeaders: ['', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
  }
}

// ─── SPREADSHEET COMPONENT ───────────────────────────────────────────────────
function Spreadsheet({ scenario, onGrade }: { scenario: ModelScenario; onGrade: (results: { cell: CellDef; value: number | null; correct: boolean }[]) => void }) {
  const [cellValues, setCellValues] = useState<Record<string, string>>({})
  const [activeCell, setActiveCell] = useState<string | null>(null)
  const [hfEngine, setHfEngine] = useState<any>(null)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' })
    hf.addSheet('Sheet1')
    setHfEngine(hf)
    return () => hf.destroy()
  }, [])

  function getCellDisplay(r: number, c: number): string {
    const key = cellKey(r, c)
    if (cellValues[key] !== undefined) {
      const val = cellValues[key]
      if (val.startsWith('=') && hfEngine) {
        try {
          const sheetId = hfEngine.getSheetId('Sheet1')
          if (sheetId !== undefined) {
            hfEngine.setCellContents({ sheet: sheetId, row: r, col: c }, val)
            const result = hfEngine.getCellValue({ sheet: sheetId, row: r, col: c })
            if (typeof result === 'number') return fmt(result)
            return String(result)
          }
        } catch { return val }
      }
      return val
    }
    const cellData = scenario.grid[r]?.[c]
    if (cellData === null || cellData === undefined) return ''
    return String(cellData)
  }

  function getCellNumericValue(r: number, c: number): number | null {
    const key = cellKey(r, c)
    if (cellValues[key] !== undefined) {
      const val = cellValues[key]
      if (val.startsWith('=') && hfEngine) {
        try {
          const sheetId = hfEngine.getSheetId('Sheet1')
          if (sheetId !== undefined) {
            hfEngine.setCellContents({ sheet: sheetId, row: r, col: c }, val)
            const result = hfEngine.getCellValue({ sheet: sheetId, row: r, col: c })
            if (typeof result === 'number') return result
          }
        } catch { /* ignore */ }
      }
      const num = parseFloat(val)
      return isNaN(num) ? null : num
    }
    return null
  }

  function handleCellChange(r: number, c: number, value: string) {
    setCellValues(prev => ({ ...prev, [cellKey(r, c)]: value }))
  }

  function handleGrade() {
    const results = scenario.gradedCells.map(cell => {
      const value = getCellNumericValue(cell.row, cell.col)
      const tolerance = Math.max(Math.abs(cell.expected) * 0.02, 0.5)
      const correct = value !== null && Math.abs(value - cell.expected) <= tolerance
      return { cell, value, correct }
    })
    onGrade(results)
  }

  const isHeaderRow = (r: number) => {
    const val = scenario.grid[r]?.[0]
    return typeof val === 'string' && (
      val.includes('INCOME') || val.includes('CASH FLOW') || val.includes('BALANCE') ||
      val.includes('LBO') || val.includes('DEBT') || val.includes('RETURNS') ||
      val.includes('TRANSACTION') || val.includes('DCF') || val.includes('DISCOUNTING') ||
      val.includes('TERMINAL') || val.includes('EQUITY VALUE BRIDGE') ||
      val.includes('FCF PROJ') || val.includes('WACC CALC')
    )
  }

  const isBlankRow = (r: number) => scenario.grid[r]?.every(c => c === '' || c === null)
  const isCheckRow = (r: number) => { const val = scenario.grid[r]?.[0]; return typeof val === 'string' && val.includes('✓') }

  return (
    <div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6">
        <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-3">Given Assumptions</div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {Object.entries(scenario.assumptions).map(([key, val]) => (
            <div key={key} className="text-[12px]">
              <span className="text-zinc-500">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}: </span>
              <span className="text-white font-mono">{typeof val === 'number' && val < 1 ? `${(val * 100).toFixed(1)}%` : val}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse font-mono text-[12px]">
          <tbody>
            {scenario.grid.map((row, r) => {
              if (isBlankRow(r)) return <tr key={r}><td colSpan={row.length} className="h-4" /></tr>
              return (
                <tr key={r} className={isHeaderRow(r) ? 'bg-zinc-800/50' : isCheckRow(r) ? 'bg-emerald-950/20' : ''}>
                  {row.map((cell, c) => {
                    const key = cellKey(r, c)
                    const isEditable = scenario.editableCells.has(key)
                    const isLabelCol = c === 0
                    const isSection = isHeaderRow(r)

                    if (isSection && c === 0) {
                      return (
                        <td key={c} className="px-3 py-2 text-[11px] font-bold text-violet-400 uppercase tracking-wider">
                          {cell}
                        </td>
                      )
                    }

                    if (isEditable) {
                      const isActive = activeCell === key
                      return (
                        <td key={c} className="px-1 py-0.5">
                          <input
                            ref={el => { inputRefs.current[key] = el }}
                            type="text"
                            value={isActive ? (cellValues[key] ?? '') : getCellDisplay(r, c)}
                            onChange={e => handleCellChange(r, c, e.target.value)}
                            onFocus={() => setActiveCell(key)}
                            onBlur={() => setActiveCell(null)}
                            className="w-full bg-zinc-800 border border-zinc-600 focus:border-violet-500 rounded px-2 py-1.5 text-right text-zinc-100 outline-none text-[12px] min-w-[80px]"
                            placeholder="..."
                          />
                        </td>
                      )
                    }

                    return (
                      <td key={c} className={`px-3 py-1.5 ${isLabelCol ? 'text-left text-zinc-400' : 'text-right text-zinc-300'} ${isSection ? 'font-bold' : ''} ${isCheckRow(r) && c === 0 ? 'text-emerald-400' : ''} whitespace-nowrap`}>
                        {cell !== null && cell !== undefined ? String(cell) : ''}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <button onClick={handleGrade}
        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 rounded-lg transition-colors text-[14px]">
        Grade Model →
      </button>
    </div>
  )
}

// ─── RESULTS COMPONENT ───────────────────────────────────────────────────────
function ResultsView({ results, scenario, onRetry, onNewScenario }: {
  results: { cell: CellDef; value: number | null; correct: boolean }[]
  scenario: ModelScenario
  onRetry: () => void
  onNewScenario: () => void
}) {
  const correctCount = results.filter(r => r.correct).length
  const total = results.length
  const pct = Math.round((correctCount / total) * 100)
  const ringColor = pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'
  const headline = pct >= 90 ? 'Model Master' : pct >= 75 ? 'Strong Model' : pct >= 50 ? 'Getting There' : 'Keep Practicing'
  const r = 30, circ = 2 * Math.PI * r, dash = (pct / 100) * circ

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button onClick={onRetry} className="text-[11px] font-mono text-violet-400 border border-zinc-700 rounded-md px-3 py-1.5 hover:bg-zinc-800 transition-colors">↺ Try same numbers</button>
        <button onClick={onNewScenario} className="text-[11px] font-mono text-emerald-400 border border-emerald-800 bg-emerald-950/30 rounded-md px-3 py-1.5 hover:bg-emerald-900/50 transition-colors">🔄 New random scenario</button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex items-center gap-6">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="40" cy="40" r={r} fill="none" stroke="#27272a" strokeWidth="6" />
            <circle cx="40" cy="40" r={r} fill="none" stroke={ringColor} strokeWidth="6"
              strokeDasharray={`${dash.toFixed(1)} ${circ.toFixed(1)}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[16px] font-bold text-white font-mono">{pct}%</span>
          </div>
        </div>
        <div>
          <div style={{fontFamily:'Georgia,serif'}} className="text-white font-bold text-xl mb-1">{headline}</div>
          <div className="text-zinc-500 text-[12px] font-mono">{correctCount}/{total} cells correct</div>
        </div>
      </div>

      {results.filter(r => r.correct).length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 mb-3">✓ Correct ({results.filter(r => r.correct).length})</div>
          <div className="space-y-1">
            {results.filter(r => r.correct).map((r, i) => (
              <div key={i} className="flex items-center justify-between text-[12px]">
                <span className="text-zinc-300">{r.cell.label}</span>
                <span className="text-emerald-400 font-mono">{r.value !== null ? fmt(r.value) : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.filter(r => !r.correct).length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-red-400 mb-3">✗ Incorrect ({results.filter(r => !r.correct).length})</div>
          <div className="space-y-3">
            {results.filter(r => !r.correct).map((r, i) => (
              <div key={i} className="border-b border-zinc-800 pb-2 last:border-0 last:pb-0">
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <span className="text-zinc-300">{r.cell.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-red-400 font-mono">Yours: {r.value !== null ? fmt(r.value) : 'empty'}</span>
                    <span className="text-emerald-400 font-mono">Expected: {fmt(r.cell.expected)}</span>
                  </div>
                </div>
                <div className="text-[11px] text-amber-400">{r.cell.explanation}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
export default function ModelingPage() {
  const [screen, setScreen] = useState<Screen>('home')
  const [modelType, setModelType] = useState<ModelType>('3-statement')
  const [scenario, setScenario] = useState<ModelScenario | null>(null)
  const [results, setResults] = useState<{ cell: CellDef; value: number | null; correct: boolean }[] | null>(null)

  function startModel(type: ModelType) {
    setModelType(type)
    const s = type === '3-statement' ? generate3Statement()
      : type === 'lbo' ? generateLBO()
      : type === 'dcf-simple' ? generateSimpleDCF()
      : generateFullDCF()
    setScenario(s)
    setResults(null)
    setScreen('modeling')
  }

  function handleGrade(r: { cell: CellDef; value: number | null; correct: boolean }[]) {
    setResults(r)
    setScreen('results')
  }

  function retry() { setResults(null); setScreen('modeling') }
  function newScenario() { startModel(modelType) }

  if (screen === 'home') return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar active="modeling" />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="text-[12px] font-mono text-zinc-500 mb-2">Financial Modeling</div>
          <h1 style={{fontFamily:'Georgia,serif'}} className="text-4xl font-bold text-white mb-4">Build Models in Your Browser</h1>
          <p className="text-zinc-400 text-[14px] leading-relaxed max-w-lg mx-auto">
            Practice building financial models with randomized assumptions. Supports Excel-like formulas. Numbers change every attempt.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div onClick={() => startModel('3-statement')}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-blue-700 transition-colors cursor-pointer">
            <div className="text-2xl mb-3">📊</div>
            <div style={{fontFamily:'Georgia,serif'}} className="text-white font-bold text-lg mb-2">3-Statement Model</div>
            <div className="text-zinc-400 text-[12px] leading-relaxed mb-4">
              Build a linked IS, CFS, and Balance Sheet. Includes NWC, D&A, and balance check.
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-blue-400 bg-blue-950/30 border border-blue-800 rounded px-2 py-0.5">22 cells</span>
              <span className="text-[10px] font-mono text-zinc-500">~15 min</span>
            </div>
          </div>

          <div onClick={() => startModel('lbo')}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-violet-700 transition-colors cursor-pointer">
            <div className="text-2xl mb-3">🏦</div>
            <div style={{fontFamily:'Georgia,serif'}} className="text-white font-bold text-lg mb-2">Paper LBO</div>
            <div className="text-zinc-400 text-[12px] leading-relaxed mb-4">
              Build a 5-year LBO with full IS, debt schedule, and returns. Calculate MOIC and IRR.
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-violet-400 bg-violet-950/30 border border-violet-800 rounded px-2 py-0.5">40+ cells</span>
              <span className="text-[10px] font-mono text-zinc-500">~20 min</span>
            </div>
          </div>

          <div onClick={() => startModel('dcf-simple')}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-emerald-700 transition-colors cursor-pointer">
            <div className="text-2xl mb-3">📈</div>
            <div style={{fontFamily:'Georgia,serif'}} className="text-white font-bold text-lg mb-2">DCF Model (Simple)</div>
            <div className="text-zinc-400 text-[12px] leading-relaxed mb-4">
              WACC is given. Project FCFs, discount them, calculate terminal value using both Gordon Growth and exit multiple methods.
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-800 rounded px-2 py-0.5">35 cells</span>
              <span className="text-[10px] font-mono text-zinc-500">~15 min</span>
            </div>
          </div>

          <div onClick={() => startModel('dcf-full')}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-amber-700 transition-colors cursor-pointer">
            <div className="text-2xl mb-3">🔬</div>
            <div style={{fontFamily:'Georgia,serif'}} className="text-white font-bold text-lg mb-2">DCF Model (Full)</div>
            <div className="text-zinc-400 text-[12px] leading-relaxed mb-4">
              Calculate WACC from scratch using CAPM, then build the full DCF. Both terminal value methods. Bridge to share price.
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-amber-400 bg-amber-950/30 border border-amber-800 rounded px-2 py-0.5">50+ cells</span>
              <span className="text-[10px] font-mono text-zinc-500">~25 min</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="text-[11px] font-mono text-zinc-600">
            Supports formulas like =100*1.1 · Numbers randomized each attempt · Balance sheet must balance
          </div>
        </div>
      </div>
    </main>
  )

  if (screen === 'modeling' && scenario) return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar active="modeling" />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <button onClick={() => setScreen('home')} className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 mb-6 flex items-center gap-1">← Back to models</button>
        <div className="flex items-center gap-3 mb-6">
          <h1 style={{fontFamily:'Georgia,serif'}} className="text-2xl font-bold text-white">{scenario.title}</h1>
          <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5">
            {scenario.gradedCells.length} cells to complete
          </span>
        </div>
        <div className="text-[12px] text-zinc-400 mb-6">
          Fill in the empty cells using numbers or formulas (e.g. =100*1.1). All amounts in $M unless stated otherwise.
        </div>
        <Spreadsheet scenario={scenario} onGrade={handleGrade} />
      </div>
    </main>
  )

  if (screen === 'results' && scenario && results) return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar active="modeling" />
      <div className="max-w-3xl mx-auto px-6 py-8">
        <button onClick={() => setScreen('home')} className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 mb-6 flex items-center gap-1">← Back to models</button>
        <h1 style={{fontFamily:'Georgia,serif'}} className="text-2xl font-bold text-white mb-6">{scenario.title} — Results</h1>
        <ResultsView results={results} scenario={scenario} onRetry={retry} onNewScenario={newScenario} />
      </div>
    </main>
  )

  return null
}