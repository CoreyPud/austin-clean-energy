export interface LenderInputs {
  systemKw: number;
  costPerWatt: number;
  baselineBill: number;
  utilityRate: number;
  rateEscalator: number;
  specificYield: number;
  degradation: number;
  omCost: number;
  aeRebateRate: number;
  irsCreditRate: number;
  aeRebateTiming: number;
  irsTiming: number;
  loanInterestRate: number;
}

export const DEFAULT_INPUTS: LenderInputs = {
  systemKw: 100,
  costPerWatt: 2,
  baselineBill: 40000,
  utilityRate: 0.12,
  rateEscalator: 2,
  specificYield: 1400,
  degradation: 0.5,
  omCost: 15,
  aeRebateRate: 1,
  irsCreditRate: 30,
  aeRebateTiming: 4,
  irsTiming: 14,
  loanInterestRate: 4,
};

export interface TimelineRow {
  month: number;
  event: string;
  inflowOutflow: number;
  principalPaid: number;
  interestPaid: number;
  endingBalance: number;
  status: string;
}

export interface ProformaYear {
  year: number;
  baselineBill: number;
  solarGenKwh: number;
  solarValue: number;
  omExpense: number;
  incentives: number;
  debtService: number;
  netAnnualCashFlow: number;
  cumulativeNetSavings: number;
  endBalance: number;
}

export interface ProformaResult {
  totalProjectCost: number;
  aeRebateTotal: number;
  irsDirectPayTotal: number;
  totalIncentives: number;
  residualDebtBalance: number;
  payoffMonth: number;
  totalInterestPaid: number;
  timeline: TimelineRow[];
  years: ProformaYear[];
  savings25Yr: number;
}

export function fmtCurr(num: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}

export function calculateProforma(i: LenderInputs): ProformaResult {
  const {
    systemKw,
    costPerWatt: costW,
    baselineBill: baselineBillYear1,
    utilityRate: rateKwh,
    specificYield: yieldKwh,
    omCost: omRatePerKw,
    aeRebateRate: rebatePerW,
    aeRebateTiming: aeMonth,
    irsTiming: irsMonth,
  } = i;
  const rateEsc = i.rateEscalator / 100;
  const degradationRate = i.degradation / 100;
  const irsPct = i.irsCreditRate / 100;
  const interestRate = i.loanInterestRate / 100;
  const monthlyRate = interestRate / 12;

  const totalProjectCost = systemKw * 1000 * costW;
  const aeRebateTotal = systemKw * 1000 * rebatePerW;
  const irsDirectPayTotal = totalProjectCost * irsPct;
  const totalIncentives = aeRebateTotal + irsDirectPayTotal;
  const residualDebtBalance = Math.max(0, totalProjectCost - totalIncentives);
  const initialAnnualGenKwh = systemKw * yieldKwh;

  let currentLoanBalance = totalProjectCost;
  let totalInterestPaid = 0;
  let payoffMonth = 0;
  let aeRebatePaid = false;
  let irsPaid = false;
  const timeline: TimelineRow[] = [
    {
      month: 0,
      event: "Project close and construction draw",
      inflowOutflow: totalProjectCost,
      principalPaid: 0,
      interestPaid: 0,
      endingBalance: currentLoanBalance,
      status: "Initial Loan Draw",
    },
  ];

  for (let m = 1; m <= 300; m++) {
    if (currentLoanBalance <= 0.01) {
      if (payoffMonth === 0) payoffMonth = m - 1;
      continue;
    }

    const currentYear = Math.ceil(m / 12);
    const currentEscalatedRate = rateKwh * Math.pow(1 + rateEsc, currentYear - 1);
    const currentYearGen = initialAnnualGenKwh * Math.pow(1 - degradationRate, currentYear - 1);
    const currentMonthlySavings = (currentYearGen / 12) * currentEscalatedRate;

    const monthlyInterest = currentLoanBalance * monthlyRate;
    totalInterestPaid += monthlyInterest;

    let principalPaid = 0;
    let eventDesc = `Month ${m} standard savings amortization`;
    let statusTag = "Active Repayment";

    if (m === aeMonth && !aeRebatePaid) {
      aeRebatePaid = true;
      principalPaid += aeRebateTotal;
      eventDesc = "Austin Energy rebate lump sum received";
      statusTag = "Rebate Payment";
    }

    if (m === irsMonth && !irsPaid) {
      irsPaid = true;
      principalPaid += irsDirectPayTotal;
      eventDesc = "IRS Direct Pay (Section 6417) received";
      statusTag = "Direct Pay Refund";
    }

    principalPaid += currentMonthlySavings;
    if (principalPaid > currentLoanBalance) principalPaid = currentLoanBalance;

    currentLoanBalance -= principalPaid;
    if (currentLoanBalance < 0) currentLoanBalance = 0;

    if (m === 1 || m === aeMonth || m === irsMonth || currentLoanBalance === 0 || m === 36) {
      timeline.push({
        month: m,
        event: eventDesc,
        inflowOutflow:
          m === aeMonth ? aeRebateTotal : m === irsMonth ? irsDirectPayTotal : currentMonthlySavings,
        principalPaid,
        interestPaid: monthlyInterest,
        endingBalance: currentLoanBalance,
        status: statusTag,
      });
    }

    if (currentLoanBalance === 0 && payoffMonth === 0) payoffMonth = m;
  }

  if (payoffMonth === 0) payoffMonth = 300;

  const years: ProformaYear[] = [];
  let cumulativeNetSavings = 0;
  let runningBalance = totalProjectCost;

  for (let y = 1; y <= 25; y++) {
    const yearGenKwh = initialAnnualGenKwh * Math.pow(1 - degradationRate, y - 1);
    const yearRate = rateKwh * Math.pow(1 + rateEsc, y - 1);
    const baselineBill = baselineBillYear1 * Math.pow(1 + rateEsc, y - 1);
    const solarValue = yearGenKwh * yearRate;
    const omExpense = systemKw * omRatePerKw * Math.pow(1.02, y - 1);

    let rebateCollected = 0;
    let irsCollected = 0;
    if (y === Math.ceil(aeMonth / 12)) rebateCollected = aeRebateTotal;
    if (y === Math.ceil(irsMonth / 12)) irsCollected = irsDirectPayTotal;

    let annualDebtService = 0;
    for (let m = (y - 1) * 12 + 1; m <= y * 12; m++) {
      if (runningBalance > 0) {
        const mInt = runningBalance * monthlyRate;
        let mPrin = solarValue / 12;
        if (m === aeMonth) mPrin += aeRebateTotal;
        if (m === irsMonth) mPrin += irsDirectPayTotal;
        if (mPrin > runningBalance) mPrin = runningBalance;
        runningBalance -= mPrin;
        annualDebtService += mPrin + mInt;
      }
    }

    const netAnnualCashFlow =
      solarValue + (rebateCollected + irsCollected) - omExpense - annualDebtService;
    cumulativeNetSavings +=
      solarValue - omExpense - (annualDebtService - rebateCollected - irsCollected);

    years.push({
      year: y,
      baselineBill,
      solarGenKwh: yearGenKwh,
      solarValue,
      omExpense,
      incentives: rebateCollected + irsCollected,
      debtService: annualDebtService,
      netAnnualCashFlow,
      cumulativeNetSavings,
      endBalance: runningBalance,
    });
  }

  return {
    totalProjectCost,
    aeRebateTotal,
    irsDirectPayTotal,
    totalIncentives,
    residualDebtBalance,
    payoffMonth,
    totalInterestPaid,
    timeline,
    years,
    savings25Yr: years[24].cumulativeNetSavings,
  };
}

export function summaryText(r: ProformaResult, i: LenderInputs): string {
  const pct = ((r.totalIncentives / r.totalProjectCost) * 100).toFixed(0);
  return `The non-profit lender provides a ${fmtCurr(r.totalProjectCost)} bridge loan covering 100% of upfront construction costs. Once the project is complete, it receives a ${fmtCurr(r.aeRebateTotal)} Austin Energy rebate in month ${i.aeRebateTiming} and a ${fmtCurr(r.irsDirectPayTotal)} IRS Direct Pay payment in month ${i.irsTiming}, retiring ${pct}% of the loan principal. The remaining ${fmtCurr(r.residualDebtBalance)} is fully repaid by month ${r.payoffMonth} using utility bill savings.`;
}
