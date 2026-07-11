import AuroraBackground from '../components/AuroraBackground.jsx';
import CursorGlow from '../components/CursorGlow.jsx';
import Logo from '../components/Logo.jsx';
import { useTheme } from '../hooks/useTheme.js';
import { useComponentStyles } from '../styles/components.js';
import { BrainCircuit, TrendingUp, ShieldCheck, BarChart3, Target } from 'lucide-react';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';
import { motion } from 'framer-motion';

export default function AuthLayout({ children, title, subtitle }) {
  useComponentStyles();
  useTheme();

  return (
    <>
      <AuroraBackground />
      <CursorGlow />
      <div className="auth-layout">
        {/* Visual side */}
        <div className="auth-visual">
          <div className="auth-visual-content">
            <div style={{ marginBottom: 28 }}>
              <Logo size={56} animated withText={false} />
            </div>
            <h2>
              Forecast smarter.<br />
              <span className="text-gradient">Spend wiser.</span>
            </h2>
            <p>
              ForecastIQ turns your marketing data into AI-driven predictions,
              budget simulations, and channel-level insights — so every dollar
              works harder.
            </p>
            <StaggerContainer className="auth-feature-list">
              <StaggerItem className="auth-feature">
                <span className="auth-feature-icon"><TrendingUp size={18} /></span>
                <span>6-month revenue & ROAS forecasting at 87% confidence</span>
              </StaggerItem>
              <StaggerItem className="auth-feature">
                <span className="auth-feature-icon"><BrainCircuit size={18} /></span>
                <span>AI insights that surface reallocation opportunities automatically</span>
              </StaggerItem>
              <StaggerItem className="auth-feature">
                <span className="auth-feature-icon"><ShieldCheck size={18} /></span>
                <span>Bank-grade encryption — your data stays yours</span>
              </StaggerItem>
            </StaggerContainer>
          </div>

          {/* Floating mock cards for visual interest */}
          <motion.div 
            className="data-badge b1"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
            style={{ top: '15%', right: '15%', left: 'auto', bottom: 'auto' }}
          >
            <BarChart3 size={16} color="var(--brand-400)" />
            <span>ROAS 4.3x</span>
          </motion.div>
          <motion.div 
            className="data-badge b2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: 'spring' }}
            style={{ bottom: '15%', left: '15%', right: 'auto', top: 'auto' }}
          >
            <Target size={16} color="var(--accent-400)" />
            <span>+14.5% Revenue</span>
          </motion.div>
        </div>

        {/* Form side */}
        <div className="auth-form-side">
          <div className="auth-form-wrap">
            <div className="auth-logo-row">
              <Logo size={48} animated withText={false} />
            </div>
            <h1 className="auth-title">{title}</h1>
            <p className="auth-subtitle">{subtitle}</p>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
