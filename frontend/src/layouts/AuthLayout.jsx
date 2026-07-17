import AuroraBackground from '../components/AuroraBackground.jsx';
import CursorGlow from '../components/CursorGlow.jsx';
import { Link } from 'react-router-dom';
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
          <video src="/videos/auth-video.mp4" autoPlay loop muted playsInline className="auth-video-bg" />
          <div className="auth-overlay" />
          <div className="auth-mesh-mobile" />
          <div className="auth-visual-content">
            <Link to="/" style={{ display: 'inline-block', marginBottom: 28 }}>
              <Logo size={72} animated withText={false} />
            </Link>
            <h2>
              Forecast smarter.<br />
              <span className="text-gradient">Spend wiser.</span>
            </h2>
            <p>
              ForecastIQ turns your marketing data into AI-driven predictions,
              budget simulations, and channel-level insights.
            </p>
            <div className="auth-feature-cards">
              <div className="auth-feature-card">
                <div className="auth-feature-icon-pulse"><BrainCircuit size={20} /></div>
                <span style={{ fontWeight: 600 }}>AI Marketing Intelligence</span>
              </div>
              <div className="auth-feature-card">
                <div className="auth-feature-icon-pulse"><Target size={20} /></div>
                <span style={{ fontWeight: 600 }}>Predict Campaign ROI</span>
              </div>
              <div className="auth-feature-card">
                <div className="auth-feature-icon-pulse"><ShieldCheck size={20} /></div>
                <span style={{ fontWeight: 600 }}>Enterprise Security</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form side */}
        <div className="auth-form-side">
          <div className="auth-form-wrap">
            <div className="auth-logo-row">
              <Link to="/">
                <Logo size={60} animated withText={false} />
              </Link>
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
