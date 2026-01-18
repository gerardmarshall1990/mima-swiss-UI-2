
import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Activity, 
  BarChart3, 
  TrendingUp,
  Calendar,
  Layers,
  HandCoins,
  CheckCircle2,
  Clock,
  Wallet
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MOCK_ACCOUNTS } from '../mockData';
import { DateFilterType } from '../types';
import KPICard from '../components/KPICard';

type AggregationType = 'DAILY' | 'WEEKLY' | 'MONTHLY';

const SummaryDashboard: React.FC = () => {
  const [dateFilter, setDateFilter] = useState<DateFilterType>('LAST_30D');
  const [aggregation, setAggregation] = useState<AggregationType>('WEEKLY');

  const stats = useMemo(() => {
    const totalBalance = MOCK_ACCOUNTS.reduce((sum, acc) => sum + acc.balance, 0);
    const totalEquity = MOCK_ACCOUNTS.reduce((sum, acc) => sum + acc.equity, 0);
    const totalLivePnL = MOCK_ACCOUNTS.reduce((sum, acc) => sum + acc.livePnL, 0);
    
    const realizedNetPnL = MOCK_ACCOUNTS.reduce((sum, acc) => 
      sum + acc.trades.reduce((tSum, t) => tSum + t.netPnL, 0), 0
    );
    
    const lotsTraded = MOCK_ACCOUNTS.reduce((sum, acc) => 
      sum + acc.trades.reduce((tSum, t) => tSum + t.lots, 0), 0
    );

    let totalPnlShareEarned = 0;
    let totalRebatesEarned = 0;
    
    MOCK_ACCOUNTS.forEach(acc => {
      const accPnl = acc.trades.reduce((s, t) => s + t.netPnL, 0);
      if (accPnl > 0) totalPnlShareEarned += (accPnl * acc.payoutStructure.pnlSharePercent / 100);
      const accLots = acc.trades.reduce((s, t) => s + t.lots, 0);
      totalRebatesEarned += (accLots * acc.payoutStructure.rebatePerLot);
    });

    const totalEarned = totalPnlShareEarned + totalRebatesEarned;

    return { 
      totalBalance, totalEquity, totalLivePnL, realizedNetPnL, 
      lotsTraded, totalEarned, totalPnlShareEarned, totalRebatesEarned 
    };
  }, []);

  const chartData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const balance = stats.totalBalance * (0.98 + Math.random() * 0.04);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date,
        balance: parseFloat(balance.toFixed(2)),
        equity: balance * (0.97 + Math.random() * 0.05),
        pnl: (Math.random() - 0.4) * 2000,
        lots: Math.random() * 5 + 1,
        tradesCount: Math.floor(Math.random() * 10) + 2
      };
    });
  }, [stats]);

  const aggregatedLedger = useMemo(() => {
    const groups: Record<string, any> = {};
    chartData.forEach(item => {
      const date = item.fullDate;
      let key = '';
      if (aggregation === 'WEEKLY') {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        key = `Week ${weekNum}, ${date.getFullYear()}`;
      } else if (aggregation === 'MONTHLY') {
        key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      } else {
        key = item.date;
      }

      if (!groups[key]) {
        groups[key] = { label: key, pnl: 0, lots: 0, tradesCount: 0, balance: 0, count: 0 };
      }
      groups[key].pnl += item.pnl;
      groups[key].lots += item.lots;
      groups[key].tradesCount += item.tradesCount;
      groups[key].balance += item.balance;
      groups[key].count += 1;
    });

    return Object.values(groups).reverse().map(g => ({
      ...g,
      balance: g.balance / g.count // Average balance for the period
    }));
  }, [chartData, aggregation]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Portfolio Summary</h1>
          <p className="text-slate-500">Global performance across {MOCK_ACCOUNTS.length} managed accounts</p>
        </div>
        
        <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {(['TODAY', 'LAST_7D', 'LAST_30D', 'MTD'] as DateFilterType[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setDateFilter(filter)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                dateFilter === filter 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {filter.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard label="Total AUM" value={`$${stats.totalBalance.toLocaleString()}`} trend={2.4} icon={<Wallet size={24} />} color="blue" />
        <KPICard 
          label="Total Earnings" 
          value={`$${stats.totalEarned.toLocaleString()}`} 
          trend={1.8} 
          icon={<HandCoins size={24} />} 
          color="indigo" 
          subValue={`Share: $${stats.totalPnlShareEarned.toLocaleString()} | Rebate: $${stats.totalRebatesEarned.toLocaleString()}`}
        />
        <KPICard label="Realized Net PnL" value={`$${stats.realizedNetPnL.toLocaleString()}`} trend={12.5} icon={<BarChart3 size={24} />} color="emerald" />
        <KPICard label="Total Lots Traded" value={stats.lotsTraded.toFixed(2)} subValue="Aggregate Volume" icon={<TrendingUp size={24} />} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="mb-8">
            <h3 className="text-lg font-bold">AUM Curve</h3>
            <p className="text-xs text-slate-400 font-medium">Aggregate portfolio balance tracking</p>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="balance" name="AUM" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="mb-8">
            <h3 className="text-lg font-bold">Payouts Health</h3>
            <p className="text-sm text-slate-400 font-medium">Pending vs Collected</p>
          </div>
          <div className="space-y-6 flex-1">
             <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
               <div className="flex items-center gap-3 text-emerald-600 mb-2">
                 <CheckCircle2 size={18} />
                 <span className="font-bold text-sm">Collected Share</span>
               </div>
               <p className="text-xs text-emerald-500 font-medium">$12,450.00 received this week.</p>
             </div>
             <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
               <div className="flex items-center gap-3 text-amber-600 mb-2">
                 <Clock size={18} />
                 <span className="font-bold text-sm">Awaiting Clients</span>
               </div>
               <p className="text-xs text-amber-500 font-medium">5 clients have pending invoices due.</p>
             </div>
             <div className="pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-slate-500">Collection Rate</span>
                  <span className="text-blue-500 font-bold">88%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '88%' }}></div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Layers size={20} className="text-blue-500" />
              Detailed Performance Ledger
            </h3>
            <p className="text-sm text-slate-400 font-medium">Periodical performance side-by-side</p>
          </div>
          
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl self-start">
            {(['DAILY', 'WEEKLY', 'MONTHLY'] as AggregationType[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setAggregation(mode)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  aggregation === mode 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Period</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Balance (AUM)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Net PnL</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Volume (Lots)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {aggregatedLedger.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Calendar size={16} className="text-slate-300" />
                      <span className="font-bold text-slate-900">{row.label}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    ${row.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`px-6 py-4 font-bold ${row.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {row.pnl >= 0 ? '+' : ''}${row.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-600">
                    {row.lots.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      row.pnl >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {row.pnl >= 0 ? 'Profit' : 'Loss'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SummaryDashboard;
