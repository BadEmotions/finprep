'use client'
import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import HyperFormula from 'hyperformula'

type ModelType = '3-statement' | 'lbo'
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

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return ''
  if (Math.abs(n) >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 1 })
  return n.toFixed(1)
}

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

  // Income Statement
  const rev1 = round(revenue * (1 + revenueGrowth), 1)
  const ebitda1 = round(rev1 * ebitdaMargin, 1)
  const da1 = round(rev1 * daPercent, 1)
  const ebit1 = round(ebitda1 - da1, 1)
  const interestExp1 = round(debtBalance * interestRate, 1)
  const ebt1 = round(ebit1 - interestExp1, 1)
  const taxes1 = round(ebt1 * taxRate, 1)
  const netIncome1 = round(ebt1 - taxes1, 1)

  // Cash Flow Statement
  const cfo1 = round(netIncome1 + da1 - nwcChange, 1)
  const capex1 = round(rev1 * capexPercent, 1)
  const fcf1 = round(cfo1 - capex1, 1)

  // Balance Sheet
  const cashEnd = round(cashBalance + fcf1, 1)
  const nwcEnd = round(nwcStart + nwcChange, 1)
  const ppeEnd = round(ppeStart - da1 + capex1, 1)
  const totalAssets = round(cashEnd + nwcEnd + ppeEnd, 1)
  const retainedEarnings = round(netIncome1, 1)
  const totalLE = round(debtBalance + retainedEarnings, 1)

  // Verify balance: totalAssets should equal totalLE + nwcEnd adjustment
  // Assets = Cash + NWC + PP&E
  // L+E = Debt + RE
  // This balances because:
  //   Cash = CashStart + FCF = CashStart + (NI + D&A - dNWC - Capex)
  //   NWC = NWCStart + dNWC
  //   PP&E = PP&EStart - D&A + Capex
  //   Total Assets = CashStart + FCF + NWCStart + dNWC + PP&EStart - D&A + Capex
  //               = CashStart + NI + D&A - dNWC - Capex + NWCStart + dNWC + PP&EStart - D&A + Capex
  //               = CashStart + NI + NWCStart + PP&EStart
  //   Total L+E   = Debt + NI
  //   So we need: CashStart + NWCStart + PP&EStart = Debt (for Y0 balance)
  // To guarantee the BS balances, set Y0 equity = assets - debt
  const y0TotalAssets = round(cashBalance + nwcStart + ppeStart, 1)
  const y0Equity = round(y0TotalAssets - debtBalance, 1)

  const grid: (string | number | null)[][] = [
    // Row 0: IS Header
    ['INCOME STATEMENT', '', 'Year 0', 'Year 1'],
    // Row 1: Revenue
    ['Revenue', '', revenue, null],
    // Row 2: Revenue Growth
    ['Revenue Growth %', '', '', `${(revenueGrowth * 100).toFixed(0)}%`],
    // Row 3: EBITDA Margin
    ['EBITDA Margin %', '', '', `${(ebitdaMargin * 100).toFixed(0)}%`],
    // Row 4: EBITDA
    ['EBITDA', '', '', null],
    // Row 5: D&A % of Rev
    ['D&A (% of Revenue)', '', '', `${(daPercent * 100).toFixed(0)}%`],
    // Row 6: D&A
    ['D&A', '', '', null],
    // Row 7: EBIT
    ['EBIT', '', '', null],
    // Row 8: Interest Rate
    ['Interest Rate', '', '', `${(interestRate * 100).toFixed(0)}%`],
    // Row 9: Interest Expense
    ['Interest Expense', '', '', null],
    // Row 10: EBT
    ['EBT (Pre-tax Income)', '', '', null],
    // Row 11: Tax Rate
    ['Tax Rate', '', '', `${(taxRate * 100).toFixed(0)}%`],
    // Row 12: Taxes
    ['Taxes', '', '', null],
    // Row 13: Net Income
    ['Net Income', '', '', null],
    // Row 14: blank
    ['', '', '', ''],
    // Row 15: CFS Header
    ['CASH FLOW STATEMENT', '', '', 'Year 1'],
    // Row 16: Net Income
    ['Net Income', '', '', null],
    // Row 17: Add back D&A
    ['(+) D&A', '', '', null],
    // Row 18: Change in NWC
    ['(-) Change in NWC', '', '', nwcChange],
    // Row 19: Capex % of Rev
    ['Capex (% of Revenue)', '', '', `${(capexPercent * 100).toFixed(0)}%`],
    // Row 20: Cash from Operations
    ['Cash from Operations', '', '', null],
    // Row 21: Capex
    ['(-) Capital Expenditures', '', '', null],
    // Row 22: Free Cash Flow
    ['Free Cash Flow', '', '', null],
    // Row 23: blank
    ['', '', '', ''],
    // Row 24: BS Header
    ['BALANCE SHEET', '', 'Year 0', 'Year 1'],
    // Row 25: Cash
    ['Cash', '', cashBalance, null],
    // Row 26: Net Working Capital
    ['Net Working Capital', '', nwcStart, null],
    // Row 27: PP&E
    ['PP&E, net', '', ppeStart, null],
    // Row 28: Total Assets
    ['Total Assets', '', y0TotalAssets, null],
    // Row 29: blank separator
    ['', '', '', ''],
    // Row 30: Debt
    ['Debt', '', debtBalance, debtBalance],
    // Row 31: Beginning Equity
    ['Beginning Equity', '', '', y0Equity],
    // Row 32: Retained Earnings (= Net Income)
    ['(+) Net Income (Retained)', '', '', null],
    // Row 33: Total Equity
    ['Total Equity', '', y0Equity, null],
    // Row 34: Total L+E
    ['Total Liabilities + Equity', '', y0TotalAssets, null],
    // Row 35: blank
    ['', '', '', ''],
    // Row 36: Balance check
    ['✓ Balance Check (Assets - L&E)', '', '', null],
  ]

  const editableCells = new Set<string>()
  const gradedCells: CellDef[] = []

  // IS cells
  editableCells.add(cellKey(1, 3))
  gradedCells.push({ row: 1, col: 3, expected: rev1, label: 'Revenue Y1', explanation: `${revenue} × (1 + ${(revenueGrowth*100).toFixed(0)}%) = ${fmt(rev1)}` })

  editableCells.add(cellKey(4, 3))
  gradedCells.push({ row: 4, col: 3, expected: ebitda1, label: 'EBITDA', explanation: `${fmt(rev1)} × ${(ebitdaMargin*100).toFixed(0)}% = ${fmt(ebitda1)}` })

  editableCells.add(cellKey(6, 3))
  gradedCells.push({ row: 6, col: 3, expected: da1, label: 'D&A', explanation: `${fmt(rev1)} × ${(daPercent*100).toFixed(0)}% = ${fmt(da1)}` })

  editableCells.add(cellKey(7, 3))
  gradedCells.push({ row: 7, col: 3, expected: ebit1, label: 'EBIT', explanation: `EBITDA ${fmt(ebitda1)} - D&A ${fmt(da1)} = ${fmt(ebit1)}` })

  editableCells.add(cellKey(9, 3))
  gradedCells.push({ row: 9, col: 3, expected: interestExp1, label: 'Interest Expense', explanation: `Debt ${debtBalance} × ${(interestRate*100).toFixed(0)}% = ${fmt(interestExp1)}` })

  editableCells.add(cellKey(10, 3))
  gradedCells.push({ row: 10, col: 3, expected: ebt1, label: 'EBT', explanation: `EBIT ${fmt(ebit1)} - Interest ${fmt(interestExp1)} = ${fmt(ebt1)}` })

  editableCells.add(cellKey(12, 3))
  gradedCells.push({ row: 12, col: 3, expected: taxes1, label: 'Taxes', explanation: `EBT ${fmt(ebt1)} × ${(taxRate*100).toFixed(0)}% = ${fmt(taxes1)}` })

  editableCells.add(cellKey(13, 3))
  gradedCells.push({ row: 13, col: 3, expected: netIncome1, label: 'Net Income', explanation: `EBT ${fmt(ebt1)} - Taxes ${fmt(taxes1)} = ${fmt(netIncome1)}` })

  // CFS cells
  editableCells.add(cellKey(16, 3))
  gradedCells.push({ row: 16, col: 3, expected: netIncome1, label: 'CFS: Net Income', explanation: `Links from Income Statement = ${fmt(netIncome1)}` })

  editableCells.add(cellKey(17, 3))
  gradedCells.push({ row: 17, col: 3, expected: da1, label: 'CFS: D&A Add-back', explanation: `Non-cash charge added back = ${fmt(da1)}` })

  editableCells.add(cellKey(20, 3))
  gradedCells.push({ row: 20, col: 3, expected: cfo1, label: 'Cash from Operations', explanation: `NI ${fmt(netIncome1)} + D&A ${fmt(da1)} - ΔNWC ${nwcChange} = ${fmt(cfo1)}` })

  editableCells.add(cellKey(21, 3))
  gradedCells.push({ row: 21, col: 3, expected: capex1, label: 'Capital Expenditures', explanation: `Revenue ${fmt(rev1)} × ${(capexPercent*100).toFixed(0)}% = ${fmt(capex1)}` })

  editableCells.add(cellKey(22, 3))
  gradedCells.push({ row: 22, col: 3, expected: fcf1, label: 'Free Cash Flow', explanation: `CFO ${fmt(cfo1)} - Capex ${fmt(capex1)} = ${fmt(fcf1)}` })

  // BS cells
  editableCells.add(cellKey(25, 3))
  gradedCells.push({ row: 25, col: 3, expected: cashEnd, label: 'Cash Y1', explanation: `Beginning ${cashBalance} + FCF ${fmt(fcf1)} = ${fmt(cashEnd)}` })

  editableCells.add(cellKey(26, 3))
  gradedCells.push({ row: 26, col: 3, expected: nwcEnd, label: 'Net Working Capital Y1', explanation: `Beginning NWC ${nwcStart} + ΔNWC ${nwcChange} = ${fmt(nwcEnd)}` })

  editableCells.add(cellKey(27, 3))
  gradedCells.push({ row: 27, col: 3, expected: ppeEnd, label: 'PP&E Y1', explanation: `Beginning ${ppeStart} - D&A ${fmt(da1)} + Capex ${fmt(capex1)} = ${fmt(ppeEnd)}` })

  editableCells.add(cellKey(28, 3))
  gradedCells.push({ row: 28, col: 3, expected: round(cashEnd + nwcEnd + ppeEnd, 1), label: 'Total Assets Y1', explanation: `Cash ${fmt(cashEnd)} + NWC ${fmt(nwcEnd)} + PP&E ${fmt(ppeEnd)} = ${fmt(round(cashEnd + nwcEnd + ppeEnd, 1))}` })

  const totalEquityEnd = round(y0Equity + netIncome1, 1)
  const totalLEEnd = round(debtBalance + totalEquityEnd, 1)

  editableCells.add(cellKey(32, 3))
  gradedCells.push({ row: 32, col: 3, expected: netIncome1, label: 'Retained Earnings (Net Income)', explanation: `Net Income flows to equity = ${fmt(netIncome1)}` })

  editableCells.add(cellKey(33, 3))
  gradedCells.push({ row: 33, col: 3, expected: totalEquityEnd, label: 'Total Equity Y1', explanation: `Beginning Equity ${fmt(y0Equity)} + Net Income ${fmt(netIncome1)} = ${fmt(totalEquityEnd)}` })

  editableCells.add(cellKey(34, 3))
  gradedCells.push({ row: 34, col: 3, expected: totalLEEnd, label: 'Total L+E Y1', explanation: `Debt ${debtBalance} + Total Equity ${fmt(totalEquityEnd)} = ${fmt(totalLEEnd)}` })

  editableCells.add(cellKey(36, 3))
  gradedCells.push({ row: 36, col: 3, expected: 0, label: 'Balance Check', explanation: `Total Assets ${fmt(round(cashEnd + nwcEnd + ppeEnd, 1))} - Total L+E ${fmt(totalLEEnd)} = 0 (balanced!)` })

  return {
    type: '3-statement',
    title: '3-Statement Model',
    assumptions: { revenue, revenueGrowth, ebitdaMargin, daPercent, taxRate, capexPercent, nwcChange, interestRate, debtBalance, cashBalance, ppeStart, nwcStart },
    grid,
    editableCells,
    gradedCells,
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

  // Transaction
  editableCells.add(cellKey(10, 2))
  gradedCells.push({ row: 10, col: 2, expected: entryEV, label: 'Entry EV', explanation: `EBITDA ${ebitda} × ${entryMultiple}x = ${entryEV}` })

  editableCells.add(cellKey(12, 2))
  gradedCells.push({ row: 12, col: 2, expected: entryDebt, label: 'Entry Debt', explanation: `EV ${entryEV} × ${(debtPercent*100).toFixed(0)}% = ${fmt(entryDebt)}` })

  editableCells.add(cellKey(13, 2))
  gradedCells.push({ row: 13, col: 2, expected: entryEquity, label: 'Entry Equity', explanation: `EV ${entryEV} - Debt ${fmt(entryDebt)} = ${fmt(entryEquity)}` })

  // Income Statement + Debt Schedule per year
  for (let y = 0; y < 5; y++) {
    const col = y + 3
    const yr = years[y]
    const prevDebt = y === 0 ? entryDebt : years[y-1].debtEnd
    const prevEbitda = y === 0 ? ebitda : years[y-1].ebitda

    // IS: EBITDA
    editableCells.add(cellKey(16, col))
    gradedCells.push({ row: 16, col, expected: yr.ebitda, label: `Y${y+1} EBITDA`, explanation: `${fmt(prevEbitda)} × (1 + ${(ebitdaGrowth*100).toFixed(0)}%) = ${fmt(yr.ebitda)}` })

    // IS: D&A
    editableCells.add(cellKey(17, col))
    gradedCells.push({ row: 17, col, expected: yr.da, label: `Y${y+1} D&A`, explanation: `EBITDA ${fmt(yr.ebitda)} × ${(daPercent*100).toFixed(0)}% = ${fmt(yr.da)}` })

    // IS: EBIT
    editableCells.add(cellKey(18, col))
    gradedCells.push({ row: 18, col, expected: yr.ebit, label: `Y${y+1} EBIT`, explanation: `EBITDA ${fmt(yr.ebitda)} - D&A ${fmt(yr.da)} = ${fmt(yr.ebit)}` })

    // IS: Interest
    editableCells.add(cellKey(19, col))
    gradedCells.push({ row: 19, col, expected: yr.interest, label: `Y${y+1} Interest`, explanation: `Beg Debt ${fmt(prevDebt)} × ${(interestRate*100).toFixed(0)}% = ${fmt(yr.interest)}` })

    // IS: EBT
    editableCells.add(cellKey(20, col))
    gradedCells.push({ row: 20, col, expected: yr.ebt, label: `Y${y+1} EBT`, explanation: `EBIT ${fmt(yr.ebit)} - Interest ${fmt(yr.interest)} = ${fmt(yr.ebt)}` })

    // IS: Taxes
    editableCells.add(cellKey(21, col))
    gradedCells.push({ row: 21, col, expected: yr.taxes, label: `Y${y+1} Taxes`, explanation: `EBT ${fmt(yr.ebt)} × ${(taxRate*100).toFixed(0)}% = ${fmt(yr.taxes)}` })

    // IS: Net Income
    editableCells.add(cellKey(22, col))
    gradedCells.push({ row: 22, col, expected: yr.ni, label: `Y${y+1} Net Income`, explanation: `EBT ${fmt(yr.ebt)} - Taxes ${fmt(yr.taxes)} = ${fmt(yr.ni)}` })

    // Debt: Beginning
    editableCells.add(cellKey(25, col))
    gradedCells.push({ row: 25, col, expected: prevDebt, label: `Y${y+1} Beg Debt`, explanation: y === 0 ? `Entry debt = ${fmt(entryDebt)}` : `Prior ending debt = ${fmt(prevDebt)}` })

    // Debt: FCF (paydown)
    editableCells.add(cellKey(27, col))
    gradedCells.push({ row: 27, col, expected: yr.fcf, label: `Y${y+1} FCF`, explanation: `NI ${fmt(yr.ni)} + D&A ${fmt(yr.da)} - Capex ${fmt(yr.capex)} = ${fmt(yr.fcf)}` })

    // Debt: Ending
    editableCells.add(cellKey(28, col))
    gradedCells.push({ row: 28, col, expected: yr.debtEnd, label: `Y${y+1} End Debt`, explanation: `Beg ${fmt(prevDebt)} - FCF ${fmt(yr.fcf)} = ${fmt(yr.debtEnd)}` })
  }

  // Exit / Returns
  editableCells.add(cellKey(31, 8))
  gradedCells.push({ row: 31, col: 8, expected: exitEbitda, label: 'Exit EBITDA', explanation: `Year 5 EBITDA = ${fmt(exitEbitda)}` })

  editableCells.add(cellKey(10, 8))
  gradedCells.push({ row: 10, col: 8, expected: exitEV, label: 'Exit EV (top)', explanation: `${fmt(exitEbitda)} × ${exitMultiple}x = ${fmt(exitEV)}` })

  editableCells.add(cellKey(32, 8))
  gradedCells.push({ row: 32, col: 8, expected: exitEV, label: 'Exit EV', explanation: `${fmt(exitEbitda)} × ${exitMultiple}x = ${fmt(exitEV)}` })

  editableCells.add(cellKey(33, 8))
  gradedCells.push({ row: 33, col: 8, expected: exitDebt, label: 'Remaining Debt', explanation: `Year 5 ending debt = ${fmt(exitDebt)}` })

  editableCells.add(cellKey(34, 8))
  gradedCells.push({ row: 34, col: 8, expected: exitEquity, label: 'Exit Equity', explanation: `Exit EV ${fmt(exitEV)} - Debt ${fmt(exitDebt)} = ${fmt(exitEquity)}` })

  editableCells.add(cellKey(35, 8))
  gradedCells.push({ row: 35, col: 8, expected: moic, label: 'MOIC', explanation: `Exit Equity ${fmt(exitEquity)} ÷ Entry Equity ${fmt(entryEquity)} = ${moic}x` })

  editableCells.add(cellKey(36, 8))
  gradedCells.push({ row: 36, col: 8, expected: irr, label: 'IRR %', explanation: `(${moic}x)^(1/5) - 1 = ${irr}%` })

  return {
    type: 'lbo',
    title: 'Paper LBO Model',
    assumptions: { ebitda, entryMultiple, debtPercent, interestRate, ebitdaGrowth, exitMultiple, taxRate, capexPercent, daPercent },
    grid,
    editableCells,
    gradedCells,
    columnHeaders: ['', '', 'Entry', 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Exit'],
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
    return typeof val === 'string' && (val.includes('INCOME') || val.includes('CASH FLOW') || val.includes('BALANCE') || val.includes('LBO') || val.includes('DEBT') || val.includes('RETURNS') || val.includes('TRANSACTION'))
  }

  const isBlankRow = (r: number) => {
    return scenario.grid[r]?.every(c => c === '' || c === null)
  }

  const isCheckRow = (r: number) => {
    const val = scenario.grid[r]?.[0]
    return typeof val === 'string' && val.includes('✓')
  }

  return (
    <div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6">
        <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-3">Given Assumptions</div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {Object.entries(scenario.assumptions).map(([key, val]) => (
            <div key={key} className="text-[12px]">
              <span className="text-zinc-500">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}: </span>
              <span className="text-white font-mono">{typeof val === 'number' && val < 1 ? `${(val * 100).toFixed(0)}%` : val}</span>
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
                    const isHeader = c === 0
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
                      <td key={c} className={`px-3 py-1.5 ${isHeader ? 'text-left text-zinc-400' : 'text-right text-zinc-300'} ${isSection ? 'font-bold' : ''} ${isCheckRow(r) && c === 0 ? 'text-emerald-400' : ''} whitespace-nowrap`}>
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
    const s = type === '3-statement' ? generate3Statement() : generateLBO()
    setScenario(s)
    setResults(null)
    setScreen('modeling')
  }

  function handleGrade(r: { cell: CellDef; value: number | null; correct: boolean }[]) {
    setResults(r)
    setScreen('results')
  }

  function retry() {
    setResults(null)
    setScreen('modeling')
  }

  function newScenario() {
    startModel(modelType)
  }

  if (screen === 'home') return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar active="modeling" />
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="text-[12px] font-mono text-zinc-500 mb-2">Financial Modeling</div>
          <h1 style={{fontFamily:'Georgia,serif'}} className="text-4xl font-bold text-white mb-4">Build Models in Your Browser</h1>
          <p className="text-zinc-400 text-[14px] leading-relaxed max-w-lg mx-auto">
            Practice building financial models with randomized assumptions. Supports Excel-like formulas. Numbers change every attempt — no memorization, pure skill.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div onClick={() => startModel('3-statement')}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-blue-700 transition-colors cursor-pointer">
            <div className="text-2xl mb-3">📊</div>
            <div style={{fontFamily:'Georgia,serif'}} className="text-white font-bold text-lg mb-2">3-Statement Model</div>
            <div className="text-zinc-400 text-[12px] leading-relaxed mb-4">
              Build a linked Income Statement, Cash Flow Statement, and Balance Sheet. Includes NWC, D&A, and balance check.
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
              Build a 5-year LBO with full income statement, debt schedule, and returns. Calculate MOIC and IRR.
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-violet-400 bg-violet-950/30 border border-violet-800 rounded px-2 py-0.5">40+ cells</span>
              <span className="text-[10px] font-mono text-zinc-500">~20 min</span>
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
          Fill in the empty cells using numbers or formulas (e.g. =100*1.1). All amounts in $M. The balance sheet must balance.
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