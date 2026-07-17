import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Moon, Sun, Monitor } from 'lucide-react';
import Logo from './Logo.jsx';
import Button from './Button.jsx';
import { useTheme } from '../hooks/useTheme.js';
import { ensureComponentStyles } from '../styles/components.js';

const LINKS = [
  { to: '/#features', label: 'Features' },
  { to: '/#about', label: 'About' },
  { to: '/#contact', label: 'Contact' },
];

export default function PublicNavbar() {
  ensureComponentStyles();
  const { mode, cycle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const themeIcon = mode === 'dark' ? <Moon size={18} /> : mode === 'light' ? <Sun size={18} /> : <Monitor size={18} />;

  const handleNav = (to) => {
    setMobileOpen(false);
    if (to.startsWith('/#')) {
      const id = to.slice(2);
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(to);
    }
  };

  return (
    <>
      <nav className={`pub-navbar ${scrolled ? 'scrolled' : ''}`}>
        <Link to="/" className="pub-nav-brand">
          <Logo size={42} animated />
        </Link>
        <div className="pub-nav-links">
          {LINKS.map((l) => (
            <button key={l.to} className="pub-nav-link" onClick={() => handleNav(l.to)}>{l.label}</button>
          ))}
        </div>
        <div className="pub-nav-cta">
          <button className="icon-btn" onClick={cycle} aria-label="Toggle theme">{themeIcon}</button>
          <Button variant="ghost" size="sm" to="/login" className="signin-btn">Sign in</Button>
          <Button size="sm" to="/signup">Get started</Button>
          <button className="icon-btn menu-btn pub-nav-toggle" onClick={() => setMobileOpen((o) => !o)} aria-label="Menu">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>
      {mobileOpen && (
        <div className="glass pub-mobile-menu open">
          {LINKS.map((l) => (
            <button key={l.to} className="nav-item" onClick={() => handleNav(l.to)}>
              <span className="nav-item-label">{l.label}</span>
            </button>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <Button variant="secondary" fullWidth to="/login" onClick={() => setMobileOpen(false)}>Sign in</Button>
            <Button fullWidth to="/signup" onClick={() => setMobileOpen(false)}>Sign up</Button>
          </div>
        </div>
      )}
    </>
  );
}
