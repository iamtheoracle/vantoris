import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getMemberDisplayName } from '@/lib/memberName';
import { formatCurrency } from '@/lib/formatCurrency';
import { hasOperationsAccess, getRoleLabel } from '@/lib/operationsAccess';
import { useToast } from '@/components/ui/use-toast';
import ShieldLogo from '@/components/vantoris/ShieldLogo';
import DeleteAccountDialog from '@/components/vantoris/DeleteAccountDialog';
import StatusBadge from '@/components/vantoris/StatusBadge';
import ProfileSection, { ProfileRow, ProfileDivider } from '@/components/vantoris/profile/ProfileSection';
import { useWhatsAppConfig, whatsappLinkFromConfig } from '@/hooks/useWhatsAppConfig';
import {
  User, Shield, LogOut, FileText, Trash2, Copy, Check,
  Gift, Sparkles, Bell, MessageCircle, ShieldCheck, ChevronRight,
  Briefcase, CreditCard, Lock, Unlock, Eye, EyeOff, Edit2, Save, X,
  Fingerprint, Smartphone, Clock, AlertCircle, RefreshCw,
  Globe, BadgeCheck,
  Wallet, Plus, Zap, Snowflake,
  RotateCcw,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Profile() {
  const whatsappNumber = useWhatsAppConfig();
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [showDelete, setShowDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralLink, setReferralLink] = useState('');
  const [activeSection, setActiveSection] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      const me = await base44.auth.me();
      if (me && me.role === 'user' && !me.referral_code) {
        const code = generateReferralCode(me.id);
        await base44.auth.updateMe({ referral_code: code });
        me.referral_code = code;
      }
      setUser(me);
      setReferralLink(`${window.location.origin}/register?ref=${me.referral_code || ''}`);

      // Load accounts
      const [accts, cardList] = await Promise.all([
        base44.entities.Account.filter({ user_id: me.id }),
        base44.entities.Card?.filter({ user_id: me.id }).catch(() => []),
      ]);
      setAccounts(accts || []);
      setCards(cardList || []);
    }
    load();
  }, []);

  const reload = async () => {
    const me = await base44.auth.me();
    setUser(me);
    const [accts, cardList] = await Promise.all([
      base44.entities.Account.filter({ user_id: me.id }),
      base44.entities.Card?.filter({ user_id: me.id }).catch(() => []),
    ]);
    setAccounts(accts || []);
    setCards(cardList || []);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  const isMember = user.role === 'user';
  const displayName = getMemberDisplayName(user);
  const initials = displayName.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const memberSince = user.created_date
    ? new Date(user.created_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  // Separate accounts by type
  const personalAccounts = accounts.filter(a => a.account_type === 'Personal' || a.account_type === 'Savings' || a.account_type === 'Checking');
  const jointAccounts = accounts.filter(a => a.account_type === 'Joint');
  const businessAccounts = accounts.filter(a => a.account_type === 'Business');
  const orgAccounts = accounts.filter(a => a.account_type === 'Organization');

  return (
    <div className="px-5 pt-6 pb-10">

      {/* ── Member Identity Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="vantoris-glass-premium p-5 mb-5 relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-brass/[0.06] blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brass/20 to-transparent" />

        <div className="relative z-10">
          {/* Avatar row */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative">
              <div className="w-18 h-18 w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-brass/20 to-brass/5 border border-brass/20 flex items-center justify-center shadow-lg">
                <span className="text-brass text-2xl font-bold tracking-tight">{initials || 'M'}</span>
              </div>
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                user.verification_status === 'verified' ? 'bg-mint' : 'bg-amber-400'
              }`}>
                {user.verification_status === 'verified'
                  ? <Check size={10} className="text-white" />
                  : <AlertCircle size={10} className="text-white" />
                }
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-foreground font-bold text-lg leading-tight truncate">{displayName}</h2>
              {user.preferred_name && user.full_name && user.preferred_name !== user.full_name && (
                <p className="text-brass text-xs mt-0.5">Goes by "{user.preferred_name}"</p>
              )}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="px-2 py-0.5 bg-brass/15 text-brass text-[10px] font-bold rounded tracking-wider uppercase">
                  {getRoleLabel(user.role)}
                </span>
                {user.verification_status && (
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded tracking-wider uppercase ${
                    user.verification_status === 'verified'
                      ? 'bg-mint/15 text-mint'
                      : 'bg-amber-100 text-amber-600'
                  }`}>
                    {user.verification_status === 'verified' ? '✓ Verified' : 'Pending Verification'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {user.id && (
              <div className="bg-white/40 rounded-xl p-2.5">
                <p className="text-gray/70 text-[9px] uppercase tracking-wider font-semibold mb-0.5">Member ID</p>
                <p className="text-foreground text-xs font-mono font-medium">{user.id.slice(0, 12).toUpperCase()}</p>
              </div>
            )}
            {memberSince && (
              <div className="bg-white/40 rounded-xl p-2.5">
                <p className="text-gray/70 text-[9px] uppercase tracking-wider font-semibold mb-0.5">Member Since</p>
                <p className="text-foreground text-xs font-medium">{memberSince}</p>
              </div>
            )}
            {accounts.length > 0 && (
              <div className="bg-white/40 rounded-xl p-2.5">
                <p className="text-gray/70 text-[9px] uppercase tracking-wider font-semibold mb-0.5">Total Accounts</p>
                <p className="text-foreground text-xs font-medium">{accounts.length} Active</p>
              </div>
            )}
            <div className="bg-white/40 rounded-xl p-2.5">
              <p className="text-gray/70 text-[9px] uppercase tracking-wider font-semibold mb-0.5">Relationship</p>
              <p className="text-foreground text-xs font-medium">Vantoris Private</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Personal Information ── */}
      <PersonalInfoSection user={user} onSaved={reload} />

      {/* ── Identification ── */}
      <IdentificationSection user={user} />

      {/* ── Security ── */}
      <SecuritySection user={user} />

      {/* ── Banking Accounts ── */}
      {accounts.length > 0 && (
        <BankingSection
          personalAccounts={personalAccounts}
          jointAccounts={jointAccounts}
          businessAccounts={businessAccounts}
          orgAccounts={orgAccounts}
          onNavigate={(id) => navigate(`/accounts/${id}`)}
        />
      )}

      {/* ── Cards ── */}
      <CardsSection
        cards={cards}
        accounts={accounts}
        onReload={reload}
        userId={user.id}
      />

      {/* ── Documents ── */}
      <ProfileSection title="Documents" icon={FileText} delay={0.25}>
        <ProfileRow icon={FileText} iconColor="text-brass" iconBg="bg-brass/10" label="Statements & Documents" value="Statements, tax docs & agreements" onClick={() => navigate('/documents')} />
      </ProfileSection>

      {/* ── Communication ── */}
      <ProfileSection title="Communication" icon={Bell} delay={0.28}>
        <ProfileRow icon={Bell} iconColor="text-brass" iconBg="bg-brass/10" label="Messages" value="Secure messages" onClick={() => navigate('/messages')} />
        <ProfileDivider />
        <ProfileRow
          icon={MessageCircle}
          iconColor="text-mint"
          iconBg="bg-mint/10"
          label="WhatsApp Support"
          value="Chat with us directly"
          onClick={() => window.open(
            whatsappLinkFromConfig(whatsappNumber, 'Hello Vantoris Support, I have a question regarding my account.'),
            '_blank', 'noopener,noreferrer'
          )}
        />
      </ProfileSection>

      {/* ── Advisory — members only ── */}
      {isMember && (
        <ProfileSection title="Advisory & Services" icon={Sparkles} delay={0.3}>
          <ProfileRow icon={Sparkles} iconColor="text-brass" iconBg="bg-brass/10" label="Vantoris Advisor" value="Your personal AI financial assistant" onClick={() => navigate('/advisor')} />
          <ProfileDivider />
          <ProfileRow icon={Briefcase} iconColor="text-brass" iconBg="bg-brass/10" label="Services" value="Manage banking services" onClick={() => navigate('/services')} />
        </ProfileSection>
      )}

      {/* ── Referral — members only ── */}
      {isMember && (
        <ProfileSection title="Referral Program" icon={Gift} delay={0.32}>
          <div className="p-3.5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-brass/10 flex items-center justify-center">
                <Gift size={16} className="text-brass" />
              </div>
              <div>
                <p className="text-foreground text-sm font-medium">Refer a Friend</p>
                <p className="text-gray text-xs">Share your invite link</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200">
              <span className="text-gray text-xs flex-1 truncate">{referralLink}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-brass/15 text-brass rounded-lg text-xs font-medium hover:bg-brass/25 transition-all flex-shrink-0"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </ProfileSection>
      )}

      {/* ── Staff Access ── */}
      {hasOperationsAccess(user.role) && (
        <ProfileSection title="Staff Access" icon={Shield} delay={0.34}>
          <ProfileRow icon={Shield} iconColor="text-brass" iconBg="bg-brass/10" label="Operations Center" value="Staff access" onClick={() => navigate('/operations')} />
        </ProfileSection>
      )}

      {/* ── Account Management ── */}
      <ProfileSection title="Account Management" icon={LogOut} delay={0.36}>
        <ProfileRow icon={LogOut} label="Sign Out" onClick={() => base44.auth.logout('/')} danger />
        <ProfileDivider />
        <ProfileRow icon={Trash2} label="Delete Account" onClick={() => setShowDelete(true)} danger />
      </ProfileSection>

      <DeleteAccountDialog open={showDelete} onOpenChange={setShowDelete} />

      <div className="mt-8 mb-2 flex flex-col items-center">
        <ShieldLogo size={28} className="mb-2 opacity-40" />
        <p className="text-gray/40 text-[10px] tracking-widest uppercase">Secure. Trusted. Tailored for you.</p>
      </div>
    </div>
  );
}

// ── Personal Information Section ──
function PersonalInfoSection({ user, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: user.full_name || '',
    preferred_name: user.preferred_name || '',
    phone: user.phone || '',
    address: user.address || '',
    date_of_birth: user.date_of_birth || '',
    nationality: user.nationality || '',
  });
  const { toast } = useToast();

  async function save() {
    setSaving(true);
    try {
      await base44.auth.updateMe(form);
      toast({ title: 'Profile updated', description: 'Your personal information has been saved.' });
      setEditing(false);
      onSaved?.();
    } catch (e) {
      toast({ title: 'Save failed', description: e.message || 'Unable to update profile.', variant: 'destructive' });
    }
    setSaving(false);
  }

  const Field = ({ label, fieldKey, type = 'text', placeholder }) => (
    <div>
      <p className="text-gray text-[10px] uppercase tracking-wider font-semibold mb-1">{label}</p>
      {editing ? (
        <input
          type={type}
          value={form[fieldKey] || ''}
          onChange={e => setForm({ ...form, [fieldKey]: e.target.value })}
          placeholder={placeholder || label}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-foreground focus:border-brass/50 focus:outline-none"
        />
      ) : (
        <p className="text-foreground text-sm">{form[fieldKey] || <span className="text-gray/50 italic">Not provided</span>}</p>
      )}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mb-4">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <User size={14} className="text-brass" />
          <h3 className="text-foreground font-semibold text-xs uppercase tracking-[0.12em]">Personal Information</h3>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-brass text-xs font-semibold hover:opacity-75 transition">
            <Edit2 size={12} /> Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(false)} className="text-gray text-xs hover:opacity-75 transition flex items-center gap-1"><X size={12} /> Cancel</button>
            <button onClick={save} disabled={saving} className="flex items-center gap-1 px-2.5 py-1 bg-brass text-white rounded-lg text-xs font-semibold disabled:opacity-40">
              <Save size={12} /> {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Legal Name" fieldKey="full_name" placeholder="First Middle Last" />
          <Field label="Preferred Name" fieldKey="preferred_name" placeholder="Goes by" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date of Birth" fieldKey="date_of_birth" type="date" />
          <Field label="Nationality" fieldKey="nationality" placeholder="Country" />
        </div>
        <Field label="Phone" fieldKey="phone" type="tel" placeholder="+1 (000) 000-0000" />
        <div>
          <p className="text-gray text-[10px] uppercase tracking-wider font-semibold mb-1">Email</p>
          <p className="text-foreground text-sm">{user.email}</p>
          <p className="text-gray/50 text-[10px] mt-0.5">Contact support to change your email address</p>
        </div>
        <Field label="Address" fieldKey="address" placeholder="Street, City, State, ZIP" />
      </div>
    </motion.div>
  );
}

// ── Identification Section ──
function IdentificationSection({ user }) {
  return (
    <ProfileSection title="Identification" icon={BadgeCheck} delay={0.12}>
      <div className="p-4 space-y-3">
        <VerificationItem
          icon={BadgeCheck}
          label="Identity Verification"
          status={user.verification_status === 'verified' ? 'Verified' : 'Pending Review'}
          verified={user.verification_status === 'verified'}
          detail={user.verification_status === 'verified' ? 'KYC/AML checks completed' : 'Submit KYC documents to verify'}
        />
        <div className="h-px bg-slate-100" />
        <VerificationItem
          icon={User}
          label="Government ID"
          status={user.kyc_status === 'approved' ? 'On File' : 'Not Submitted'}
          verified={user.kyc_status === 'approved'}
          detail="Primary identity document"
        />
        <div className="h-px bg-slate-100" />
        <VerificationItem
          icon={Globe}
          label="Passport"
          status={user.passport_verified ? 'Verified' : 'Not on File'}
          verified={!!user.passport_verified}
          detail={user.passport_expiry ? `Expires ${user.passport_expiry}` : 'Optional — for international services'}
        />
      </div>
    </ProfileSection>
  );
}

function VerificationItem({ icon: Icon, label, status, verified, detail }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${verified ? 'bg-mint/10' : 'bg-amber-50'}`}>
        <Icon size={16} className={verified ? 'text-mint' : 'text-amber-500'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-foreground text-sm font-medium">{label}</p>
        <p className="text-gray text-xs truncate">{detail}</p>
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
        verified ? 'bg-mint/10 text-mint' : 'bg-amber-100 text-amber-600'
      }`}>{status}</span>
    </div>
  );
}

// ── Security Section ──
function SecuritySection({ user }) {
  const navigate = useNavigate();
  const [showSessions, setShowSessions] = useState(false);

  return (
    <>
      <ProfileSection title="Security" icon={Shield} delay={0.15}>
        <div className="divide-y divide-slate-100">
          <SecurityRow
            icon={Lock}
            label="Password"
            value="Last changed recently"
            onClick={() => navigate('/advisor')}
            actionLabel="Change"
          />
          <SecurityRow
            icon={Fingerprint}
            label="Security PIN"
            value="6-digit transaction PIN"
            onClick={() => navigate('/advisor')}
            actionLabel="Change"
          />
          <SecurityRow
            icon={Smartphone}
            label="Trusted Devices"
            value={`${navigator.userAgent.includes('Mobile') ? 1 : 1} device registered`}
            onClick={() => setShowSessions(true)}
            actionLabel="Manage"
          />
          <SecurityRow
            icon={Clock}
            label="Login History"
            value="View recent sign-in activity"
            onClick={() => setShowSessions(true)}
            actionLabel="View"
          />
          <SecurityRow
            icon={Shield}
            label="Recovery Methods"
            value={user.email ? 'Email recovery enabled' : 'No recovery method'}
            onClick={() => navigate('/advisor')}
            actionLabel="Manage"
          />
        </div>
      </ProfileSection>

      <Dialog open={showSessions} onOpenChange={setShowSessions}>
        <DialogContent className="bg-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Shield size={18} className="text-brass" />
              Active Sessions
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="p-3 bg-mint/5 border border-mint/20 rounded-xl">
              <div className="flex items-center gap-3">
                <Smartphone size={16} className="text-mint" />
                <div className="flex-1">
                  <p className="text-foreground text-sm font-medium">Current Session</p>
                  <p className="text-gray text-xs">{navigator.userAgent.split(' ').slice(-2).join(' ')}</p>
                  <p className="text-mint text-[10px] font-semibold mt-0.5">Active Now</p>
                </div>
                <Check size={14} className="text-mint" />
              </div>
            </div>
            <p className="text-gray text-xs text-center">Contact support to revoke other sessions.</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SecurityRow({ icon: Icon, label, value, onClick, actionLabel }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-slate-50 transition-all">
      <div className="w-9 h-9 rounded-xl bg-brass/10 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-brass" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-foreground text-sm font-medium">{label}</p>
        <p className="text-gray text-xs truncate">{value}</p>
      </div>
      <span className="text-brass text-xs font-semibold flex-shrink-0">{actionLabel}</span>
    </button>
  );
}

// ── Banking Section ──
function BankingSection({ personalAccounts, jointAccounts, businessAccounts, orgAccounts, onNavigate }) {
  return (
    <ProfileSection title="Banking Accounts" icon={Wallet} delay={0.18}>
      <div className="divide-y divide-slate-100">
        {personalAccounts.map(acct => (
          <AccountRow key={acct.id} account={acct} label="Personal" onClick={() => onNavigate(acct.id)} />
        ))}
        {jointAccounts.map(acct => (
          <AccountRow key={acct.id} account={acct} label="Joint" onClick={() => onNavigate(acct.id)} />
        ))}
        {businessAccounts.map(acct => (
          <AccountRow key={acct.id} account={acct} label="Business" onClick={() => onNavigate(acct.id)} />
        ))}
        {orgAccounts.map(acct => (
          <AccountRow key={acct.id} account={acct} label="Organization" onClick={() => onNavigate(acct.id)} />
        ))}
      </div>
    </ProfileSection>
  );
}

function AccountRow({ account, label, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-slate-50 transition-all">
      <div className="w-9 h-9 rounded-xl bg-brass/10 flex items-center justify-center flex-shrink-0">
        <Wallet size={16} className="text-brass" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-foreground text-sm font-medium truncate">{account.account_name}</p>
          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-gray rounded font-medium flex-shrink-0">{label}</span>
        </div>
        <p className="text-gray text-xs font-mono">••••{(account.account_number || '').slice(-4)}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-foreground text-sm font-semibold">{formatCurrency(account.balance)}</p>
        <p className={`text-[10px] font-medium ${account.status === 'active' ? 'text-mint' : 'text-amber-500'}`}>
          {account.status}
        </p>
      </div>
    </button>
  );
}

// ── Cards Section ──
function CardsSection({ cards, accounts, onReload, userId }) {
  const [showRequest, setShowRequest] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const navigate = useNavigate();

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }} className="mb-4">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <CreditCard size={14} className="text-brass" />
            <h3 className="text-foreground font-semibold text-xs uppercase tracking-[0.12em]">Cards</h3>
          </div>
          <button
            onClick={() => setShowRequest(true)}
            className="flex items-center gap-1 text-brass text-xs font-semibold hover:opacity-75 transition"
          >
            <Plus size={12} /> Request Card
          </button>
        </div>

        {cards.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
            <CreditCard size={28} className="text-gray/30 mx-auto mb-2" />
            <p className="text-foreground font-medium text-sm mb-1">No cards issued</p>
            <p className="text-gray text-xs mb-4">Request your first Vantoris card below</p>
            <button
              onClick={() => setShowRequest(true)}
              className="px-5 py-2 bg-brass text-white rounded-xl text-sm font-semibold hover:bg-brass/90 transition-all"
            >
              Request a Card
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {cards.map(card => (
              <CardTile key={card.id} card={card} onSelect={() => setSelectedCard(card)} onReload={onReload} />
            ))}
          </div>
        )}
      </motion.div>

      {/* Card Request Dialog */}
      <CardRequestDialog
        open={showRequest}
        onClose={() => setShowRequest(false)}
        accounts={accounts}
        userId={userId}
        onSuccess={() => { setShowRequest(false); onReload(); }}
      />

      {/* Card Detail / Controls Dialog */}
      {selectedCard && (
        <CardControlDialog
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onReload={() => { setSelectedCard(null); onReload(); }}
        />
      )}
    </>
  );
}

function CardTile({ card, onSelect, onReload }) {
  const [freezing, setFreezing] = useState(false);
  const { toast } = useToast();

  async function toggleFreeze() {
    setFreezing(true);
    try {
      const newStatus = card.status === 'frozen' ? 'active' : 'frozen';
      await base44.entities.Card.update(card.id, { status: newStatus });
      toast({ title: newStatus === 'frozen' ? 'Card frozen' : 'Card unfrozen', description: `${card.card_name || 'Card'} status updated.` });
      onReload();
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
    setFreezing(false);
  }

  const isFrozen = card.status === 'frozen' || card.status === 'locked';
  const last4 = card.card_number ? card.card_number.slice(-4) : card.last_four || '••••';

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all ${isFrozen ? 'border-crimson/20' : 'border-slate-200'}`}>
      {/* Card Visual */}
      <div className={`relative p-5 ${isFrozen ? 'bg-slate-100' : 'bg-gradient-to-br from-navy to-navy/80'}`}>
        {isFrozen && (
          <div className="absolute inset-0 bg-slate-200/60 flex items-center justify-center z-10">
            <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-full">
              <Snowflake size={14} className="text-crimson" />
              <span className="text-crimson text-xs font-semibold uppercase tracking-wider">{card.status}</span>
            </div>
          </div>
        )}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${isFrozen ? 'text-gray' : 'text-white/60'}`}>VANTORIS</p>
              {card.card_type && <p className={`text-[10px] ${isFrozen ? 'text-gray/60' : 'text-white/40'}`}>{card.card_type}</p>}
            </div>
            <CreditCard size={20} className={isFrozen ? 'text-gray/40' : 'text-white/40'} />
          </div>
          <p className={`font-mono text-lg tracking-[0.2em] mb-3 ${isFrozen ? 'text-gray' : 'text-white'}`}>
            •••• •••• •••• {last4}
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-[9px] uppercase tracking-wider ${isFrozen ? 'text-gray/60' : 'text-white/40'}`}>Card Holder</p>
              <p className={`text-sm font-medium ${isFrozen ? 'text-gray' : 'text-white'}`}>{card.card_name || card.holder_name || 'Vantoris Member'}</p>
            </div>
            {card.expiry_date && (
              <div>
                <p className={`text-[9px] uppercase tracking-wider ${isFrozen ? 'text-gray/60' : 'text-white/40'}`}>Expires</p>
                <p className={`text-sm font-medium ${isFrozen ? 'text-gray' : 'text-white'}`}>{card.expiry_date}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-3 grid grid-cols-4 gap-1.5">
        <QuickCardBtn icon={isFrozen ? Zap : Snowflake} label={isFrozen ? 'Unfreeze' : 'Freeze'} onClick={toggleFreeze} loading={freezing} danger={!isFrozen} />
        <QuickCardBtn icon={Eye} label="Details" onClick={onSelect} />
        <QuickCardBtn icon={Lock} label={card.status === 'locked' ? 'Unlock' : 'Lock'} onClick={onSelect} />
        <QuickCardBtn icon={RotateCcw} label="Replace" onClick={onSelect} />
      </div>
    </div>
  );
}

function QuickCardBtn({ icon: Icon, label, onClick, loading, danger }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-center transition-all ${
        danger ? 'hover:bg-crimson/5 text-crimson' : 'hover:bg-brass/5 text-brass'
      } disabled:opacity-40`}
    >
      <Icon size={15} />
      <span className="text-[9px] font-semibold leading-tight">{label}</span>
    </button>
  );
}

// ── Card Detail / Controls Dialog ──
function CardControlDialog({ card, onClose, onReload }) {
  const [showNumber, setShowNumber] = useState(false);
  const [showCVV, setShowCVV] = useState(false);
  const [copied, setCopied] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(card.card_name || '');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  function copy(text, field) {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
    toast({ title: 'Copied', description: `${field} copied to clipboard.` });
  }

  async function toggleStatus(status) {
    try {
      await base44.entities.Card.update(card.id, { status });
      toast({ title: `Card ${status}`, description: 'Status updated successfully.' });
      onReload();
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  }

  async function saveRename() {
    setSaving(true);
    try {
      await base44.entities.Card.update(card.id, { card_name: newName });
      toast({ title: 'Card renamed', description: 'Name updated.' });
      setRenaming(false);
      onReload();
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
    setSaving(false);
  }

  async function reportLost() {
    try {
      await base44.entities.Card.update(card.id, { status: 'reported_lost' });
      await base44.entities.ServiceRequest.create({
        user_id: card.user_id,
        type: 'card_lost',
        title: 'Lost Card Report',
        description: `Card ending ${card.last_four || card.card_number?.slice(-4)} reported lost.`,
        status: 'pending',
        priority: 'high',
      });
      toast({ title: 'Lost card reported', description: 'A replacement card will be issued.' });
      onReload();
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  }

  const last4 = card.card_number ? card.card_number.slice(-4) : card.last_four || '••••';

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <CreditCard size={18} className="text-brass" />
            Card Controls
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Card name */}
          {renaming ? (
            <div className="flex items-center gap-2">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Card nickname"
              />
              <button onClick={saveRename} disabled={saving} className="px-3 py-2 bg-brass text-white rounded-lg text-xs font-semibold disabled:opacity-40">
                {saving ? '…' : 'Save'}
              </button>
              <button onClick={() => setRenaming(false)} className="p-2"><X size={14} className="text-gray" /></button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-semibold">{card.card_name || 'Vantoris Card'}</p>
                <p className="text-gray text-xs">••••{last4} · {card.card_type || 'Debit'}</p>
              </div>
              <button onClick={() => setRenaming(true)} className="text-brass text-xs font-semibold hover:opacity-75">Rename</button>
            </div>
          )}

          {/* Sensitive details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <p className="text-gray text-xs">Card Number</p>
                <p className="text-foreground font-mono text-sm">
                  {showNumber && card.card_number ? card.card_number : `•••• •••• •••• ${last4}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowNumber(!showNumber)} className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 transition">
                  {showNumber ? <EyeOff size={14} className="text-gray" /> : <Eye size={14} className="text-gray" />}
                </button>
                {showNumber && card.card_number && (
                  <button onClick={() => copy(card.card_number, 'Card number')} className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 transition">
                    {copied === 'Card number' ? <Check size={14} className="text-mint" /> : <Copy size={14} className="text-gray" />}
                  </button>
                )}
              </div>
            </div>

            {card.cvv && (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-gray text-xs">CVV</p>
                  <p className="text-foreground font-mono text-sm">{showCVV ? card.cvv : '•••'}</p>
                </div>
                <button onClick={() => setShowCVV(!showCVV)} className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 transition">
                  {showCVV ? <EyeOff size={14} className="text-gray" /> : <Eye size={14} className="text-gray" />}
                </button>
              </div>
            )}
          </div>

          {/* Status controls */}
          <div className="grid grid-cols-2 gap-2">
            {card.status !== 'frozen' ? (
              <button onClick={() => toggleStatus('frozen')} className="py-2.5 bg-amber-50 text-amber-600 font-semibold rounded-xl text-sm hover:bg-amber-100 transition flex items-center justify-center gap-2">
                <Snowflake size={14} /> Freeze
              </button>
            ) : (
              <button onClick={() => toggleStatus('active')} className="py-2.5 bg-mint/10 text-mint font-semibold rounded-xl text-sm hover:bg-mint/20 transition flex items-center justify-center gap-2">
                <Zap size={14} /> Unfreeze
              </button>
            )}
            {card.status !== 'locked' ? (
              <button onClick={() => toggleStatus('locked')} className="py-2.5 bg-slate-100 text-foreground font-semibold rounded-xl text-sm hover:bg-slate-200 transition flex items-center justify-center gap-2">
                <Lock size={14} /> Lock
              </button>
            ) : (
              <button onClick={() => toggleStatus('active')} className="py-2.5 bg-slate-100 text-foreground font-semibold rounded-xl text-sm hover:bg-slate-200 transition flex items-center justify-center gap-2">
                <Unlock size={14} /> Unlock
              </button>
            )}
          </div>

          {/* Spending Controls section */}
          <div>
            <p className="text-gray text-[10px] uppercase tracking-wider font-semibold mb-2">Spending Controls</p>
            <div className="space-y-1.5">
              {[
                { label: 'ATM Withdrawals', key: 'atm_enabled', default: true },
                { label: 'Online Purchases', key: 'online_enabled', default: true },
                { label: 'International Purchases', key: 'international_enabled', default: false },
                { label: 'Contactless / Tap to Pay', key: 'contactless_enabled', default: true },
              ].map(ctrl => (
                <div key={ctrl.key} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-foreground text-sm">{ctrl.label}</span>
                  <SpendingToggle cardId={card.id} field={ctrl.key} initial={card[ctrl.key] ?? ctrl.default} />
                </div>
              ))}
            </div>
          </div>

          {/* Wallet links */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href="https://wallet.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 bg-black text-white font-semibold rounded-xl text-sm hover:opacity-80 transition flex items-center justify-center gap-2"
            >
              <Smartphone size={14} /> Apple Wallet
            </a>
            <a
              href="https://pay.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:opacity-80 transition flex items-center justify-center gap-2"
            >
              <Smartphone size={14} /> Google Pay
            </a>
          </div>

          {/* Danger actions */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
            <button
              onClick={reportLost}
              className="py-2.5 bg-crimson/5 text-crimson font-semibold rounded-xl text-sm hover:bg-crimson/10 transition flex items-center justify-center gap-2"
            >
              <AlertCircle size={14} /> Report Lost
            </button>
            <button
              onClick={async () => {
                try {
                  await base44.entities.ServiceRequest.create({
                    user_id: card.user_id,
                    type: 'card_replacement',
                    title: 'Card Replacement Request',
                    description: `Replacement requested for card ending ${last4}.`,
                    status: 'pending',
                  });
                  toast({ title: 'Replacement requested', description: 'A new card will be issued within 5-7 business days.' });
                } catch (e) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
              }}
              className="py-2.5 bg-slate-100 text-foreground font-semibold rounded-xl text-sm hover:bg-slate-200 transition flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} /> Replace
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SpendingToggle({ cardId, field, initial }) {
  const [enabled, setEnabled] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    const next = !enabled;
    setEnabled(next);
    try {
      await base44.entities.Card.update(cardId, { [field]: next });
    } catch {
      setEnabled(!next); // revert on failure
    }
    setSaving(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`relative w-10 h-6 rounded-full transition-all ${enabled ? 'bg-mint' : 'bg-slate-200'} disabled:opacity-40`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${enabled ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'}`} />
    </button>
  );
}

// ── Card Request Dialog ──
function CardRequestDialog({ open, onClose, accounts, userId, onSuccess }) {
  const { toast } = useToast();
  const [step, setStep] = useState(1); // 1=type, 2=details, 3=review, 4=done
  const [form, setForm] = useState({
    card_type: 'Personal Debit',
    account_id: accounts[0]?.id || '',
    delivery_address: '',
    card_name_printed: '',
    design: 'standard',
  });
  const [submitting, setSubmitting] = useState(false);

  const CARD_TYPES = [
    { value: 'Personal Debit', desc: 'Standard personal debit card', icon: CreditCard },
    { value: 'Virtual Card', desc: 'Instant digital card for online use', icon: Globe },
    { value: 'Premium Card', desc: 'Premium metal-finish card', icon: Star },
    { value: 'Business Debit', desc: 'For your business account', icon: Briefcase },
  ];

  async function submit() {
    setSubmitting(true);
    try {
      await base44.entities.ServiceRequest.create({
        user_id: userId,
        type: 'card_issuance',
        title: `${form.card_type} Request`,
        description: `Card type: ${form.card_type}. Name on card: ${form.card_name_printed || 'Member name'}. Design: ${form.design}. Delivery: ${form.delivery_address || 'Default address on file'}.`,
        status: 'pending',
        account_id: form.account_id || null,
        priority: 'normal',
      });
      await base44.entities.Notification.create({
        user_id: userId,
        title: 'Card Request Submitted',
        message: `Your ${form.card_type} request is being processed. Estimated delivery: 5-7 business days.`,
        type: 'info',
      });
      setStep(4);
    } catch (e) {
      toast({ title: 'Request failed', description: e.message, variant: 'destructive' });
    }
    setSubmitting(false);
  }

  function reset() { setForm({ card_type: 'Personal Debit', account_id: accounts[0]?.id || '', delivery_address: '', card_name_printed: '', design: 'standard' }); setStep(1); onSuccess(); }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <CreditCard size={18} className="text-brass" />
            {step < 4 ? 'Request a Card' : 'Request Submitted'}
          </DialogTitle>
        </DialogHeader>

        {step < 4 && (
          <div className="flex gap-1 mb-4">
            {[1,2,3].map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= step ? 'bg-brass' : 'bg-slate-100'}`} />
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-2">
            <p className="text-gray text-xs mb-3">Select the type of card you'd like to request.</p>
            {CARD_TYPES.map(ct => {
              const Icon = ct.icon;
              const isLinked = ct.value === 'Business Debit' && accounts.filter(a => a.account_type === 'Business').length === 0;
              if (isLinked) return null;
              return (
                <button
                  key={ct.value}
                  onClick={() => { setForm({ ...form, card_type: ct.value }); setStep(2); }}
                  className="w-full flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl hover:bg-brass/5 hover:border-brass/30 border border-slate-200 text-left transition-all"
                >
                  <Icon size={18} className="text-brass flex-shrink-0" />
                  <div>
                    <p className="text-foreground font-semibold text-sm">{ct.value}</p>
                    <p className="text-gray text-xs">{ct.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray/40 ml-auto" />
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {accounts.length > 1 && (
              <div>
                <label className="text-gray text-xs uppercase tracking-wider mb-1.5 block">Link to Account</label>
                <select
                  value={form.account_id}
                  onChange={e => setForm({ ...form, account_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-foreground focus:border-brass/50 focus:outline-none"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.account_name} (••••{a.account_number?.slice(-4)})</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="text-gray text-xs uppercase tracking-wider mb-1.5 block">Name on Card</label>
              <input
                value={form.card_name_printed}
                onChange={e => setForm({ ...form, card_name_printed: e.target.value })}
                placeholder="As it should appear on the card"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-brass/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-gray text-xs uppercase tracking-wider mb-1.5 block">Delivery Address</label>
              <textarea
                value={form.delivery_address}
                onChange={e => setForm({ ...form, delivery_address: e.target.value })}
                placeholder="Street, City, State, ZIP (leave blank for address on file)"
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:border-brass/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-gray text-xs uppercase tracking-wider mb-1.5 block">Card Design</label>
              <div className="grid grid-cols-3 gap-2">
                {['standard', 'dark', 'gold'].map(d => (
                  <button
                    key={d}
                    onClick={() => setForm({ ...form, design: d })}
                    className={`py-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                      form.design === d ? 'bg-brass text-white border-brass' : 'bg-slate-50 text-gray border-slate-200 hover:border-brass/30'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setStep(1)} className="flex-1 py-2.5 bg-slate-100 text-foreground rounded-xl text-sm font-medium hover:bg-slate-200 transition">Back</button>
              <button onClick={() => setStep(3)} className="flex-1 py-2.5 bg-brass text-white rounded-xl text-sm font-semibold hover:bg-brass/90 transition">Review</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
              {[
                ['Card Type', form.card_type],
                ['Name on Card', form.card_name_printed || 'Name on file'],
                ['Design', form.design],
                ['Delivery', form.delivery_address || 'Address on file'],
                ['Linked Account', accounts.find(a => a.id === form.account_id)?.account_name || 'Default account'],
                ['Processing', '3-5 business days'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between items-center">
                  <span className="text-gray text-xs">{l}</span>
                  <span className="text-foreground text-sm font-medium">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="flex-1 py-2.5 bg-slate-100 text-foreground rounded-xl text-sm font-medium">Back</button>
              <button onClick={submit} disabled={submitting} className="flex-1 py-2.5 bg-brass text-white rounded-xl text-sm font-semibold disabled:opacity-40">
                {submitting ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-4 space-y-3">
            <div className="w-14 h-14 bg-mint/10 rounded-full flex items-center justify-center mx-auto">
              <Check size={24} className="text-mint" />
            </div>
            <p className="text-foreground font-semibold">Request Submitted!</p>
            <p className="text-gray text-sm">Your {form.card_type} request is being processed. You'll receive a notification when your card is ready.</p>
            <button onClick={reset} className="w-full py-2.5 bg-brass text-white rounded-xl text-sm font-semibold hover:bg-brass/90 transition">Done</button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function generateReferralCode(userId) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}
