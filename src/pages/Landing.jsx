import { useState, useRef } from 'react';
import {
  TrendingUp, BrainCircuit, SlidersHorizontal, BarChart3, UploadCloud,
  Sparkles, ShieldCheck, Zap, Target, ArrowRight, Check, Mail, MapPin, Phone,
} from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar.jsx';
import PublicFooter from '../components/PublicFooter.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import AuroraBackground from '../components/AuroraBackground.jsx';
import CursorGlow from '../components/CursorGlow.jsx';
import AnimatedCounter from '../components/AnimatedCounter.jsx';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';
import { useToast } from '../components/Toast.jsx';
import { useReveal } from '../hooks/useUI.js';
import { useComponentStyles } from '../styles/components.js';
import { motion } from 'framer-motion';

const FEATURES = [
  { icon: TrendingUp, title: 'Revenue Forecasting', desc: 'AI predicts 6 months of revenue & ROAS at 87% confidence. Model multiple scenarios in seconds.' },
  { icon: SlidersHorizontal, title: 'Budget Simulator', desc: 'Drag sliders to reallocate spend across channels and instantly see projected revenue and ROAS impact.' },
  { icon: BrainCircuit, title: 'AI Insights', desc: 'Automated recommendations surface reallocation opportunities, ad fatigue, and underutilized channels.' },
  { icon: BarChart3, title: 'Channel Analytics', desc: 'Deep-dive into every channel — spend, revenue, ROAS, CPA, CTR — with interactive trend visualizations.' },
  { icon: UploadCloud, title: 'Smart Data Upload', desc: 'Drop a CSV or Excel file and we auto-detect columns and map them. Connect ad platforms for auto-sync.' },
  { icon: Sparkles, title: 'AI Chat Assistant', desc: 'Ask questions about your data in plain English. Get instant answers about budgets, forecasts, and channels.' },
];

const STATS = [
  { num: '87%', label: 'Forecast Confidence' },
  { num: '4.3x', label: 'Avg ROAS Lift' },
  { num: '6', label: 'Channels Tracked' },
  { num: '<2min', label: 'Setup Time' },
];

const ABOUT_POINTS = [
  'AI models trained on 10M+ marketing data points',
  'Works with Google Ads, Meta, TikTok, LinkedIn & more',
  'Bank-grade encryption — your data stays yours',
  'No-code: upload a file and get insights in minutes',
];

export default function Landing() {
  useComponentStyles();
  const toast = useToast();
  const [contact, setContact] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const submitContact = (e) => {
    e.preventDefault();
    if (!contact.name || !contact.email || !contact.message) return toast.warning('Please fill in all fields');
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setContact({ name: '', email: '', message: '' });
      toast.success('Message sent! We\'ll be in touch soon.');
    }, 1000);
  };

  return (
    <>
      <AuroraBackground />
      <CursorGlow />
      <PublicNavbar />
      <div className="landing">
        {/* ===== HERO ===== */}
        <section className="hero">
          <div className="hero-inner">
            <StaggerContainer className="hero-text">
              <StaggerItem className="hero-badge">
                <Sparkles size={14} /> AI-Powered Marketing Intelligence
              </StaggerItem>
              <StaggerItem>
                <h1 className="hero-title">
                  Forecast smarter.<br />
                  <span className="text-gradient">Spend wiser.</span>
                </h1>
              </StaggerItem>
              <StaggerItem>
                <p className="hero-desc">
                  ForecastIQ turns your marketing data into AI-driven predictions, budget simulations, and channel-level insights — so every dollar works harder.
                </p>
              </StaggerItem>
              <StaggerItem className="hero-cta-row">
                <Button size="lg" to="/signup" rightIcon={<ArrowRight size={18} />}>Start free</Button>
                <Button variant="outline" size="lg" onClick={() => scrollTo('features')}>Explore features</Button>
              </StaggerItem>
              <StaggerItem className="hero-stats">
                {STATS.map((s) => {
                  const val = parseFloat(s.num);
                  const isNum = !isNaN(val);
                  return (
                    <div key={s.label}>
                      <div className="hero-stat-num">
                        {isNum ? (
                          <AnimatedCounter 
                            value={val} 
                            suffix={s.num.replace(/[0-9.]/g, '')} 
                            prefix={s.num.startsWith('<') ? '<' : ''} 
                            decimals={s.num.includes('.') ? 1 : 0} 
                          />
                        ) : (
                          s.num
                        )}
                      </div>
                      <div className="hero-stat-label">{s.label}</div>
                    </div>
                  );
                })}
              </StaggerItem>
            </StaggerContainer>

            {/* 3D visual */}
            <div className="hero-visual">
              <div className="orbit-ring r1" />
              <div className="orbit-ring r2" />
              <div className="orbit-ring r3" />
              <div className="orbit-dot d1" />
              <div className="orbit-dot d2" />
              <div className="orbit-dot d3" />
              <div className="scene-3d">
                <div className="cube-3d">
                  <div className="cube-face front"><TrendingUp size={40} /></div>
                  <div className="cube-face back"><BrainCircuit size={40} /></div>
                  <div className="cube-face right"><Target size={40} /></div>
                  <div className="cube-face left"><BarChart3 size={40} /></div>
                  <div className="cube-face top"><Zap size={40} /></div>
                  <div className="cube-face bottom"><SlidersHorizontal size={40} /></div>
                </div>
              </div>
              <div className="data-badge b1"><span style={{ color: 'var(--success)' }}>+8.2%</span> ROAS</div>
              <div className="data-badge b2"><TrendingUp size={12} style={{ color: 'var(--brand-400)' }} /> $245k forecast</div>
              <div className="data-badge b3"><BrainCircuit size={12} style={{ color: 'var(--accent-400)' }} /> AI insight</div>
              <div className="data-badge b4"><ShieldCheck size={12} style={{ color: 'var(--info)' }} /> Secure</div>
            </div>
          </div>
        </section>

        {/* ===== FEATURES ===== */}
        <section className="landing-section" id="features">
          <div className="landing-section-inner">
            <div className="section-center" style={{ marginBottom: 48 }}>
              <div className="section-eyebrow"><Zap size={14} /> Features</div>
              <h2 className="section-heading">Everything you need to optimize marketing spend</h2>
              <p className="section-subheading">From forecasting to budget simulation to AI insights — ForecastIQ gives you the tools to make data-driven decisions in minutes, not weeks.</p>
            </div>
            <StaggerContainer className="feature-grid">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <StaggerItem key={i}>
                    <FeatureCard icon={Icon} title={f.title} desc={f.desc} delay={0} />
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </section>

        {/* ===== ABOUT ===== */}
        <section className="landing-section" id="about" style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="landing-section-inner">
            <div className="about-grid">
              <div className="about-visual">
                <div className="float-chart">
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>Revenue trend</span>
                    <span className="badge badge-success"><TrendingUp size={12} /> +14.5%</span>
                  </div>
                  <div className="float-chart-bar">
                    <span /><span /><span /><span /><span /><span />
                  </div>
                  <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="glass" style={{ padding: 16, textAlign: 'center' }}>
                      <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700, color: 'var(--brand-400)' }}>
                        <AnimatedCounter value={4.3} decimals={1} suffix="x" />
                      </div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>ROAS</div>
                    </div>
                    <div className="glass" style={{ padding: 16, textAlign: 'center' }}>
                      <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700, color: 'var(--accent-400)' }}>
                        <AnimatedCounter value={482} prefix="$" suffix="k" />
                      </div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Revenue</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="about-text">
                <div className="section-eyebrow"><ShieldCheck size={14} /> About Us</div>
                <h2 className="section-heading">Built for marketers who want to do more with less</h2>
                <p>ForecastIQ was born from a simple observation: marketing teams have more data than ever, but turning that data into actionable decisions is still painfully slow.</p>
                <p>Our AI engine analyzes your spend, revenue, and channel performance to surface the insights that actually move the needle — automatically.</p>
                <StaggerContainer className="about-list">
                  {ABOUT_POINTS.map((p, i) => (
                    <StaggerItem key={i} className="about-list-item">
                      <span className="about-list-icon"><Check size={16} /></span>
                      {p}
                    </StaggerItem>
                  ))}
                </StaggerContainer>
                <Button variant="outline" style={{ marginTop: 24 }} to="/signup" rightIcon={<ArrowRight size={16} />}>Get started free</Button>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CONTACT ===== */}
        <section className="landing-section" id="contact">
          <div className="landing-section-inner">
            <div className="section-center" style={{ marginBottom: 48 }}>
              <div className="section-eyebrow"><Mail size={14} /> Contact Us</div>
              <h2 className="section-heading">Let's talk</h2>
              <p className="section-subheading">Have questions? Want a demo? Need a custom plan? Drop us a line and we'll respond within 24 hours.</p>
            </div>
            <div className="contact-grid">
              <div>
                <div className="glass contact-info-card">
                  <span className="contact-info-icon"><Mail size={20} /></span>
                  <div>
                    <div className="contact-info-title">Email</div>
                    <div className="contact-info-val">hello@forecastiq.io</div>
                  </div>
                </div>
                <div className="glass contact-info-card">
                  <span className="contact-info-icon"><Phone size={20} /></span>
                  <div>
                    <div className="contact-info-title">Phone</div>
                    <div className="contact-info-val">+1 (415) 555-0142</div>
                  </div>
                </div>
                <div className="glass contact-info-card">
                  <span className="contact-info-icon"><MapPin size={20} /></span>
                  <div>
                    <div className="contact-info-title">Office</div>
                    <div className="contact-info-val">548 Market St, San Francisco, CA</div>
                  </div>
                </div>
              </div>
              <Card padding="lg" reveal>
                <form onSubmit={submitContact} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="input-group">
                    <label className="input-label">Name</label>
                    <input className="input" value={contact.name} onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))} placeholder="Your name" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Email</label>
                    <input className="input" type="email" value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} placeholder="you@company.com" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Message</label>
                    <textarea className="input" value={contact.message} onChange={(e) => setContact((c) => ({ ...c, message: e.target.value }))} placeholder="Tell us what you need…" rows={4} />
                  </div>
                  <Button type="submit" fullWidth size="lg" loading={sending} rightIcon={<ArrowRight size={18} />}>Send message</Button>
                </form>
              </Card>
            </div>
          </div>
        </section>

        {/* ===== MARQUEE (PARTNERS) ===== */}
        <section className="landing-section" style={{ padding: '60px 0', borderBottom: '1px solid var(--border)' }}>
          <div className="section-center" style={{ marginBottom: 32 }}>
            <div className="section-eyebrow" style={{ color: 'var(--text-muted)' }}>Trusted by fast-growing teams</div>
          </div>
          <div className="marquee-container">
            <div className="marquee-track">
              {['Acme Corp', 'GlobalTech', 'Nimbus Labs', 'Stark Industries', 'Wayne Enterprises', 'Vandelay Ind.', 'Cyberdyne', 'Massive Dynamic'].map((name, i) => (
                <div key={i} className="marquee-item">
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-500), var(--accent-500))' }} />
                  {name}
                </div>
              ))}
              {/* Duplicate for infinite effect */}
              {['Acme Corp', 'GlobalTech', 'Nimbus Labs', 'Stark Industries', 'Wayne Enterprises', 'Vandelay Ind.', 'Cyberdyne', 'Massive Dynamic'].map((name, i) => (
                <div key={'dup'+i} className="marquee-item">
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-500), var(--accent-500))' }} />
                  {name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CTA BAND ===== */}
        <section className="cta-band">
          <div className="pub-footer-glow" style={{ top: '50%' }} />
          <div className="cta-band-inner">
            <h2>Ready to forecast smarter?</h2>
            <p>Join thousands of marketers using ForecastIQ to optimize their spend.</p>
            <div className="hero-cta-row">
              <Button size="lg" to="/signup" rightIcon={<ArrowRight size={18} />}>Start free</Button>
              <Button variant="outline" size="lg" to="/login">Sign in</Button>
            </div>
          </div>
        </section>
      </div>
      <PublicFooter />
    </>
  );
}

function FeatureCard({ icon: Icon, title, desc, delay }) {
  return (
    <div className="card feature-card">
      <span className="feature-icon-3d"><Icon size={26} /></span>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}
