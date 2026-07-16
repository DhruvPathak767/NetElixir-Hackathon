/**
 * AIChat.jsx — Persistent AI Consultant Chat Page
 * Uses the real database-backed chat endpoints to reload, clear, and consult.
 * Extends the UX with typing animation, message copying, and custom avatars.
 */
import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, BrainCircuit, Sparkles, RotateCcw, Copy, Check } from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { TypingDots } from '../components/Loader.jsx';
import { useToast } from '../components/Toast.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { sendAIChat, getChatMessages, clearChatMessages } from '../services/aiApi.js';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_SUGGESTIONS = [
  'Which channel performed best?',
  'Why is profit negative?',
  'Recommend budget allocation',
  'Compare today\'s forecast with my last simulation',
  'Explain forecast confidence'
];

export default function AIChat() {
  const toast = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [suggestedQuestions, setSuggestedQuestions] = useState(INITIAL_SUGGESTIONS);
  const [copiedId, setCopiedId] = useState(null);
  
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // User initials
  const initials = (() => {
    if (!user) return 'U';
    const name = user.full_name || user.name || 'User';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  })();

  // 1. Reload chat history from database on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await getChatMessages();
        // Map backend schema (role, message, timestamp) to local state
        const loaded = data.map((m) => ({
          id: m.id,
          role: m.role === 'assistant' ? 'ai' : 'user',
          text: m.message,
          time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setMessages(loaded);
      } catch (err) {
        console.error('Failed to load chat history:', err);
        toast.error('Could not restore previous conversation.');
      } finally {
        setInitialLoading(false);
      }
    }
    loadHistory();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // 2. Submit prompt to AI Consultant
  const send = async (msgText) => {
    const textToSend = (msgText || input).trim();
    if (!textToSend || chatLoading) return;

    const newMsg = {
      role: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((m) => [...m, newMsg]);
    if (!msgText) setInput('');
    setChatLoading(true);

    try {
      const res = await sendAIChat(textToSend);
      const aiReply = {
        role: 'ai',
        text: res.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((m) => [...m, aiReply]);
      if (res.suggestedQuestions && res.suggestedQuestions.length > 0) {
        setSuggestedQuestions(res.suggestedQuestions);
      }
    } catch (err) {
      toast.error('AI consultant is unavailable right now');
      setMessages((m) => [...m, {
        role: 'ai',
        text: 'I apologize — I encountered an issue processing your query. Please try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // 3. Clear Chat Log
  const handleClearConversation = async () => {
    if (window.confirm('Are you sure you want to clear your conversation history? This cannot be undone.')) {
      try {
        await clearChatMessages();
        setMessages([]);
        setSuggestedQuestions(INITIAL_SUGGESTIONS);
        toast.success('Conversation history cleared.');
      } catch (err) {
        toast.error('Failed to clear conversation.');
      }
    }
  };

  const handleCopyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idx);
    toast.success('Response copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <StaggerContainer>
      <StaggerItem className="page-header">
        <div>
          <h1 className="page-title">AI Consultant Chat</h1>
          <p className="page-desc">Interact with your Senior eCommerce Marketing Consultant powered by ForecastIQ</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="badge badge-info"><Sparkles size={14} style={{ marginRight: 4 }} /> AI Active</span>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearConversation} leftIcon={<RotateCcw size={14} />}>
              Clear Chat
            </Button>
          )}
        </div>
      </StaggerItem>

      <StaggerItem style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <Card reveal padding="lg" style={{ minHeight: '580px', display: 'flex', flexDirection: 'column' }}>
          {/* Chat header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <span className="insight-icon opportunity" style={{ width: 42, height: 42, flexShrink: 0 }}>
              <BrainCircuit size={22} />
            </span>
            <div>
              <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text-primary)' }}>Marketing Consultant</div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                Specialized in Google Ads, Meta Ads, campaign ROAS, and budget strategy
              </div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-xs)', color: 'var(--success)', fontWeight: 600 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                Online
              </span>
            </div>
          </div>

          {/* Chat window */}
          <div
            className="chat-window"
            style={{ flex: 1, minHeight: '320px', maxHeight: '500px', overflowY: 'auto', padding: '4px 0' }}
          >
            {initialLoading ? (
              <div style={{ display: 'flex', flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
                <TypingDots />
              </div>
            ) : messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-sm)', padding: '64px 24px' }}
              >
                <BrainCircuit size={36} style={{ marginBottom: 12, color: 'var(--brand-400)', opacity: 0.6 }} />
                <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>Ask ForecastIQ AI about your marketing performance</div>
                <div style={{ fontSize: 'var(--fs-xs)' }}>Budget allocation · Forecast insights · Channel efficiency · ROAS optimization</div>
              </motion.div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    className={`chat-msg ${m.role}`}
                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 25 }}
                  >
                    <span className="chat-avatar" style={{ fontSize: 9, fontWeight: 700 }}>
                      {m.role === 'ai' ? <BrainCircuit size={15} /> : initials}
                    </span>
                    <div className="chat-bubble-container" style={{ position: 'relative' }}>
                      <div className="chat-bubble" style={{ whiteSpace: 'pre-line', paddingRight: m.role === 'ai' ? 36 : 12 }}>
                        {m.text}
                        {m.role === 'ai' && (
                          <button
                            type="button"
                            onClick={() => handleCopyText(m.text, i)}
                            className="chat-copy-btn"
                            style={{ position: 'absolute', right: 8, bottom: 8, opacity: 0.6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                            title="Copy message"
                          >
                            {copiedId === i ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 4, marginLeft: m.role === 'ai' ? 4 : 0, textAlign: m.role === 'user' ? 'right' : 'left' }}>
                        {m.time}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {chatLoading && (
                  <motion.div
                    key="loading"
                    className="chat-msg ai"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <span className="chat-avatar"><BrainCircuit size={15} /></span>
                    <div className="chat-bubble"><TypingDots /></div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input row */}
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Suggestions */}
            <AnimatePresence>
              {suggestedQuestions.length > 0 && !chatLoading && !initialLoading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
                >
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      className="tag"
                      onClick={() => send(q)}
                      disabled={chatLoading}
                      style={{ cursor: 'pointer', fontSize: 'var(--fs-xs)' }}
                    >
                      {q}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Text input + send */}
            <div className="chat-input-row" style={{ display: 'flex', gap: 10 }}>
              <input
                ref={inputRef}
                className="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about budget, forecast, channels, ROAS..."
                disabled={chatLoading || initialLoading}
                style={{ flex: 1 }}
                id="ai-chat-input"
              />
              <Button
                onClick={() => send()}
                loading={chatLoading}
                disabled={(!input.trim() && !chatLoading) || initialLoading}
                style={{ minWidth: 48, aspectRatio: '1 / 1', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Send message"
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        </Card>
      </StaggerItem>

      {/* Context panel */}
      <StaggerItem style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <Card reveal padding="lg" style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.04), transparent)', borderLeft: '3px solid var(--brand-400)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <MessageSquare size={18} style={{ color: 'var(--brand-400)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>AI Consultant Capabilities</div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                The AI Consultant is powered by your ForecastIQ models and data. It can help with
                <strong> budget split optimization</strong>, <strong>channel efficiency diagnostics</strong>,
                <strong> ROAS forecasting</strong>, <strong>weekend vs. weekday performance analysis</strong>,
                and <strong>campaign-level bid strategy recommendations</strong>. All responses are generated
                using deterministic marketing intelligence frameworks.
              </div>
            </div>
          </div>
        </Card>
      </StaggerItem>
    </StaggerContainer>
  );
}
