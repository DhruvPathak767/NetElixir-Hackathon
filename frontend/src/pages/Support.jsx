import { motion } from 'framer-motion';
import { Mail, MessageCircle, HelpCircle, Activity, ArrowRight } from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import PublicFooter from '../components/PublicFooter.jsx';
import Logo from '../components/Logo.jsx';
import { Link } from 'react-router-dom';
import { useScrollTop } from '../hooks/useUI.js';

const SUPPORT_CARDS = [
  {
    icon: HelpCircle,
    title: 'Help Center',
    desc: 'Browse our comprehensive guides and FAQs for self-serve troubleshooting.',
    action: 'Visit Help Center',
    type: 'info'
  },
  {
    icon: MessageCircle,
    title: 'Live Chat',
    desc: 'Chat directly with our support engineers. Available 24/7 for Enterprise customers.',
    action: 'Start Chat',
    type: 'warning'
  },
  {
    icon: Mail,
    title: 'Email Support',
    desc: 'Send us a detailed message. We typically respond within 2-4 business hours.',
    action: 'Email Us',
    type: 'success'
  },
  {
    icon: Activity,
    title: 'System Status',
    desc: 'Check the real-time operational status of the ForecastIQ platform and APIs.',
    action: 'View Status',
    type: 'error'
  }
];

export default function Support() {
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
          <div className="badge badge-warning" style={{ marginBottom: 24, display: 'inline-flex' }}>ForecastIQ Support</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 24 }}>
            How can we help?
          </h1>
          <p style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 600, margin: '0 auto', marginBottom: 40 }}>
            Our team is here to help you get the most out of your marketing intelligence.
          </p>
          
          <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
            <input 
              type="text" 
              className="input" 
              placeholder="Search for answers..." 
              style={{ width: '100%', padding: '16px 24px', borderRadius: 'var(--r-full)', fontSize: 'var(--fs-md)', border: '1px solid var(--brand-400)', boxShadow: '0 0 20px rgba(34,211,238,0.2)' }}
            />
          </div>
        </motion.div>
      </section>

      {/* Grid */}
      <section style={{ padding: '0 24px 100px', flex: 1 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
          {SUPPORT_CARDS.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * idx }}
              >
                <Card hover style={{ height: '100%', padding: '32px', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className={`insight-icon ${card.type}`} style={{ width: 64, height: 64, marginBottom: 24 }}>
                    <Icon size={32} />
                  </div>
                  <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 600, marginBottom: 12 }}>{card.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', lineHeight: 1.6, marginBottom: 24, flex: 1 }}>
                    {card.desc}
                  </p>
                  <Button variant="outline" style={{ width: '100%' }}>
                    {card.action}
                  </Button>
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
