/**
 * Data structures for Shambhu Ji RXL Billing
 */

export type BillType = 'ROUGH ESTIMATE' | 'FINAL BILL';

export interface BillItem {
  id: string;
  amount: string;     // expression or text or number, e.g. "6290"
  item: string;       // name of item, e.g. "MICRO FX HAAR"
  weight: string;     // expression or number, e.g. "565"
  less: string;       // arithmetic expression, e.g. "10*12.140+6*12.315"
  netWt?: number | null; // calculated: weight - less
  tunch: string;      // percentage, e.g. "74"
  lab: string;        // making / labor charge, e.g. "17000"
  fine?: number | null;  // calculated: netWt * tunch / 100
}

export interface Bill {
  id: string;
  slNo: string;
  shopName: string;
  billType: BillType;
  date: string;
  time: string;
  customer: string;
  items: BillItem[];
  // Summary & settlement fields
  oldBalanceLabel: string;
  oldBalanceAmount: string;
  oldBalanceDate: string;
  oldBalanceFine: string;
  jamaLabel: string;
  jamaAmount: string;
  jamaFine: string;
  dhada: string;
  footerNote: string;
  // Metadata
  createdAt: number;
  updatedAt: number;
}

export interface BillCalculations {
  rowResults: Array<{
    weightVal: number | null;
    lessVal: number | null;
    netWtVal: number | null;
    tunchVal: number | null;
    fineVal: number | null;
    amountVal: number | null;
  }>;
  newTotalAmount: number;
  newTotalWeight: number;
  newTotalLess: number;
  newTotalNet: number;
  newTotalFine: number;
  oldBalanceAmountNum: number;
  oldBalanceFineNum: number;
  totalAmount: number;
  totalFine: number;
  jamaAmountNum: number;
  jamaFineNum: number;
  finalAmount: number;
  finalFine: number;
}

export interface AppSettings {
  shopName: string;
  defaultBillType: BillType;
  footerNote: string;
  autoIncrementSerial: boolean;
  lastSerial: number;
  finePrecision: number; // 0 for whole number as per physical bill
  defaultPrinter?: string;
}
