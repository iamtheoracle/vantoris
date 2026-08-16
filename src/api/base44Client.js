import { appParams } from '@/lib/app-params';
import { offlineStore, offlineUser } from '@/lib/offlineStore';
import { generateLocalTitle, getLocalAgentResponse } from '@/lib/localAgent';

const hasRemoteConfig = Boolean(appParams.appId && (appParams.appBaseUrl || appParams.token));
const remoteOptIn = import.meta.env.VITE_VANTORIS_REMOTE === 'true';
export const isOfflineMode =
  import.meta.env.VITE_VANTORIS_OFFLINE === 'true' ||
  !remoteOptIn ||
  !hasRemoteConfig ||
  !appParams.token;

let remoteClientPromise = null;

async function getRemoteClient() {
  if (isOfflineMode || !hasRemoteConfig) return null;
  if (!remoteClientPromise) {
    remoteClientPromise = import('@base44/sdk').then(({ createClient }) => createClient({
      appId: appParams.appId,
      token: appParams.token,
      functionsVersion: appParams.functionsVersion,
      serverUrl: '',
      requiresAuth: false,
      appBaseUrl: appParams.appBaseUrl,
    }));
  }
  return remoteClientPromise;
}

async function tryRemote(operation, fallback) {
  const client = await getRemoteClient();
  if (!client || isOfflineMode) return fallback();
  try {
    return await operation(client);
  } catch (error) {
    console.warn('Remote service unavailable; using local adapter:', error?.message || error);
    return fallback();
  }
}

function localEntity(entityName) {
  return {
    async list(sort, limit) {
      return offlineStore.list(entityName, sort, limit);
    },
    async filter(query, sort, limit) {
      return offlineStore.filter(entityName, query, sort, limit);
    },
    async get(id) {
      return offlineStore.get(entityName, id);
    },
    async create(payload) {
      return offlineStore.create(entityName, payload);
    },
    async update(id, patch) {
      return offlineStore.update(entityName, id, patch);
    },
    async delete(id) {
      return offlineStore.delete(entityName, id);
    },
    subscribe() {
      // Local mode has no server push stream. Screens still load from the
      // local store and can refresh after a mutation without throwing.
      return () => {};
    },
  };
}

function resilientEntity(entityName) {
  const local = localEntity(entityName);
  return {
    list: (sort, limit) => tryRemote(
      client => client.entities[entityName].list(sort, limit),
      () => local.list(sort, limit),
    ),
    filter: (query, sort, limit) => tryRemote(
      client => client.entities[entityName].filter(query, sort, limit),
      () => local.filter(query, sort, limit),
    ),
    get: id => tryRemote(
      client => client.entities[entityName].get(id),
      () => local.get(id),
    ),
    create: payload => tryRemote(
      client => client.entities[entityName].create(payload),
      () => local.create(payload),
    ),
    update: (id, patch) => tryRemote(
      client => client.entities[entityName].update(id, patch),
      () => local.update(id, patch),
    ),
    delete: id => tryRemote(
      client => client.entities[entityName].delete(id),
      () => local.delete(id),
    ),
    subscribe: listener => {
      if (isOfflineMode) return local.subscribe(listener);
      let remoteUnsubscribe = null;
      let disposed = false;
      getRemoteClient()
        .then(client => client?.entities[entityName]?.subscribe(listener))
        .then(unsubscribe => {
          if (disposed) unsubscribe?.();
          else remoteUnsubscribe = unsubscribe;
        })
        .catch(error => console.warn('Remote subscription unavailable:', error?.message || error));
      return () => {
        disposed = true;
        remoteUnsubscribe?.();
      };
    },
  };
}

const entities = new Proxy({}, {
  get: (_, entityName) => resilientEntity(entityName),
});

function localAuth() {
  return {
    async me() {
      return { ...offlineUser };
    },
    async updateMe(patch) {
      const updated = offlineStore.update('User', offlineUser.id, patch);
      Object.assign(offlineUser, updated);
      return { ...offlineUser };
    },
    logout() {
      return undefined;
    },
    redirectToLogin() {
      return undefined;
    },
    async resetPasswordRequest() {
      return { ok: true, offline: true };
    },
    async resetPassword() {
      return { ok: true, offline: true };
    },
  };
}

const conversationListeners = new Map();

function notifyConversation(conversation) {
  (conversationListeners.get(conversation.id) || []).forEach(listener => listener({
    ...conversation,
    messages: [...conversation.messages],
  }));
}

function localConversationRecords(agentName) {
  return offlineStore
    .list('AgentConversation')
    .filter(conversation => !agentName || conversation.agent_name === agentName);
}

function localAgents() {
  return {
    async listConversations({ agent_name: agentName } = {}) {
      return localConversationRecords(agentName);
    },
    async createConversation({ agent_name: agentName, metadata = {} } = {}) {
      return offlineStore.create('AgentConversation', {
        agent_name: agentName || 'vantoris_assistant',
        metadata,
        messages: [],
      });
    },
    async addMessage(conversation, message) {
      const current = offlineStore.get('AgentConversation', conversation.id) || conversation;
      current.messages = [...(current.messages || []), { ...message, created_date: new Date().toISOString() }];
      offlineStore.update('AgentConversation', current.id, { messages: current.messages });
      notifyConversation(current);

      const mode = current.agent_name?.toLowerCase().includes('dev') || current.agent_name?.toLowerCase().includes('admin')
        ? 'admin'
        : 'member';
      const reply = getLocalAgentResponse({ userMessage: message.content, mode });
      setTimeout(() => {
        current.messages = [
          ...current.messages,
          { role: 'assistant', content: reply, created_date: new Date().toISOString() },
        ];
        offlineStore.update('AgentConversation', current.id, { messages: current.messages });
        notifyConversation(current);
      }, 250);
      return current;
    },
    subscribeToConversation(id, listener) {
      const listeners = conversationListeners.get(id) || [];
      conversationListeners.set(id, [...listeners, listener]);
      const conversation = offlineStore.get('AgentConversation', id);
      if (conversation) listener({ ...conversation, messages: [...conversation.messages] });
      return () => {
        const remaining = (conversationListeners.get(id) || []).filter(item => item !== listener);
        conversationListeners.set(id, remaining);
      };
    },
    async initiate({ userMessage, conversationHistory = [], systemPrompt = '' } = {}) {
      const mode = /dev ai|codebase|architecture|security review/i.test(systemPrompt) ? 'admin' : 'member';
      return {
        content: getLocalAgentResponse({ userMessage, history: conversationHistory, mode }),
        offline: true,
      };
    },
  };
}

function localCore() {
  return {
    async InvokeLLM({ prompt = '' } = {}) {
      return {
        response: generateLocalTitle(prompt.replace(/^.*?"([^"]+)".*$/s, '$1')),
        offline: true,
      };
    },
    async UploadFile({ file } = {}) {
      if (!file) throw new Error('No file was provided');
      const file_url = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      return { file_url, offline: true };
    },
    async SendEmail({ to, subject, body } = {}) {
      // Preserve the operation locally so flows can be exercised without
      // email credentials or a transactional email subscription.
      offlineStore.create('Notification', {
        user_id: offlineUser.id,
        title: subject || 'Local email',
        message: `Queued locally for ${to || 'recipient'}.\n\n${body || ''}`,
        type: 'info',
        offline: true,
      });
      return { ok: true, queued: true, offline: true };
    },
  };
}

const auth = {
  me: () => tryRemote(client => client.auth.me(), () => localAuth().me()),
  updateMe: patch => tryRemote(client => client.auth.updateMe(patch), () => localAuth().updateMe(patch)),
  logout: (...args) => {
    if (!isOfflineMode) {
      return getRemoteClient().then(client => client?.auth.logout(...args));
    }
    return localAuth().logout(...args);
  },
  redirectToLogin: (...args) => {
    if (!isOfflineMode) {
      return getRemoteClient().then(client => client?.auth.redirectToLogin(...args));
    }
    return localAuth().redirectToLogin(...args);
  },
  resetPasswordRequest: email => tryRemote(
    client => client.auth.resetPasswordRequest(email),
    () => localAuth().resetPasswordRequest(email),
  ),
  resetPassword: payload => tryRemote(
    client => client.auth.resetPassword(payload),
    () => localAuth().resetPassword(payload),
  ),
};

const agents = localAgents();
const core = localCore();
const users = {
  async inviteUser(email, role = 'user') {
    return offlineStore.create('User', {
      email,
      full_name: email.split('@')[0],
      role,
      invited: true,
      verification_status: 'pending',
    });
  },
};

export const base44 = {
  entities,
  auth,
  users,
  // Agents are local-first. Hosted agent responses remain an optional future adapter.
  agents,
  integrations: { Core: core },
};