import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate, Outlet, Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import Logo from '../components/Logo.jsx';
import Button from '../components/Button.jsx';
import AuroraBackground from '../components/AuroraBackground.jsx';
import CursorGlow from '../components/CursorGlow.jsx';
import PageTransition from '../components/PageTransition.jsx';
import ScrollProgress from '../components/ScrollProgress.jsx';
import FloatingActionButton from '../components/FloatingActionButton.jsx';
import { useTheme } from '../hooks/useTheme.js';
import { useScrollTop, useLocalStorage } from '../hooks/useUI.js';
import { useComponentStyles } from '../styles/components.js';
import { NAV_ITEMS, APP_NAME } from '../constants/index.js';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';


export default function AppLayout() {
  useComponentStyles();
  useScrollTop();
  const { mode, cycle } = useTheme();
  const [collapsed, setCollapsed] = useLocalStorage('fiq-sidebar-collapsed', false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };


  const pathnames = location.pathname.split('/').filter((x) => x);
  const breadcrumbs = pathnames.map((name, index) => {
    const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
    const isLast = index === pathnames.length - 1;
    const cleanName = name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    return isLast ? (
      <span key={name} style={{ color: 'var(--brand-400)', fontWeight: 600 }}>{cleanName}</span>
    ) : (
      <span key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
        <Link to={routeTo} style={{ transition: 'color 0.2s', cursor: 'pointer' }} className="footer-link">{cleanName}</Link>
        <Icons.ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
      </span>
    );
  });

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const themeIcon = mode === 'dark' ? <Icons.Moon size={18} /> : mode === 'light' ? <Icons.Sun size={18} /> : <Icons.Monitor size={18} />;

  return (
    <>
      <ScrollProgress />
      <AuroraBackground />
      <CursorGlow />

      {/* Sidebar */}
      <motion.aside 
        className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}
        animate={{ width: collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)' }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="sidebar-brand">
          <Logo size={34} animated textClassName="fiq-logo-text" />
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = Icons[item.icon] || Icons.Circle;
            return (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                {({ isActive }) => (
                  <>
                    <span className="nav-item-icon"><Icon size={18} /></span>
                    <span className="nav-item-label">{item.label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="sidebarActivePill" 
                        className="sidebar-active-indicator"
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          marginTop: '-12px',
                          width: '4px',
                          height: '24px',
                          borderRadius: '0 var(--r-full) var(--r-full) 0',
                          background: 'linear-gradient(var(--brand-400), var(--accent-400))',
                          boxShadow: 'var(--shadow-glow)'
                        }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <button className="nav-item" onClick={() => setCollapsed((c) => !c)} title="Toggle sidebar">
            <span className="nav-item-icon">
              {collapsed ? <Icons.ChevronRight size={18} /> : <Icons.ChevronLeft size={18} />}
            </span>
            <span className="nav-item-label">Collapse</span>
          </button>
        </div>
      </motion.aside>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            className="sidebar-overlay" 
            onClick={() => setMobileOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Main */}
      <div className={`app-main ${collapsed ? 'collapsed' : ''}`}>
        {/* Navbar */}
        <header className="navbar">
          <button className="icon-btn menu-toggle" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Icons.Menu size={20} />
          </button>
          <div className="navbar-search">
            <Icons.Search size={16} />
            <input placeholder="Search…" aria-label="Search" />
          </div>
          <div className="navbar-spacer" />
          <div className="navbar-actions">
            <button className="icon-btn" onClick={cycle} title={`Theme: ${mode}`} aria-label="Toggle theme">
              {themeIcon}
            </button>
            <div style={{ position: 'relative' }}>
              <button className="avatar" onClick={() => setProfileOpen((o) => !o)} aria-label="Profile">
                {getInitials(user?.full_name)}
              </button>
              {profileOpen && (
                <div style={{ position: 'absolute', right: 0, top: 48, padding: 8, minWidth: 200, zIndex: 200, animation: 'scaleIn 0.2s var(--ease-out)', background: 'var(--bg-elevated)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-lg)' }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{user?.full_name || 'User'}</div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{user?.email || ''}</div>
                  </div>
                  <button className="nav-item" onClick={() => navigate('/app/settings')} style={{ width: '100%', justifyContent: 'flex-start' }}>
                    <Icons.Settings size={16} /><span className="nav-item-label">Settings</span>
                  </button>
                  <button className="nav-item" onClick={handleLogout} style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--error)' }}>
                    <Icons.LogOut size={16} /><span className="nav-item-label">Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="app-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-xs)', marginBottom: 16, flexWrap: 'wrap' }}>
            {breadcrumbs}
          </div>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <div className="footer-grid">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Logo size={28} animated={false} withText={false} />
              <span className="footer-copy">© 2025 {APP_NAME}. All rights reserved.</span>
            </div>
            <div className="footer-links">
              <a className="footer-link" href="#">Privacy</a>
              <a className="footer-link" href="#">Terms</a>
              <a className="footer-link" href="#">Docs</a>
              <a className="footer-link" href="#">Support</a>
            </div>
          </div>
        </footer>
      </div>
      <FloatingActionButton />
    </>
  );
}
