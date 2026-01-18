
import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ArrowUpDown, 
  Search,
  HandCoins,
  BarChart2,
  Activity,
  Layers,
  ChevronDown,
  Calendar,
  Filter,
  ChevronRight,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { MOCK_ACCOUNTS as MOCK_DATA_ACCOUNTS } from '../mockData';
import KPICard from '../components/KPICard';
import { PaymentStatus, DateFilterType } from '../types';

type AggregationType = 'DAILY' | 'WEEKLY' | 'MONTHLY';

const PayoutsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('ALL');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [isCustomToggled, setIsCustomToggled] = useState(false);
  
  const [chartAggregation, setChartAggregation] = useState<AggregationType>('MONTHLY');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'amount', direction: 'desc' });
  const [accruedSort, setAccruedSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'totalAccrued', direction: 'desc' });
  const [expandedPending, setExpandedPending] = useState<string | null>(null);

  // Helper for date filtering
  const filterByDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    
    if (dateFilter === 'CUSTOM' && customRange.start && customRange.end) {
      return date >= new Date(customRange.start) && date <= new Date(customRange.end);
    }

    if (dateFilter === 'ALL') return true;
    if (dateFilter === 'TODAY') return date.toDateString() === now.toDateString();
    if (dateFilter === 'LAST_7D') return date > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (dateFilter === 'LAST_30D') return date > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (dateFilter === 'MTD') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    
    return true;
  };

  const handleToggleCustom = () => {
    if (!isCustomToggled) {
      setDateFilter('CUSTOM');
      setIsCustomToggled(true);
    } else {
      setDateFilter('ALL');
      setIsCustomToggled(false);
    }
  };

  // 1. Calculate Global Summaries filtered by Global Date Filter
  const payoutSummary = useMemo(() => {
    let receivedTotal = 0;
    let receivedPnlShare = 0;
    let receivedRebates = 0;
    let pending = 0;
    let paidLots = 0;

    MOCK_DATA_ACCOUNTS.forEach(acc => {
      acc.paymentHistory.forEach(pay => {
        // Filter based on due date for historical records
        if (!filterByDate(pay.dueDate)) return;

        if (pay.status === 'PAID') {
          receivedTotal += pay.amount;
          if (pay.type === 'PNL_SHARE') receivedPnlShare += pay.amount;
          if (pay.type === 'REBATE') {
            receivedRebates += pay.amount;
            paidLots += (pay.amount / acc.payoutStructure.rebatePerLot);
          }
        } else {
          pending += pay.amount;
        }
      });
    });

    return { receivedTotal, receivedPnlShare, receivedRebates, pending, paidLots };
  }, [dateFilter, customRange]);

  // 2. Client-Wise Accruals Breakdown with Global Date Filter
  const clientBreakdown = useMemo(() => {
    let result = MOCK_DATA_ACCOUNTS.map(acc => {
      const filteredTrades = acc.trades.filter(t => filterByDate(t.closeTime || t.openTime));
      const netPnL = filteredTrades.reduce((sum, t) => sum + t.netPnL, 0);
      const lots = filteredTrades.reduce((sum, t) => sum + t.lots, 0);
      const shareEarned = netPnL > 0 ? (netPnL * acc.payoutStructure.pnlSharePercent / 100) : 0;
      const rebateEarned = lots * acc.payoutStructure.rebatePerLot;
      
      return {
        ...acc,
        netPnL,
        lots,
        shareEarned,
        rebateEarned,
        totalAccrued: shareEarned + rebateEarned
      };
    }).filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    result.sort((a, b) => {
      const aVal = (a as any)[accruedSort.key];
      const bVal = (b as any)[accruedSort.key];
      return accruedSort.direction === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

    return result;
  }, [searchTerm, dateFilter, customRange, accruedSort]);

  // 3. Earnings Chart Data (Shows Historical Paid Data, ignores current period filter for context)
  const chartData = useMemo(() => {
    const dataMap: Record<string, { label: string, pnl: number, rebate: number, sortKey: number }> = {};
    
    MOCK_DATA_ACCOUNTS.forEach(acc => {
      acc.paymentHistory.forEach(pay => {
        if (pay.status === 'PAID') {
          const date = new Date(pay.dueDate);
          let key = '';
          let label = '';
          let sortKey = 0;

          if (chartAggregation === 'MONTHLY') {
            key = `${date.getFullYear()}-${date.getMonth()}`;
            label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            sortKey = date.getFullYear() * 100 + date.getMonth();
          } else if (chartAggregation === 'WEEKLY') {
            const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
            const weekNum = Math.ceil((((date.getTime() - firstDayOfYear.getTime()) / 86400000) + firstDayOfYear.getDay() + 1) / 7);
            key = `${date.getFullYear()}-W${weekNum}`;
            label = `W${weekNum} ${date.getFullYear()}`;
            sortKey = date.getFullYear() * 100 + weekNum;
          } else {
            key = date.toISOString().split('T')[0];
            label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            sortKey = date.getTime();
          }

          if (!dataMap[key]) dataMap[key] = { label, pnl: 0, rebate: 0, sortKey };
          if (pay.type === 'PNL_SHARE') dataMap[key].pnl += pay.amount;
          else dataMap[key].rebate += pay.amount;
        }
      });
    });

    return Object.values(dataMap).sort((a, b) => a.sortKey - b.sortKey);
  }, [chartAggregation]);

  // 4. Flattened Ledger for History
  const allPayments = useMemo(() => {
    const flattened = MOCK_DATA_ACCOUNTS.flatMap(acc => 
      acc.paymentHistory.map(pay => ({
        ...pay,
        accountName: acc.name,
        accountNumber: acc.accountNumber,
        rebatePerLot: acc.payoutStructure.rebatePerLot,
        pnlSharePercent: acc.payoutStructure.pnlSharePercent
      }))
    );

    let filtered = flattened.filter(pay => 
      (statusFilter === 'ALL' || pay.status === statusFilter) &&
      filterByDate(pay.dueDate) &&
      (pay.accountName.toLowerCase().includes(searchTerm.toLowerCase()) || pay.accountNumber.includes(searchTerm))
    );

    filtered.sort((a, b) => {
      const aVal = (a as any)[sortConfig.key];
      const bVal = (b as any)[sortConfig.key];
      return sortConfig.direction === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

    return filtered;
  }, [searchTerm, statusFilter, sortConfig, dateFilter, customRange]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleAccruedSort = (key: string) => {
    setAccruedSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payouts Hub</h1>
          <p className="text-slate-500">Comprehensive summary of performance fees and volume rebates</p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
          {(['TODAY', 'LAST_7D', 'LAST_30D', 'ALL'] as DateFilterType[]).map((f) => (
            <button 
              key={f} 
              onClick={() => { setDateFilter(f); setIsCustomToggled(false); }} 
              className={`px-3 py-2 text-[10px] font-bold rounded-lg transition-all ${dateFilter === f && !isCustomToggled ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {f === 'ALL' ? 'TOTAL' : f.replace('_', ' ')}
            </button>
          ))}
          <button 
            onClick={handleToggleCustom}
            className={`flex items-center gap-2 px-3 py-2 text-[10px] font-bold rounded-lg transition-all ${isCustomToggled ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            {isCustomToggled ? <CheckCircle size={12} /> : <Calendar size={12} />}
            CUSTOM
          </button>
        </div>
      </div>

      {isCustomToggled && (
        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl shadow-sm flex items-center gap-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col">
            <label className="text-[9px] font-bold text-blue-600 uppercase mb-1">From</label>
            <input type="date" className="bg-white border border-blue-100 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" value={customRange.start} onChange={e => setCustomRange(p => ({...p, start: e.target.value}))}/>
          </div>
          <div className="text-slate-300 mt-5">to</div>
          <div className="flex flex-col">
            <label className="text-[9px] font-bold text-blue-600 uppercase mb-1">To</label>
            <input type="date" className="bg-white border border-blue-100 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" value={customRange.end} onChange={e => setCustomRange(p => ({...p, end: e.target.value}))}/>
          </div>
          <div className="flex-1"></div>
          <p className="text-[10px] text-blue-400 font-medium italic">Summaries adjusted for selection</p>
        </div>
      )}

      {/* Global Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard 
          label="Total Collected" 
          value={`$${payoutSummary.receivedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          icon={<CheckCircle2 size={24} />} 
          color="blue" 
          subValue={dateFilter === 'ALL' ? 'Lifetime Revenue' : 'Period Revenue'} 
        />
        <KPICard 
          label="PnL Share Paid" 
          value={`$${payoutSummary.receivedPnlShare.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          icon={<HandCoins size={24} />} 
          color="indigo" 
          subValue="Settled Performance" 
        />
        <KPICard 
          label="Rebates Paid" 
          value={`$${payoutSummary.receivedRebates.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          icon={<BarChart2 size={24} />} 
          color="orange" 
          subValue="Settled Volume" 
        />
        <KPICard 
          label="Paid Lots Traded" 
          value={payoutSummary.paidLots.toFixed(2)} 
          icon={<Activity size={24} />} 
          color="emerald" 
          subValue="Aggregate Vol." 
        />
        <KPICard 
          label="Total Pending" 
          value={`$${payoutSummary.pending.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          icon={<Clock size={24} />} 
          color="amber" 
          subValue="Open Accruals" 
        />
      </div>

      {/* Earnings Summary Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-lg font-bold">Historical Earnings Curve</h3>
            <p className="text-sm text-slate-400 font-medium">Aggregate settled revenue over time</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl self-start">
            {(['DAILY', 'WEEKLY', 'MONTHLY'] as AggregationType[]).map(agg => (
              <button 
                key={agg} 
                onClick={() => setChartAggregation(agg)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${chartAggregation === agg ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {agg}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={val => `$${val}`} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '11px', fontWeight: 'bold' }} />
              <Bar dataKey="pnl" name="PnL Share" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} barSize={32} />
              <Bar dataKey="rebate" name="Rebates" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Accrued Earnings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Layers size={20} className="text-blue-600" />
              Real-time Accruals Breakdown
            </h3>
            <p className="text-sm text-slate-400 font-medium">Calculated earnings for selected timeframe</p>
          </div>
          <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg uppercase">
            Active Filter: {dateFilter.replace('_', ' ')}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/30 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client</th>
                <th onClick={() => handleAccruedSort('netPnL')} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right cursor-pointer hover:text-blue-600">
                  <div className="flex items-center justify-end gap-1">Net PnL <ArrowUpDown size={12}/></div>
                </th>
                <th onClick={() => handleAccruedSort('lots')} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right cursor-pointer hover:text-blue-600">
                  <div className="flex items-center justify-end gap-1">Lots <ArrowUpDown size={12}/></div>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">PnL Share ($)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Rebate ($)</th>
                <th onClick={() => handleAccruedSort('totalAccrued')} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right cursor-pointer hover:text-blue-600">
                  <div className="flex items-center justify-end gap-1">Total Accrued <ArrowUpDown size={12}/></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {clientBreakdown.map(acc => (
                <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 leading-tight">{acc.name}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{acc.accountNumber}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className={`text-sm font-bold ${acc.netPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ${acc.netPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-bold text-slate-600">{acc.lots.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-bold text-indigo-600">${acc.shareEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{acc.payoutStructure.pnlSharePercent}% Rate</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-bold text-orange-600">${acc.rebateEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">${acc.payoutStructure.rebatePerLot.toFixed(2)}/L</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-bold text-slate-900">${acc.totalAccrued.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  </td>
                </tr>
              ))}
              {clientBreakdown.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No data available for the selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Payment Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Ledger Archive</h3>
            <p className="text-sm text-slate-400 font-medium">Search and manage historical invoices</p>
          </div>
        </div>
        <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search ledger..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid Only</option>
            <option value="PENDING">Pending (Due)</option>
            <option value="OVERDUE">Overdue Only</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Period & Client</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Type</th>
                <th onClick={() => handleSort('amount')} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-blue-600">
                  <div className="flex items-center gap-2">Amount <ArrowUpDown size={14} /></div>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {allPayments.map((pay) => {
                const isExpanded = expandedPending === pay.id;
                return (
                  <React.Fragment key={pay.id}>
                    <tr 
                      className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50/30' : ''}`}
                      onClick={() => setExpandedPending(isExpanded ? null : pay.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 leading-tight">{pay.periodLabel}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{pay.accountName}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                          pay.type === 'PNL_SHARE' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                          {pay.type === 'PNL_SHARE' ? 'PnL Share' : 'Rebate'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        ${pay.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                        {new Date(pay.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                          pay.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' :
                          pay.status === 'OVERDUE' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {pay.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight size={18} className={`text-slate-300 transition-transform ${isExpanded ? 'rotate-90 text-blue-500' : ''}`} />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-blue-50/10 border-l-2 border-l-blue-500">
                        <td colSpan={6} className="px-6 py-6 animate-in slide-in-from-top-2 duration-200">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Account Details</p>
                              <p className="text-sm font-bold text-slate-900">{pay.accountName}</p>
                              <p className="text-xs text-slate-500 font-medium"># {pay.accountNumber}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Commercial Basis</p>
                              <p className="text-sm font-bold text-slate-900">
                                {pay.type === 'PNL_SHARE' ? `${pay.pnlSharePercent}% Net Profit` : `$${pay.rebatePerLot.toFixed(2)} / Lot`}
                              </p>
                              <p className="text-xs text-slate-500 font-medium">Applied to {pay.periodLabel}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col justify-between">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Payment Intent</p>
                                <p className="text-sm font-bold text-slate-900">${pay.amount.toLocaleString()}</p>
                              </div>
                              <button className="mt-2 w-full py-1.5 bg-blue-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-blue-700">
                                Mark as Collected
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayoutsView;
