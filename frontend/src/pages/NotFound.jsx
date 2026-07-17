import { Link } from 'react-router-dom';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: 24,
    }}>
      <StaggerContainer style={{ maxWidth: 480, width: '100%' }}>
        <StaggerItem>
          <Card reveal glow padding="xl" style={{
            textAlign: 'center',
            background: 'var(--bg-elevated-glass)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-glass)',
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--error)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <AlertCircle size={32} />
            </div>

            <h1 style={{
              fontSize: '4rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, var(--brand-400), var(--accent-400))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 0 12px',
              lineHeight: 1,
            }}>
              404
            </h1>

            <h2 style={{
              fontSize: 'var(--fs-lg)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 12,
            }}>
              Page Not Found
            </h2>

            <p style={{
              fontSize: 'var(--fs-sm)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: 32,
            }}>
              The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>

            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <Link to="/app/dashboard">
                <Button variant="primary" leftIcon={<Home size={16} />}>
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </Card>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
