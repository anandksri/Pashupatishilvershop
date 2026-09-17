import { Bill, BillCalculations, BillItem } from '../types';
import { evaluateExpression, formatSmartNumber, roundFine } from './mathParser';

/**
 * Calculates all derived values for a bill
 */
export function calculateBill(bill: Bill, finePrecision: number = 0): BillCalculations {
  let newTotalAmount = 0;
  let newTotalWeight = 0;
  let newTotalLess = 0;
  let newTotalNet = 0;
  let newTotalFine = 0;

  let hasAnyAmount = false;
  let hasAnyWeight = false;
  let hasAnyLess = false;
  let hasAnyNet = false;
  let hasAnyFine = false;

  const rowResults = bill.items.map((item: BillItem) => {
    // 1. Amount
    const amountRes = evaluateExpression(item.amount);
    const amountVal = amountRes.valid ? amountRes.value : null;
    if (amountVal !== null) {
      newTotalAmount += amountVal;
      hasAnyAmount = true;
    }

    // 2. Weight
    const weightRes = evaluateExpression(item.weight);
    const weightVal = weightRes.valid ? weightRes.value : null;
    if (weightVal !== null) {
      newTotalWeight += weightVal;
      hasAnyWeight = true;
    }

    // 3. Less
    const lessRes = evaluateExpression(item.less);
    const lessVal = lessRes.valid ? lessRes.value : null;
    if (lessVal !== null) {
      newTotalLess += lessVal;
      hasAnyLess = true;
    }

    // 4. Net Wt.
    // If Weight is blank: Net Wt. is blank.
    // If Less is blank: Net Wt. = Weight.
    // If Weight and Less: Net Wt. = Weight - Less.
    let netWtVal: number | null = null;
    if (weightVal !== null) {
      if (lessVal !== null) {
        netWtVal = Math.round((weightVal - lessVal) * 10000) / 10000;
      } else {
        netWtVal = weightVal;
      }
      newTotalNet += netWtVal;
      hasAnyNet = true;
    }

    // 5. Tunch
    const tunchRes = evaluateExpression(item.tunch);
    const tunchVal = tunchRes.valid ? tunchRes.value : null;

    // 6. Fine = Net Wt. * Tunch / 100
    let fineVal: number | null = null;
    if (netWtVal !== null && tunchVal !== null) {
      const rawFine = (netWtVal * tunchVal) / 100;
      fineVal = roundFine(rawFine, finePrecision);
      newTotalFine += fineVal;
      hasAnyFine = true;
    }

    return {
      amountVal,
      weightVal,
      lessVal,
      netWtVal,
      tunchVal,
      fineVal,
    };
  });

  // Old Balance
  const oldBalAmtRes = evaluateExpression(bill.oldBalanceAmount);
  const oldBalanceAmountNum = oldBalAmtRes.valid ? oldBalAmtRes.value : 0;

  const oldBalFineRes = evaluateExpression(bill.oldBalanceFine);
  const oldBalanceFineNum = oldBalFineRes.valid ? oldBalFineRes.value : 0;

  // Total = New Total + Old Balance
  const totalAmount = (hasAnyAmount ? newTotalAmount : 0) + oldBalanceAmountNum;
  const totalFine = (hasAnyFine ? newTotalFine : 0) + oldBalanceFineNum;

  // Jama Total
  const jamaAmtRes = evaluateExpression(bill.jamaAmount);
  const jamaAmountNum = jamaAmtRes.valid ? jamaAmtRes.value : 0;

  const jamaFineRes = evaluateExpression(bill.jamaFine);
  const jamaFineNum = jamaFineRes.valid ? jamaFineRes.value : 0;

  // Final = Total - Jama
  const finalAmount = totalAmount - jamaAmountNum;
  const finalFine = totalFine - jamaFineNum;

  return {
    rowResults,
    newTotalAmount: hasAnyAmount ? Math.round(newTotalAmount * 100) / 100 : 0,
    newTotalWeight: hasAnyWeight ? Math.round(newTotalWeight * 1000) / 1000 : 0,
    newTotalLess: hasAnyLess ? Math.round(newTotalLess * 1000) / 1000 : 0,
    newTotalNet: hasAnyNet ? Math.round(newTotalNet * 1000) / 1000 : 0,
    newTotalFine: hasAnyFine ? roundFine(newTotalFine, finePrecision) : 0,
    oldBalanceAmountNum,
    oldBalanceFineNum,
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalFine: roundFine(totalFine, finePrecision),
    jamaAmountNum,
    jamaFineNum,
    finalAmount: Math.round(finalAmount * 100) / 100,
    finalFine: roundFine(finalFine, finePrecision),
  };
}

/**
 * Creates a clean new bill with default parameters
 */
export function createEmptyBill(
  slNo: string = '1',
  shopName: string = 'SHAMBHU JI RXL',
  billType: 'ROUGH ESTIMATE' | 'FINAL BILL' = 'ROUGH ESTIMATE',
  footerNote: string = 'Only Agra Item Will Be Return...'
): Bill {
  const now = new Date();
  const dateStr = formatDate(now);
  const timeStr = formatTime(now);

  return {
    id: 'bill_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    slNo,
    shopName,
    billType,
    date: dateStr,
    time: timeStr,
    customer: '',
    items: [createEmptyBillItem()],
    oldBalanceLabel: 'Old Balance',
    oldBalanceAmount: '',
    oldBalanceDate: '',
    oldBalanceFine: '',
    jamaLabel: 'Jama Total',
    jamaAmount: '',
    jamaFine: '',
    dhada: '',
    footerNote,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createEmptyBillItem(): BillItem {
  return {
    id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    amount: '',
    item: '',
    weight: '',
    less: '',
    tunch: '',
    lab: '',
  };
}

export function formatDate(d: Date): string {
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function formatTime(d: Date): string {
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}
