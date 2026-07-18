import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import {
  Plus, TrendingUp, Eye, EyeOff, ArrowLeft, Download, ArrowUpRight,
  ArrowDownLeft, FileText, BarChart3, Activity, Clock, Layers,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';

const TRADING_CHARTS = [
  { symbol: 'AAPL', type: 'Stocks', name: 'Apple Inc.' },
  { symbol: 'TSLA', type: 'Stocks', name: 'Tesla Inc.' },
  { symbol: 'GOOGL', type: 'Stocks', name: 'Google (Alphabet)' },
  { symbol: 'MSFT', type: 'Stocks', name: 'Microsoft' },
  { symbol: 'AMZN', type: 'Stocks', name: 'Amazon' },
  { symbol: 'SPY', type: 'ETFs', name: 'S&P 500 ETF' },
];

const ASSET_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'etfs', label: 'ETFs' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'commodities', label: 'Commodities' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'news', label: 'Market News' },
];

const ALLOCATION_DATA = [
  { name: 'Stocks', value: 45, color: '#071C38' },
  { name: 'ETFs', value: 25, color: '#1F5EFF' },
  { name: 'Crypto', value: 15, color: '#C9A227' },
  { name: 'Commodities', value: 10, color: '#16A34A' },
  { name: 'Cash', value: 5, color: '#64748B' },
];

const PERFORMANCE_DATA = [
  { month: 'Jan', value: 4200 },
  { month: 'Feb', value: 4500 },
  { month: 'Mar', value: 4300 },
  { month: 'Apr', value: 4800 },
  { month: 'May', value: 5100 },
  { month: 'Jun', value: 5400 },
  { month: 'Jul', value: 5800 },
];

const WATCHLIST = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 178.45, change: 1.24 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 242.18, change: -2.15 },
  { symbol: 'GOOGL', name: 'Alphabet', price: 142.65, change: 0.87 },
  { symbol: 'MSFT', name: 'Microsoft', price: 378.91, change: 1.56 },
  { symbol: 'AMZN', name: 'Amazon', price: 145.32, change: -0.43 },
  { symbol: 'SPY', name: 'S&P 500 ETF', price: 456.78, change: 0.92 },
];

const MARKET_NEWS = [
  { title: 'Fed Signals Rate Cut in Q3', source: 'Market Wire', time: '2h ago' },
  { title: 'Tech Stocks Rally on Earnings', source: 'Bloomberg', time: '4h ago' },
  { title: 'Gold Hits New High Amid Uncertainty', source: 'Reuters', time: '6h ago' },
  { title: 'Crypto Market Stabilizes', source: 'CoinDesk', time: '8h ago' },
];

export default function Investments() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedChart, setSelectedChart] = useState(TRADING_CHARTS[0]);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ account_type: 'Forex', account_name: '', initial_balance: '' });
  const [creating, setCreating] = useState(false);
  const [detailAccount, setDetailAccount] = useState(null); // drill into an account
  const { toast } = useToast();

  useEffect(() => { loadAccounts(); }, []);

  async function loadAccounts() {
    try {
      const user = await base44.auth.me();
      const accts = await base44.entities.TradingAccount.filter({ user_id: user.id }, '-created_date', 10);
      setAccounts(accts);
      } catch (e) {
      console.error(e);
      toast({ title: 'Load failed', description: e.message || 'Unable to load trading accounts.', variant: 'destructive' });
      }
      setLoading(false);
  }

  async function createAccount() {
    if (!newAccount.account_name) return;
    setCreating(true);
    try {
      const user = await base44.auth.me();
      const accountNum = `TRD-${Date.now()}`;
      const account = await base44.entities.TradingAccount.create({
        user_id: user.id,
        account_number: accountNum,
        account_name: newAccount.account_name,
        account_type: newAccount.account_type,
        balance: parseFloat(newAccount.initial_balance) || 0,
        equity: parseFloat(newAccount.initial_balance) || 0,
        margin_available: (parseFloat(newAccount.initial_balance) || 0) * 20,
        status: 'active',
        leverage: 1,
      });
      await base44.entities.Notification.create({
        user_id: user.id,
        title: `${newAccount.account_type} Trading Account Created`,
        message: `Your ${newAccount.account_type} trading account has been activated. Account: ${accountNum}`,
        type: 'success',
      });
      setShowCreateAccount(false);
      setNewAccount({ account_type: 'Forex', account_name: '', initial_balance: '' });
      loadAccounts();
      toast({ title: 'Trading account created', description: `${newAccount.account_type} account activated successfully.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Create failed', description: e.message || 'Unable to create trading account.', variant: 'destructive' });
    }
    setCreating(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  // Drill into a specific investment account
  if (detailAccount) {
    return (
      <InvestmentAccountDetail
        account={detailAccount}
        onBack={() => setDetailAccount(null)}
      />
    );
  }

  const totalPortfolioValue = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  return (
    <div className="px-5 pt-6 pb-4">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-foreground">Investments</h1>
        <p className="text-gray text-sm mt-0.5">Portfolios, markets & trading</p>
      </div>

      {/* Portfolio Summary */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="vantoris-balance-hero p-5 mb-5"
      >
        <p className="text-white/60 text-xs uppercase tracking-wider">Total Portfolio Value</p>
        <p className="text-white text-3xl font-bold mt-1">{formatCurrency(totalPortfolioValue)}</p>
        <div className="flex items-center gap-4 mt-3">
          <div>
            <p className="text-white/50 text-[10px] uppercase tracking-wider">Day Change</p>
            <p className="text-mint text-sm font-semibold">+2.34%</p>
          </div>
          <div className="w-px h-8 bg-white/15" />
          <div>
            <p className="text-white/50 text-[10px] uppercase tracking-wider">Total Return</p>
            <p className="text-mint text-sm font-semibold">+12.8%</p>
          </div>
          <div className="w-px h-8 bg-white/15" />
          <div>
            <p className="text-white/50 text-[10px] uppercase tracking-wider">Accounts</p>
            <p className="text-white text-sm font-semibold">{accounts.length}</p>
          </div>
        </div>
      </motion.div>

      {/* Asset Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-5 px-5" style={{ scrollbarWidth: 'none' }}>
        {ASSET_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-brass text-white'
                : 'bg-white text-gray border border-border hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          accounts={accounts}
          onCreateAccount={() => setShowCreateAccount(true)}
          selectedChart={selectedChart}
          setSelectedChart={setSelectedChart}
          onSelectAccount={setDetailAccount}
        />
      )}

      {activeTab === 'portfolio' && (
        <PortfolioTab accounts={accounts} onCreateAccount={() => setShowCreateAccount(true)} />
      )}

      {activeTab === 'stocks' && <StocksTab />}
      {activeTab === 'etfs' && <ETFsTab />}
      {activeTab === 'crypto' && <CryptoTab />}
      {activeTab === 'commodities' && <CommoditiesTab />}
      {activeTab === 'news' && <NewsTab />}

      {/* Create Trading Account Dialog */}
      <Dialog open={showCreateAccount} onOpenChange={setShowCreateAccount}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <TrendingUp size={18} className="text-brass" />
              Create Trading Account
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-gray text-xs uppercase tracking-wider mb-2 block">Account Type</label>
              <select
                value={newAccount.account_type}
                onChange={e => setNewAccount({ ...newAccount, account_type: e.target.value })}
                className="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:border-brass/50 focus:outline-none"
              >
                <option value="Forex">Forex</option>
                <option value="Stocks">Stocks</option>
                <option value="Crypto">Crypto</option>
                <option value="Mixed">Mixed (All Asset Classes)</option>
              </select>
            </div>
            <div>
              <label className="text-gray text-xs uppercase tracking-wider mb-2 block">Account Name</label>
              <input
                type="text"
                value={newAccount.account_name}
                onChange={e => setNewAccount({ ...newAccount, account_name: e.target.value })}
                placeholder="e.g., My Growth Portfolio"
                className="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:border-brass/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-gray text-xs uppercase tracking-wider mb-2 block">Initial Balance (USD)</label>
              <input
                type="number"
                value={newAccount.initial_balance}
                onChange={e => setNewAccount({ ...newAccount, initial_balance: e.target.value })}
                placeholder="0.00"
                className="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:border-brass/50 focus:outline-none"
              />
            </div>
            <button
              disabled={creating}
              onClick={createAccount}
              className="w-full py-3 bg-brass text-white font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> {creating ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OverviewTab({ accounts, onCreateAccount, selectedChart, setSelectedChart, onSelectAccount }) {
  return (
    <>
      {/* Trading Accounts */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-foreground font-semibold text-sm">Investment Accounts</h2>
          <button
            onClick={onCreateAccount}
            className="flex items-center gap-1 px-3 py-1.5 bg-brass text-white rounded-lg text-xs font-semibold hover:bg-brass/90 transition-all"
          >
            <Plus size={12} /> New
          </button>
        </div>
        {accounts.length === 0 ? (
          <div className="vantoris-glass-premium p-6 text-center">
            <TrendingUp size={28} className="text-brass/40 mx-auto mb-2" />
            <p className="text-gray text-sm mb-3">No investment accounts yet</p>
            <button
              onClick={onCreateAccount}
              className="px-4 py-2 bg-brass/10 text-brass rounded-lg text-xs font-medium hover:bg-brass/20 transition-all"
            >
              Create First Account
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {accounts.map(account => (
              <button
                key={account.id}
                onClick={() => onSelectAccount(account)}
                className="vantoris-glass-premium p-4 text-left hover:border-brass/30 transition-all w-full"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-foreground font-semibold text-sm">{account.account_name}</p>
                    <p className="text-gray text-xs">{account.account_type} · {account.account_number}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${account.status === 'active' ? 'bg-emerald-500/10 text-mint' : 'bg-slate-100 text-gray'}`}>
                      {account.status}
                    </span>
                    <ArrowUpRight size={14} className="text-brass" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <p className="text-gray text-xs mb-1">Balance</p>
                    <p className="text-foreground font-semibold text-sm">{formatCurrency(account.balance)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <p className="text-gray text-xs mb-1">Equity / Margin</p>
                    <p className="text-foreground font-semibold text-sm">{formatCurrency(account.equity || account.margin_available)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Live Market Chart */}
      <div className="mb-5">
        <h2 className="text-foreground font-semibold text-sm mb-3">Live Market Charts</h2>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {TRADING_CHARTS.map(chart => (
            <button
              key={chart.symbol}
              onClick={() => setSelectedChart(chart)}
              className={`p-2 rounded-lg text-xs font-medium transition-all border ${
                selectedChart.symbol === chart.symbol
                  ? 'bg-brass text-white border-brass'
                  : 'bg-white text-gray border-border hover:border-brass/50'
              }`}
            >
              <p className="font-semibold">{chart.symbol}</p>
              <p className="text-[10px] opacity-70">{chart.type}</p>
            </button>
          ))}
        </div>
        <div className="vantoris-glass-premium overflow-hidden">
          <div className="bg-slate-50 p-3 border-b border-border/50">
            <p className="text-foreground font-semibold text-sm">{selectedChart.name} ({selectedChart.symbol})</p>
            <p className="text-gray text-xs">{selectedChart.type} · Live Market Data</p>
          </div>
          <div className="relative w-full h-72 bg-white">
            <iframe
              src={`https://s.tradingview.com/widgetembed/?frameElementId=tv_${selectedChart.symbol}&symbol=${selectedChart.symbol}&interval=D&timezone=Etc%2FUTC&theme=light&style=1&locale=en&hide_legend=false&withdateranges=true`}
              title={`${selectedChart.symbol} Chart`}
              className="w-full h-full border-0"
              allowFullScreen
            />
          </div>
        </div>
      </div>

      {/* Watchlist Preview */}
      <WatchlistPreview />
    </>
  );
}

function PortfolioTab({ accounts, onCreateAccount }) {
  return (
    <>
      {/* Allocation Chart */}
      <div className="vantoris-glass-premium p-4 mb-5">
        <h3 className="text-foreground font-semibold text-sm mb-3">Asset Allocation</h3>
        <div className="w-full h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ALLOCATION_DATA}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {ALLOCATION_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.98)',
                  border: '1px solid rgba(30,86,160,0.1)',
                  borderRadius: '10px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {ALLOCATION_DATA.map(item => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
              <span className="text-gray text-xs">{item.name}</span>
              <span className="text-foreground text-xs font-medium ml-auto">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Chart */}
      <div className="vantoris-glass-premium p-4 mb-5">
        <h3 className="text-foreground font-semibold text-sm mb-3">Performance (6 Months)</h3>
        <div className="w-full h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={PERFORMANCE_DATA}>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.98)',
                  border: '1px solid rgba(30,86,160,0.1)',
                  borderRadius: '10px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="value" fill="#071C38" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dividends & History */}
      <div className="vantoris-glass-premium p-4 mb-5">
        <h3 className="text-foreground font-semibold text-sm mb-3">Dividends & Distributions</h3>
        <div className="space-y-2">
          {[
            { name: 'AAPL Dividend', date: 'Jul 15', amount: 24.00 },
            { name: 'SPY Distribution', date: 'Jul 10', amount: 45.50 },
            { name: 'MSFT Dividend', date: 'Jul 05', amount: 18.75 },
          ].map((d, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <div>
                <p className="text-foreground text-sm font-medium">{d.name}</p>
                <p className="text-gray text-xs">{d.date}</p>
              </div>
              <p className="text-mint text-sm font-semibold">+{formatCurrency(d.amount)}</p>
            </div>
          ))}
        </div>
      </div>

      {accounts.length > 0 && (
        <div className="vantoris-glass-premium p-4">
          <h3 className="text-foreground font-semibold text-sm mb-3">Investment History</h3>
          <div className="space-y-2">
            {accounts.map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-foreground text-sm font-medium">{a.account_name}</p>
                  <p className="text-gray text-xs">{a.account_type}</p>
                </div>
                <p className="text-foreground text-sm font-semibold">{formatCurrency(a.balance)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function WatchlistPreview() {
  return (
    <div className="mb-5">
      <h2 className="text-foreground font-semibold text-sm mb-3">Watchlist</h2>
      <div className="vantoris-glass-premium overflow-hidden">
        {WATCHLIST.map((item, idx) => (
          <div key={item.symbol} className={`flex items-center justify-between p-3 ${idx > 0 ? 'border-t border-border/50' : ''}`}>
            <div>
              <p className="text-foreground font-semibold text-sm">{item.symbol}</p>
              <p className="text-gray text-xs">{item.name}</p>
            </div>
            <div className="text-right">
              <p className="text-foreground font-medium text-sm">${item.price.toFixed(2)}</p>
              <p className={`text-xs font-medium ${item.change >= 0 ? 'text-mint' : 'text-crimson'}`}>
                {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StocksTab() {
  return <WatchlistPreview />;
}

const ETF_LIST = [
  { symbol: 'SPY',  name: 'S&P 500 ETF Trust',          price: 456.78, change: 0.92,  expense: 0.09 },
  { symbol: 'QQQ',  name: 'Invesco Nasdaq-100 ETF',      price: 382.15, change: 1.14,  expense: 0.20 },
  { symbol: 'VTI',  name: 'Vanguard Total Market ETF',   price: 228.40, change: 0.73,  expense: 0.03 },
  { symbol: 'IWM',  name: 'iShares Russell 2000 ETF',    price: 198.65, change: -0.55, expense: 0.19 },
  { symbol: 'GLD',  name: 'SPDR Gold Shares ETF',        price: 193.20, change: 0.44,  expense: 0.40 },
  { symbol: 'AGG',  name: 'iShares Core US Aggregate',   price: 97.80,  change: 0.12,  expense: 0.03 },
  { symbol: 'VNQ',  name: 'Vanguard Real Estate ETF',    price: 82.45,  change: -0.28, expense: 0.12 },
  { symbol: 'ARKK', name: 'ARK Innovation ETF',          price: 54.30,  change: 2.35,  expense: 0.75 },
];

function ETFsTab() {
  const [selectedETF, setSelectedETF] = useState(null);

  return (
    <div className="mb-5">
      <h2 className="text-foreground font-semibold text-sm mb-3">ETF Marketplace</h2>
      <p className="text-gray text-xs mb-3">Market data refreshed daily. Contact your advisor to add ETF positions to your portfolio.</p>
      <div className="vantoris-glass-premium overflow-hidden">
        {ETF_LIST.map((etf, idx) => (
          <button
            key={etf.symbol}
            onClick={() => setSelectedETF(selectedETF?.symbol === etf.symbol ? null : etf)}
            className={`w-full flex items-center p-3.5 text-left transition-colors ${idx > 0 ? 'border-t border-border/50' : ''} ${selectedETF?.symbol === etf.symbol ? 'bg-brass/5' : 'hover:bg-slate-50'}`}
          >
            <div className="w-9 h-9 rounded-full bg-brass/10 flex items-center justify-center mr-3 flex-shrink-0">
              <span className="text-brass text-[10px] font-bold">{etf.symbol.slice(0, 3)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-semibold text-sm">{etf.symbol}</p>
              <p className="text-gray text-xs truncate">{etf.name} · {etf.expense}% exp</p>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <p className="text-foreground font-medium text-sm">${etf.price.toFixed(2)}</p>
              <p className={`text-xs font-medium ${etf.change >= 0 ? 'text-mint' : 'text-crimson'}`}>
                {etf.change >= 0 ? '+' : ''}{etf.change.toFixed(2)}%
              </p>
            </div>
          </button>
        ))}
      </div>
      {selectedETF && (
        <div className="mt-3 vantoris-glass-premium p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-foreground font-bold">{selectedETF.symbol}</p>
              <p className="text-gray text-xs">{selectedETF.name}</p>
            </div>
            <p className="text-foreground font-bold text-lg">${selectedETF.price.toFixed(2)}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-slate-50 rounded-lg p-2.5">
              <p className="text-gray text-xs mb-1">Expense Ratio</p>
              <p className="text-foreground font-semibold text-sm">{selectedETF.expense}%</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2.5">
              <p className="text-gray text-xs mb-1">1-Day Change</p>
              <p className={`font-semibold text-sm ${selectedETF.change >= 0 ? 'text-mint' : 'text-crimson'}`}>
                {selectedETF.change >= 0 ? '+' : ''}{selectedETF.change.toFixed(2)}%
              </p>
            </div>
          </div>
          <div className="relative w-full h-44 bg-white rounded-xl overflow-hidden">
            <iframe
              src={`https://s.tradingview.com/widgetembed/?frameElementId=tv_etf_${selectedETF.symbol}&symbol=${selectedETF.symbol}&interval=W&timezone=Etc%2FUTC&theme=light&style=1&locale=en&hide_legend=false`}
              title={`${selectedETF.symbol} Chart`}
              className="w-full h-full border-0"
              allowFullScreen
            />
          </div>
          <button className="mt-3 w-full py-2.5 bg-brass/10 text-brass font-semibold rounded-xl text-sm hover:bg-brass/20 transition-all">
            Request Investment Access
          </button>
        </div>
      )}
    </div>
  );
}

function CryptoTab() {
  const cryptos = [
    { symbol: 'BTC', name: 'Bitcoin', price: 43250.00, change: 2.34 },
    { symbol: 'ETH', name: 'Ethereum', price: 2280.50, change: -1.12 },
    { symbol: 'SOL', name: 'Solana', price: 98.45, change: 5.67 },
    { symbol: 'ADA', name: 'Cardano', price: 0.52, change: 1.23 },
  ];
  return (
    <div className="mb-5">
      <h2 className="text-foreground font-semibold text-sm mb-3">Crypto Assets</h2>
      <div className="vantoris-glass-premium overflow-hidden">
        {cryptos.map((c, idx) => (
          <div key={c.symbol} className={`flex items-center justify-between p-3.5 ${idx > 0 ? 'border-t border-border/50' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brass/10 flex items-center justify-center">
                <span className="text-brass text-xs font-bold">{c.symbol.slice(0, 2)}</span>
              </div>
              <div>
                <p className="text-foreground font-semibold text-sm">{c.symbol}</p>
                <p className="text-gray text-xs">{c.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-foreground font-medium text-sm">${c.price.toLocaleString()}</p>
              <p className={`text-xs font-medium ${c.change >= 0 ? 'text-mint' : 'text-crimson'}`}>
                {c.change >= 0 ? '+' : ''}{c.change.toFixed(2)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommoditiesTab() {
  const commodities = [
    { name: 'Gold', price: 2045.30, change: 0.87 },
    { name: 'Silver', price: 24.15, change: -0.32 },
    { name: 'Oil (WTI)', price: 78.45, change: 1.45 },
    { name: 'Natural Gas', price: 2.34, change: -1.23 },
  ];
  return (
    <div className="mb-5">
      <h2 className="text-foreground font-semibold text-sm mb-3">Commodities</h2>
      <div className="vantoris-glass-premium overflow-hidden">
        {commodities.map((c, idx) => (
          <div key={c.name} className={`flex items-center justify-between p-3.5 ${idx > 0 ? 'border-t border-border/50' : ''}`}>
            <div>
              <p className="text-foreground font-semibold text-sm">{c.name}</p>
            </div>
            <div className="text-right">
              <p className="text-foreground font-medium text-sm">${c.price.toFixed(2)}</p>
              <p className={`text-xs font-medium ${c.change >= 0 ? 'text-mint' : 'text-crimson'}`}>
                {c.change >= 0 ? '+' : ''}{c.change.toFixed(2)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsTab() {
  return (
    <div className="mb-5">
      <h2 className="text-foreground font-semibold text-sm mb-3">Market News</h2>
      <div className="vantoris-glass-premium overflow-hidden">
        {MARKET_NEWS.map((n, idx) => (
          <div key={idx} className={`p-3.5 ${idx > 0 ? 'border-t border-border/50' : ''}`}>
            <p className="text-foreground font-medium text-sm">{n.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-brass text-xs font-medium">{n.source}</span>
              <span className="text-gray text-xs">· {n.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Investment Account Detail — full sub-page
// ─────────────────────────────────────────────
const ACCOUNT_DETAIL_TABS = [
  { id: 'overview', label: 'Overview', icon: TrendingUp },
  { id: 'transactions', label: 'Transactions', icon: Activity },
  { id: 'performance', label: 'Performance', icon: BarChart3 },
  { id: 'portfolio', label: 'Portfolio', icon: Layers },
  { id: 'orders', label: 'Orders', icon: Clock },
  { id: 'statements', label: 'Statements', icon: FileText },
  { id: 'documents', label: 'Documents', icon: Download },
];

function InvestmentAccountDetail({ account, onBack }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFund, setShowFund] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDetail();
  }, [account.id]);

  async function loadDetail() {
    setLoading(true);
    try {
      const [txns, docs] = await Promise.all([
        base44.entities.Transaction.filter({ account_id: account.id }, '-created_date', 50).catch(() => []),
        base44.entities.Document.filter({ account_id: account.id }).catch(() => []),
      ]);
      setTransactions(txns || []);
      setDocuments(docs || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function fundAccount() {
    const amt = parseFloat(fundAmount);
    if (!amt || amt <= 0) return;
    setSubmitting(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.WithdrawalRequest.create({
        account_id: account.id,
        user_id: user.id,
        amount: amt,
        method: 'Internal Transfer',
        notes: `Funding investment account: ${account.account_name}`,
        status: 'pending',
        type: 'investment_funding',
      });
      await base44.entities.Notification.create({
        user_id: user.id,
        title: 'Investment Funding Requested',
        message: `Your request to fund ${account.account_name} with ${formatCurrency(amt)} is pending review.`,
        type: 'info',
      });
      toast({ title: 'Funding request submitted', description: 'Your request is pending approval.' });
      setShowFund(false);
      setFundAmount('');
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
    setSubmitting(false);
  }

  async function withdrawAccount() {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) return;
    setSubmitting(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.WithdrawalRequest.create({
        account_id: account.id,
        user_id: user.id,
        amount: amt,
        method: 'ACH Transfer',
        notes: `Withdrawal from investment account: ${account.account_name}`,
        status: 'pending',
        type: 'investment_withdrawal',
      });
      toast({ title: 'Withdrawal request submitted', description: 'Your request is pending approval.' });
      setShowWithdraw(false);
      setWithdrawAmount('');
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
    setSubmitting(false);
  }

  return (
    <div className="px-5 pt-4 pb-6">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-gray text-sm mb-5">
        <ArrowLeft size={17} /> Back to Investments
      </button>

      {/* Account Hero */}
      <div className="vantoris-balance-hero p-5 mb-5">
        <p className="text-white/60 text-xs uppercase tracking-wider">{account.account_type} Account</p>
        <p className="text-white font-bold text-2xl mt-1">{formatCurrency(account.balance)}</p>
        <p className="text-white/50 text-xs mt-0.5">{account.account_number}</p>
        <div className="flex items-center gap-4 mt-3">
          <div>
            <p className="text-white/50 text-[10px] uppercase tracking-wider">Equity</p>
            <p className="text-white text-sm font-semibold">{formatCurrency(account.equity || account.balance)}</p>
          </div>
          <div className="w-px h-8 bg-white/15" />
          <div>
            <p className="text-white/50 text-[10px] uppercase tracking-wider">Margin</p>
            <p className="text-white text-sm font-semibold">{formatCurrency(account.margin_available || 0)}</p>
          </div>
          <div className="w-px h-8 bg-white/15" />
          <div>
            <p className="text-white/50 text-[10px] uppercase tracking-wider">Status</p>
            <p className={`text-sm font-semibold ${account.status === 'active' ? 'text-mint' : 'text-amber-400'}`}>
              {account.status}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button onClick={() => setShowFund(true)} className="py-2.5 bg-mint/10 text-mint font-semibold rounded-xl text-sm hover:bg-mint/20 transition flex items-center justify-center gap-2">
          <ArrowDownLeft size={15} /> Fund Account
        </button>
        <button onClick={() => setShowWithdraw(true)} className="py-2.5 bg-brass/10 text-brass font-semibold rounded-xl text-sm hover:bg-brass/20 transition flex items-center justify-center gap-2">
          <ArrowUpRight size={15} /> Withdraw
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-5 px-5" style={{ scrollbarWidth: 'none' }}>
        {ACCOUNT_DETAIL_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id ? 'bg-brass text-white' : 'bg-white text-gray border border-border hover:text-foreground'
              }`}
            >
              <Icon size={12} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <h3 className="text-foreground font-semibold text-sm mb-3">Account Details</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Account Name', value: account.account_name },
                { label: 'Account Type', value: account.account_type },
                { label: 'Account Number', value: account.account_number },
                { label: 'Leverage', value: account.leverage ? `${account.leverage}:1` : '1:1' },
                { label: 'Opened', value: account.created_date ? new Date(account.created_date).toLocaleDateString() : '—' },
                { label: 'Currency', value: account.currency || 'USD' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-gray text-[10px] uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="text-foreground text-sm font-medium">{value || '—'}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-foreground font-semibold text-sm">Recent Activity</h3>
            </div>
            {loading ? (
              <div className="p-6 text-center"><div className="w-6 h-6 border-2 border-brass/30 border-t-brass rounded-full animate-spin mx-auto" /></div>
            ) : transactions.slice(0, 5).length === 0 ? (
              <div className="p-6 text-center text-gray text-sm">No transactions yet</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {transactions.slice(0, 5).map(txn => (
                  <TransactionRow key={txn.id} txn={txn} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-foreground font-semibold text-sm">All Transactions</h3>
          </div>
          {loading ? (
            <div className="p-6 text-center"><div className="w-6 h-6 border-2 border-brass/30 border-t-brass rounded-full animate-spin mx-auto" /></div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center">
              <Activity size={24} className="text-gray/30 mx-auto mb-2" />
              <p className="text-gray text-sm">No transactions on this account yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map(txn => <TransactionRow key={txn.id} txn={txn} />)}
            </div>
          )}
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <h3 className="text-foreground font-semibold text-sm mb-3">Performance Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Account Balance', value: formatCurrency(account.balance), positive: true },
                { label: 'Equity', value: formatCurrency(account.equity || account.balance), positive: true },
                { label: 'Unrealized P&L', value: formatCurrency((account.equity || 0) - (account.balance || 0)), positive: (account.equity || 0) >= (account.balance || 0) },
                { label: 'Margin Used', value: formatCurrency((account.margin_available || 0) - (account.balance || 0) * 20), positive: false },
              ].map(({ label, value, positive }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-gray text-[10px] uppercase tracking-wider mb-1">{label}</p>
                  <p className={`text-sm font-bold ${positive ? 'text-mint' : 'text-foreground'}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <h3 className="text-foreground font-semibold text-sm mb-3">Portfolio Performance</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={PERFORMANCE_DATA}>
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(30,86,160,0.1)', borderRadius: '10px', fontSize: '12px' }} />
                  <Bar dataKey="value" fill="#071C38" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'portfolio' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <h3 className="text-foreground font-semibold text-sm mb-3">Portfolio Allocation</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ALLOCATION_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {ALLOCATION_DATA.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(30,86,160,0.1)', borderRadius: '10px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {ALLOCATION_DATA.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-gray text-xs">{item.name}</span>
                  <span className="text-foreground text-xs font-medium ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
          <Clock size={24} className="text-gray/30 mx-auto mb-2" />
          <p className="text-foreground font-medium text-sm mb-1">No Open Orders</p>
          <p className="text-gray text-xs">Your active trade orders will appear here.</p>
        </div>
      )}

      {activeTab === 'statements' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
          <FileText size={24} className="text-gray/30 mx-auto mb-2" />
          <p className="text-foreground font-medium text-sm mb-1">Statements</p>
          <p className="text-gray text-xs mb-4">Download your investment account statements.</p>
          <button className="px-5 py-2.5 bg-brass text-white rounded-xl text-sm font-semibold hover:bg-brass/90 transition-all flex items-center gap-2 mx-auto">
            <Download size={14} /> Request Statement
          </button>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
              <div className="w-6 h-6 border-2 border-brass/30 border-t-brass rounded-full animate-spin mx-auto" />
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
              <Download size={24} className="text-gray/30 mx-auto mb-2" />
              <p className="text-foreground font-medium text-sm mb-1">No Documents</p>
              <p className="text-gray text-xs">Account documents and tax forms will appear here.</p>
            </div>
          ) : (
            documents.map(doc => (
              <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                <FileText size={18} className="text-brass flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-medium truncate">{doc.title}</p>
                  <p className="text-gray text-xs">{doc.type} · {new Date(doc.created_date).toLocaleDateString()}</p>
                </div>
                {doc.file_url && (
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" download className="p-2 bg-brass/10 rounded-lg hover:bg-brass/20 transition">
                    <Download size={14} className="text-brass" />
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Fund Dialog */}
      <Dialog open={showFund} onOpenChange={setShowFund}>
        <DialogContent className="bg-white max-w-sm">
          <DialogHeader><DialogTitle className="text-foreground">Fund Account</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-gray text-sm">Add funds to <strong>{account.account_name}</strong>. The transfer will be reviewed and applied within 1-2 business days.</p>
            <div>
              <label className="text-gray text-xs uppercase tracking-wider mb-1.5 block">Amount (USD)</label>
              <input type="number" value={fundAmount} onChange={e => setFundAmount(e.target.value)} placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-foreground text-sm focus:border-brass/50 focus:outline-none" />
            </div>
            <button onClick={fundAccount} disabled={submitting || !fundAmount} className="w-full py-3 bg-mint text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-mint/90 transition">
              {submitting ? 'Submitting…' : 'Submit Funding Request'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent className="bg-white max-w-sm">
          <DialogHeader><DialogTitle className="text-foreground">Withdraw from Account</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-gray text-sm">Withdraw funds from <strong>{account.account_name}</strong>. Processing takes 1-3 business days.</p>
            <div>
              <label className="text-gray text-xs uppercase tracking-wider mb-1.5 block">Amount (USD)</label>
              <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-foreground text-sm focus:border-brass/50 focus:outline-none" />
            </div>
            <button onClick={withdrawAccount} disabled={submitting || !withdrawAmount} className="w-full py-3 bg-brass text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-brass/90 transition">
              {submitting ? 'Submitting…' : 'Submit Withdrawal Request'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TransactionRow({ txn }) {
  const isCredit = (txn.amount || 0) >= 0;
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isCredit ? 'bg-mint/10' : 'bg-crimson/10'}`}>
          {isCredit ? <ArrowDownLeft size={14} className="text-mint" /> : <ArrowUpRight size={14} className="text-crimson" />}
        </div>
        <div>
          <p className="text-foreground text-sm font-medium">{txn.description || txn.type}</p>
          <p className="text-gray text-[11px]">
            {new Date(txn.transaction_date || txn.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
      <p className={`text-sm font-semibold ${isCredit ? 'text-mint' : 'text-crimson'}`}>
        {isCredit ? '+' : '-'}{formatCurrency(Math.abs(txn.amount || 0))}
      </p>
    </div>
  );
}