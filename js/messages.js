/**
 * Dharashiv Foundation - Direct Messaging & Supabase Realtime Module
 */

import { getSupabase } from './supabase-client.js';
import { getCurrentProfile } from './auth.js';
import { mockStore } from './mock-store.js';
import { formatDateTime, escapeHtml, showToast } from './ui.js';

let activeConversationId = null;
let activeRecipientProfile = null;
let realtimeChannel = null;

export async function initMessagesPage() {
  const currentProfile = await getCurrentProfile();
  const params = new URLSearchParams(window.location.search);
  const withUserId = params.get('with');

  await loadConversations(currentProfile, withUserId);
  setupMessageInput(currentProfile);
  setupRealtime(currentProfile);
}

async function loadConversations(currentProfile, targetUserId = null) {
  const convList = document.getElementById('conversationsList');
  if (!convList) return;

  const supabase = await getSupabase();
  let conversations = [];

  if (supabase.isMock) {
    conversations = mockStore.data.conversations || [];
  } else {
    const { data } = await supabase
      .from('conversation_participants')
      .select('conversation:conversations(*)')
      .eq('user_id', currentProfile.id);
    conversations = (data || []).map(d => d.conversation);
  }

  // If URL specified ?with=userId, ensure conversation exists
  if (targetUserId && targetUserId !== currentProfile.id) {
    const targetUser = mockStore.getProfile(targetUserId);
    if (targetUser) {
      activeRecipientProfile = targetUser;
      // Check existing
      let conv = conversations.find(c => {
        if (supabase.isMock) {
          return c.participants?.includes(targetUserId);
        }
        return false;
      });

      if (!conv) {
        // Create new
        if (supabase.isMock) {
          conv = {
            id: 'conv-' + Date.now(),
            participants: [currentProfile.id, targetUserId],
            updated_at: new Date().toISOString()
          };
          mockStore.data.conversations.unshift(conv);
          mockStore.save();
        }
      }
      activeConversationId = conv?.id;
    }
  }

  if (conversations.length === 0 && !activeConversationId) {
    convList.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--color-text-muted);">No conversations yet. Connect with members to start messaging!</div>';
    return;
  }

  convList.innerHTML = conversations.map(c => {
    let otherUser = null;
    if (supabase.isMock) {
      const otherId = c.participants.find(id => id !== currentProfile.id);
      otherUser = mockStore.getProfile(otherId);
    }

    const isActive = c.id === activeConversationId;
    return `
      <div class="conversation-item ${isActive ? 'active' : ''}" data-conv-id="${c.id}" data-user-id="${otherUser?.id || ''}" style="padding: 1rem; border-bottom: 1px solid var(--color-border-light); cursor: pointer; display: flex; align-items: center; gap: 0.85rem; background: ${isActive ? 'var(--color-light-orange)' : 'transparent'};">
        <img src="${otherUser?.avatar_url || '/assets/avatars/default-avatar.svg'}" style="width: 40px; height: 40px; border-radius: 9999px; object-fit: cover;" alt="Avatar" />
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 600; color: var(--color-primary-dark-brown); font-size: 0.9rem;">${escapeHtml(otherUser?.full_name || 'Member')}</div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">📍 ${escapeHtml(otherUser?.taluka || 'Dharashiv')}</div>
        </div>
      </div>
    `;
  }).join('');

  // Attach click listener
  convList.querySelectorAll('.conversation-item').forEach(item => {
    item.addEventListener('click', () => {
      const convId = item.dataset.convId;
      const otherId = item.dataset.userId;
      activeConversationId = convId;
      activeRecipientProfile = mockStore.getProfile(otherId);
      loadConversations(currentProfile);
      loadChatMessages(currentProfile, convId);
    });
  });

  // If an active conversation exists, load messages
  if (activeConversationId) {
    await loadChatMessages(currentProfile, activeConversationId);
  }
}

async function loadChatMessages(currentProfile, conversationId) {
  const chatHeader = document.getElementById('chatRecipientHeader');
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;

  if (chatHeader && activeRecipientProfile) {
    chatHeader.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.85rem;">
        <img src="${activeRecipientProfile.avatar_url || '/assets/avatars/default-avatar.svg'}" style="width: 42px; height: 42px; border-radius: 9999px;" alt="Avatar" />
        <div>
          <div style="font-weight: 700; color: var(--color-primary-dark-brown);">${escapeHtml(activeRecipientProfile.full_name)}</div>
          <div style="font-size: 0.75rem; color: var(--color-text-secondary);">${escapeHtml(activeRecipientProfile.profession || 'Member')} • 📍 ${escapeHtml(activeRecipientProfile.taluka || 'Dharashiv')}</div>
        </div>
      </div>
    `;
  }

  const supabase = await getSupabase();
  let messages = [];

  if (supabase.isMock) {
    messages = mockStore.data.messages.filter(m => m.conversation_id === conversationId);
  } else {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    messages = data || [];
  }

  if (messages.length === 0) {
    chatMessages.innerHTML = `
      <div style="text-align: center; color: var(--color-text-muted); padding: 3rem 1rem;">
        <div>Say hello to ${escapeHtml(activeRecipientProfile?.full_name || 'your connection')}! 👋</div>
        <div style="font-size: 0.75rem; margin-top: 0.5rem;">Messages are private and encrypted in Supabase cloud database.</div>
      </div>
    `;
    return;
  }

  chatMessages.innerHTML = messages.map(m => {
    const isMine = m.sender_id === currentProfile.id;
    return `
      <div style="display: flex; justify-content: ${isMine ? 'flex-end' : 'flex-start'}; margin-bottom: 0.85rem;">
        <div style="max-width: 70%; padding: 0.75rem 1rem; border-radius: ${isMine ? '14px 14px 2px 14px' : '14px 14px 14px 2px'}; background: ${isMine ? 'var(--color-primary-orange)' : 'var(--color-surface)'}; color: ${isMine ? '#FFFFFF' : 'var(--color-text-primary)'}; border: 1px solid ${isMine ? 'transparent' : 'var(--color-border)'}; box-shadow: var(--shadow-sm);">
          <div style="font-size: 0.9rem; line-height: 1.4;">${escapeHtml(m.content)}</div>
          <div style="font-size: 0.65rem; margin-top: 0.25rem; text-align: right; opacity: 0.8;">${formatDateTime(m.created_at)}</div>
        </div>
      </div>
    `;
  }).join('');

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function setupMessageInput(currentProfile) {
  const sendBtn = document.getElementById('sendMessageBtn');
  const messageInput = document.getElementById('chatMessageInput');

  if (sendBtn && messageInput) {
    const handleSend = async () => {
      const text = messageInput.value.trim();
      if (!text || !activeConversationId) return;

      messageInput.value = '';
      sendBtn.disabled = true;

      try {
        const supabase = await getSupabase();
        if (supabase.isMock) {
          const newMsg = {
            id: 'msg-' + Date.now(),
            conversation_id: activeConversationId,
            sender_id: currentProfile.id,
            content: text,
            is_read: false,
            created_at: new Date().toISOString()
          };
          mockStore.data.messages.push(newMsg);
          mockStore.save();
        } else {
          await supabase.from('messages').insert({
            conversation_id: activeConversationId,
            sender_id: currentProfile.id,
            content: text
          });
        }

        await loadChatMessages(currentProfile, activeConversationId);
      } catch (err) {
        showToast('Failed to send message.', 'error');
      } finally {
        sendBtn.disabled = false;
      }
    };

    sendBtn.addEventListener('click', handleSend);
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
  }
}

function setupRealtime(currentProfile) {
  getSupabase().then(supabase => {
    if (supabase.isMock) return;

    realtimeChannel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        if (payload.new && payload.new.conversation_id === activeConversationId) {
          loadChatMessages(currentProfile, activeConversationId);
        }
      })
      .subscribe();
  });
}
