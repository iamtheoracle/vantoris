import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { getMemberDisplayName } from '@/lib/memberName';
import { logAuditEntry } from '@/lib/auditLogger';
import {
  Bot, Send, Code2, GitPullRequest, BarChart2, ShieldAlert,
  Loader2, AlertTriangle, RefreshCw, Copy, Check,
} from 'lucide-react';

const CAPABILITIES = [
  { icon: Code2, label: 'Review project structure', prompt: 'Review the VANTORIS project structure and summarize the architecture.' },
  { icon: BarChart2, label: 'Analyze component quality', prompt: 'Analyze the quality and completeness of the VANTORIS frontend components.' },
  { icon: GitPullRequest, label: 'Suggest improvements', prompt: 'What are the top 5 improvements I should make to the VANTORIS codebase?' },
  { icon: ShieldAlert, label: 'Security review', prompt: 'Review VANTORIS for common security concerns in a banking application.' },
];

export default function AdminAIMode() {
  const [user, setUser] = useState(null);
  const [authorized, setAuthorized] = useState(null); // null = checking
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Welcome to VANTORIS AI Development Mode.\n\nThis workspace is restricted to authorized administrators and developers. I can help you:\n\n• Review the project structure and component architecture\n• Analyze code quality and suggest improvements\n• Identify security and compliance considerations\n• Generate code suggestions and patches\n• Recommend deployment strategies\n\n**Note:** Any deployment or publishing action requires explicit administrator approval before execution. I will never perform deployments autonomously.\n\nHow can I assist you today?`,
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const bottomRef = useRef(null);

  const ADMIN_ROLES = ['admin', 'developer', 'executive', 'ops'];

  useEffect(() => {
    base44.auth.me().then(me => {
      setUser(me);
      const role = me?.role || '';
      setAuthorized(ADMIN_ROLES.includes(role));
      if (ADMIN_ROLES.includes(role)) {
        logAuditEntry({
          action: 'AI_DEV_MODE_ACCESS',
          actor_id: me.id,
          entity_type: 'AdminAIMode',
          description: `Admin AI Dev Mode accessed by ${getMemberDisplayName(me)} (${role})`,
        }).catch(() => {});
      }
    }).catch(() => setAuthorized(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(content) {
    if (!content.trim() || loading) return;
    const userMsg = { role: 'user', content: content.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Use the Base44 agent for AI responses
      const history = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const systemPrompt = `You are VANTORIS Dev AI, an expert software architect and banking platform specialist restricted to authorized administrators only.

You assist with:
- Reviewing React/Vite frontend code and Base44 SDK integration
- Analyzing component architecture, security, and compliance
- Suggesting code improvements and best practices for banking applications
- Generating code patches and pull request descriptions

IMPORTANT CONSTRAINTS:
- You NEVER perform actual deployments or publish the application without explicit administrator approval
- Always recommend human review before any code changes are applied to production
- Flag any security-sensitive suggestions for additional review
- You have read-only analysis capabilities; actual execution requires developer action

The VANTORIS stack: React 18, Vite 6, Tailwind CSS, Radix UI, Base44 SDK, TanStack Query, React Router v6.`;

      const response = await base44.agents.initiate({
        agentName: 'VantorisDevAI',
        userMessage: userMsg.content,
        systemPrompt,
        conversationHistory: history.slice(-10),
      }).catch(() => null);

      const replyContent = response?.content || response?.message || response?.reply ||
        `I've noted your request: "${userMsg.content}"\n\nFor VANTORIS AI Dev Mode assistance, ensure the VantorisDevAI agent is configured in your Base44 backend. In the meantime, I can provide general architectural guidance based on common patterns for React/Base44 banking applications.\n\nWould you like me to elaborate on any specific aspect of the codebase?`;

      setMessages(prev => [...prev, { role: 'assistant', content: replyContent }]);

      await logAuditEntry({
        action: 'AI_DEV_MODE_QUERY',
        actor_id: user?.id,
        entity_type: 'AdminAIMode',
        description: `Query: ${userMsg.content.slice(0, 100)}`,
      }).catch(() => {});
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I encountered an error processing your request: ${e.message || 'Unknown error'}.\n\nPlease check that the AI agent is properly configured in the Base44 backend, or try again.`,
      }]);
    }
    setLoading(false);
  }

  function copyMessage(content, idx) {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(idx);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  // Access check
  if (authorized === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-brass" />
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto bg-crimson/10 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert size={28} className="text-crimson" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Access Restricted</h2>
          <p className="text-gray text-sm">
            AI Development Mode is available only to authorized administrators and developers.
            Contact your system administrator if you require access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b border-border bg-white/50 backdrop-blur px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brass/10 flex items-center justify-center">
              <Bot size={20} className="text-brass" />
            </div>
            <div>
              <h2 className="text-foreground font-bold text-base">AI Development Mode</h2>
              <p className="text-gray text-xs">Administrator-only · {getMemberDisplayName(user)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
              Admin Only
            </span>
            <button
              onClick={() => setMessages([{ role: 'assistant', content: 'Session cleared. How can I help you?' }])}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              title="Clear conversation"
            >
              <RefreshCw size={15} className="text-gray" />
            </button>
          </div>
        </div>

        {/* Quick capability prompts */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {CAPABILITIES.map(cap => {
            const Icon = cap.icon;
            return (
              <button
                key={cap.label}
                onClick={() => sendMessage(cap.prompt)}
                disabled={loading}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-brass/10 hover:text-brass text-gray rounded-lg text-xs font-medium transition-all disabled:opacity-40"
              >
                <Icon size={13} />
                {cap.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] relative group ${msg.role === 'user' ? 'order-1' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-brass/10 flex items-center justify-center mb-1.5">
                  <Bot size={14} className="text-brass" />
                </div>
              )}
              <div
                className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brass text-white rounded-tr-sm'
                    : 'bg-white border border-border text-foreground rounded-tl-sm shadow-sm'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'assistant' && (
                <button
                  onClick={() => copyMessage(msg.content, idx)}
                  className="absolute top-8 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-100"
                >
                  {copied === idx ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-gray" />}
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-brass" />
                <span className="text-gray text-xs">Analyzing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Deployment warning banner */}
      <div className="px-4 py-1.5 bg-amber-50 border-t border-amber-200 flex-shrink-0">
        <p className="text-amber-700 text-[10px] text-center flex items-center justify-center gap-1">
          <AlertTriangle size={10} />
          Deployment and publishing require explicit administrator approval. AI suggestions are for review only.
        </p>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-white px-4 py-3 flex-shrink-0">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Ask about the codebase, request a code review, or analyze architecture..."
            rows={2}
            disabled={loading}
            className="flex-1 bg-slate-50 border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:border-brass/50 focus:outline-none resize-none disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-10 h-10 bg-brass text-white rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-brass/90 transition-all flex-shrink-0"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <p className="text-gray/50 text-[10px] mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
