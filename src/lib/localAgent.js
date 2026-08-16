import { offlineStore, offlineUser } from '@/lib/offlineStore';

const money = value => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
}).format(Number(value || 0));

function displayName() {
  return offlineUser.preferred_name || offlineUser.full_name || 'Member';
}

function accountSummary() {
  const accounts = offlineStore.filter('Account', { user_id: offlineUser.id });
  const total = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  return {
    accounts,
    total,
    text: accounts.map(account => `• ${account.account_name}: ${money(account.balance)} (${account.status})`).join('\n'),
  };
}

function recentTransactions() {
  return offlineStore.filter('Transaction', { user_id: offlineUser.id }, '-created_date', 5);
}

export function generateLocalTitle(message = '') {
  const clean = message.replace(/\s+/g, ' ').trim();
  if (!clean) return 'New Conversation';
  const words = clean.split(' ').slice(0, 6).join(' ');
  return words.length > 48 ? `${words.slice(0, 48)}…` : words;
}

export function getLocalAgentResponse({ userMessage = '', mode = 'member' } = {}) {
  const prompt = userMessage.toLowerCase();
  const summary = accountSummary();
  const transactions = recentTransactions();

  if (mode === 'admin' || /code|architecture|security review|component|refactor|deploy|publish|project structure/.test(prompt)) {
    return `Local VANTORIS Dev Agent\n\nI am operating without a hosted LLM. I can still provide deterministic guidance from the application rules:\n\n• Keep financial mutations behind authenticated, audited actions.\n• Validate amounts, ownership, and approval status before creating transactions.\n• Keep member visibility scoped by user_id and never expose another member's accounts.\n• Treat publishing, destructive changes, and schema changes as human-approved operations.\n• Prefer local adapters and explicit errors over silent service fallbacks.\n\nRequested focus: ${userMessage.trim() || 'general architecture review'}\n\nNo remote model or subscription is required for this response.`;
  }

  if (/balance|how much|available|total/.test(prompt)) {
    return `Your current local workspace balance is ${money(summary.total)} across ${summary.accounts.length} account${summary.accounts.length === 1 ? '' : 's'}.\n\n${summary.text || 'No accounts are currently recorded.'}\n\nThis answer came from the local VANTORIS data adapter.`;
  }

  if (/transaction|recent activity|payments|spending/.test(prompt)) {
    const text = transactions.length
      ? transactions.map(item => `• ${item.description || item.type}: ${money(item.amount)} — ${new Date(item.transaction_date || item.created_date).toLocaleDateString()}`).join('\n')
      : 'No transactions are recorded yet.';
    return `Here are your latest local transactions:\n\n${text}\n\nYou can open Accounts for the full transaction history.`;
  }

  if (/kyc|identity|verify|verification/.test(prompt)) {
    return `Your identity verification status is ${offlineUser.verification_status === 'verified' ? 'verified' : 'pending review'}.\n\nThe local workspace is configured with the same approval rules as the hosted application, so you can continue testing KYC-dependent screens without a third-party AI or database subscription.`;
  }

  if (/statement|pdf|document|tax/.test(prompt)) {
    return 'You can generate and download a branded statement from an account detail page. The local adapter keeps transactions in this browser and the PDF generator works without a hosted AI service.';
  }

  if (/transfer|send|wire|ach|move money|deposit|withdraw/.test(prompt)) {
    return 'You can use Move Money to prepare internal transfers, send requests, ACH, domestic or international wires, check deposits, and QR Pay. Requests are recorded locally in offline mode and remain pending for review.';
  }

  if (/card|freeze|lost|virtual/.test(prompt)) {
    const cards = offlineStore.filter('Card', { user_id: offlineUser.id });
    return cards.length
      ? `Your local workspace has ${cards.length} card${cards.length === 1 ? '' : 's'} on file. Card controls remain available from Profile, including freeze, lock, and replacement requests.`
      : 'No cards are currently recorded. You can request one from Profile.';
  }

  if (/investment|portfolio|trading|performance/.test(prompt)) {
    const accounts = offlineStore.filter('TradingAccount', { user_id: offlineUser.id });
    const total = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
    return `Your local investment portfolio is ${money(total)} across ${accounts.length} investment account${accounts.length === 1 ? '' : 's'}. Open Investments to view account-level performance, transactions, portfolio allocation, orders, statements, and documents.`;
  }

  return `I’m the local VANTORIS Advisor. I work without Base44, Lovable, Replit services, or any LLM subscription.\n\nI can help with:\n• balances and recent transactions\n• KYC and identity status\n• transfers, wires, ACH, deposits, and withdrawals\n• cards and investment accounts\n• statements, documents, and security\n\nTry asking: “What is my current balance?”`;
}

export function getLocalConversationResponse(messages = [], mode = 'member') {
  const lastUserMessage = [...messages].reverse().find(message => message.role === 'user');
  return getLocalAgentResponse({ userMessage: lastUserMessage?.content || '', mode });
}