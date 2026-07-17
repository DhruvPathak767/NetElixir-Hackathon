import { useEffect } from 'react';
import { ensureLogoStyles } from '../components/Logo.jsx';

/**
 * Injects all component-level CSS (buttons, cards, toasts, modals, sidebar,
 * navbar, footer, forms, charts) into the document head once.
 * Keeps index.css for theme tokens + global effects only.
 */
let injected = false;

const CSS = `
/* ============================================================
   BUTTONS
   ============================================================ */
.btn {
  --btn-bg: var(--brand-500);
  --btn-fg: #fff;
  --btn-border: transparent;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  font-size: var(--fs-sm);
  line-height: 1;
  padding: 0 16px;
  height: 40px;
  border-radius: var(--r-md);
  border: 1px solid var(--btn-border);
  background: var(--btn-bg);
  color: var(--btn-fg);
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.2s var(--ease), box-shadow 0.2s var(--ease), background 0.2s var(--ease), opacity 0.2s var(--ease), border-color 0.2s var(--ease);
  white-space: nowrap;
  user-select: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), var(--shadow-sm);
}
/* Enhanced hover and active states */
.btn:hover { transform: translateY(-1px); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), var(--shadow-md); }
.btn:active { transform: translateY(0) scale(0.97); box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1); }
.btn:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--bg-base), 0 0 0 4px var(--brand-400); }
.btn:disabled, .btn-loading { opacity: 0.5; cursor: not-allowed; transform: none !important; box-shadow: none !important; }
.btn-sm { height: 32px; padding: 0 12px; font-size: var(--fs-xs); }
.btn-lg { height: 48px; padding: 0 24px; font-size: var(--fs-base); }
.btn-icon { width: 40px; padding: 0; height: 40px; }
.btn-full { width: 100%; }
.btn-label { position: relative; z-index: 1; }
.btn-icon-left, .btn-icon-right { display: inline-flex; align-items: center; }
.btn-spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
.btn-primary { 
  --btn-bg: linear-gradient(135deg, var(--brand-500), var(--brand-600)); 
  --btn-fg: #fff; 
}
.btn-primary:hover { box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), var(--shadow-glow); }
.btn-secondary { --btn-bg: var(--bg-surface-2); --btn-fg: var(--text-primary); --btn-border: var(--border); box-shadow: var(--shadow-sm); }
.btn-secondary:hover { border-color: var(--border-strong); background: var(--bg-hover); }
.btn-ghost { --btn-bg: transparent; --btn-fg: var(--text-secondary); --btn-border: transparent; box-shadow: none; }
.btn-ghost:hover { --btn-bg: var(--bg-hover); --btn-fg: var(--text-primary); box-shadow: none; }
.btn-outline { --btn-bg: transparent; --btn-fg: var(--text-primary); --btn-border: var(--border-strong); box-shadow: var(--shadow-sm); }
.btn-outline:hover { --btn-bg: var(--bg-hover); border-color: var(--border-brand); }
.btn-danger { --btn-bg: linear-gradient(135deg, #ef4444, #dc2626); --btn-fg: #fff; }
.btn-success { --btn-bg: linear-gradient(135deg, var(--accent-500), var(--accent-600)); --btn-fg: #fff; }

/* ============================================================
   CARD
   ============================================================ */
.glass {
  background: var(--bg-glass);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--border);
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}
.glass:hover {
  box-shadow: 0 8px 32px rgba(34, 211, 238, 0.1);
  border-color: rgba(34, 211, 238, 0.2);
}
.card {
  background: var(--bg-glass);
  backdrop-filter: blur(32px) saturate(180%);
  -webkit-backdrop-filter: blur(32px) saturate(180%);
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
  transition: transform 0.3s var(--ease-out), box-shadow 0.3s var(--ease-out), border-color 0.3s var(--ease-out);
}
.card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(34,211,238,0.15), transparent 40%, transparent 60%, rgba(16,185,129,0.1));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.5s var(--ease);
}
/* Enhanced hover for cards */
.card-hover:hover { 
  transform: translateY(-4px); 
  box-shadow: var(--shadow-lg), 0 12px 40px rgba(34, 211, 238, 0.15); 
  border-color: rgba(34, 211, 238, 0.3);
}
  z-index: 2;
}
.card-hover:hover::before { opacity: 1; }
.card-glow { animation: glowPulse 4s ease-in-out infinite alternate; }

/* Mouse Spotlight */
.card-spotlight { position: relative; }
.card-spotlight::after {
  content: '';
  position: absolute;
  top: var(--mouse-y, 0);
  left: var(--mouse-x, 0);
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 60%);
  transform: translate(-50%, -50%);
  border-radius: 50%;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1;
}
.card-spotlight:hover::after { opacity: 1; }

@keyframes glowPulse { 0% { box-shadow: var(--shadow-md); } 100% { box-shadow: var(--shadow-lg), var(--shadow-glow); } }
.card-pad-sm { padding: var(--sp-4); }
.card-pad-md { padding: 24px; }
.card-pad-lg { padding: 32px; }
.card-title { font-size: var(--fs-lg); font-weight: 600; margin-bottom: var(--sp-2); letter-spacing: -0.01em; color: var(--text-primary); position: relative; z-index: 2; }
.card-subtitle { font-size: var(--fs-sm); color: var(--text-secondary); line-height: 1.5; position: relative; z-index: 2; }

/* ============================================================
   FORM INPUTS
   ============================================================ */
.input-group { position: relative; display: flex; flex-direction: column; gap: 6px; }
.input-label { font-size: var(--fs-sm); font-weight: 500; color: var(--text-primary); transition: color 0.2s var(--ease); }
.input-wrap { position: relative; display: flex; align-items: center; }
.input-wrap > svg { position: absolute; left: 12px; color: var(--text-muted); pointer-events: none; transition: color 0.2s var(--ease); z-index: 2; width: 18px; height: 18px; }
.input {
  width: 100%;
  height: 40px;
  padding: 0 12px 0 12px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  font-size: var(--fs-sm);
  color: var(--text-primary);
  transition: border-color 0.2s var(--ease), box-shadow 0.2s var(--ease), background 0.2s var(--ease);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}
.input-wrap > svg + .input { padding-left: 38px; }
/* Enhanced Focus states */
.input:focus { 
  outline: none; 
  border-color: var(--brand-400); 
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05), 0 0 0 2px var(--bg-base), 0 0 0 4px var(--brand-400); 
  background: var(--bg-hover);
}
.input-wrap:focus-within > svg { color: var(--brand-400); }
.input-group:focus-within .input-label { color: var(--brand-400); }
.input::placeholder { color: var(--text-muted); transition: opacity 0.2s var(--ease); }
.input:focus::placeholder { opacity: 0.5; }

/* Floating Labels */
.input-floating-wrap { position: relative; }
.input-floating-wrap .input { padding-top: 20px; padding-bottom: 4px; height: 52px; }
.input-floating-label { position: absolute; left: 14px; top: 16px; color: var(--text-muted); font-size: var(--fs-sm); pointer-events: none; transition: transform 0.2s var(--ease-spring), font-size 0.2s var(--ease-spring), color 0.2s var(--ease); transform-origin: left top; }
.input-floating-wrap .input:focus + .input-floating-label, .input-floating-wrap .input:not(:placeholder-shown) + .input-floating-label { transform: translateY(-10px) scale(0.75); color: var(--brand-400); }
.input-floating-wrap .input:not(:focus):not(:placeholder-shown) + .input-floating-label { color: var(--text-secondary); }

/* Checkbox */
.checkbox-wrap { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
.checkbox-input { position: relative; appearance: none; width: 18px; height: 18px; border: 2px solid var(--border-strong); border-radius: var(--r-sm); background: var(--bg-input); transition: background 0.2s, border-color 0.2s, box-shadow 0.2s; cursor: pointer; margin: 0; }
.checkbox-input:hover { border-color: var(--brand-400); box-shadow: 0 0 0 4px rgba(34,211,238,0.1); }
.checkbox-input:checked { background: var(--brand-400); border-color: var(--brand-400); }
.checkbox-input::after { content: ''; position: absolute; top: 40%; left: 50%; width: 5px; height: 10px; border: solid white; border-width: 0 2px 2px 0; transform: translate(-50%, -50%) rotate(45deg) scale(0); opacity: 0; transition: transform 0.3s var(--ease-spring), opacity 0.2s; }
.checkbox-input:checked::after { transform: translate(-50%, -50%) rotate(45deg) scale(1); opacity: 1; }
.checkbox-label { font-size: var(--fs-sm); color: var(--text-primary); user-select: none; }
/* Input Validation Animations */
.input-error { border-color: var(--error) !important; animation: errorShake 0.4s var(--ease-spring); }
.input-error:focus { box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05), 0 0 0 2px var(--bg-base), 0 0 0 4px var(--error) !important; }
.input-success { border-color: var(--success) !important; animation: successPulse 0.4s var(--ease-out); }
.input-success:focus { box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05), 0 0 0 2px var(--bg-base), 0 0 0 4px var(--success) !important; }

@keyframes errorShake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}
@keyframes successPulse {
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

textarea.input { height: auto; padding: 12px 14px; resize: vertical; min-height: 100px; }
select.input { cursor: pointer; appearance: none; padding-right: 36px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; }
select.input option { background-color: var(--bg-elevated); color: var(--text-primary); }

/* Toggle switch */
.toggle { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; inset: 0; background: var(--bg-surface-3); border-radius: var(--r-full); cursor: pointer; transition: background 0.3s var(--ease), box-shadow 0.3s var(--ease); border: 1px solid var(--border); }
.toggle-slider::before { content: ''; position: absolute; width: 18px; height: 18px; left: 2px; top: 2px; background: #fff; border-radius: 50%; box-shadow: var(--shadow-sm); transition: transform 0.4s var(--ease-spring), width 0.3s var(--ease-spring); }
.toggle input:checked + .toggle-slider { background: linear-gradient(135deg, var(--brand-500), var(--brand-400)); box-shadow: var(--shadow-glow); border-color: var(--brand-400); }
.toggle input:checked + .toggle-slider::before { transform: translateX(20px); }
.toggle input:active + .toggle-slider::before { width: 22px; }
.toggle input:checked:active + .toggle-slider::before { transform: translateX(16px); }

/* Slider */
.range-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: var(--r-full); background: var(--border-strong); outline: none; }
.range-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%; background: var(--brand-500); cursor: pointer; box-shadow: 0 0 0 4px rgba(34,211,238,0.2), var(--shadow-sm); transition: transform var(--t-fast), box-shadow var(--t-fast); }
.range-slider::-webkit-slider-thumb:hover { transform: scale(1.25); box-shadow: 0 0 0 6px rgba(34,211,238,0.3), var(--shadow-md); }
.range-slider::-moz-range-thumb { width: 20px; height: 20px; border: none; border-radius: 50%; background: var(--brand-500); cursor: pointer; transition: transform var(--t-fast); }
.range-slider::-moz-range-thumb:hover { transform: scale(1.25); }

/* ============================================================
   TOAST
   ============================================================ */
.toast-container { position: fixed; top: 24px; right: 24px; z-index: var(--z-toast); display: flex; flex-direction: column; gap: 12px; max-width: 380px; }
.toast { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: var(--r-md); background: var(--bg-glass); backdrop-filter: blur(24px); border: 1px solid var(--border); box-shadow: var(--shadow-lg); animation: slideInRight 0.4s var(--ease-spring); }
.toast-icon { flex-shrink: 0; }
.toast-success .toast-icon { color: var(--success); }
.toast-error .toast-icon { color: var(--error); }
.toast-warning .toast-icon { color: var(--warning); }
.toast-info .toast-icon { color: var(--info); }
.toast-msg { flex: 1; font-size: var(--fs-sm); color: var(--text-primary); font-weight: 500; }
.toast-close { color: var(--text-muted); padding: 4px; border-radius: 6px; transition: background var(--t-fast), color var(--t-fast); cursor: pointer; }
.toast-close:hover { color: var(--text-primary); background: var(--bg-hover); }

/* ============================================================
   MODAL
   ============================================================ */
.modal-overlay { position: fixed; inset: 0; z-index: var(--z-modal); background: rgba(0,0,0,0.55); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.3s ease; }
.modal { background: var(--bg-elevated); border: 1px solid var(--border-strong); border-radius: var(--r-xl); box-shadow: var(--shadow-lg), var(--shadow-glow-strong); max-height: 90vh; display: flex; flex-direction: column; animation: scaleIn 0.3s var(--ease-spring); }
.modal-sm { width: 100%; max-width: 400px; }
.modal-md { width: 100%; max-width: 560px; }
.modal-lg { width: 100%; max-width: 760px; }
.modal-xl { width: 100%; max-width: 1000px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--border); }
.modal-title { font-size: var(--fs-lg); font-weight: 600; }
.modal-close { color: var(--text-muted); padding: 6px; border-radius: var(--r-sm); transition: background var(--t-fast), color var(--t-fast); cursor: pointer; }
.modal-close:hover { background: var(--bg-hover); color: var(--text-primary); }
.modal-body { padding: 24px; overflow-y: auto; }
.modal-footer { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 10px; background: var(--bg-surface-2); border-bottom-left-radius: inherit; border-bottom-right-radius: inherit; }

/* ============================================================
   LOADER / SKELETON
   ============================================================ */
.loader-wrap { display: flex; flex-direction: column; align-items: center; gap: 14px; }
.loader { animation: spin 1s linear infinite; }
.loader-arc { animation: spin 1s linear infinite; transform-origin: 25px 25px; }
.loader-label { font-size: var(--fs-sm); color: var(--text-secondary); font-weight: 500; }
.spinner { display: inline-block; border: 2px solid var(--border-strong); border-top-color: var(--brand-500); border-radius: 50%; animation: spin 0.6s linear infinite; }
.skeleton { display: block; border-radius: var(--r-md); }
.page-loader { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
.typing-dots { display: inline-flex; gap: 4px; align-items: center; }
.typing-dots span { width: 7px; height: 7px; border-radius: 50%; background: var(--brand-400); animation: typingDot 1.2s ease-in-out infinite; }
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

/* ============================================================
   SIDEBAR
   ============================================================ */
.sidebar {
  position: fixed;
  top: 0; left: 0; bottom: 0;
  width: var(--sidebar-w);
  z-index: var(--z-sidebar);
  background: var(--bg-elevated);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  transition: width var(--t-med), transform var(--t-med);
}
.sidebar-brand { display: flex; align-items: center; gap: 10px; padding: 20px 22px; height: var(--navbar-h); border-bottom: 1px solid var(--border); flex-shrink: 0; }
.sidebar-nav { flex: 1; overflow-y: auto; padding: 16px 14px; display: flex; flex-direction: column; gap: 4px; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: var(--r-md); color: var(--text-secondary); font-size: var(--fs-sm); font-weight: 500; transition: background 0.2s var(--ease), color 0.2s var(--ease), transform 0.2s var(--ease-spring); position: relative; overflow: hidden; cursor: pointer; }
.nav-item:hover { background: rgba(255, 255, 255, 0.04); color: var(--text-primary); transform: translateX(4px); }
[data-theme='light'] .nav-item:hover { background: rgba(0, 0, 0, 0.04); }
.nav-item.active { background: rgba(34, 211, 238, 0.08); color: var(--text-primary); font-weight: 600; }
.nav-item-icon { flex-shrink: 0; display: flex; transition: transform 0.2s var(--ease-spring); }
.nav-item:hover .nav-item-icon { transform: scale(1.15) rotate(-3deg); color: var(--brand-400); }
.sidebar-footer { padding: 16px 14px; border-top: 1px solid var(--border); flex-shrink: 0; }
.sidebar.collapsed { width: var(--sidebar-w-collapsed); }
.sidebar.collapsed .nav-item-label, .sidebar.collapsed .fiq-logo-text { display: none; }
.sidebar.collapsed .nav-item { justify-content: center; padding: 11px; }

.sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: calc(var(--z-sidebar) - 1); backdrop-filter: blur(4px); transition: opacity var(--t-med); }

@media (max-width: 1024px) {
  .sidebar { transform: translateX(-100%); }
  .sidebar.open { transform: translateX(0); box-shadow: var(--shadow-lg); }
}

/* ============================================================
   NAVBAR
   ============================================================ */
.navbar {
  position: sticky;
  top: 0;
  z-index: var(--z-nav);
  height: var(--navbar-h);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 var(--sp-6);
  background: var(--bg-glass);
  backdrop-filter: blur(48px) saturate(200%);
  -webkit-backdrop-filter: blur(48px) saturate(200%);
  border-bottom: 1px solid transparent;
  transition: background var(--t-med), box-shadow var(--t-med), border-color var(--t-med);
}
.navbar.scrolled { box-shadow: var(--shadow-sm); border-color: var(--border); }
.navbar-spacer { flex: 1; }
.navbar-search { position: relative; flex: 0 1 360px; }
.navbar-search input { width: 100%; height: 40px; padding: 0 14px 0 40px; background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--r-md); font-size: var(--fs-sm); color: var(--text-primary); transition: border-color var(--t-fast), box-shadow var(--t-fast); }
.navbar-search input:focus { outline: none; border-color: var(--brand-400); box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05), 0 0 0 2px var(--bg-base), 0 0 0 4px var(--brand-400); background: var(--bg-hover); width: 120%; }
.navbar-search svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); transition: color var(--t-fast); }
.navbar-search:focus-within svg { color: var(--brand-400); }
.navbar-actions { display: flex; align-items: center; gap: 8px; }
.icon-btn { width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--r-md); color: var(--text-secondary); transition: background var(--t-fast), color var(--t-fast), transform var(--t-fast); position: relative; cursor: pointer; }
.icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); transform: scale(1.05); }
.icon-btn:active { transform: scale(0.95); }
.icon-btn .badge { position: absolute; top: 6px; right: 6px; width: 8px; height: 8px; border-radius: 50%; background: var(--error); border: 2px solid var(--bg-elevated); box-shadow: 0 0 8px var(--error); }
.avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, var(--brand-500), var(--accent-500)); display: inline-flex; align-items: center; justify-content: center; font-weight: 600; font-size: var(--fs-sm); color: #fff; flex-shrink: 0; cursor: pointer; transition: transform 0.4s var(--ease-spring), box-shadow 0.4s var(--ease-spring); border: 2px solid transparent; }
.avatar:hover { transform: translateY(-2px) scale(1.05); box-shadow: var(--shadow-md), 0 4px 12px rgba(34,211,238,0.3); border-color: var(--brand-100); }

.menu-toggle { display: none; }
@media (max-width: 1024px) { .menu-toggle { display: inline-flex; } .navbar-search { display: none; } }

/* ============================================================
   APP MAIN
   ============================================================ */
.app-main { margin-left: var(--sidebar-w); min-height: 100vh; display: flex; flex-direction: column; transition: margin var(--t-med); }
.app-main.collapsed { margin-left: var(--sidebar-w-collapsed); }
@media (max-width: 1024px) { .app-main { margin-left: 0; } }
.app-content { flex: 1; padding: var(--sp-6); position: relative; z-index: var(--z-base); }
@media (max-width: 768px) { .app-content { padding: var(--sp-4); } }

.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: var(--sp-6); flex-wrap: wrap; }
.page-title { font-size: var(--fs-2xl); font-weight: 700; letter-spacing: -0.02em; }
.page-desc { font-size: var(--fs-sm); color: var(--text-secondary); margin-top: 4px; }

/* ============================================================
   FOOTER
   ============================================================ */
.app-footer { border-top: 1px solid var(--border); padding: 24px var(--sp-6); background: var(--bg-glass); backdrop-filter: blur(20px); }
.footer-grid { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.footer-links { display: flex; gap: 20px; flex-wrap: wrap; }
.footer-link { font-size: var(--fs-sm); color: var(--text-secondary); transition: color var(--t-fast); }
.footer-link:hover { color: var(--brand-400); }
.footer-copy { font-size: var(--fs-xs); color: var(--text-muted); }

/* ============================================================
   AUTH LAYOUT
   ============================================================ */
.auth-layout { min-height: 100vh; display: grid; grid-template-columns: 4fr 6fr; }
@media (max-width: 900px) { .auth-layout { grid-template-columns: 1fr; } }
.auth-visual { position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: center; padding: 48px; background: #000; }
@media (max-width: 900px) { .auth-visual { display: none; } }
.auth-visual-content { position: relative; z-index: 3; max-width: 440px; margin: 0 auto; display: flex; flex-direction: column; height: 100%; justify-content: center; }
.auth-video-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; animation: slowZoom 30s linear infinite alternate; z-index: 1; }
@keyframes slowZoom { from { transform: scale(1); } to { transform: scale(1.05); } }
.auth-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8)); backdrop-filter: blur(2px); z-index: 2; }
.auth-overlay::after { content: ""; position: absolute; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E"); opacity: 0.15; z-index: 2; mix-blend-mode: overlay; }
.auth-mesh-mobile { display: none; }
@media (max-width: 900px) { .auth-video-bg { display: none; } .auth-visual { display: block; background: var(--bg-base); } .auth-mesh-mobile { display: block; position: absolute; inset: 0; background: radial-gradient(at 0% 0%, rgba(34,211,238,0.2) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(16,185,129,0.2) 0px, transparent 50%); z-index: 1; } }

.auth-visual h2 { font-size: var(--fs-3xl); font-weight: 700; line-height: var(--lh-tight); margin-bottom: 16px; color: #fff; }
.auth-visual p { font-size: var(--fs-base); color: rgba(255,255,255,0.8); line-height: var(--lh-body); margin-bottom: 32px; }
.auth-feature-cards { display: flex; flex-direction: column; gap: 16px; }
.auth-feature-card { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); padding: 16px; border-radius: var(--r-lg); display: flex; align-items: center; gap: 16px; color: #fff; animation: floatCard 6s ease-in-out infinite; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
.auth-feature-card:nth-child(1) { animation-delay: 0s; }
.auth-feature-card:nth-child(2) { animation-delay: 1.5s; }
.auth-feature-card:nth-child(3) { animation-delay: 3s; }
@keyframes floatCard { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.auth-feature-icon-pulse { width: 40px; height: 40px; border-radius: var(--r-md); background: rgba(34,211,238,0.2); display: flex; align-items: center; justify-content: center; color: #22d3ee; animation: pulseIcon 2s infinite; }
@keyframes pulseIcon { 0% { box-shadow: 0 0 0 0 rgba(34,211,238,0.4); } 70% { box-shadow: 0 0 0 10px rgba(34,211,238,0); } 100% { box-shadow: 0 0 0 0 rgba(34,211,238,0); } }

.auth-form-side { display: flex; align-items: center; justify-content: center; padding: 40px 24px; position: relative; z-index: 2; }
.auth-form-wrap { width: 100%; max-width: 420px; padding: 40px; background: var(--bg-glass); backdrop-filter: blur(20px); border-radius: var(--r-xl); border: 1px solid var(--border); box-shadow: var(--shadow-lg); }
@media (max-width: 480px) { .auth-form-wrap { padding: 24px; border: none; background: transparent; box-shadow: none; } }
.auth-logo-row { display: flex; justify-content: center; margin-bottom: 32px; }
.auth-title { font-size: var(--fs-2xl); font-weight: 700; text-align: center; margin-bottom: 8px; }
.auth-subtitle { font-size: var(--fs-sm); color: var(--text-secondary); text-align: center; margin-bottom: 28px; line-height: 1.5; }
.auth-toggle-link { text-align: center; font-size: var(--fs-sm); color: var(--text-secondary); margin-top: 24px; }
.auth-toggle-link a { color: var(--brand-400); font-weight: 600; transition: color var(--t-fast); }
.auth-toggle-link a:hover { color: var(--brand-300); text-decoration: underline; }
.auth-divider { display: flex; align-items: center; gap: 14px; margin: 24px 0; color: var(--text-muted); font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
.auth-divider::before, .auth-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }

/* ============================================================
   KPI CARD
   ============================================================ */
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--sp-4); }
.kpi { padding: var(--sp-5); display: flex; flex-direction: column; gap: 10px; position: relative; overflow: hidden; border-radius: var(--r-xl); background: var(--bg-glass); border: 1px solid var(--border); box-shadow: var(--shadow-sm); transition: transform 0.3s var(--ease), box-shadow 0.3s var(--ease), border-color 0.3s var(--ease); }
/* Shimmer on hover for KPIs */
.kpi::after {
  content: '';
  position: absolute;
  top: 0; left: -100%; width: 50%; height: 100%;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent);
  transform: skewX(-20deg);
  transition: none;
}
.kpi:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--border-strong); }
.kpi:hover::after {
  animation: kpiShimmer 1.5s ease-in-out;
}
@keyframes kpiShimmer {
  100% { left: 200%; }
}
.kpi-top { display: flex; align-items: center; justify-content: space-between; }
.kpi-label { font-size: var(--fs-sm); color: var(--text-secondary); font-weight: 500; }
.kpi-icon { width: 40px; height: 40px; border-radius: var(--r-md); background: linear-gradient(135deg, rgba(34,211,238,0.12), rgba(16,185,129,0.08)); display: inline-flex; align-items: center; justify-content: center; color: var(--brand-400); box-shadow: inset 0 0 0 1px rgba(34,211,238,0.2); }
.kpi-value { font-size: var(--fs-3xl); font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; }
.kpi-delta { font-size: var(--fs-xs); font-weight: 600; display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: var(--r-sm); background: var(--bg-surface-2); }
.kpi-delta.up { color: var(--success); background: rgba(16,185,129,0.1); }
.kpi-delta.down { color: var(--error); background: rgba(239,68,68,0.1); }

/* ============================================================
   GRID HELPERS
   ============================================================ */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-4); }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--sp-4); }
@media (max-width: 900px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } }
.grid-dashboard { display: grid; grid-template-columns: 2fr 1fr; gap: var(--sp-4); }
@media (max-width: 1100px) { .grid-dashboard { grid-template-columns: 1fr; } }

/* ============================================================
   MISC
   ============================================================ */
.badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: var(--r-full); font-size: var(--fs-xs); font-weight: 600; border: 1px solid transparent; position: relative; overflow: hidden; transition: transform var(--t-spring), box-shadow var(--t-spring); }
.badge:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); }
.badge::after {
  content: '';
  position: absolute;
  top: 0; left: -100%; width: 50%; height: 100%;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent);
  transform: skewX(-20deg);
  transition: none;
}
.badge:hover::after { animation: kpiShimmer 1.5s ease-in-out; }
.badge-success { background: rgba(16,185,129,0.15); color: var(--success); border-color: rgba(16,185,129,0.3); }
.badge-warning { background: rgba(245,158,11,0.15); color: var(--warning); border-color: rgba(245,158,11,0.3); }
.badge-info { background: rgba(34,211,238,0.15); color: var(--info); border-color: rgba(34,211,238,0.3); }
.badge-muted { background: var(--bg-surface-2); color: var(--text-secondary); border-color: var(--border); }

.tag { display: inline-flex; padding: 6px 14px; border-radius: var(--r-full); font-size: var(--fs-xs); font-weight: 500; background: var(--bg-surface-2); color: var(--text-secondary); border: 1px solid var(--border); transition: all var(--t-fast); cursor: pointer; }
.tag:hover { background: var(--bg-hover); color: var(--text-primary); border-color: var(--border-strong); transform: translateY(-1px); box-shadow: var(--shadow-sm); }

.section-title { font-size: var(--fs-lg); font-weight: 600; margin-bottom: var(--sp-3); }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; text-align: center; gap: 12px; }
.empty-state-icon { width: 64px; height: 64px; border-radius: var(--r-full); background: linear-gradient(135deg, rgba(34,211,238,0.1), rgba(16,185,129,0.05)); display: inline-flex; align-items: center; justify-content: center; color: var(--brand-400); margin-bottom: 8px; box-shadow: inset 0 0 0 1px rgba(34,211,238,0.2); }
.empty-state-title { font-size: var(--fs-lg); font-weight: 600; }
.empty-state-desc { font-size: var(--fs-sm); color: var(--text-secondary); max-width: 380px; line-height: 1.5; }

/* Upload dropzone */
.dropzone { border: 2px dashed var(--border-strong); border-radius: var(--r-lg); padding: 56px 24px; text-align: center; transition: all var(--t-med); cursor: pointer; background: rgba(0,0,0,0.02); }
.dropzone:hover, .dropzone.dragover { border-color: var(--brand-400); background: rgba(34,211,238,0.04); transform: scale(1.01); }
.dropzone-icon { width: 72px; height: 72px; border-radius: var(--r-full); background: linear-gradient(135deg, rgba(34,211,238,0.15), rgba(16,185,129,0.1)); display: inline-flex; align-items: center; justify-content: center; color: var(--brand-400); margin-bottom: 20px; box-shadow: 0 0 0 4px rgba(34,211,238,0.1); transition: transform var(--t-fast); }
.dropzone:hover .dropzone-icon { transform: scale(1.1); }

/* Chat */
.chat-window { display: flex; flex-direction: column; gap: 16px; max-height: 500px; overflow-y: auto; padding: 12px 4px; scroll-behavior: smooth; }
.chat-msg { display: flex; gap: 12px; max-width: 85%; }
.chat-msg.user { margin-left: auto; flex-direction: row-reverse; }
.chat-avatar { width: 36px; height: 36px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: var(--shadow-sm); }
.chat-msg.ai .chat-avatar { background: linear-gradient(135deg, var(--brand-500), var(--accent-500)); color: #fff; }
.chat-msg.user .chat-avatar { background: var(--bg-surface-2); color: var(--text-secondary); border: 1px solid var(--border); }
.chat-bubble { padding: 14px 18px; border-radius: var(--r-lg); font-size: var(--fs-sm); line-height: 1.6; box-shadow: var(--shadow-sm); position: relative; }
.chat-msg.ai .chat-bubble { background: var(--bg-surface-2); border: 1px solid var(--border); border-top-left-radius: 4px; }
.chat-msg.user .chat-bubble { background: linear-gradient(135deg, var(--brand-600), var(--brand-700)); color: #fff; border-top-right-radius: 4px; }
.chat-timestamp { font-size: 10px; color: var(--text-muted); margin-top: 4px; opacity: 0; transition: opacity 0.2s var(--ease); }
.chat-msg:hover .chat-timestamp { opacity: 1; }
.chat-msg.user .chat-timestamp { text-align: right; }
.chat-input-row { display: flex; gap: 10px; margin-top: 20px; position: relative; }
.chat-input-row .input { flex: 1; padding-right: 50px; }
.chat-input-row .btn-icon { position: absolute; right: 4px; top: 4px; width: 38px; height: 38px; background: transparent; color: var(--brand-400); }
.chat-input-row .btn-icon:hover { background: var(--bg-hover); }

/* Insight card */
.insight-card { display: flex; gap: 16px; padding: var(--sp-5); align-items: flex-start; }
.insight-icon { width: 44px; height: 44px; border-radius: var(--r-md); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1); transition: transform var(--t-spring), box-shadow var(--t-spring); cursor: default; }
.insight-icon:hover { transform: scale(1.15) rotate(5deg); box-shadow: var(--shadow-glow); }
.insight-icon.opportunity { background: rgba(16,185,129,0.15); color: var(--success); }
.insight-icon.warning { background: rgba(245,158,11,0.15); color: var(--warning); }
.insight-icon.insight { background: rgba(34,211,238,0.15); color: var(--info); }
.insight-icon.seasonality { background: rgba(139,92,246,0.15); color: #a78bfa; }
.insight-body { flex: 1; }
.insight-title { font-weight: 600; font-size: var(--fs-base); margin-bottom: 6px; }
.insight-desc { font-size: var(--fs-sm); color: var(--text-secondary); line-height: 1.6; }
.insight-meta { display: flex; gap: 12px; margin-top: 12px; flex-wrap: wrap; align-items: center; }

/* Confidence meter */
.confidence-bar { height: 8px; border-radius: var(--r-full); background: var(--bg-input); border: 1px solid var(--border); overflow: hidden; }
.confidence-fill { height: 100%; border-radius: var(--r-full); background: linear-gradient(90deg, var(--brand-400), var(--accent-400)); transition: width 1s var(--ease-spring); box-shadow: 0 0 10px rgba(34,211,238,0.4); }

/* Table */
.table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
.table { width: 100%; border-collapse: separate; border-spacing: 0; white-space: nowrap; }
.table th { text-align: left; font-size: var(--fs-xs); font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; padding: 12px 16px; border-bottom: 1px solid var(--border-strong); }
.table td { padding: 14px 16px; font-size: var(--fs-sm); border-bottom: 1px solid var(--border); transition: background var(--t-fast); }
.table tr { position: relative; transition: transform var(--t-fast), box-shadow var(--t-fast); }
/* Enhanced table row hover */
.table tbody tr:hover { 
  transform: translateY(-1px) scale(1.002); 
  box-shadow: var(--shadow-md); 
  z-index: 10; 
  position: relative;
}
.table tbody tr:hover td { 
  background: var(--bg-hover); 
  border-bottom-color: transparent;
}
.table tbody tr:hover td:first-child { border-top-left-radius: var(--r-sm); border-bottom-left-radius: var(--r-sm); }
.table tbody tr:hover td:last-child { border-top-right-radius: var(--r-sm); border-bottom-right-radius: var(--r-sm); }
.table tr:last-child td { border-bottom: none; }

/* Progress ring */
.progress-ring { transform: rotate(-90deg); }
.progress-ring-track { stroke: var(--bg-surface-2); }
.progress-ring-fill { stroke: url(#loaderGrad); stroke-linecap: round; transition: stroke-dashoffset 1s var(--ease-spring); }

/* Recharts overrides */
.recharts-cartesian-grid-horizontal line, .recharts-cartesian-grid-vertical line { stroke: var(--border); stroke-dasharray: 4 4; }
.recharts-tooltip-cursor { fill: rgba(16, 185, 129, 0.05); }

/* Recharts Glass Tooltip */
.recharts-tooltip-wrapper { transition: transform 0.2s var(--ease-spring) !important; outline: none; }
.recharts-default-tooltip { background: var(--bg-glass) !important; backdrop-filter: blur(24px); border: 1px solid var(--border-strong) !important; border-radius: var(--r-md) !important; box-shadow: var(--shadow-lg), var(--shadow-glow) !important; padding: 12px 16px !important; animation: scaleIn 0.3s var(--ease-spring); }
.recharts-tooltip-item { padding: 4px 0 !important; font-weight: 500 !important; color: var(--text-primary) !important; }
.recharts-cartesian-axis-tick-value { fill: var(--chart-axis) !important; font-size: 11px !important; font-weight: 500 !important; }
.recharts-cartesian-grid line { stroke: var(--chart-grid) !important; }
.recharts-legend-item-text { color: var(--text-secondary) !important; font-size: var(--fs-sm) !important; font-weight: 500 !important; }

/* ============================================================
   PUBLIC NAVBAR
   ============================================================ */
.pub-navbar {
  position: fixed;
  top: 16px; left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 48px);
  max-width: 1200px;
  z-index: var(--z-nav);
  height: var(--navbar-h);
  display: flex;
  align-items: center;
  padding: 0 var(--sp-6);
  background: var(--bg-glass);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid var(--border-strong);
  border-radius: var(--r-full);
  box-shadow: var(--shadow-md), 0 0 20px rgba(34,211,238,0.1);
  transition: all var(--t-med);
}
.pub-navbar.scrolled { 
  top: 0;
  width: 100%;
  max-width: 100%;
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-top: none;
  box-shadow: var(--shadow-lg), 0 4px 30px rgba(0,0,0,0.3); 
  border-color: var(--border-strong); 
  background: rgba(17, 26, 43, 0.85); 
}
[data-theme='light'] .pub-navbar.scrolled { background: rgba(255, 255, 255, 0.95); }
.pub-nav-brand { display: flex; align-items: center; gap: 10px; flex-shrink: 0; transition: transform var(--t-fast); }
.pub-nav-brand:hover { transform: scale(1.05); }
.pub-nav-links { display: flex; align-items: center; gap: 8px; margin-left: 48px; }
.pub-nav-link {
  padding: 8px 16px;
  font-size: var(--fs-sm);
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: var(--r-full);
  transition: color var(--t-fast), background var(--t-fast), transform var(--t-fast);
  position: relative;
}
.pub-nav-link:hover { color: var(--text-primary); background: var(--bg-hover); transform: translateY(-1px); }
.pub-nav-link::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  width: 20px;
  height: 2px;
  border-radius: 2px;
  background: var(--brand-400);
  transition: transform var(--t-fast);
}
.pub-nav-link:hover::after { transform: translateX(-50%) scaleX(1); }
.pub-nav-cta { margin-left: auto; display: flex; align-items: center; gap: 12px; }
.pub-nav-toggle { display: none; }
@media (max-width: 860px) {
  .pub-nav-links { display: none; }
  .pub-nav-toggle { display: inline-flex; }
  .pub-nav-cta .btn:not(.menu-btn) { display: none; }
  .pub-nav-cta .btn.signin-btn { display: inline-flex; }
}
.pub-mobile-menu { display: none; }
@media (max-width: 860px) {
  .pub-mobile-menu.open { display: flex; flex-direction: column; gap: 8px; padding: 20px; position: fixed; top: var(--navbar-h); left: 16px; right: 16px; z-index: var(--z-nav); border-radius: var(--r-lg); box-shadow: var(--shadow-lg); border: 1px solid var(--border-strong); }
}

/* ============================================================
   PUBLIC FOOTER
   ============================================================ */
.pub-footer { position: relative; border-top: 1px solid var(--border-strong); background: radial-gradient(circle at center top, var(--bg-surface-2), var(--bg-base) 80%); overflow: hidden; margin-top: 60px; }
.pub-footer::before { content: ''; position: absolute; inset: 0; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M10 10h80v80H10z' fill='none' stroke='rgba(255,255,255,0.02)' stroke-width='1'/%3E%3C/svg%3E"); pointer-events: none; opacity: 0.5; }
.pub-footer-glow { position: absolute; top: -150px; left: 50%; transform: translateX(-50%); width: 1000px; height: 400px; background: radial-gradient(ellipse, rgba(34,211,238,0.15), transparent 70%); pointer-events: none; opacity: 0.8; }
.pub-footer-inner { max-width: 1200px; margin: 0 auto; padding: 100px 24px 40px; position: relative; z-index: 1; }
.pub-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 64px; }
@media (max-width: 768px) { .pub-footer-grid { grid-template-columns: 1fr 1fr; gap: 40px; } }
@media (max-width: 480px) { .pub-footer-grid { grid-template-columns: 1fr; } }
.pub-footer-brand-desc { font-size: var(--fs-sm); color: var(--text-secondary); line-height: 1.6; margin: 20px 0 24px; max-width: 320px; }
.pub-footer-col h4 { font-size: var(--fs-sm); font-weight: 600; margin-bottom: 20px; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; }
.pub-footer-col a { display: block; font-size: var(--fs-sm); color: var(--text-secondary); padding: 6px 0; transition: color var(--t-fast), transform var(--t-fast); }
.pub-footer-col a:hover { color: var(--brand-400); transform: translateX(4px); }
.pub-footer-bottom { border-top: 1px solid var(--border); padding-top: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
.pub-footer-social { display: flex; gap: 12px; }
.pub-social-btn { width: 40px; height: 40px; border-radius: var(--r-full); border: 1px solid var(--border); background: var(--bg-surface-2); display: inline-flex; align-items: center; justify-content: center; color: var(--text-secondary); transition: all var(--t-fast); }
.pub-social-btn:hover { color: #fff; background: var(--brand-500); border-color: var(--brand-500); transform: translateY(-3px) rotate(8deg); box-shadow: 0 4px 12px rgba(34,211,238,0.4); }
.pub-footer-newsletter { display: flex; gap: 8px; margin-top: 12px; }
.pub-footer-newsletter .input { flex: 1; height: 44px; border-radius: var(--r-full); padding-left: 20px; }
.pub-footer-newsletter .btn-icon { border-radius: 50%; width: 44px; height: 44px; }
.pub-footer-copy { font-size: var(--fs-sm); color: var(--text-muted); }

/* ============================================================
   LANDING / 3D ANIMATIONS
   ============================================================ */
.landing { position: relative; z-index: var(--z-base); }

/* Hero */
.hero { min-height: 100vh; display: flex; align-items: center; padding: calc(var(--navbar-h) + 60px) 24px 100px; position: relative; overflow: hidden; }
.hero-inner { max-width: 1240px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; width: 100%; }
@media (max-width: 900px) { .hero-inner { grid-template-columns: 1fr; text-align: center; gap: 48px; } .hero-visual { margin: 0 auto; } }
.hero-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: var(--r-full); background: rgba(34,211,238,0.1); border: 1px solid var(--border-brand); font-size: var(--fs-sm); font-weight: 600; color: var(--brand-400); margin-bottom: 24px; box-shadow: var(--shadow-glow); }
.hero-title { font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 800; line-height: 1.1; letter-spacing: -0.03em; margin-bottom: 24px; }
.hero-desc { font-size: var(--fs-xl); color: var(--text-secondary); line-height: 1.6; margin-bottom: 40px; max-width: 560px; font-weight: 400; }
@media (max-width: 900px) { .hero-desc { margin-left: auto; margin-right: auto; } }
.hero-cta-row { display: flex; gap: 16px; flex-wrap: wrap; }
@media (max-width: 900px) { .hero-cta-row { justify-content: center; } }
.hero-stats { display: flex; gap: 40px; margin-top: 56px; flex-wrap: wrap; }
@media (max-width: 900px) { .hero-stats { justify-content: center; } }
.hero-stat-num { font-size: var(--fs-3xl); font-weight: 800; color: var(--brand-400); line-height: 1.2; letter-spacing: -0.02em; }
.hero-stat-label { font-size: var(--fs-sm); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; margin-top: 4px; }

/* 3D orb / cube visual */
.hero-visual { width: 100%; height: 480px; display: flex; align-items: center; justify-content: center; perspective: 1200px; position: relative; }
.hero-video-container { position: absolute; right: -5%; width: 60%; height: 120%; top: -10%; z-index: 0; pointer-events: none; border-radius: 200px 0 0 200px; overflow: hidden; mask-image: linear-gradient(to right, transparent 0%, black 20%, black 100%); -webkit-mask-image: linear-gradient(to right, transparent 0%, black 20%, black 100%); }
@media (max-width: 900px) { .hero-video-container { display: none; } }
.hero-video { width: 100%; height: 100%; object-fit: cover; opacity: 0.45; filter: blur(2px); animation: heroZoom 20s linear alternate infinite; }
@keyframes heroZoom { from { transform: scale(1); } to { transform: scale(1.1); } }
.hero-video-overlay { position: absolute; inset: 0; background: radial-gradient(circle at center, transparent 30%, var(--bg-base) 100%); mix-blend-mode: multiply; z-index: 1; }
.hero-video-vignette { position: absolute; inset: 0; box-shadow: inset 0 0 100px var(--bg-base); z-index: 2; }
.scene-3d { width: 240px; height: 240px; perspective: 1000px; position: relative; z-index: 2; }
.cube-glow { position: absolute; top: 50%; left: 50%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(34,211,238,0.4), transparent 60%); transform: translate(-50%, -50%); z-index: -1; filter: blur(30px); }
.cube-3d { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; animation: cubeRotate 24s linear infinite; }
@keyframes cubeRotate {
  0% { transform: rotateX(-20deg) rotateY(0deg) rotateZ(5deg); }
  100% { transform: rotateX(-20deg) rotateY(360deg) rotateZ(5deg); }
}
.cube-face { position: absolute; width: 240px; height: 240px; border: 1px solid rgba(34,211,238,0.5); background: linear-gradient(135deg, rgba(34,211,238,0.1), rgba(16,185,129,0.05)); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; font-size: 56px; color: var(--brand-400); box-shadow: inset 0 0 40px rgba(34,211,238,0.2); }
.cube-face.front { transform: translateZ(120px); }
.cube-face.back { transform: rotateY(180deg) translateZ(120px); }
.cube-face.right { transform: rotateY(90deg) translateZ(120px); }
.cube-face.left { transform: rotateY(-90deg) translateZ(120px); }
.cube-face.top { transform: rotateX(90deg) translateZ(120px); }
.cube-face.bottom { transform: rotateX(-90deg) translateZ(120px); }

/* Orbiting rings around cube */
.orbit-ring { position: absolute; top: 50%; left: 50%; border: 1px solid rgba(34,211,238,0.2); border-radius: 50%; transform: translate(-50%, -50%); transition: border-color var(--t-med); }
.orbit-ring.r1 { width: 360px; height: 360px; animation: orbitSpin 16s linear infinite, ringPulse 4s ease-in-out infinite alternate; }
.orbit-ring.r2 { width: 440px; height: 440px; border-color: rgba(16,185,129,0.15); animation: orbitSpin 22s linear infinite reverse, ringPulse 5s ease-in-out infinite alternate 1s; }
.orbit-ring.r3 { width: 520px; height: 520px; border-color: rgba(59,130,246,0.1); animation: orbitSpin 28s linear infinite, ringPulse 6s ease-in-out infinite alternate 2s; }
@keyframes ringPulse { 0% { opacity: 0.6; } 100% { opacity: 1; } }

.orbit-dot {
  position: absolute;
  border-radius: 50%;
  box-shadow: var(--shadow-glow-strong);
  pointer-events: none;
  transform: translate(-50%, -50%);
}
.d1 { width: 8px; height: 8px; background: var(--brand-400); top: 50%; left: 50%; animation: orbitDot1 16s linear infinite; }
.d2 { width: 6px; height: 6px; background: var(--accent-400); top: 50%; left: 50%; animation: orbitDot2 22s linear infinite reverse; }
.d3 { width: 10px; height: 10px; background: #8b5cf6; top: 50%; left: 50%; animation: orbitDot3 28s linear infinite; }

@keyframes orbitDot1 {
  0% { transform: translate(-50%, -50%) rotate(0deg) translateX(180px) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg) translateX(180px) rotate(-360deg); }
}
@keyframes orbitDot2 {
  0% { transform: translate(-50%, -50%) rotate(0deg) translateX(220px) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg) translateX(220px) rotate(-360deg); }
}
@keyframes orbitDot3 {
  0% { transform: translate(-50%, -50%) rotate(0deg) translateX(260px) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg) translateX(260px) rotate(-360deg); }
}

.scroll-indicator {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  opacity: 0.6;
  transition: opacity var(--t-fast);
}
.scroll-indicator:hover { opacity: 1; }
.scroll-mouse {
  width: 24px;
  height: 36px;
  border: 2px solid var(--text-muted);
  border-radius: 12px;
  position: relative;
}
.scroll-wheel {
  width: 4px;
  height: 6px;
  background: var(--text-muted);
  border-radius: 2px;
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  animation: scrollWheel 2s infinite ease-in-out;
}
@keyframes scrollWheel {
  0% { transform: translate(-50%, 0); opacity: 1; }
  100% { transform: translate(-50%, 12px); opacity: 0; }
}
@keyframes orbitSpin { to { transform: translate(-50%, -50%) rotate(360deg); } }

/* Orbiting dots */
.orbit-dot { position: absolute; top: 50%; left: 50%; width: 14px; height: 14px; border-radius: 50%; background: var(--brand-400); box-shadow: 0 0 20px var(--brand-400); }
.orbit-dot.d1 { animation: orbitMove1 16s linear infinite; }
.orbit-dot.d2 { width: 10px; height: 10px; background: var(--accent-400); box-shadow: 0 0 16px var(--accent-400); animation: orbitMove2 22s linear infinite; }
.orbit-dot.d3 { width: 8px; height: 8px; background: #3b82f6; box-shadow: 0 0 12px #3b82f6; animation: orbitMove3 28s linear infinite; }
@keyframes orbitMove1 { 0% { transform: translate(-50%, -50%) rotate(0deg) translateX(180px) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg) translateX(180px) rotate(-360deg); } }
@keyframes orbitMove2 { 0% { transform: translate(-50%, -50%) rotate(0deg) translateX(220px) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(-360deg) translateX(220px) rotate(360deg); } }
@keyframes orbitMove3 { 0% { transform: translate(-50%, -50%) rotate(0deg) translateX(260px) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg) translateX(260px) rotate(-360deg); } }

/* Floating data badges */
.data-badge { position: absolute; padding: 10px 16px; border-radius: var(--r-md); background: var(--bg-glass); backdrop-filter: blur(16px); border: 1px solid var(--border-strong); font-size: var(--fs-sm); font-weight: 600; display: flex; align-items: center; gap: 8px; box-shadow: var(--shadow-lg); animation: float 5s ease-in-out infinite; z-index: 10; }
.data-badge.b1 { top: 10%; left: -15%; animation-delay: 0s; }
.data-badge.b2 { top: 25%; right: -10%; animation-delay: 1.2s; }
.data-badge.b3 { bottom: 20%; left: -10%; animation-delay: 2.5s; }
.data-badge.b4 { bottom: 10%; right: -5%; animation-delay: 1.8s; }
@media (max-width: 1024px) { .data-badge { display: none; } }

/* Section */
.landing-section { padding: 100px 24px; position: relative; }
.landing-section-inner { max-width: 1240px; margin: 0 auto; }
.section-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: var(--fs-sm); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--brand-400); margin-bottom: 16px; }
.section-heading { font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; letter-spacing: -0.02em; line-height: 1.15; margin-bottom: 24px; }
.section-subheading { font-size: var(--fs-xl); color: var(--text-secondary); max-width: 720px; line-height: 1.6; margin-bottom: 64px; }
.section-center { text-align: center; }
.section-center .section-subheading { margin-left: auto; margin-right: auto; }

/* Feature grid with 3D tilt */
.feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
@media (max-width: 900px) { .feature-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 600px) { .feature-grid { grid-template-columns: 1fr; } }
.feature-card { padding: 40px 32px; transform-style: preserve-3d; transition: transform 0.5s var(--ease-out), box-shadow 0.5s var(--ease-out); }
.feature-card:hover { transform: translateY(-8px) rotateX(4deg) rotateY(-2deg); box-shadow: var(--shadow-lg), var(--shadow-glow); }
.feature-icon-3d { width: 64px; height: 64px; border-radius: var(--r-xl); background: linear-gradient(135deg, rgba(34,211,238,0.15), rgba(16,185,129,0.1)); display: inline-flex; align-items: center; justify-content: center; color: var(--brand-400); margin-bottom: 24px; transform: translateZ(30px); box-shadow: 0 8px 16px rgba(0,0,0,0.1); }
.feature-card h3 { font-size: var(--fs-xl); font-weight: 700; margin-bottom: 12px; transform: translateZ(20px); }
.feature-card p { font-size: var(--fs-base); color: var(--text-secondary); line-height: 1.6; transform: translateZ(10px); }

/* About section */
.about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
@media (max-width: 900px) { .about-grid { grid-template-columns: 1fr; } }
.about-visual { position: relative; height: 420px; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, rgba(34,211,238,0.05), transparent 70%); border-radius: var(--r-2xl); }
.about-stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.about-stat { padding: 32px; text-align: center; border-radius: var(--r-xl); }
.about-stat-num { font-size: var(--fs-4xl); font-weight: 800; color: var(--brand-400); letter-spacing: -0.02em; }
.about-stat-label { font-size: var(--fs-base); color: var(--text-secondary); margin-top: 8px; font-weight: 500; }
.about-text p { font-size: var(--fs-lg); color: var(--text-secondary); line-height: 1.6; margin-bottom: 20px; }
.about-list { display: flex; flex-direction: column; gap: 16px; margin-top: 24px; }
.about-list-item { display: flex; align-items: center; gap: 16px; font-size: var(--fs-base); font-weight: 500; color: var(--text-primary); }
.about-list-icon { width: 32px; height: 32px; border-radius: var(--r-full); background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05)); color: var(--success); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 0 12px rgba(16,185,129,0.2); }

/* Contact section */
.contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; }
@media (max-width: 900px) { .contact-grid { grid-template-columns: 1fr; } }
.contact-info-card { padding: 32px; display: flex; align-items: flex-start; gap: 20px; margin-bottom: 20px; transition: transform var(--t-fast); }
.contact-info-card:hover { transform: translateX(8px); border-color: var(--border-brand); }
.contact-info-icon { width: 56px; height: 56px; border-radius: var(--r-xl); background: linear-gradient(135deg, rgba(34,211,238,0.15), rgba(16,185,129,0.1)); display: inline-flex; align-items: center; justify-content: center; color: var(--brand-400); flex-shrink: 0; box-shadow: inset 0 0 0 1px rgba(34,211,238,0.2); }
.contact-info-title { font-weight: 600; font-size: var(--fs-lg); margin-bottom: 6px; color: var(--text-primary); }
.contact-info-val { font-size: var(--fs-base); color: var(--text-secondary); }

/* CTA band */
.cta-band { padding: 100px 24px; text-align: center; position: relative; overflow: hidden; background: linear-gradient(180deg, transparent, rgba(34,211,238,0.03)); border-top: 1px solid var(--border); }
.cta-band-inner { max-width: 800px; margin: 0 auto; position: relative; z-index: 1; }
.cta-band h2 { font-size: clamp(2rem, 4vw, 3.5rem); font-weight: 800; margin-bottom: 24px; letter-spacing: -0.02em; }
.cta-band p { font-size: var(--fs-xl); color: var(--text-secondary); margin-bottom: 40px; line-height: 1.6; }
.cta-band .hero-cta-row { justify-content: center; }

/* Parallax-ish floating chart mock */
.float-chart { position: relative; width: 100%; max-width: 520px; background: var(--bg-glass); backdrop-filter: blur(20px); border: 1px solid var(--border-strong); border-radius: var(--r-xl); padding: 32px; box-shadow: var(--shadow-lg), var(--shadow-glow); }
.float-chart-bar { display: flex; align-items: flex-end; gap: 12px; height: 240px; }
.float-chart-bar span { flex: 1; border-radius: 8px 8px 0 0; background: linear-gradient(to top, var(--brand-600), var(--brand-400)); animation: barGrow 1.5s var(--ease-spring) forwards; transform-origin: bottom; transform: scaleY(0); box-shadow: 0 -4px 12px rgba(34,211,238,0.3); }
.float-chart-bar span:nth-child(1) { height: 40%; animation-delay: 0.1s; }
.float-chart-bar span:nth-child(2) { height: 65%; animation-delay: 0.2s; }
.float-chart-bar span:nth-child(3) { height: 50%; animation-delay: 0.3s; }
.float-chart-bar span:nth-child(4) { height: 85%; animation-delay: 0.4s; }
.float-chart-bar span:nth-child(5) { height: 70%; animation-delay: 0.5s; }
.float-chart-bar span:nth-child(6) { height: 95%; animation-delay: 0.6s; }

/* Tilt wrapper */
.tilt-card { transform-style: preserve-3d; transition: transform 0.15s ease-out; }

/* ============================================================
   PREMIUM HERO AURORA
   ============================================================ */
.hero-aurora-container {
  position: absolute;
  inset: -30%;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  mask-image: radial-gradient(circle at center, black 30%, transparent 70%);
  -webkit-mask-image: radial-gradient(circle at center, black 30%, transparent 70%);
}

.hero-aurora-blob {
  position: absolute;
  border-radius: 50%;
  will-change: transform;
  mix-blend-mode: soft-light;
}

[data-theme='light'] .hero-aurora-blob {
  opacity: 0.08;
  filter: blur(120px);
  mix-blend-mode: normal;
}

[data-theme='dark'] .hero-aurora-blob {
  opacity: 0.12;
  filter: blur(140px);
  mix-blend-mode: screen;
}

[data-theme='light'] .hero-aurora-1 { background: #cffafe; }
[data-theme='light'] .hero-aurora-2 { background: #e0e7ff; }
[data-theme='light'] .hero-aurora-3 { background: #ccfbf1; }

[data-theme='dark'] .hero-aurora-1 { background: #06b6d4; }
[data-theme='dark'] .hero-aurora-2 { background: #8b5cf6; }
[data-theme='dark'] .hero-aurora-3 { background: #1e3a8a; }

.hero-aurora-1 {
  width: 80%;
  height: 80%;
  top: 10%;
  left: 10%;
  animation: heroAuroraHoriz 35s ease-in-out infinite alternate;
}

.hero-aurora-2 {
  width: 75%;
  height: 75%;
  top: 15%;
  right: 5%;
  animation: heroAuroraDiag 45s ease-in-out infinite alternate;
}

.hero-aurora-3 {
  width: 90%;
  height: 90%;
  top: 5%;
  left: 5%;
  animation: heroAuroraBreathe 20s ease-in-out infinite alternate;
}

@keyframes heroAuroraHoriz {
  0% { transform: translateX(-15%) scale(1); }
  100% { transform: translateX(15%) scale(1.05); }
}

@keyframes heroAuroraDiag {
  0% { transform: translate(-10%, -10%) scale(1); }
  100% { transform: translate(10%, 10%) scale(1.1); }
}

@keyframes heroAuroraBreathe {
  0% { transform: scale(0.95); opacity: 0.8; }
  100% { transform: scale(1.05); opacity: 1; }
}

@media (max-width: 900px) {
  [data-theme='light'] .hero-aurora-blob { opacity: 0.04; }
  [data-theme='dark'] .hero-aurora-blob { opacity: 0.06; }
  .hero-aurora-2, .hero-aurora-3 { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .hero-aurora-blob { animation: none !important; }
}
`;

export function ensureComponentStyles() {
  if (injected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.setAttribute('data-fiq-components', '');
  el.textContent = CSS;
  document.head.appendChild(el);
  injected = true;
}

export function useComponentStyles() {
  useEffect(() => {
    ensureComponentStyles();
    ensureLogoStyles();
  }, []);
}
