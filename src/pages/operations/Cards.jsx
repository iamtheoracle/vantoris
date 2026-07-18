import React, { useState, useEffect } from 'react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { base44 } from '@/api/base44Client';
import { logAuditEntry } from '@/lib/auditLogger';
import { useToast } from '@/components/ui/use-toast';
import { getMemberDisplayName } from '@/lib/memberName';
import {
  CreditCard, Search, Snowflake, Zap, Lock, Unlock, AlertCircle,
  RefreshCw, Eye, EyeOff, Plus, ChevronDown, ChevronUp, User,
  Check, X, Filter,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const STATUS_COLORS = {
  active: 'text-emerald-400 bg-emerald-400/10',
  frozen: 'text-blue-400 bg-blue-400/10',
  locked: 'text-amber-400 bg-amber-400/10',
  reported_lost: 'text-red-400 bg-red-400/10',
  cancelled: 'text-gray-400 bg-gray-400/10',
};

export default function Cards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCard, setSelectedCard] = useState(null);
  const [showIssue, setShowIssue] = useState(false);
  const { toast } = useToast();

  useEffect(() => { loadCards(); }, []);

  async function loadCards() {
    setLoading(true);
    try {
      const cardList = await base44.entities.Card?.filter({}, '-created_date', 200).catch(() => []);
      setCards(cardList || []);
    } catch (e) {
      console.error(e);
      toast({ title: 'Load failed', description: e.message, variant: 'destructive' });
    }
    setLoading(false);
  }

  async function updateCardStatus(cardId, status, card) {
    try {
      await base44.entities.Card.update(cardId, { status });
      await logAuditEntry({
        action_type: 'card_status_change',
        description: `Card ${card.card_number?.slice(-4) || cardId} status changed to ${status}`,
        target_user_id: card.user_id,
      });
      toast({ title: 'Card updated', description: `Status set to ${status}.` });
      loadCards();
      setSelectedCard(null);
    } catch (e) {
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' });
    }
  }

  const filtered = cards.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchQuery = !q || (
      (c.card_name || '').toLowerCase().includes(q) ||
      (c.holder_name || '').toLowerCase().includes(q) ||
      (c.card_number || '').includes(q) ||
      (c.last_four || '').includes(q)
    );
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchQuery && matchStatus;
  });

  const statusCounts = cards.reduce((acc, c) => {
    acc[c.status || 'active'] = (acc[c.status || 'active'] || 0) + 1;
    return acc;
  }, {});

  return (
    <OperationsPageLayout title="Cards" description="Member debit and virtual card management" icon={CreditCard}>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
        {[
          { label: 'Total Cards', value: cards.length, color: 'text-white' },
          { label: 'Active', value: statusCounts.active || 0, color: 'text-emerald-400' },
          { label: 'Frozen', value: statusCounts.frozen || 0, color: 'text-blue-400' },
          { label: 'Lost / Cancelled', value: (statusCounts.reported_lost || 0) + (statusCounts.cancelled || 0), color: 'text-red-400' },
        ].map(stat => (
          <div key={stat.label} className="vantoris-card p-4">
            <p className="text-[#AAB4C3] text-xs mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="vantoris-card p-4 mb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AAB4C3]" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, card number…"
              className="w-full bg-[#1a2332] border border-[#242D38] rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder:text-[#AAB4C3]/50 focus:border-brass/50 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'active', 'frozen', 'locked', 'reported_lost'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === s ? 'bg-brass text-white' : 'bg-[#1a2332] text-[#AAB4C3] border border-[#242D38] hover:border-brass/30'
                }`}
              >
                {s === 'all' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowIssue(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brass text-white rounded-xl text-sm font-semibold hover:bg-brass/90 transition-all flex-shrink-0"
          >
            <Plus size={15} /> Issue Card
          </button>
        </div>
      </div>

      {/* Cards Table */}
      {loading ? (
        <div className="vantoris-card p-12 text-center">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#AAB4C3] text-sm">Loading cards…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="vantoris-card p-12 text-center">
          <CreditCard size={32} className="text-[#AAB4C3] mx-auto mb-3 opacity-40" />
          <p className="text-white font-medium mb-1">{cards.length === 0 ? 'No cards issued yet' : 'No matching cards'}</p>
          <p className="text-[#AAB4C3] text-sm mb-4">
            {cards.length === 0
              ? 'Cards issued to members will appear here once the Card entity is populated.'
              : 'Try adjusting your search or filter.'}
          </p>
          {cards.length === 0 && (
            <button
              onClick={() => setShowIssue(true)}
              className="px-5 py-2.5 bg-brass text-white rounded-xl text-sm font-semibold hover:bg-brass/90 transition-all"
            >
              Issue First Card
            </button>
          )}
        </div>
      ) : (
        <div className="vantoris-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#242D38]">
                  {['Card Holder', 'Card Number', 'Type', 'Account', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[#AAB4C3] text-xs uppercase tracking-wider font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242D38]/50">
                {filtered.map(card => (
                  <tr key={card.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-brass/15 flex items-center justify-center flex-shrink-0">
                          <User size={14} className="text-brass" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{card.card_name || card.holder_name || '—'}</p>
                          <p className="text-[#AAB4C3] text-[10px]">ID: {card.user_id?.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-white font-mono text-sm">
                        •••• •••• •••• {card.last_four || card.card_number?.slice(-4) || '••••'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 bg-brass/10 text-brass rounded text-xs font-medium">
                        {card.card_type || 'Debit'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[#AAB4C3] text-sm">
                      {card.account_id ? `••••${card.account_id.slice(-4)}` : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${STATUS_COLORS[card.status] || STATUS_COLORS.active}`}>
                        {(card.status || 'active').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {card.status !== 'frozen' ? (
                          <button onClick={() => updateCardStatus(card.id, 'frozen', card)} title="Freeze" className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition">
                            <Snowflake size={13} />
                          </button>
                        ) : (
                          <button onClick={() => updateCardStatus(card.id, 'active', card)} title="Unfreeze" className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition">
                            <Zap size={13} />
                          </button>
                        )}
                        {card.status !== 'locked' ? (
                          <button onClick={() => updateCardStatus(card.id, 'locked', card)} title="Lock" className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition">
                            <Lock size={13} />
                          </button>
                        ) : (
                          <button onClick={() => updateCardStatus(card.id, 'active', card)} title="Unlock" className="p-1.5 rounded-lg bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 transition">
                            <Unlock size={13} />
                          </button>
                        )}
                        <button onClick={() => setSelectedCard(card)} title="View" className="p-1.5 rounded-lg bg-brass/10 text-brass hover:bg-brass/20 transition">
                          <Eye size={13} />
                        </button>
                        {card.status !== 'reported_lost' && (
                          <button onClick={() => updateCardStatus(card.id, 'reported_lost', card)} title="Report Lost" className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition">
                            <AlertCircle size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Card Detail Dialog */}
      {selectedCard && (
        <Dialog open onOpenChange={() => setSelectedCard(null)}>
          <DialogContent className="bg-[#0E1A2B] border border-[#242D38] max-w-md text-white">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <CreditCard size={18} className="text-brass" />
                Card Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="bg-gradient-to-br from-navy to-navy/80 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">VANTORIS</p>
                    <p className="text-white/40 text-[10px]">{selectedCard.card_type || 'Debit'}</p>
                  </div>
                  <CreditCard size={20} className="text-white/40" />
                </div>
                <p className="font-mono text-xl tracking-[0.2em] text-white mb-3">
                  •••• •••• •••• {selectedCard.last_four || selectedCard.card_number?.slice(-4) || '••••'}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-[9px] uppercase tracking-wider">Card Holder</p>
                    <p className="text-white text-sm font-medium">{selectedCard.card_name || selectedCard.holder_name || '—'}</p>
                  </div>
                  {selectedCard.expiry_date && (
                    <div>
                      <p className="text-white/40 text-[9px] uppercase tracking-wider">Expires</p>
                      <p className="text-white text-sm font-medium">{selectedCard.expiry_date}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Status', value: selectedCard.status || 'active' },
                  { label: 'Type', value: selectedCard.card_type || 'Debit' },
                  { label: 'Issued', value: selectedCard.created_date ? new Date(selectedCard.created_date).toLocaleDateString() : '—' },
                  { label: 'Member ID', value: selectedCard.user_id?.slice(0, 10) + '…' || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#1a2332] rounded-xl p-3">
                    <p className="text-[#AAB4C3] text-[10px] uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-white text-sm font-medium capitalize">{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {selectedCard.status !== 'frozen' ? (
                  <button onClick={() => updateCardStatus(selectedCard.id, 'frozen', selectedCard)} className="py-2.5 bg-blue-500/10 text-blue-400 font-semibold rounded-xl text-sm hover:bg-blue-500/20 transition flex items-center justify-center gap-2">
                    <Snowflake size={14} /> Freeze
                  </button>
                ) : (
                  <button onClick={() => updateCardStatus(selectedCard.id, 'active', selectedCard)} className="py-2.5 bg-emerald-500/10 text-emerald-400 font-semibold rounded-xl text-sm hover:bg-emerald-500/20 transition flex items-center justify-center gap-2">
                    <Zap size={14} /> Unfreeze
                  </button>
                )}
                <button onClick={() => updateCardStatus(selectedCard.id, 'cancelled', selectedCard)} className="py-2.5 bg-red-500/10 text-red-400 font-semibold rounded-xl text-sm hover:bg-red-500/20 transition flex items-center justify-center gap-2">
                  <X size={14} /> Cancel Card
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Issue Card Dialog */}
      <IssueCardDialog
        open={showIssue}
        onClose={() => setShowIssue(false)}
        onIssued={() => { setShowIssue(false); loadCards(); }}
      />
    </OperationsPageLayout>
  );
}

function IssueCardDialog({ open, onClose, onIssued }) {
  const [form, setForm] = useState({ user_id: '', card_type: 'Debit', card_name: '', last_four: '', expiry_date: '', status: 'active' });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  async function submit() {
    if (!form.user_id || !form.card_name) {
      toast({ title: 'Required fields missing', description: 'Member ID and card name are required.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await base44.entities.Card.create({
        user_id: form.user_id,
        card_type: form.card_type,
        card_name: form.card_name,
        holder_name: form.card_name,
        last_four: form.last_four || Math.floor(1000 + Math.random() * 9000).toString(),
        expiry_date: form.expiry_date,
        status: form.status,
      });
      await logAuditEntry({
        action_type: 'card_issued',
        description: `${form.card_type} card issued to member ${form.user_id}`,
        target_user_id: form.user_id,
      });
      await base44.entities.Notification.create({
        user_id: form.user_id,
        title: 'Card Issued',
        message: `Your ${form.card_type} card has been issued. It will arrive within 5-7 business days.`,
        type: 'success',
      });
      toast({ title: 'Card issued successfully' });
      setForm({ user_id: '', card_type: 'Debit', card_name: '', last_four: '', expiry_date: '', status: 'active' });
      onIssued();
    } catch (e) {
      toast({ title: 'Issue failed', description: e.message, variant: 'destructive' });
    }
    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0E1A2B] border border-[#242D38] max-w-sm text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Plus size={18} className="text-brass" />
            Issue New Card
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {[
            { label: 'Member ID *', key: 'user_id', placeholder: 'Member UUID' },
            { label: 'Name on Card *', key: 'card_name', placeholder: 'Full name as printed' },
            { label: 'Last 4 Digits', key: 'last_four', placeholder: 'Auto-generated if blank' },
            { label: 'Expiry Date', key: 'expiry_date', placeholder: 'MM/YY' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">{f.label}</label>
              <input
                value={form[f.key]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="w-full bg-[#1a2332] border border-[#242D38] rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-[#AAB4C3]/40 focus:border-brass/50 focus:outline-none"
              />
            </div>
          ))}
          <div>
            <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Card Type</label>
            <select
              value={form.card_type}
              onChange={e => setForm({ ...form, card_type: e.target.value })}
              className="w-full bg-[#1a2332] border border-[#242D38] rounded-xl px-3 py-2.5 text-white text-sm focus:border-brass/50 focus:outline-none"
            >
              {['Debit', 'Virtual', 'Premium', 'Business Debit', 'Joint Debit', 'Metal'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <button
            onClick={submit}
            disabled={submitting}
            className="w-full py-3 bg-brass text-white font-semibold rounded-xl text-sm hover:bg-brass/90 transition disabled:opacity-40"
          >
            {submitting ? 'Issuing…' : 'Issue Card'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
