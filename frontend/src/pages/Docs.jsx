import { motion } from 'framer-motion';
import { BookOpen, Code, Terminal, Zap, Shield, FileText, ArrowRight } from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import PublicFooter from '../components/PublicFooter.jsx';
import Logo from '../components/Logo.jsx';
import { Link } from 'react-router-dom';
import { useScrollTop } from '../hooks/useUI.js';

const DOCS_SECTIONS = [
  {
    icon: Zap,
    title: 'Getting Started',
    desc: 'Learn how to connect your data sources and generate your first marketing forecast in under 5 minutes.',
  },
  {
    icon: Code,
    title: 'API Reference',
    desc: 'Integrate ForecastIQ directly into your internal tools using our REST GraphQL APIs.',
  },
  {
    icon: Terminal,
    title: 'SDKs & Libraries',
    desc: 'Official client libraries for Python, Node.js, Go, and Ruby to speed up your development.',
  },
  {
    icon: Shield,
    title: 'Security & Privacy',
    desc: 'Read about our SOC2 compliance, data encryption practices, and GDPR adherence.',
  },
  {
    icon: BookOpen,
    title: 'Tutorials',
    desc: 'Step-by-step guides on advanced features like budget simulation and custom AI models.',
  },
  {
    icon: FileText,
    title: 'Release Notes',
    desc: 'Stay up to date with the latest features, improvements, and bug fixes to the platform.',
  }
];

export default function Docs() {
  useScrollTop();

  return (
    <div className="landing-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ 
        padding: '20px var(--sp-6)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <Link to="/">
          <Logo animated={false} />
        </Link>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link to="/login"><Button variant="ghost">Log In</Button></Link>
          <Link to="/signup"><Button variant="primary">Get Started</Button></Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: '80px 24px', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="badge badge-info" style={{ marginBottom: 24, display: 'inline-flex' }}>ForecastIQ Developer Hub</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 24 }}>
            Documentation
          </h1>
          <p style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 600, margin: '0 auto' }}>
            Everything you need to build, integrate, and scale your marketing intelligence with ForecastIQ.
          </p>
        </motion.div>
      </section>

      {/* Grid */}
      <section style={{ padding: '0 24px 100px', flex: 1 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {DOCS_SECTIONS.map((section, idx) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * idx }}
              >
                <Card hover style={{ height: '100%', padding: '32px', cursor: 'pointer' }}>
                  <div className="insight-icon info" style={{ width: 48, height: 48, marginBottom: 24 }}>
                    <Icon size={24} />
                  </div>
                  <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 600, marginBottom: 12 }}>{section.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', lineHeight: 1.6, marginBottom: 24 }}>
                    {section.desc}
                  </p>
                  <div style={{ color: 'var(--brand-400)', fontSize: 'var(--fs-sm)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    Read more <ArrowRight size={14} />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
