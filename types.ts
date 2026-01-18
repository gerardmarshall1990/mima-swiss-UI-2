
export enum ConnectionStatus {
  CONNECTED = 'Connected',
  NO_MARKET = 'No Market',
  BUSY = 'Busy',
  DISCONNECTED = 'Disconnected'
}

export interface Trade {
  id: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  lots: number;
  openPrice: number;
  closePrice?: number;
  openTime: string;
  closeTime?: string;
  profit: number;
  swap: number;
  commission: number;
  netPnL: number;
}

export interface Cashflow {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  timestamp: string;
  note?: string;
}

export interface AccountSnapshot {
  timestamp: string;
  equity: number;
  balance: number;
  drawdownPercent: number;
}

export interface PayoutStructure {
  pnlSharePercent: number; // e.g., 30 for 30%
  rebatePerLot: number;    // e.g., 2 for $2 per lot
  frequency: 'Weekly' | 'Monthly' | 'Bi-Weekly';
}

export type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE';
export type PaymentType = 'PNL_SHARE' | 'REBATE';

export interface PaymentRecord {
  id: string;
  type: PaymentType;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  periodLabel: string; // e.g., "June 2024"
}

export interface ManagedAccount {
  id: string;
  name: string;
  broker: string;
  server: string;        // e.g. "Pepperstone-Live4"
  vpsName: string;       // e.g. "Zurich-HFT-01"
  platform: 'MT4' | 'MT5';
  accountNumber: string;
  status: ConnectionStatus;
  
  // Real-time metrics
  balance: number;
  equity: number;
  marginPercent: number;
  currentDDPercent: number;
  livePnL: number;
  
  buyPositionsCount: number;
  buyLotsTotal: number;
  sellPositionsCount: number;
  sellLotsTotal: number;

  // History for period calculation
  trades: Trade[];
  cashflows: Cashflow[];
  snapshots: AccountSnapshot[];
  
  // Payout info
  payoutStructure: PayoutStructure;
  paymentHistory: PaymentRecord[];

  // Metadata
  strategyTag: string;
}

export interface PortfolioSummary {
  totalBalance: number;
  totalEquity: number;
  totalLivePnL: number;
  realizedNetPnL: number;
  lotsTraded: number;
  maxDDPercent: number;
  maxDDAmount: number;
  totalWithdrawals: number;
  totalDeposits: number;
}

export type DateFilterType = 'TODAY' | 'LAST_7D' | 'LAST_30D' | 'MTD' | 'ALL' | 'CUSTOM';
