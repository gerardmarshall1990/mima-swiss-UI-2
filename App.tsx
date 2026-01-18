
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  AlertCircle, 
  Settings, 
  Menu, 
  X, 
  TrendingUp, 
  DollarSign, 
  LogOut,
  WalletCards
} from 'lucide-react';
import SummaryDashboard from './views/SummaryDashboard';
import AccountsView from './views/AccountsView';
import AccountDetailView from './views/AccountDetailView';
import PayoutsView from './views/PayoutsView';

const SidebarItem: React.FC<{ 
  to: string; 
  icon: React.ReactNode; 
  label: string; 
  active: boolean;
  onClick?: () => void;
}> = ({ to, icon, label, active, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
        : 'text-slate-500 hover:bg-slate-100'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
);

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <HashRouter>
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        {/* Sidebar */}
        <aside 
          className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  M
                </div>
                <div>
                  <h1 className="text-lg font-bold leading-tight">MIMA SWISS</h1>
                  <p className="text-xs text-slate-400 font-semibold tracking-wider">FINTECH</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-2 text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 space-y-2 mt-4">
              <NavLinks onCloseMobile={() => setIsSidebarOpen(false)} />
            </nav>

            {/* Profile/Footer */}
            <div className="p-4 border-t border-slate-100">
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                  <img src="https://picsum.photos/seed/mako/100/100" alt="User" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">Operations Manager</p>
                  <p className="text-xs text-slate-400 truncate">Internal Dashboard</p>
                </div>
                <LogOut size={16} className="text-slate-400" />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Header */}
          <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 text-slate-500"
              >
                <Menu size={24} />
              </button>
              <h2 className="text-xl font-semibold text-slate-800 hidden sm:block">Operations Hub</h2>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full text-sm text-slate-600">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                System Live: MT4/MT5 Connected
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-600 relative">
                <AlertCircle size={22} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
            </div>
          </header>

          {/* View Container */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            <Routes>
              <Route path="/" element={<SummaryDashboard />} />
              <Route path="/accounts" element={<AccountsView />} />
              <Route path="/accounts/:id" element={<AccountDetailView />} />
              <Route path="/payouts" element={<PayoutsView />} />
              <Route path="/risk" element={<div className="p-8 text-center text-slate-400">Risk Monitoring Coming Soon</div>} />
              <Route path="/settings" element={<div className="p-8 text-center text-slate-400">Settings Coming Soon</div>} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

const NavLinks: React.FC<{ onCloseMobile: () => void }> = ({ onCloseMobile }) => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <>
      <SidebarItem 
        to="/" 
        icon={<LayoutDashboard size={20} />} 
        label="Summary" 
        active={path === '/'} 
        onClick={onCloseMobile}
      />
      <SidebarItem 
        to="/accounts" 
        icon={<Users size={20} />} 
        label="Managed Accounts" 
        active={path.startsWith('/accounts')} 
        onClick={onCloseMobile}
      />
      <SidebarItem 
        to="/payouts" 
        icon={<WalletCards size={20} />} 
        label="Payout Ledger" 
        active={path === '/payouts'} 
        onClick={onCloseMobile}
      />
      <SidebarItem 
        to="/risk" 
        icon={<AlertCircle size={20} />} 
        label="Risk Alerts" 
        active={path === '/risk'} 
        onClick={onCloseMobile}
      />
      <div className="pt-4 pb-2 px-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Admin</p>
      </div>
      <SidebarItem 
        to="/settings" 
        icon={<Settings size={20} />} 
        label="Settings" 
        active={path === '/settings'} 
        onClick={onCloseMobile}
      />
    </>
  );
};

export default App;
