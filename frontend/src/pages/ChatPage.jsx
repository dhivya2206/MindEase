/**
 * pages/ChatPage.jsx
 * AI Wellness Chatbot — Part 9.
 *
 * Features:
 *   - Left sidebar: conversation history, new chat, delete
 *   - Main area: message thread, input, suggested prompts
 *   - Graceful error handling (AI unavailable, network errors)
 *   - Auto-scroll to latest message
 *   - Typing indicator while AI is responding
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import DashboardShell from '../components/dashboard/DashboardShell';
import { useTheme } from '../context/ThemeContext';
import * as chatService from '../services/chatService';

// ── Suggested prompts ─────────────────────────────────────────
const SUGGESTED_PROMPTS = [
  { icon: '😰', text: 'I feel stressed about my exams.' },
  { icon: '🌿', text: 'Help me relax.' },
  { icon: '🫁', text: 'Give me a breathing exercise.' },
  { icon: '🎯', text: 'I cannot focus today.' },
];

// ── Formatters ─────────────────────────────────────────────────
const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const formatRelativeDate = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// ── Markdown-ish renderer: bold, bullet lists, line breaks ─────
const renderMessageContent = (text) => {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Bold **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    // Bullet list item
    if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
      return (
        <li key={i} style={{ marginLeft: '1rem', marginBottom: '0.2rem' }}>
          {rendered}
        </li>
      );
    }
    return (
      <span key={i}>
        {rendered}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
};

// ── Typing indicator dots ─────────────────────────────────────
const TypingIndicator = ({ isDark }) => (
  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', padding: '0.25rem 0' }}>
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        style={{
          width: 8, height: 8, borderRadius: '50%',
          background: isDark ? 'rgba(108,99,255,0.6)' : '#6c63ff',
          animation: 'typingBounce 1.2s infinite',
          animationDelay: `${i * 0.2}s`,
        }}
      />
    ))}
  </div>
);

// ── Single message bubble ─────────────────────────────────────
const MessageBubble = ({ msg, isDark }) => {
  const isUser = msg.role === 'user';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: '0.6rem',
        marginBottom: '1rem',
        animation: 'fadeInUp 0.3s ease forwards',
      }}
    >
      {/* Avatar */}
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '10px', flexShrink: 0,
          background: 'linear-gradient(135deg,#6c63ff,#4ecdc4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.9rem',
        }}>🧠</div>
      )}

      {/* Bubble */}
      <div style={{
        maxWidth: '72%',
        padding: '0.75rem 1rem',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser
          ? 'linear-gradient(135deg,#6c63ff,#5a4fd9)'
          : isDark ? 'rgba(255,255,255,0.06)' : '#fff',
        color: isUser ? '#fff' : (isDark ? '#e8e6ff' : '#1a1a2e'),
        fontSize: '0.9rem',
        lineHeight: 1.65,
        boxShadow: isUser
          ? '0 4px 16px rgba(108,99,255,0.3)'
          : isDark ? '0 2px 12px rgba(0,0,0,0.2)' : '0 2px 12px rgba(108,99,255,0.08)',
        border: !isUser ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.08)'}` : 'none',
        wordBreak: 'break-word',
      }}>
        {renderMessageContent(msg.content)}
        <div style={{
          fontSize: '0.7rem',
          opacity: 0.55,
          marginTop: '0.4rem',
          textAlign: isUser ? 'right' : 'left',
        }}>
          {msg.createdAt ? formatTime(msg.createdAt) : ''}
        </div>
      </div>
    </div>
  );
};

// ── Sidebar conversation item ─────────────────────────────────
const ConvoItem = ({ convo, isActive, onSelect, onDelete, isDark }) => (
  <div
    style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.65rem 0.85rem',
      borderRadius: '10px',
      cursor: 'pointer',
      background: isActive
        ? (isDark ? 'rgba(108,99,255,0.15)' : 'rgba(108,99,255,0.09)')
        : 'transparent',
      borderLeft: `3px solid ${isActive ? '#6c63ff' : 'transparent'}`,
      transition: 'all 0.18s ease',
      marginBottom: '0.15rem',
    }}
    onClick={() => onSelect(convo.id)}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onSelect(convo.id)}
  >
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: '0.82rem', fontWeight: isActive ? 600 : 500,
        color: isActive ? '#6c63ff' : (isDark ? 'rgba(232,230,255,0.85)' : '#1a1a2e'),
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {convo.title || 'New Conversation'}
      </div>
      {convo.lastMessage && (
        <div style={{
          fontSize: '0.72rem', opacity: 0.5, marginTop: '0.1rem',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {convo.lastMessage}
        </div>
      )}
      <div style={{ fontSize: '0.68rem', opacity: 0.4, marginTop: '0.1rem' }}>
        {formatRelativeDate(convo.updatedAt)} · {convo.messageCount} msg{convo.messageCount !== 1 ? 's' : ''}
      </div>
    </div>
    <button
      id={`delete-convo-${convo.id}`}
      onClick={(e) => { e.stopPropagation(); onDelete(convo.id); }}
      title="Delete conversation"
      style={{
        width: 26, height: 26, borderRadius: '7px', border: 'none',
        background: 'transparent', cursor: 'pointer',
        color: isDark ? 'rgba(255,107,107,0.6)' : 'rgba(224,85,85,0.5)',
        fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'all 0.18s',
        opacity: 0,
      }}
      className="convo-delete-btn"
      aria-label="Delete conversation"
    >🗑️</button>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Main ChatPage component
// ─────────────────────────────────────────────────────────────
const ChatPage = () => {
  const { isDark } = useTheme();

  // Conversations sidebar state
  const [convos, setConvos] = useState([]);
  const [convosLoading, setConvosLoading] = useState(true);

  // Active conversation state
  const [activeConvoId, setActiveConvoId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [convoLoading, setConvoLoading] = useState(false);

  // Input & sending state
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Sidebar collapse (mobile)
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ── Auto-scroll to bottom ────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, sending, scrollToBottom]);

  // ── Load conversations on mount ───────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const list = await chatService.listConversations();
        setConvos(list);
      } catch {
        // silently fail — user can still create a new chat
      } finally {
        setConvosLoading(false);
      }
    };
    load();
  }, []);

  // ── Load a specific conversation ──────────────────────────────
  const selectConversation = useCallback(async (id) => {
    if (id === activeConvoId) return;
    setConvoLoading(true);
    setError(null);
    setMessages([]);
    setActiveConvoId(id);
    try {
      const convo = await chatService.getConversation(id);
      setMessages(convo.messages ?? []);
    } catch (err) {
      setError(err.message || 'Failed to load conversation');
    } finally {
      setConvoLoading(false);
    }
  }, [activeConvoId]);

  // ── Create new conversation ──────────────────────────────────
  const handleNewChat = useCallback(async () => {
    setError(null);
    try {
      const convo = await chatService.createConversation();
      setConvos((prev) => [
        { id: convo.id, title: convo.title, updatedAt: convo.updatedAt ?? new Date().toISOString(), messageCount: 0, lastMessage: null },
        ...prev,
      ]);
      setActiveConvoId(convo.id);
      setMessages([]);
      inputRef.current?.focus();
    } catch (err) {
      setError(err.message || 'Failed to create conversation');
    }
  }, []);

  // ── Delete conversation ───────────────────────────────────────
  const handleDelete = useCallback(async (id) => {
    try {
      await chatService.deleteConversation(id);
      setConvos((prev) => prev.filter((c) => c.id !== id));
      if (activeConvoId === id) {
        setActiveConvoId(null);
        setMessages([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete conversation');
    }
  }, [activeConvoId]);

  // ── Send message ──────────────────────────────────────────────
  const handleSend = useCallback(async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || sending) return;

    let convoId = activeConvoId;

    // If no active conversation, create one first
    if (!convoId) {
      try {
        const convo = await chatService.createConversation();
        convoId = convo.id;
        setActiveConvoId(convoId);
        setConvos((prev) => [
          { id: convo.id, title: convo.title, updatedAt: new Date().toISOString(), messageCount: 0, lastMessage: null },
          ...prev,
        ]);
      } catch (err) {
        setError(err.message || 'Failed to start conversation');
        return;
      }
    }

    // Optimistically add user message to UI
    const tempUserMsg = { role: 'user', content: trimmed, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInput('');
    setSending(true);
    setError(null);

    try {
      const result = await chatService.sendMessage(convoId, trimmed);

      // Add AI reply
      const aiMsg = { role: 'assistant', content: result.reply, createdAt: new Date().toISOString() };
      setMessages((prev) => [...prev, aiMsg]);

      // Update conversation list (title may have been auto-generated)
      setConvos((prev) =>
        prev.map((c) =>
          c.id === convoId
            ? { ...c, title: result.title || c.title, updatedAt: new Date().toISOString(), messageCount: c.messageCount + 2, lastMessage: trimmed.slice(0, 80) }
            : c
        )
      );
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.');
      // Remove the optimistically-added user message on error
      setMessages((prev) => prev.filter((m) => m !== tempUserMsg));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, sending, activeConvoId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Styles ────────────────────────────────────────────────────
  const sidebarBg = isDark ? 'rgba(15,14,26,0.97)' : '#fff';
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.09)';
  const mainBg = isDark ? 'rgba(26,24,48,0.5)' : 'rgba(248,247,255,0.8)';
  const textMain = isDark ? '#e8e6ff' : '#1a1a2e';
  const textMuted = isDark ? 'rgba(232,230,255,0.45)' : 'rgba(26,26,46,0.45)';

  const isEmptyState = !activeConvoId || (messages.length === 0 && !convoLoading);

  return (
    <DashboardShell>
      <div style={{
        display: 'flex',
        height: 'calc(100vh - 64px - 3.5rem)',
        minHeight: 500,
        borderRadius: '1.25rem',
        overflow: 'hidden',
        border: `1px solid ${border}`,
        boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : '0 8px 40px rgba(108,99,255,0.08)',
        background: mainBg,
      }}>

        {/* ── Left Sidebar ───────────────────────────────────── */}
        <div style={{
          width: sidebarOpen ? 280 : 0,
          minWidth: sidebarOpen ? 280 : 0,
          overflow: 'hidden',
          background: sidebarBg,
          borderRight: `1px solid ${border}`,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}>
          {/* Sidebar header */}
          <div style={{
            padding: '1rem',
            borderBottom: `1px solid ${border}`,
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.95rem', color: textMain }}>
                💬 Conversations
              </div>
            </div>
            <button
              id="new-chat-btn"
              onClick={handleNewChat}
              title="New conversation"
              style={{
                padding: '0.4rem 0.75rem', borderRadius: '9px',
                border: '1.5px solid #6c63ff',
                background: 'rgba(108,99,255,0.08)',
                color: '#6c63ff', fontWeight: 600, fontSize: '0.78rem',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#6c63ff'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(108,99,255,0.08)'; e.currentTarget.style.color = '#6c63ff'; }}
            >
              + New
            </button>
          </div>

          {/* Conversation list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {convosLoading ? (
              <div style={{ padding: '1rem', textAlign: 'center', opacity: 0.4, fontSize: '0.8rem', color: textMuted }}>
                Loading…
              </div>
            ) : convos.length === 0 ? (
              <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: textMuted, fontSize: '0.82rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌿</div>
                No conversations yet.
                <br />Start a new chat!
              </div>
            ) : (
              convos.map((c) => (
                <ConvoItem
                  key={c.id}
                  convo={c}
                  isActive={c.id === activeConvoId}
                  onSelect={selectConversation}
                  onDelete={handleDelete}
                  isDark={isDark}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Right: Chat Area ───────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Chat header */}
          <div style={{
            padding: '0.85rem 1.25rem',
            borderBottom: `1px solid ${border}`,
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: isDark ? 'rgba(15,14,26,0.6)' : 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(8px)',
          }}>
            <button
              id="chat-sidebar-toggle-btn"
              onClick={() => setSidebarOpen((o) => !o)}
              style={{
                width: 32, height: 32, borderRadius: '8px', border: `1px solid ${border}`,
                background: 'transparent', cursor: 'pointer', fontSize: '0.85rem',
                color: textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
            <div style={{
              width: 36, height: 36, borderRadius: '10px',
              background: 'linear-gradient(135deg,#6c63ff,#4ecdc4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', flexShrink: 0,
            }}>🧠</div>
            <div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.95rem', color: textMain }}>
                MindEase AI
              </div>
              <div style={{ fontSize: '0.72rem', color: textMuted }}>
                General wellness support · Not a substitute for professional care
              </div>
            </div>
          </div>

          {/* Messages area */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '1.25rem',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Empty / welcome state */}
            {isEmptyState && !convoLoading && (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', gap: '0.75rem', padding: '2rem',
                animation: 'fadeInUp 0.5s ease forwards',
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '20px',
                  background: 'linear-gradient(135deg,#6c63ff,#4ecdc4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', boxShadow: '0 8px 32px rgba(108,99,255,0.3)',
                  animation: 'pulse-glow 2.5s ease-in-out infinite',
                }}>🧠</div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 'clamp(1.1rem,3vw,1.35rem)', fontWeight: 700, color: textMain }}>
                  Hi! I'm MindEase AI 🌿
                </div>
                <div style={{ fontSize: '0.875rem', color: textMuted, maxWidth: 400, lineHeight: 1.7 }}>
                  I'm here to support your mental wellness journey. I can guide breathing exercises, help you relax, or just listen.
                  <br /><br />
                  <span style={{ fontStyle: 'italic', opacity: 0.75 }}>
                    I provide general wellness support only and am not a substitute for professional medical or mental health care.
                  </span>
                </div>

                {/* Suggested prompts */}
                <div style={{ marginTop: '1rem', width: '100%', maxWidth: 480 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: textMuted, marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Try a prompt
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {SUGGESTED_PROMPTS.map((p) => (
                      <button
                        key={p.text}
                        id={`suggested-prompt-${p.text.slice(0, 20).replace(/\s+/g, '-')}`}
                        onClick={() => handleSend(p.text)}
                        style={{
                          padding: '0.7rem 0.875rem',
                          borderRadius: '12px',
                          border: `1.5px solid ${isDark ? 'rgba(108,99,255,0.2)' : 'rgba(108,99,255,0.15)'}`,
                          background: isDark ? 'rgba(108,99,255,0.07)' : 'rgba(108,99,255,0.04)',
                          color: textMain, fontSize: '0.82rem', fontWeight: 500,
                          cursor: 'pointer', textAlign: 'left',
                          transition: 'all 0.2s ease', lineHeight: 1.4,
                          display: 'flex', alignItems: 'flex-start', gap: '0.4rem',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#6c63ff';
                          e.currentTarget.style.background = isDark ? 'rgba(108,99,255,0.14)' : 'rgba(108,99,255,0.09)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = isDark ? 'rgba(108,99,255,0.2)' : 'rgba(108,99,255,0.15)';
                          e.currentTarget.style.background = isDark ? 'rgba(108,99,255,0.07)' : 'rgba(108,99,255,0.04)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <span>{p.icon}</span>
                        <span>{p.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Loading state */}
            {convoLoading && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: textMuted, fontSize: '0.85rem' }}>
                <span style={{ marginRight: '0.5rem' }}>⏳</span> Loading conversation…
              </div>
            )}

            {/* Messages */}
            {!convoLoading && messages.map((msg, i) => (
              <MessageBubble key={msg.id ?? i} msg={msg} isDark={isDark} />
            ))}

            {/* Typing indicator */}
            {sending && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.6rem', marginBottom: '1rem', animation: 'fadeInUp 0.3s ease' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '10px', flexShrink: 0,
                  background: 'linear-gradient(135deg,#6c63ff,#4ecdc4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem',
                }}>🧠</div>
                <div style={{
                  padding: '0.75rem 1rem', borderRadius: '18px 18px 18px 4px',
                  background: isDark ? 'rgba(255,255,255,0.06)' : '#fff',
                  border: `1px solid ${border}`,
                  boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.2)' : '0 2px 12px rgba(108,99,255,0.08)',
                }}>
                  <TypingIndicator isDark={isDark} />
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div style={{
                margin: '0.75rem 0', padding: '0.75rem 1rem', borderRadius: '12px',
                background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.22)',
                color: isDark ? '#ff9494' : '#c0392b', fontSize: '0.85rem', lineHeight: 1.5,
                display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'fadeInUp 0.3s ease',
              }}>
                <span>⚠️</span>
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.6, fontSize: '0.95rem' }}
                >✕</button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div style={{
            padding: '0.875rem 1.25rem',
            borderTop: `1px solid ${border}`,
            background: isDark ? 'rgba(15,14,26,0.6)' : 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(8px)',
          }}>
            {/* Suggested prompts row (compact, when chat is active) */}
            {activeConvoId && messages.length > 0 && (
              <div style={{
                display: 'flex', gap: '0.4rem', marginBottom: '0.6rem', flexWrap: 'wrap',
              }}>
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p.text}
                    onClick={() => handleSend(p.text)}
                    disabled={sending}
                    style={{
                      padding: '0.3rem 0.65rem', borderRadius: '20px',
                      border: `1px solid ${isDark ? 'rgba(108,99,255,0.2)' : 'rgba(108,99,255,0.18)'}`,
                      background: 'transparent',
                      color: isDark ? 'rgba(232,230,255,0.65)' : 'rgba(26,26,46,0.6)',
                      fontSize: '0.73rem', cursor: sending ? 'not-allowed' : 'pointer',
                      transition: 'all 0.18s', whiteSpace: 'nowrap', opacity: sending ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!sending) {
                        e.currentTarget.style.borderColor = '#6c63ff';
                        e.currentTarget.style.color = '#6c63ff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isDark ? 'rgba(108,99,255,0.2)' : 'rgba(108,99,255,0.18)';
                      e.currentTarget.style.color = isDark ? 'rgba(232,230,255,0.65)' : 'rgba(26,26,46,0.6)';
                    }}
                  >
                    {p.icon} {p.text}
                  </button>
                ))}
              </div>
            )}

            {/* Text input row */}
            <div style={{
              display: 'flex', gap: '0.65rem', alignItems: 'flex-end',
            }}>
              <textarea
                id="chat-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
                disabled={sending}
                rows={1}
                style={{
                  flex: 1, padding: '0.7rem 1rem', borderRadius: '14px',
                  border: `1.5px solid ${isDark ? 'rgba(108,99,255,0.2)' : 'rgba(108,99,255,0.18)'}`,
                  background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                  color: textMain, fontSize: '0.9rem', lineHeight: 1.55,
                  resize: 'none', outline: 'none', fontFamily: 'inherit',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  maxHeight: 120, overflowY: 'auto',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#6c63ff'; e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.12)'; }}
                onBlur={(e) => { e.target.style.borderColor = isDark ? 'rgba(108,99,255,0.2)' : 'rgba(108,99,255,0.18)'; e.target.style.boxShadow = 'none'; }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
              />
              <button
                id="chat-send-btn"
                onClick={() => handleSend()}
                disabled={sending || !input.trim()}
                style={{
                  width: 44, height: 44, borderRadius: '12px', border: 'none',
                  background: sending || !input.trim()
                    ? (isDark ? 'rgba(108,99,255,0.2)' : 'rgba(108,99,255,0.15)')
                    : 'linear-gradient(135deg,#6c63ff,#5a4fd9)',
                  color: sending || !input.trim() ? (isDark ? 'rgba(232,230,255,0.3)' : 'rgba(108,99,255,0.3)') : '#fff',
                  cursor: sending || !input.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', flexShrink: 0,
                  boxShadow: !sending && input.trim() ? '0 4px 16px rgba(108,99,255,0.35)' : 'none',
                  transition: 'all 0.2s ease',
                }}
                title="Send message"
                aria-label="Send message"
              >
                {sending ? '⏳' : '➤'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Keyframe injection */}
      <style>{`
        .convo-delete-btn { opacity: 0; }
        div:hover > .convo-delete-btn,
        [role="button"]:hover .convo-delete-btn { opacity: 1 !important; }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        @media (max-width: 640px) {
          #chat-sidebar-toggle-btn { display: flex !important; }
        }
      `}</style>
    </DashboardShell>
  );
};

export default ChatPage;
