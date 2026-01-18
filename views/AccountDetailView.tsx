
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar,
  TrendingUp,
  Activity,
  BarChart2,
  HandCoins,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend, LabelList } from 'recharts';
import { MOCK_ACCOUNTS } from '../mockData';
import { DateFilterType } from '../types';
import KPICard from '../components/KPICard';

type AggregationType = 'DAILY' | 'WEEKLY' | 'MONTHLY';

// Stylized floating label for Rebate Earnings
const CustomRebateLabel = (props: any) => {
  const { x, y, width, value } = props;
  if (value === undefined || value === 0) return null;

  return (
    <g>
      <filter id="shadowRebate" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
        <feOffset dx="0" dy="1.5" result="offsetblur" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.1" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <rect 
        x={x + width / 2 - 30} 
        y={y - 28} 
        width={60} 
        height={22} 
        rx={6} 
        fill="#ffffff" 
        stroke="#fdba74"
        strokeWidth={1.5}
        filter="url(#shadowRebate)"
      />
      <text 
        x={x + width / 2} 
        y={y - 12} 
        fill="#ea580c" 
        textAnchor="middle" 
        fontSize="10" 
        fontWeight="800"
        fontFamily="Inter, sans-serif"
      >
        ${parseFloat(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </text>
    </g>
  );
};

// Stylized floating label for Total PnL (Top of stacked bar)
const CustomPnLTotalLabel = (props: any) => {
  const { x, y, width, value } = props;
  if (value === undefined || value === 0) return null;

  const isProfit = value >= 0;
  const color = isProfit ? '#059669' : '#e11d48';
  const borderColor = isProfit ? '#6ee7b7' : '#fda4af';

  return (
    <g>
      <filter id="shadowPnL" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
        <feOffset dx="0" dy="1.5" result="offsetblur" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.1" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <rect 
        x={x + width / 2 - 35} 
        y={y - 28} 
        width={70} 
        height={22} 
        rx={6} 
        fill="#ffffff" 
        stroke={borderColor}
        strokeWidth={1.5}
        filter="url(#shadowPnL)"
      />
      <text 
        x={x + width / 2} 
        y={y - 12} 
        fill={color} 
        textAnchor="middle" 
        fontSize="10" 
        fontWeight="800"
        fontFamily="Inter, sans-serif"
      >
        {isProfit ? '+' : ''}${Math.abs(parseFloat(value)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </text>
    </g>
  );
};

const AccountDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [dateFilter, setDateFilter] = useState<DateFilterType>('ALL'); // Default to 'ALL' to see the expanded history
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [isCustomToggled, setIsCustomToggled] = useState(false);
  
  const [pnlAggregation, setPnlAggregation] = useState<AggregationType>('WEEKLY');
  const [lotsAggregation, setLotsAggregation] = useState<AggregationType>('WEEKLY');
  const [ddAggregation, setDdAggregation] = useState<AggregationType>('WEEKLY');
  
  const account = useMemo(() => MOCK_ACCOUNTS.find(a => a.id === id), [id]);

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
        <Activity size={48} className="mb-4 opacity-20" />
        <h2 className="text-xl font-bold">Account not found</h2>
        <button onClick={() => navigate('/accounts')} className="mt-4 text-blue-600 font-bold hover:underline">
          Back to all accounts
        </button>
      </div>
    );
  }

  const handleToggleCustom = () => {
    if (!isCustomToggled) {
      setDateFilter('CUSTOM');
      setIsCustomToggled(true);
    } else {
      setDateFilter('ALL');
      setIsCustomToggled(false);
    }
  };

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

  const periodStats = useMemo(() => {
    const filteredTrades = account.trades.filter(t => filterByDate(t.closeTime || t.openTime));
    const netPnL = filteredTrades.reduce((sum, t) => sum + t.netPnL, 0);
    const lotsTraded = filteredTrades.reduce((sum, t) => sum + t.lots, 0);
    const pnlShare = netPnL > 0 ? (netPnL * account.payoutStructure.pnlSharePercent / 100) : 0;
    const rebate = lotsTraded * account.payoutStructure.rebatePerLot;
    
    const relevantSnapshots = account.snapshots.filter(s => filterByDate(s.timestamp));
    const maxDD = relevantSnapshots.length > 0 
      ? Math.max(...relevantSnapshots.map(s => s.drawdownPercent))
      : account.currentDDPercent;

    return { netPnL, lotsTraded, pnlShare, rebate, tradeCount: filteredTrades.length, maxDD };
  }, [account, dateFilter, customRange]);

  const getAggregatedData = (aggregation: AggregationType, dataKey: 'pnl' | 'lots' | 'dd') => {
    const map: Record<string, { date: string, rawDate: Date, value: number, fintechShare?: number, clientPnL?: number, rebateValue?: number }> = {};
    
    if (dataKey === 'pnl' || dataKey === 'lots') {
      account.trades.filter(t => filterByDate(t.closeTime || t.openTime)).forEach(trade => {
        const d = new Date(trade.closeTime || trade.openTime);
        const key = d.toISOString().split('T')[0];
        if (!map[key]) map[key] = { date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), rawDate: d, value: 0 };
        map[key].value += dataKey === 'pnl' ? trade.netPnL : trade.lots;
      });
    } else {
      account.snapshots.filter(s => filterByDate(s.timestamp)).forEach(snap => {
        const d = new Date(snap.timestamp);
        const key = d.toISOString().split('T')[0];
        if (!map[key]) map[key] = { date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), rawDate: d, value: 0 };
        map[key].value = Math.max(map[key].value, snap.drawdownPercent);
      });
    }

    const dailyArray = Object.values(map).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
    
    dailyArray.forEach(item => {
        if (dataKey === 'pnl') {
            const share = item.value > 0 ? (item.value * account.payoutStructure.pnlSharePercent / 100) : 0;
            item.fintechShare = share;
            item.clientPnL = item.value - share;
        } else if (dataKey === 'lots') {
            item.rebateValue = item.value * account.payoutStructure.rebatePerLot;
        }
    });

    if (aggregation === 'DAILY') return dailyArray;
    
    const aggregated: Record<string, any> = {};
    dailyArray.forEach(item => {
      const d = item.rawDate;
      const key = aggregation === 'WEEKLY' 
        ? `W${Math.ceil(((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(d.getFullYear(), 0, 1).getDay() + 1) / 7)}` 
        : d.toLocaleDateString('en-US', { month: 'short' });
      
      if (!aggregated[key]) {
          aggregated[key] = { date: key, value: 0, fintechShare: 0, clientPnL: 0, rebateValue: 0 };
      }
      
      if (dataKey === 'dd') {
        aggregated[key].value = Math.max(aggregated[key].value, item.value);
      } else {
        aggregated[key].value += item.value;
        if (dataKey === 'pnl') {
            aggregated[key].fintechShare += (item.fintechShare || 0);
            aggregated[key].clientPnL += (item.clientPnL || 0);
        } else if (dataKey === 'lots') {
            aggregated[key].rebateValue += (item.rebateValue || 0);
        }
      }
    });
    return Object.values(aggregated);
  };

  const pnlChartData = useMemo(() => getAggregatedData(pnlAggregation, 'pnl'), [account, pnlAggregation, dateFilter, customRange]);
  const lotsChartData = useMemo(() => getAggregatedData(lotsAggregation, 'lots'), [account, lotsAggregation, dateFilter, customRange]);
  const ddChartData = useMemo(() => getAggregatedData(ddAggregation, 'dd'), [account, ddAggregation, dateFilter, customRange]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/accounts')} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{account.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">{account.platform}</span>
              <p className="text-slate-400 text-xs font-medium">{account.broker} • {account.accountNumber}</p>
              <span className="text-slate-300">|</span>
              <p className="text-slate-400 text-[10px] font-bold uppercase">{account.server}</p>
            </div>
          </div>
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
            {isCustomToggled ? <CheckCircle2 size={12} /> : <Calendar size={12} />}
            CUSTOM
          </button>
        </div>
      </div>

      {isCustomToggled && (
        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl shadow-sm flex items-center gap-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col">
            <label className="text-[9px] font-bold text-blue-600 uppercase mb-1">Start Date</label>
            <input type="date" className="bg-white border border-blue-100 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" value={customRange.start} onChange={e => setCustomRange(p => ({...p, start: e.target.value}))}/>
          </div>
          <div className="text-slate-300 mt-5">to</div>
          <div className="flex flex-col">
            <label className="text-[9px] font-bold text-blue-600 uppercase mb-1">End Date</label>
            <input type="date" className="bg-white border border-blue-100 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" value={customRange.end} onChange={e => setCustomRange(p => ({...p, end: e.target.value}))}/>
          </div>
          <div className="flex-1"></div>
          <p className="text-[10px] text-blue-400 font-medium italic">Data will aggregate based on this custom window</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard label="Net PnL" value={`$${periodStats.netPnL.toLocaleString()}`} icon={<TrendingUp size={20} />} color="emerald" subValue={dateFilter === 'ALL' ? 'Lifetime' : isCustomToggled ? 'Custom Range' : dateFilter} />
        <KPICard label="PnL Share ($)" value={`$${periodStats.pnlShare.toLocaleString()}`} subValue={`${account.payoutStructure.pnlSharePercent}% Share Frequency: ${account.payoutStructure.frequency}`} icon={<HandCoins size={20} />} color="indigo" />
        <KPICard label="Rebate Share ($)" value={`$${periodStats.rebate.toLocaleString()}`} subValue={`$${account.payoutStructure.rebatePerLot.toFixed(2)}/Lot`} icon={<BarChart2 size={20} />} color="orange" />
        <KPICard label="Lots Traded" value={periodStats.lotsTraded.toFixed(2)} subValue={`${periodStats.tradeCount} trades`} icon={<Activity size={20} />} color="slate" />
        <KPICard label="Period Max DD" value={`${periodStats.maxDD.toFixed(2)}%`} subValue="Peak Risk Hits" icon={<ShieldAlert size={20} />} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Periodic PnL Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h3 className="text-lg font-bold">Periodic Net PnL</h3>
            <div className="flex bg-slate-100 p-1 rounded-lg self-start">
              {(['DAILY', 'WEEKLY', 'MONTHLY'] as AggregationType[]).map(m => (
                <button key={m} onClick={() => setPnlAggregation(m)} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${pnlAggregation === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{m}</button>
              ))}
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pnlChartData} margin={{ top: 40, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={val => `$${val}`} />
                <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                    formatter={(value: any, name: string) => {
                        const val = parseFloat(value).toLocaleString();
                        if (name === 'clientPnL') return [`$${val}`, 'Client PnL'];
                        if (name === 'fintechShare') return [`$${val}`, 'Fintech Share (Profit Only)'];
                        return [`$${val}`, name];
                    }}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '30px', fontSize: '11px', fontWeight: 'bold' }} />
                <Bar dataKey="clientPnL" name="Client Share" stackId="a" radius={[0, 0, 0, 0]} barSize={24}>
                  {pnlChartData.map((e, i) => (
                    <Cell key={i} fill={e.value >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
                <Bar dataKey="fintechShare" name="Fintech Share" stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24}>
                   <LabelList 
                    dataKey="value" 
                    content={<CustomPnLTotalLabel />} 
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Periodic Lots Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h3 className="text-lg font-bold">Periodic Lots Traded</h3>
            <div className="flex bg-slate-100 p-1 rounded-lg self-start">
              {(['DAILY', 'WEEKLY', 'MONTHLY'] as AggregationType[]).map(m => (
                <button key={m} onClick={() => setLotsAggregation(m)} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${lotsAggregation === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{m}</button>
              ))}
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lotsChartData} margin={{ top: 40, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: any, name: string) => {
                        if (name === 'value') return [value.toFixed(2), 'Lots Traded'];
                        if (name === 'rebateValue') return [`$${parseFloat(value).toLocaleString()}`, 'Rebate Earned'];
                        return [value, name];
                    }}
                />
                <Bar dataKey="value" name="Lots" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24}>
                  <LabelList 
                    dataKey="rebateValue" 
                    content={<CustomRebateLabel />} 
                  />
                </Bar>
                <Bar dataKey="rebateValue" name="Rebate" hide />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Periodic Max Drawdown Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h3 className="text-lg font-bold">Periodic Max Drawdown</h3>
            <div className="flex bg-slate-100 p-1 rounded-lg self-start">
              {(['DAILY', 'WEEKLY', 'MONTHLY'] as AggregationType[]).map(m => (
                <button key={m} onClick={() => setDdAggregation(m)} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${ddAggregation === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{m}</button>
              ))}
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ddChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={val => `${val}%`} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDetailView;
