const STORAGE_KEY = 'vantoris_offline_store_v1';
const USER_ID = 'offline-member-001';

function now() {
  return new Date().toISOString();
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const seed = {
  User: [{
    id: USER_ID,
    role: 'user',
    full_name: 'Alex Morgan',
    preferred_name: 'Alex Morgan',
    email: 'member@vantoris.local',
    phone: '+1 (555) 010-2040',
    verification_status: 'verified',
    created_date: '2025-01-15T10:00:00.000Z',
  }],
  Application: [{
    id: 'offline-application-001',
    user_id: USER_ID,
    application_status: 'approved',
    kyc_status: 'approved',
    account_type: 'Personal',
    created_date: '2025-01-15T10:00:00.000Z',
  }],
  Account: [
    {
      id: 'offline-account-001',
      user_id: USER_ID,
      account_name: 'Private Reserve',
      account_type: 'Personal',
      account_number: 'VAN-4821-001',
      balance: 125000,
      status: 'active',
      currency: 'USD',
      created_date: '2025-01-20T10:00:00.000Z',
    },
    {
      id: 'offline-account-002',
      user_id: USER_ID,
      account_name: 'Growth Savings',
      account_type: 'Savings',
      account_number: 'VAN-4821-002',
      balance: 35000,
      status: 'active',
      currency: 'USD',
      created_date: '2025-02-02T10:00:00.000Z',
    },
  ],
  Transaction: [
    {
      id: 'offline-transaction-001',
      user_id: USER_ID,
      account_id: 'offline-account-001',
      type: 'credit',
      amount: 15000,
      description: 'Portfolio distribution',
      reference: 'OFFLINE-CR-001',
      status: 'completed',
      transaction_date: '2026-07-12T14:30:00.000Z',
      created_date: '2026-07-12T14:30:00.000Z',
    },
    {
      id: 'offline-transaction-002',
      user_id: USER_ID,
      account_id: 'offline-account-001',
      type: 'debit',
      amount: -2400,
      description: 'Private banking transfer',
      reference: 'OFFLINE-DB-002',
      status: 'completed',
      transaction_date: '2026-07-09T09:15:00.000Z',
      created_date: '2026-07-09T09:15:00.000Z',
    },
  ],
  TradingAccount: [{
    id: 'offline-trading-001',
    user_id: USER_ID,
    account_name: 'Long-Term Portfolio',
    account_number: 'TRD-OFFLINE-001',
    account_type: 'Mixed',
    balance: 78500,
    equity: 80125,
    margin_available: 157000,
    leverage: 2,
    status: 'active',
    created_date: '2025-03-01T10:00:00.000Z',
  }],
  Card: [{
    id: 'offline-card-001',
    user_id: USER_ID,
    card_name: 'Alex Morgan',
    holder_name: 'Alex Morgan',
    card_type: 'Private Debit',
    last_four: '4821',
    status: 'active',
    expiry_date: '12/29',
    created_date: '2025-02-05T10:00:00.000Z',
  }],
  Notification: [{
    id: 'offline-notification-001',
    user_id: USER_ID,
    title: 'Offline workspace ready',
    message: 'VANTORIS is running locally. Your data stays in this browser until a hosted data service is connected.',
    type: 'info',
    read: false,
    created_date: now(),
  }],
  ServiceRequest: [],
  WithdrawalRequest: [],
  AuditLog: [],
  MessageThread: [],
  Document: [],
  AgentConversation: [],
  VerificationRequest: [],
  ServiceTemplate: [],
  AppConfiguration: [{ id: 'offline-config-whatsapp', key: 'whatsapp_number', value: '' }],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readStore() {
  if (typeof window === 'undefined') return clone(seed);
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...clone(seed), ...JSON.parse(stored) };
  } catch (error) {
    console.warn('Offline store read failed:', error);
  }
  return clone(seed);
}

let memoryStore = readStore();

function persist() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
  } catch (error) {
    console.warn('Offline store write failed:', error);
  }
}

function matches(record, query = {}) {
  return Object.entries(query).every(([key, expected]) => {
    if (expected === undefined || expected === null || expected === '') return true;
    const actual = record[key];
    if (Array.isArray(expected)) return expected.includes(actual);
    if (Array.isArray(actual)) return actual.includes(expected);
    return String(actual ?? '').toLowerCase() === String(expected).toLowerCase();
  });
}

function sortRecords(records, sort = '-created_date') {
  const field = String(sort || '-created_date');
  const descending = field.startsWith('-');
  const key = descending ? field.slice(1) : field;
  return records.sort((a, b) => {
    const left = a[key] ?? '';
    const right = b[key] ?? '';
    if (left === right) return 0;
    const result = left > right ? 1 : -1;
    return descending ? -result : result;
  });
}

export const offlineUser = clone(seed.User[0]);

export const offlineStore = {
  list(entityName, sort = '-created_date', limit) {
    const records = sortRecords(clone(memoryStore[entityName] || []), sort);
    return typeof limit === 'number' ? records.slice(0, limit) : records;
  },

  filter(entityName, query = {}, sort = '-created_date', limit) {
    const records = (memoryStore[entityName] || []).filter(record => matches(record, query));
    const sorted = sortRecords(clone(records), sort);
    return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
  },

  get(entityName, id) {
    const record = (memoryStore[entityName] || []).find(item => item.id === id);
    return record ? clone(record) : null;
  },

  create(entityName, payload = {}) {
    const record = {
      ...payload,
      id: payload.id || makeId(entityName.toLowerCase()),
      created_date: payload.created_date || now(),
      updated_date: now(),
    };
    if (!memoryStore[entityName]) memoryStore[entityName] = [];
    memoryStore[entityName].push(record);
    persist();
    return clone(record);
  },

  update(entityName, id, patch = {}) {
    const records = memoryStore[entityName] || [];
    const index = records.findIndex(item => item.id === id);
    if (index === -1) throw new Error(`${entityName} record ${id} was not found locally`);
    records[index] = { ...records[index], ...patch, updated_date: now() };
    persist();
    return clone(records[index]);
  },

  delete(entityName, id) {
    const records = memoryStore[entityName] || [];
    memoryStore[entityName] = records.filter(item => item.id !== id);
    persist();
    return { id, deleted: true };
  },

  reset() {
    memoryStore = clone(seed);
    persist();
  },

  snapshot() {
    return clone(memoryStore);
  },
};

export function isOfflineStoreEmpty() {
  return Object.values(memoryStore).every(value => !value?.length);
}