import PublicNavbar from '../components/PublicNavbar.jsx';
import PublicFooter from '../components/PublicFooter.jsx';
import CursorGlow from '../components/CursorGlow.jsx';
import { useComponentStyles } from '../styles/components.js';

export default function Privacy() {
  useComponentStyles();

  return (
    <>
      <CursorGlow />
      <PublicNavbar />
      <div style={{ paddingTop: 'calc(var(--navbar-h) + 60px)', paddingBottom: 100, minHeight: '100vh', background: 'var(--bg-base)' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h1 style={{ fontSize: 'var(--fs-4xl)', fontWeight: 800, marginBottom: 24 }}>Privacy Policy</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 40, fontSize: 'var(--fs-lg)' }}>
            Last updated: October 10, 2026
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, lineHeight: 1.6, color: 'var(--text-primary)' }}>
            <section>
              <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 600, marginBottom: 16 }}>1. Information We Collect</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us.
              </p>
            </section>
            
            <section>
              <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 600, marginBottom: 16 }}>2. How We Use Information</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                We use the information we collect about you to provide, maintain, and improve our services, including providing budget simulations and marketing forecasts.
              </p>
            </section>
            
            <section>
              <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 600, marginBottom: 16 }}>3. Data Security</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction. Bank-grade encryption is utilized for all marketing data.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 600, marginBottom: 16 }}>4. Contact Us</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                If you have any questions about this Privacy Policy, please contact us at privacy@forecastiq.io.
              </p>
            </section>
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}
