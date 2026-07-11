import PublicNavbar from '../components/PublicNavbar.jsx';
import PublicFooter from '../components/PublicFooter.jsx';
import CursorGlow from '../components/CursorGlow.jsx';
import { useComponentStyles } from '../styles/components.js';

export default function Terms() {
  useComponentStyles();

  return (
    <>
      <CursorGlow />
      <PublicNavbar />
      <div style={{ paddingTop: 'calc(var(--navbar-h) + 60px)', paddingBottom: 100, minHeight: '100vh', background: 'var(--bg-base)' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h1 style={{ fontSize: 'var(--fs-4xl)', fontWeight: 800, marginBottom: 24 }}>Terms of Service</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 40, fontSize: 'var(--fs-lg)' }}>
            Last updated: October 10, 2026
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, lineHeight: 1.6, color: 'var(--text-primary)' }}>
            <section>
              <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 600, marginBottom: 16 }}>1. Acceptance of Terms</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                By accessing or using ForecastIQ's services, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service.
              </p>
            </section>
            
            <section>
              <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 600, marginBottom: 16 }}>2. Service Provision</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                ForecastIQ provides an AI-powered platform for marketing teams to forecast revenue, simulate budgets, and analyze channel performance. We reserve the right to modify or discontinue the service at any time without notice.
              </p>
            </section>
            
            <section>
              <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 600, marginBottom: 16 }}>3. User Data</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                You retain all rights to the data you upload to ForecastIQ. By uploading data, you grant us a license to use it solely for the purpose of providing the service to you.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 600, marginBottom: 16 }}>4. Limitation of Liability</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                ForecastIQ's predictions and forecasts are based on AI models and historical data. We do not guarantee future performance or specific outcomes based on our insights.
              </p>
            </section>
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}
