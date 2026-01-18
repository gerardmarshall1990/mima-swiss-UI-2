
import { ManagedAccount, ConnectionStatus, Trade, Cashflow, AccountSnapshot, PaymentRecord } from './types';

const generateTrades = (count: number, daysBack: number): Trade[] => {
  const trades: Trade[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    // Distribute trades over the daysBack period
    const offsetMillis = Math.random() * daysBack * 24 * 60 * 60 * 1000;
    const openTime = new Date(now.getTime() - offsetMillis);
    const closeTime = new Date(openTime.getTime() + (Math.random() * 4 * 60 * 60 * 1000)); // 0-4 hours duration
    
    const profit = Math.random() * 500 - 150;
    const swap = Math.random() * -10;
    const commission = Math.random() * -5;
    
    trades.push({
      id: `T-${i}-${Math.random().toString(36).substr(2, 5)}`,
      type: Math.random() > 0.5 ? 'BUY' : 'SELL',
      symbol: ['EURUSD', 'GBPUSD', 'XAUUSD', 'NAS100', 'USDJPY', 'DAX40'][Math.floor(Math.random() * 6)],
      lots: parseFloat((Math.random() * 1.5 + 0.1).toFixed(2)),
      openPrice: 1.1234 + Math.random() * 0.1,
      closePrice: 1.1234 + Math.random() * 0.1,
      openTime: openTime.toISOString(),
      closeTime: closeTime.toISOString(),
      profit: parseFloat(profit.toFixed(2)),
      swap: parseFloat(swap.toFixed(2)),
      commission: parseFloat(commission.toFixed(2)),
      netPnL: parseFloat((profit + swap + commission).toFixed(2)),
    });
  }
  return trades.sort((a, b) => new Date(a.openTime).getTime() - new Date(b.openTime).getTime());
};

const generateSnapshots = (count: number, baseBalance: number): AccountSnapshot[] => {
  const snapshots: AccountSnapshot[] = [];
  let currentBalance = baseBalance;
  for (let i = count; i >= 0; i--) {
    const time = new Date(Date.now() - i * 1000 * 60 * 60 * 24);
    const fluctuation = (Math.random() - 0.45) * 800; // Increased volatility for better chart visuals
    currentBalance += fluctuation;
    snapshots.push({
      timestamp: time.toISOString(),
      balance: currentBalance,
      equity: currentBalance * (1 - Math.random() * 0.03),
      drawdownPercent: Math.random() * 6 + (Math.random() > 0.9 ? 4 : 0), // Occasional spikes
    });
  }
  return snapshots;
};

const generatePaymentHistory = (): PaymentRecord[] => {
  return [
    { id: 'p1', type: 'PNL_SHARE', amount: 1200.50, dueDate: '2024-05-01', status: 'PAID', periodLabel: 'April 2024' },
    { id: 'p2', type: 'REBATE', amount: 450.00, dueDate: '2024-05-01', status: 'PAID', periodLabel: 'April 2024' },
    { id: 'p3', type: 'PNL_SHARE', amount: 1540.20, dueDate: '2024-06-01', status: 'PENDING', periodLabel: 'May 2024' },
    { id: 'p4', type: 'REBATE', amount: 320.10, dueDate: '2024-06-01', status: 'OVERDUE', periodLabel: 'May 2024' },
  ];
};

const brokers = ['IC Markets', 'Pepperstone', 'Exness', 'FTMO'];
const servers = ['Live01', 'Live04', 'Pro-MT5', 'Server-X'];
const strategies = ['Scalper Pro', 'Gold Hunter', 'HFT Arbitrage', 'Swing Master'];
const vpsNodes = ['CH-ZRH-01', 'UK-LDN-04', 'US-NY-HFT', 'DE-FRA-EDGE', 'SG-FIN-02'];

export const MOCK_ACCOUNTS: ManagedAccount[] = [
  {
    id: 'acc-1',
    name: 'James Wilson',
    broker: brokers[0],
    server: `${brokers[0]}-${servers[0]}`,
    vpsName: vpsNodes[0],
    platform: 'MT4',
    accountNumber: '1092837',
    status: ConnectionStatus.CONNECTED,
    balance: 45791.00,
    equity: 46210.45,
    marginPercent: 1240.5,
    currentDDPercent: 1.2,
    livePnL: 419.45,
    buyPositionsCount: 2,
    buyLotsTotal: 0.50,
    sellPositionsCount: 1,
    sellLotsTotal: 0.25,
    strategyTag: strategies[0],
    trades: generateTrades(250, 180), // 180 days of data
    cashflows: [
      { id: 'cf-1', type: 'DEPOSIT', amount: 40000, timestamp: '2023-01-10T10:00:00Z' },
      { id: 'cf-2', type: 'WITHDRAWAL', amount: 5000, timestamp: '2024-02-15T14:30:00Z' }
    ],
    snapshots: generateSnapshots(180, 45000),
    payoutStructure: { pnlSharePercent: 30, rebatePerLot: 2.5, frequency: 'Weekly' },
    paymentHistory: generatePaymentHistory(),
  },
  {
    id: 'acc-2',
    name: 'Sophia Chen',
    broker: brokers[1],
    server: `${brokers[1]}-${servers[1]}`,
    vpsName: vpsNodes[1],
    platform: 'MT5',
    accountNumber: '8827364',
    status: ConnectionStatus.CONNECTED,
    balance: 124500.50,
    equity: 121300.20,
    marginPercent: 850.2,
    currentDDPercent: 3.4,
    livePnL: -3200.30,
    buyPositionsCount: 4,
    buyLotsTotal: 2.10,
    sellPositionsCount: 0,
    sellLotsTotal: 0.00,
    strategyTag: strategies[1],
    trades: generateTrades(320, 180),
    cashflows: [{ id: 'cf-3', type: 'DEPOSIT', amount: 100000, timestamp: '2023-05-12T09:00:00Z' }],
    snapshots: generateSnapshots(180, 120000),
    payoutStructure: { pnlSharePercent: 40, rebatePerLot: 1.8, frequency: 'Monthly' },
    paymentHistory: generatePaymentHistory(),
  },
  {
    id: 'acc-3',
    name: 'Marco Rossi',
    broker: brokers[2],
    server: `${brokers[2]}-${servers[2]}`,
    vpsName: vpsNodes[2],
    platform: 'MT4',
    accountNumber: '5564732',
    status: ConnectionStatus.BUSY,
    balance: 8900.00,
    equity: 8900.00,
    marginPercent: 0,
    currentDDPercent: 0,
    livePnL: 0,
    buyPositionsCount: 0,
    buyLotsTotal: 0,
    sellPositionsCount: 0,
    sellLotsTotal: 0,
    strategyTag: strategies[2],
    trades: generateTrades(150, 180),
    cashflows: [{ id: 'cf-4', type: 'DEPOSIT', amount: 10000, timestamp: '2024-01-01T00:00:00Z' }],
    snapshots: generateSnapshots(180, 9000),
    payoutStructure: { pnlSharePercent: 25, rebatePerLot: 5.0, frequency: 'Weekly' },
    paymentHistory: generatePaymentHistory(),
  },
  {
    id: 'acc-4',
    name: 'Elena Gilbert',
    broker: brokers[3],
    server: `${brokers[3]}-${servers[3]}`,
    vpsName: vpsNodes[3],
    platform: 'MT4',
    accountNumber: '2293847',
    status: ConnectionStatus.DISCONNECTED,
    balance: 23450.00,
    equity: 23450.00,
    marginPercent: 0,
    currentDDPercent: 0,
    livePnL: 0,
    buyPositionsCount: 0,
    buyLotsTotal: 0,
    sellPositionsCount: 0,
    sellLotsTotal: 0,
    strategyTag: strategies[3],
    trades: generateTrades(100, 180),
    cashflows: [{ id: 'cf-5', type: 'DEPOSIT', amount: 25000, timestamp: '2024-03-01T12:00:00Z' }],
    snapshots: generateSnapshots(180, 24000),
    payoutStructure: { pnlSharePercent: 30, rebatePerLot: 2.0, frequency: 'Bi-Weekly' },
    paymentHistory: generatePaymentHistory(),
  },
  {
    id: 'acc-5',
    name: 'David Miller',
    broker: brokers[0],
    server: `${brokers[0]}-${servers[0]}`,
    vpsName: vpsNodes[4],
    platform: 'MT4',
    accountNumber: '9928371',
    status: ConnectionStatus.CONNECTED,
    balance: 67200.00,
    equity: 64100.00,
    marginPercent: 420.5,
    currentDDPercent: 9.2,
    livePnL: -3100.00,
    buyPositionsCount: 5,
    buyLotsTotal: 4.50,
    sellPositionsCount: 2,
    sellLotsTotal: 1.20,
    strategyTag: strategies[0],
    trades: generateTrades(400, 180),
    cashflows: [{ id: 'cf-6', type: 'DEPOSIT', amount: 60000, timestamp: '2023-11-20T10:00:00Z' }],
    snapshots: generateSnapshots(180, 65000),
    payoutStructure: { pnlSharePercent: 50, rebatePerLot: 3.2, frequency: 'Monthly' },
    paymentHistory: generatePaymentHistory(),
  },
];
