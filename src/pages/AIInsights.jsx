import { useState, useEffect, useRef } from 'react';
import { Sparkles, AlertTriangle, Lightbulb, CalendarClock, Send, TrendingUp, BrainCircuit } from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { TypingDots } from '../components/Loader.jsx';
import { useToast } from '../components/Toast.jsx';
import { getAIInsights, sendAIChat } from '../services/api.js';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_META = {
  opportunity: { icon: Sparkles, cls: 'opportunity', label: 'Opportunity' },
  warning: { icon: AlertTriangle, cls: 'warning', label: 'Warning' },
  insight: { icon: Lightbulb, cls: 'insight', label: 'Insight' },
  seasonality: { icon: CalendarClock, cls: 'seasonality', label: 'Seasonality' },
};

export default function AIInsights() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    getAIInsights().then((d) => { setData(d); setLoading(false); });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  const send = async () => {
    if (!input.trim() || chatLoading) return;
    const msg = input.trim();
    setMessages((m) => [...m, { role: 'user', text: msg }]);
    setInput('');
    setChatLoading(true);
    try {
      const res = await sendAIChat(msg);
      setMessages((m) => [...m, { role: 'ai', text: res.reply }]);
    } catch {
      toast.error('AI is unavailable right now');
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) return null;

  return (
    <StaggerContainer>
      <StaggerItem className="page-header">
        <div>
          <h1 className="page-title">AI Insights</h1>
          <p className="page-desc">Automated recommendations from your marketing data</p>
        </div>
        <span className="badge badge-info"><Sparkles size={14} /> AI-powered</span>
      </StaggerItem>

      <StaggerItem className="grid-dashboard">
        {/* Insights list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {data.insights.map((ins) => {
            const meta = TYPE_META[ins.type] || TYPE_META.insight;
            const Icon = meta.icon;
            return (
              <Card key={ins.id} reveal padding="lg" className="insight-card">
                <span className={`insight-icon ${meta.cls}`}><Icon size={20} /></span>
                <div className="insight-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="badge badge-muted">{meta.label}</span>
                    <span className="badge badge-success">{ins.impact}</span>
                  </div>
                  <div className="insight-title">{ins.title}</div>
                  <div className="insight-desc">{ins.desc}</div>
                  <div className="insight-meta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                      <BrainCircuit size={14} /> Confidence: {(ins.confidence * 100).toFixed(0)}%
                    </div>
                    <div className="confidence-bar" style={{ width: 80 }}><div className="confidence-fill" style={{ width: `${ins.confidence * 100}%` }} /></div>
                  </div>
                  <Button variant="outline" size="sm" style={{ marginTop: 12 }}>{ins.action}</Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Chat */}
        <Card reveal padding="lg" style={{ position: 'sticky', top: 90 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span className="insight-icon opportunity" style={{ width: 38, height: 38 }}><BrainCircuit size={20} /></span>
            <div>
              <div className="card-title" style={{ marginBottom: 0 }}>Ask ForecastIQ AI</div>
              <div className="card-subtitle">Ask about your data, forecasts, or budget</div>
            </div>
          </div>
          <div className="chat-window">
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-sm)', padding: '24px 0' }}>
                Ask me anything about your marketing performance…
              </div>
            )}
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div 
                  key={i} 
                  className={`chat-msg ${m.role}`}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <span className="chat-avatar">{m.role === 'ai' ? <BrainCircuit size={16} /> : 'You'}</span>
                  <div className="chat-bubble">{m.text}</div>
                </motion.div>
              ))}
              {chatLoading && (
                <motion.div 
                  key="loading" 
                  className="chat-msg ai"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <span className="chat-avatar"><BrainCircuit size={16} /></span>
                  <div className="chat-bubble"><TypingDots /></div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>
          <div className="chat-input-row">
            <input className="input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Ask about budget, forecast, channels…" />
            <Button onClick={send} loading={chatLoading} className="btn-icon"><Send size={18} /></Button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            <button className="tag" onClick={() => setInput('What is my best channel?')}>Best channel?</button>
            <button className="tag" onClick={() => setInput('How can I optimize my budget?')}>Optimize budget</button>
            <button className="tag" onClick={() => setInput('What does the forecast predict?')}>Forecast summary</button>
          </div>
        </Card>
      </StaggerItem>
    </StaggerContainer>
  );
}
