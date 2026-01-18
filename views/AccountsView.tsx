
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, ChevronRight, Download, Activity, ExternalLink, Zap, Server } from 'lucide-react';
import { MOCK_ACCOUNTS } from '../mockData';

const AccountsView: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'balance', direction: 'desc' });

  const enhancedAccounts = useMemo(() => {
    return MOCK_ACCOUNTS.map(acc => {
      // Calculate historical Max Drawdown from snapshots for realism
      const maxDD = acc.snapshots.length > 0 
        ? Math.max(...acc.snapshots.map(s => s.drawdownPercent), acc.currentDDPercent)
        : acc.currentDDPercent;
      
      return {
        ...acc,
        maxDD
      };
    });
  }, []);

  const filteredAccounts = useMemo(() => {
    let result = enhancedAccounts.filter(acc => 
      acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.accountNumber.includes(searchTerm) ||
      acc.broker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.vpsName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = (a as any)[sortConfig.key];
        const bValue = (b as any)[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [searchTerm, sortConfig, enhancedAccounts]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Managed Portfolio</h1>
          <p className="text-slate-500">Real-time operational monitoring with volume and risk segregation</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors shadow-sm">
            <Download size={16} />
            Export Portfolio
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Controls */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search by client, account, broker or VPS..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
            <Filter size={18} /> Filters
          </button>
        </div>

        {/* Operational Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1600px]">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th onClick={() => requestSort('name')} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-blue-600">
                  <div className="flex items-center gap-2">Client & Account <ArrowUpDown size={14} /></div>
                </th>
                <th onClick={() => requestSort('balance')} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 text-right">
                  <div className="flex items-center justify-end gap-2">Balance <ArrowUpDown size={14} /></div>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Equity</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Profit Share</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Rebate Rate</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Buy Lots</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Sell Lots</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Live PnL</th>
                <th onClick={() => requestSort('currentDDPercent')} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right cursor-pointer hover:text-blue-600">
                  <div className="flex items-center justify-end gap-2">Current DD <ArrowUpDown size={14} /></div>
                </th>
                <th onClick={() => requestSort('maxDD')} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right cursor-pointer hover:text-blue-600">
                  <div className="flex items-center justify-end gap-2">Max DD <ArrowUpDown size={14} /></div>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">VPS Node</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAccounts.map((acc) => (
                <tr 
                  key={acc.id} 
                  onClick={() => navigate(`/accounts/${acc.id}`)}
                  className="hover:bg-slate-50/50 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-bold text-slate-900 leading-tight mb-0.5">{acc.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{acc.accountNumber} • {acc.broker}</div>
                      <div className="text-[9px] text-blue-500 font-bold uppercase mt-1">
                        {acc.platform} • {acc.server}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">
                    ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-600">
                    ${acc.equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-bold text-indigo-600">{acc.payoutStructure.pnlSharePercent}%</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase">{acc.payoutStructure.frequency}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-bold text-orange-600">${acc.payoutStructure.rebatePerLot.toFixed(2)}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Per Lot</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-bold text-emerald-600">{acc.buyLotsTotal.toFixed(2)}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase">{acc.buyPositionsCount} Pos</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-bold text-rose-500">{acc.sellLotsTotal.toFixed(2)}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase">{acc.sellPositionsCount} Pos</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className={`text-sm font-bold ${acc.livePnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {acc.livePnL >= 0 ? '+' : ''}${acc.livePnL.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className={`text-sm font-bold ${acc.currentDDPercent > 10 ? 'text-rose-600' : acc.currentDDPercent > 5 ? 'text-amber-500' : 'text-slate-600'}`}>
                      {acc.currentDDPercent.toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg inline-block">
                      {acc.maxDD.toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-slate-500 uppercase">
                      <Server size={12} className="text-slate-300" />
                      {acc.vpsName}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      acc.status === 'Connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {acc.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300 group-hover:text-blue-500 transition-colors">
                    <ChevronRight size={18} />
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

export default AccountsView;
