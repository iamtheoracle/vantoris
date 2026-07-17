import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { getMemberDisplayName } from '@/lib/memberName';
import {
  MessageSquare, Plus, Zap, Clock, Briefcase,
  DollarSign, FileText, Users, AlertCircle, ChevronRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

export default function AIAssistantHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const [accts, convs] = await Promise.all([
          base44.entities.Account.filter({ user_id: me.id }).catch(() => []),
          base44.entities.MessageThread.filter({ user_id: me.id }, '-created_date', 5).catch(() => []),
        ]);
        setAccounts(accts);
        setThreads(convs);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    loadData();
  }, []);

  const displayName = getMemberDisplayName(user);
  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  const suggestedActions = [
    { label: 'View Accounts', icon: DollarSign, action: () => navigate('/accounts') },
    { label: 'Generate Statement', icon: FileText, action: () => navigate('/advisor?action=statement') },
    { label: 'Move Money', icon: Briefcase, action: () => navigate('/move-money') },
    { label: 'Continue KYC', icon: AlertCircle, action: () => navigate('/apply/kyc') },
    { label: 'My Documents', icon: FileText, action: () => navigate('/documents') },
    { label: 'Contact Support', icon: Users, action: () => navigate('/messages') },
  ];

  const smartPrompts = [
    'What is my current balance?',
    'Show my recent transactions',
    'Generate my latest statement',
    'Explain my portfolio',
    'How do I transfer money?',
    'Where is my KYC status?',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0E1A2B]">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1A2B] text-white">
      {/* Header */}
      <div className="border-b border-[#242D38] sticky top-0 z-20 bg-[#0E1A2B]/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 safe-top">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <MessageSquare size={26} className="text-brass" />
                VANTORIS Guide
              </h1>
              <p className="text-[#AAB4C3] text-xs mt-0.5">AI Banking Assistant</p>
            </div>
            <button
              onClick={() => navigate('/advisor')}
              className="flex items-center gap-2 px-4 py-2.5 bg-brass text-[#0E1A2B] font-semibold rounded-xl hover:bg-brass/90 transition-all"
            >
              <Plus size={16} />
              New Chat
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Welcome card */}
        <div className="bg-gradient-to-br from-brass/10 to-transparent border border-brass/20 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-1">Welcome back, {displayName}</h2>
          <p className="text-[#AAB4C3] text-sm mb-5">
            I'm your VANTORIS AI assistant. Ask me about your accounts, transactions, investments, or anything else.
          </p>
          {accounts.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#242D38]/60 rounded-lg p-3 border border-[#242D38]">
                <p className="text-[#AAB4C3] mb-1">Total Balance</p>
                <p className="font-bold text-white text-base">{formatCurrency(totalBalance)}</p>
              </div>
              <div className="bg-[#242D38]/60 rounded-lg p-3 border border-[#242D38]">
                <p className="text-[#AAB4C3] mb-1">Accounts</p>
                <p className="font-bold text-white text-base">{accounts.length}</p>
              </div>
              <div className="bg-[#242D38]/60 rounded-lg p-3 border border-[#242D38] col-span-2 md:col-span-1">
                <p className="text-[#AAB4C3] mb-1">AI Status</p>
                <p className="font-bold text-emerald-400 text-base">Ready</p>
              </div>
            </div>
          )}
        </div>

        {/* Smart Prompts */}
        <div>
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Zap size={18} className="text-brass" />
            Suggested Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {smartPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => navigate(`/advisor?prompt=${encodeURIComponent(prompt)}`)}
                className="text-left px-4 py-3 bg-[#242D38] hover:bg-[#2a3340] border border-[#242D38] hover:border-brass/30 rounded-xl transition-all text-sm text-[#AAB4C3] hover:text-white flex items-center justify-between gap-2"
              >
                <span>{prompt}</span>
                <ChevronRight size={14} className="flex-shrink-0 opacity-40" />
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Briefcase size={18} className="text-brass" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {suggestedActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  onClick={action.action}
                  className="p-4 bg-[#242D38] hover:bg-[#2a3340] border border-[#242D38] hover:border-brass/30 rounded-xl transition-all text-center"
                >
                  <Icon size={22} className="text-brass mx-auto mb-2" />
                  <p className="text-white text-xs font-medium">{action.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Conversations */}
        <div>
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Clock size={18} className="text-brass" />
            Recent Conversations
          </h3>
          {threads.length === 0 ? (
            <div className="bg-[#242D38]/30 border border-[#242D38] rounded-xl p-8 text-center">
              <MessageSquare size={28} className="text-[#AAB4C3]/40 mx-auto mb-3" />
              <p className="text-[#AAB4C3] text-sm">No conversations yet</p>
              <button
                onClick={() => navigate('/advisor')}
                className="mt-3 text-brass text-xs font-semibold hover:underline"
              >
                Start your first conversation →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {threads.map(thread => (
                <button
                  key={thread.id}
                  onClick={() => navigate(`/advisor?thread=${thread.id}`)}
                  className="w-full text-left px-4 py-3 bg-[#242D38]/50 hover:bg-[#242D38] border border-[#242D38] hover:border-brass/20 rounded-xl transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-brass/15 flex items-center justify-center flex-shrink-0">
                      <MessageSquare size={14} className="text-brass" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {thread.subject || thread.channel || 'Conversation'}
                      </p>
                      <p className="text-[#AAB4C3] text-xs">
                        {thread.created_date ? new Date(thread.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-[#AAB4C3]/40 flex-shrink-0" />
                </button>
              ))}
              <button
                onClick={() => navigate('/messages')}
                className="w-full text-center text-brass text-xs font-semibold py-2 hover:underline"
              >
                View all messages →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
