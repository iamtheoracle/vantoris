import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Shield, MessageCircle, Calendar,
  ChevronRight, Star, Trash2, Clock, Search, X, Plus, Download,
  FileText, Mic, AlertCircle,
} from 'lucide-react';
import { getMessageKey, isStarred, toggleStar, addDeletedId, getDeletedIds } from '@/lib/starredMessages';
import VantorisMonogram from '@/components/vantoris/brand/VantorisMonogram';
import ConversationTabs from '@/components/vantoris/chat/ConversationTabs';
import ChatMessage from '@/components/vantoris/chat/ChatMessage';
import ChatInputBar from '@/components/vantoris/chat/ChatInputBar';
import BankingCards from '@/components/vantoris/chat/BankingCards';
import TypingIndicator from '@/components/vantoris/chat/TypingIndicator';
import { useWhatsAppConfig, whatsappLinkFromConfig } from '@/hooks/useWhatsAppConfig';
import { useToast } from '@/components/ui/use-toast';

const SUGGESTIONS = [
  'What is my current account balance?',
  'Show me my recent transactions',
  'What is my KYC status?',
  'How do I request a wire transfer?',
];

function DateSeparator({ label }) {
  return (
    <div className="flex items-center justify-center my-3">
      <span className="text-[10px] font-semibold text-gray/70 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-200">
        {label}
      </span>
    </div>
  );
}

function formatDateGroup(dateStr) {
  if (!dateStr) return 'Today';
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function shouldShowDateSeparator(messages, idx) {
  if (idx === 0) return true;
  const prev = messages[idx - 1];
  const curr = messages[idx];
  const prevDate = new Date(prev.created_date || prev.timestamp || Date.now()).toDateString();
  const currDate = new Date(curr.created_date || curr.timestamp || Date.now()).toDateString();
  return prevDate !== currDate;
}

// ── Attachment Bubble ──
function AttachmentBubble({ attachment, isUser }) {
  const isImage = attachment.type === 'image';
  const isVoice = attachment.type === 'voice';

  if (isImage && attachment.url) {
    return (
      <div className="mt-1 max-w-[220px] rounded-xl overflow-hidden border border-slate-200">
        <img src={attachment.url} alt={attachment.name} className="w-full object-cover" />
        <div className="px-2 py-1 flex items-center justify-between bg-slate-50">
          <span className="text-[10px] text-gray truncate">{attachment.name}</span>
          <a href={attachment.url} download target="_blank" rel="noopener noreferrer" className="ml-2 flex-shrink-0">
            <Download size={12} className="text-brass" />
          </a>
        </div>
      </div>
    );
  }

  if (isVoice) {
    return (
      <div className="mt-1 flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 max-w-[200px]">
        <Mic size={14} className="text-brass flex-shrink-0" />
        <div className="flex-1">
          <p className="text-[10px] text-gray">Voice note</p>
          <p className="text-foreground text-xs font-medium">{attachment.duration || '0:03'}</p>
        </div>
      </div>
    );
  }

  // Document / PDF
  return (
    <div className="mt-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 max-w-[220px]">
      <FileText size={16} className="text-brass flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-foreground text-xs font-medium truncate">{attachment.name || 'Attachment'}</p>
        {attachment.size && <p className="text-gray text-[10px]">{(attachment.size / 1024).toFixed(1)} KB</p>}
      </div>
      {attachment.url && (
        <a href={attachment.url} download target="_blank" rel="noopener noreferrer">
          <Download size={12} className="text-brass" />
        </a>
      )}
    </div>
  );
}

export default function MemberAdvisorChat() {
  const [activeTab, setActiveTab] = useState('advisor');
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingConv, setLoadingConv] = useState(true);
  const [starredOnly, setStarredOnly] = useState(false);
  const [starredVersion, setStarredVersion] = useState(0);
  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const messagesEndRef = useRef(null);
  const searchRef = useRef(null);
  const whatsappNumber = useWhatsAppConfig();
  const { toast } = useToast();

  useEffect(() => {
    if (activeTab === 'advisor') {
      loadConversations();
    } else {
      setLoadingConv(false);
      setMessages([]);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeConv && activeTab === 'advisor') {
      const unsubscribe = base44.agents.subscribeToConversation(activeConv.id, (data) => {
        setMessages(data.messages || []);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [activeConv, activeTab]);

  useEffect(() => {
    if (!showSearch) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, showSearch]);

  useEffect(() => {
    if (showSearch) searchRef.current?.focus();
  }, [showSearch]);

  // Search through messages
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    const allMessages = conversations.flatMap(conv =>
      (conv.messages || []).map(m => ({ ...m, convId: conv.id, convName: conv.metadata?.name }))
    );
    const found = allMessages.filter(m => m.content?.toLowerCase().includes(q));
    setSearchResults(found.slice(0, 50));
  }, [searchQuery, conversations]);

  async function loadConversations() {
    setLoadingConv(true);
    try {
      const convs = await base44.agents.listConversations({ agent_name: 'member_advisor' });
      const deleted = getDeletedIds('member_advisor');
      const filtered = (convs || []).filter(c => !deleted.has(c.id));
      setConversations(filtered);
      if (filtered.length > 0) {
        setActiveConv(filtered[0]);
        setMessages(filtered[0].messages || []);
      }
    } catch (e) {
      console.error('Load conversations error:', e);
      toast({ title: 'Chat load failed', description: e.message || 'Unable to load conversations.', variant: 'destructive' });
    }
    setLoadingConv(false);
  }

  function deleteConversation(convId) {
    addDeletedId('member_advisor', convId);
    const remaining = conversations.filter(c => c.id !== convId);
    setConversations(remaining);
    if (activeConv?.id === convId) {
      const next = remaining[0] || null;
      setActiveConv(next);
      setMessages(next?.messages || []);
    }
  }

  function startNewConversation() {
    setActiveConv(null);
    setMessages([]);
  }

  async function generateConversationTitle(firstMessage) {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a very short title (3-6 words, no quotes, no trailing punctuation) for a banking conversation that starts with:\n\n"${firstMessage}"\n\nTitle:`,
      });
      const title = (typeof result === 'string' ? result : (result.response || result.result || '')).trim();
      return title.slice(0, 60) || firstMessage.slice(0, 40);
    } catch {
      return firstMessage.length > 40 ? firstMessage.slice(0, 40) + '…' : firstMessage;
    }
  }

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: text, created_date: new Date().toISOString() }]);

    let conv = activeConv;
    if (!conv) {
      const title = await generateConversationTitle(text);
      conv = await base44.agents.createConversation({
        agent_name: 'member_advisor',
        metadata: { name: title, description: 'Member advisory chat' },
      });
      if (!conv.metadata) conv.metadata = { name: title };
      setConversations(prev => [conv, ...prev]);
      setActiveConv(conv);
    }

    try {
      await base44.agents.addMessage(conv, { role: 'user', content: text });
    } catch (e) {
      console.error('Send message error:', e);
      toast({ title: 'Message failed', description: e.message || 'Unable to send message.', variant: 'destructive' });
      setLoading(false);
    }
  }

  async function sendAttachment(attachment) {
    if (loading) return;
    const text = attachment.type === 'image'
      ? `[📷 Image: ${attachment.name}](${attachment.url})`
      : attachment.type === 'voice'
      ? `[🎤 Voice note (${attachment.duration || '0:03'})]`
      : `[📎 ${attachment.name}](${attachment.url || ''})`;
    await sendMessage(text);
  }

  const displayMessages = starredOnly
    ? messages.filter(m => activeConv && isStarred(activeConv.id, getMessageKey(m)))
    : messages;

  const filteredDisplay = showSearch && searchQuery
    ? searchResults
    : displayMessages;

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)]">
      {/* Conversation Tabs */}
      <ConversationTabs active={activeTab} onChange={setActiveTab} />

      {/* Chat Container */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mt-2">
        {/* Header */}
        <ChatHeader
          activeTab={activeTab}
          whatsappNumber={whatsappNumber}
          conversations={conversations}
          activeConv={activeConv}
          onSelectConv={(conv) => { setActiveConv(conv); setMessages(conv.messages || []); }}
          onDeleteConv={deleteConversation}
          onNewConv={startNewConversation}
          onToggleStarred={() => { setStarredOnly(s => !s); setStarredVersion(v => v + 1); }}
          onToggleSearch={() => { setShowSearch(s => !s); setSearchQuery(''); setSearchResults([]); }}
          starredOnly={starredOnly}
          showSearch={showSearch}
        />

        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-slate-200 overflow-hidden"
            >
              <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50">
                <Search size={15} className="text-gray flex-shrink-0" />
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search messages…"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-gray/50 focus:outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-gray hover:text-foreground">
                    <X size={14} />
                  </button>
                )}
                {searchResults.length > 0 && (
                  <span className="text-gray text-xs">{searchResults.length} found</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0 bg-slate-50/30">
          {activeTab === 'advisor' && (
            <>
              {loadingConv ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
                    <p className="text-gray text-xs">Loading conversations…</p>
                  </div>
                </div>
              ) : filteredDisplay.length === 0 && !loading ? (
                <AdvisorEmptyState
                  showSearch={showSearch && !!searchQuery}
                  onSuggest={sendMessage}
                />
              ) : (
                <>
                  {showSearch && searchQuery ? (
                    // Search results
                    <div className="space-y-2">
                      {searchResults.map((msg, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3">
                          <p className="text-[10px] text-gray mb-1 uppercase tracking-wider">{msg.convName || 'Conversation'}</p>
                          <p className="text-foreground text-sm">
                            {highlightSearch(msg.content || '', searchQuery)}
                          </p>
                          <p className="text-gray text-[10px] mt-1">
                            {msg.created_date ? new Date(msg.created_date).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    filteredDisplay.map((msg, idx) => {
                      const isUser = msg.role === 'user';
                      const nextMsg = filteredDisplay[idx + 1];
                      const isLastInGroup = !nextMsg || nextMsg.role !== msg.role;
                      const showAvatar = isLastInGroup;
                      const showDateSep = shouldShowDateSeparator(filteredDisplay, idx);

                      // Check if message is an attachment link
                      const attachmentMatch = (msg.content || '').match(/^\[(📷|📎|🎤)[^\]]+\]\(([^)]*)\)$/);

                      return (
                        <React.Fragment key={idx}>
                          {showDateSep && <DateSeparator label={formatDateGroup(msg.created_date || msg.timestamp)} />}
                          {attachmentMatch ? (
                            <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-1`}>
                              <AttachmentBubble
                                attachment={{
                                  type: msg.content.startsWith('[📷') ? 'image' : msg.content.startsWith('[🎤') ? 'voice' : 'document',
                                  name: msg.content.match(/\[.+?: (.+?)\]/)?.[1] || 'Attachment',
                                  url: attachmentMatch[2],
                                }}
                                isUser={isUser}
                              />
                            </div>
                          ) : (
                            <ChatMessage
                              message={msg}
                              isUser={isUser}
                              showAvatar={showAvatar}
                              isLastInGroup={isLastInGroup}
                              convId={activeConv?.id}
                              onStarToggle={() => setStarredVersion(v => v + 1)}
                            />
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                  {loading && (
                    <div className="flex items-start gap-2 mb-1">
                      <div className="w-7 h-7 rounded-full bg-navy/8 flex items-center justify-center flex-shrink-0 self-end">
                        <VantorisMonogram size={18} variant="flat" theme="light" />
                      </div>
                      <div className="vantoris-chat-bubble-in rounded-2xl rounded-bl-md">
                        <TypingIndicator />
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {activeTab === 'support' && <SupportChannel whatsappNumber={whatsappNumber} />}
          {activeTab === 'manager' && <ManagerChannel />}

          <div ref={messagesEndRef} />
        </div>

        {/* Banking Quick Actions */}
        {activeTab === 'advisor' && !showSearch && <BankingCards />}

        {/* Input Bar */}
        {activeTab === 'advisor' && (
          <ChatInputBar
            onSend={sendMessage}
            onAttach={sendAttachment}
            disabled={loading}
          />
        )}
        {activeTab !== 'advisor' && (
          <ChannelInputBar activeTab={activeTab} whatsappNumber={whatsappNumber} />
        )}
      </div>
    </div>
  );
}

// ── Highlight search terms ──
function highlightSearch(text, query) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-brass/20 text-foreground rounded px-0.5">{part}</mark>
      : part
  );
}

// ── Empty State ──
function AdvisorEmptyState({ showSearch, onSuggest }) {
  if (showSearch) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-8">
        <Search size={28} className="text-gray/30 mb-3" />
        <p className="text-foreground font-medium text-sm">No messages found</p>
        <p className="text-gray text-xs mt-1">Try a different search term</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-6">
      <div className="w-14 h-14 rounded-2xl bg-navy/8 flex items-center justify-center mb-4">
        <VantorisMonogram size={32} variant="flat" theme="light" />
      </div>
      <h3 className="text-foreground font-semibold text-base mb-1">Vantoris Advisor</h3>
      <p className="text-gray text-xs max-w-[220px] mb-5">Your AI financial guide. Ask me anything about your accounts, transactions, or services.</p>
      <div className="space-y-2 w-full max-w-xs">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggest(s)}
            className="w-full text-left px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-foreground hover:border-brass/30 hover:bg-brass/5 transition-all"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Support Channel ──
function SupportChannel({ whatsappNumber }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-8 px-4">
      <div className="w-14 h-14 rounded-2xl bg-mint/10 flex items-center justify-center mb-4">
        <MessageCircle size={26} className="text-mint" />
      </div>
      <h3 className="text-foreground font-semibold text-base mb-1">Human Support</h3>
      <p className="text-gray text-sm max-w-[240px] mb-2">
        Connect with a live support agent via WhatsApp for immediate assistance.
      </p>
      <p className="text-gray text-xs max-w-[240px] mb-6">
        Available Monday–Friday, 9 AM – 6 PM EST. For urgent matters, call your relationship manager.
      </p>
      <div className="space-y-2 w-full max-w-xs">
        {[
          { label: 'Account inquiry', msg: 'Hello Vantoris Support, I have a question about my account.' },
          { label: 'Transaction dispute', msg: 'Hello Vantoris Support, I need to report a transaction dispute.' },
          { label: 'Document request', msg: 'Hello Vantoris Support, I need to request a document.' },
          { label: 'General inquiry', msg: 'Hello Vantoris Support, I have a general inquiry.' },
        ].map(item => (
          <a
            key={item.label}
            href={whatsappNumber
              ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(item.msg)}`
              : '#'
            }
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-foreground hover:border-mint/40 hover:bg-mint/5 transition-all ${!whatsappNumber ? 'opacity-40 pointer-events-none' : ''}`}
          >
            <MessageCircle size={14} className="text-mint flex-shrink-0" />
            {item.label}
            <ChevronRight size={14} className="text-gray/40 ml-auto" />
          </a>
        ))}
      </div>
      {!whatsappNumber && (
        <p className="text-gray text-xs mt-4">WhatsApp support is not configured yet. Contact your relationship manager.</p>
      )}
    </div>
  );
}

// ── Manager Channel ──
function ManagerChannel() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-8 px-4">
      <div className="w-14 h-14 rounded-2xl bg-brass/10 flex items-center justify-center mb-4">
        <Shield size={26} className="text-brass" />
      </div>
      <h3 className="text-foreground font-semibold text-base mb-1">Relationship Manager</h3>
      <p className="text-gray text-sm max-w-[240px] mb-6">
        Your dedicated Vantoris relationship manager is here to provide personalized guidance and support.
      </p>
      <div className="vantoris-glass-premium p-4 mb-5 w-full max-w-xs text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brass/15 flex items-center justify-center">
            <span className="text-brass font-bold text-sm">VM</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Vantoris Private</p>
            <p className="text-xs text-gray">Wealth Management · Dedicated RM</p>
          </div>
        </div>
      </div>
      <div className="space-y-2 w-full max-w-xs">
        <button
          onClick={() => navigate('/advisor')}
          className="w-full py-2.5 bg-brass text-white font-semibold rounded-xl text-sm hover:bg-brass/90 transition flex items-center justify-center gap-2"
        >
          <Calendar size={15} />
          Schedule Appointment
        </button>
        <button
          onClick={() => navigate('/services')}
          className="w-full py-2.5 bg-slate-100 text-foreground font-medium rounded-xl text-sm hover:bg-slate-200 transition"
        >
          View Premium Services
        </button>
      </div>
    </div>
  );
}

// ── Chat Header ──
function ChatHeader({ activeTab, whatsappNumber, conversations, activeConv, onSelectConv, onDeleteConv, onNewConv, onToggleStarred, onToggleSearch, starredOnly, showSearch }) {
  const [showHistory, setShowHistory] = useState(false);
  const config = {
    advisor: { name: 'Vantoris Advisor', status: 'Online · AI Financial Guide', online: true },
    support: { name: 'Human Support', status: whatsappNumber ? 'WhatsApp · Available' : 'Contact via WhatsApp', online: !!whatsappNumber },
    manager: { name: 'Relationship Manager', status: 'Your dedicated RM', online: true },
  };
  const info = config[activeTab];

  return (
    <div className="flex items-center gap-3 p-3.5 border-b border-slate-200 vantoris-glass-header">
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-navy/8 flex items-center justify-center">
          <VantorisMonogram size={24} variant="flat" theme="light" />
        </div>
        {info.online && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-mint rounded-full border-2 border-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-foreground truncate">{info.name}</h3>
        <p className="text-gray text-xs truncate">{info.status}</p>
      </div>
      {activeTab === 'advisor' && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onToggleSearch}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${showSearch ? 'bg-brass text-white' : 'bg-slate-100 text-gray hover:bg-slate-200'}`}
            title="Search messages"
          >
            <Search size={15} />
          </button>
          <button
            onClick={onToggleStarred}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${starredOnly ? 'bg-gold/20 text-gold' : 'bg-slate-100 text-gray hover:bg-slate-200'}`}
            title={starredOnly ? 'Show all messages' : 'Show starred only'}
          >
            <Star size={15} fill={starredOnly ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all relative ${showHistory ? 'bg-navy text-white' : 'bg-slate-100 text-gray hover:bg-slate-200'}`}
            title="Conversations"
          >
            <Clock size={15} />
            {conversations.length > 0 && !showHistory && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-brass text-white rounded-full text-[8px] flex items-center justify-center font-bold">
                {Math.min(conversations.length, 9)}
              </span>
            )}
          </button>
          {showHistory && (
            <ConversationHistory
              conversations={conversations}
              activeConv={activeConv}
              onSelect={(conv) => { onSelectConv(conv); setShowHistory(false); }}
              onDelete={onDeleteConv}
              onNew={() => { onNewConv(); setShowHistory(false); }}
              onClose={() => setShowHistory(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Conversation History Dropdown ──
function ConversationHistory({ conversations, activeConv, onSelect, onDelete, onNew, onClose }) {
  return (
    <div className="absolute top-14 right-3 z-30 w-72 vantoris-glass-dropdown rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-200">
        <h4 className="text-foreground font-semibold text-sm">Conversations</h4>
        <div className="flex items-center gap-1">
          <button
            onClick={onNew}
            className="flex items-center gap-1 px-2.5 py-1 bg-brass/10 text-brass rounded-lg text-[11px] font-semibold hover:bg-brass/20 transition"
          >
            <Plus size={11} /> New
          </button>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-gray hover:bg-slate-200 transition">
            <X size={13} />
          </button>
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-gray text-xs">No conversations yet</p>
          </div>
        ) : (
          conversations.map(conv => (
            <div
              key={conv.id}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer transition-all hover:bg-slate-50 ${activeConv?.id === conv.id ? 'bg-brass/5 border-l-2 border-brass' : ''}`}
              onClick={() => onSelect(conv)}
            >
              <div className="w-8 h-8 rounded-xl bg-navy/8 flex items-center justify-center flex-shrink-0">
                <VantorisMonogram size={18} variant="flat" theme="light" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-xs font-semibold truncate">
                  {conv.metadata?.name || 'Conversation'}
                </p>
                <p className="text-gray text-[10px]">
                  {conv.messages?.length || 0} messages
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                className="w-6 h-6 flex items-center justify-center rounded-full text-gray hover:text-crimson hover:bg-crimson/10 transition opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Channel Input Bar ──
function ChannelInputBar({ activeTab, whatsappNumber }) {
  const navigate = useNavigate();

  if (activeTab === 'support' && whatsappNumber) {
    const waLink = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`;
    return (
      <div className="p-3 border-t border-slate-200 bg-white safe-bottom">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-11 bg-mint text-white font-semibold rounded-xl text-sm hover:bg-mint/90 transition flex items-center justify-center gap-2"
        >
          <MessageCircle size={16} />
          Open WhatsApp Chat
        </a>
      </div>
    );
  }
  if (activeTab === 'support' && !whatsappNumber) {
    return (
      <div className="p-3 border-t border-slate-200 bg-white safe-bottom">
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <AlertCircle size={15} className="text-amber-500 flex-shrink-0" />
          <p className="text-amber-700 text-xs">WhatsApp support is not configured. Contact your relationship manager.</p>
        </div>
      </div>
    );
  }
  if (activeTab === 'manager') {
    return (
      <div className="p-3 border-t border-slate-200 bg-white safe-bottom">
        <button
          onClick={() => navigate('/services')}
          className="w-full h-11 bg-navy text-white font-semibold rounded-xl text-sm hover:bg-navy/90 transition flex items-center justify-center gap-2"
        >
          <Calendar size={16} />
          Schedule Appointment
        </button>
      </div>
    );
  }
  return null;
}
