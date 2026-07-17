import { Link } from 'react-router-dom';
import { Twitter, Github, Linkedin, Youtube, ArrowRight } from 'lucide-react';
import Logo from './Logo.jsx';
import Button from './Button.jsx';
import { useToast } from './Toast.jsx';
import { ensureComponentStyles } from '../styles/components.js';

const COLS = [
  { title: 'Product', links: [
    { to: '/#features', label: 'Features' },
    { to: '/app/dashboard', label: 'Dashboard' },
    { to: '/app/forecast', label: 'Forecast' },
    { to: '/app/budget-simulator', label: 'Budget Simulator' },
  ]},
  { title: 'Company', links: [
    { to: '/#about', label: 'About Us' },
    { to: '/#contact', label: 'Contact' },
    { to: '/404', label: 'Careers' },
    { to: '/404', label: 'Blog' },
  ]},
  { title: 'Resources', links: [
    { to: '/docs', label: 'Documentation' },
    { to: '/docs', label: 'API Reference' },
    { to: '/support', label: 'Help Center' },
    { to: '/support', label: 'Status' },
  ]},
];

const SOCIAL = [Twitter, Github, Linkedin, Youtube];

export default function PublicFooter() {
  ensureComponentStyles();
  const toast = useToast();

  return (
    <footer className="pub-footer">
      <div className="pub-footer-glow" />
      <div className="pub-footer-inner">
        <div className="pub-footer-grid">
          <div className="pub-footer-col">
            <Logo size={44} animated />
            <p className="pub-footer-brand-desc">
              AI-powered marketing spend optimization. Forecast revenue, simulate budgets, and let AI surface the opportunities that matter.
            </p>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 8 }}>Subscribe to our newsletter</div>
            <div className="pub-footer-newsletter">
              <input className="input" placeholder="you@company.com" aria-label="Email" />
              <Button className="btn-icon" onClick={() => toast.success('Subscribed!')} aria-label="Subscribe"><ArrowRight size={18} /></Button>
            </div>
          </div>
          {COLS.map((col) => (
            <div key={col.title} className="pub-footer-col">
              <h4>{col.title}</h4>
              {col.links.map((l, i) => (
                <Link key={i} to={l.to}>{l.label}</Link>
              ))}
            </div>
          ))}
        </div>
        <div className="pub-footer-bottom">
          <span className="pub-footer-copy">© 2026 ForecastIQ. All rights reserved.</span>
          <div className="pub-footer-social">
            {SOCIAL.map((Icon, i) => (
              <a key={i} href="#" className="pub-social-btn" aria-label="Social"><Icon size={18} /></a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link to="/privacy" className="footer-link">Privacy</Link>
            <Link to="/terms" className="footer-link">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
