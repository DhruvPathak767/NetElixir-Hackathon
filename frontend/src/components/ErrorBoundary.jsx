import React from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';
import Button from './Button.jsx';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="empty-state" style={{ minHeight: '50vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="empty-state-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
            <ShieldAlert size={32} />
          </div>
          <h2 className="empty-state-title" style={{ marginTop: 24 }}>Something went wrong</h2>
          <p className="empty-state-desc" style={{ maxWidth: 400, margin: '0 auto 24px' }}>
            We encountered an unexpected error while loading this component.
          </p>
          <Button variant="primary" leftIcon={<RotateCcw size={16} />} onClick={this.handleRetry}>
            Try Again
          </Button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-surface-2)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', textAlign: 'left', maxWidth: '80%', overflowX: 'auto' }}>
              <pre>{this.state.error.toString()}</pre>
              <pre style={{ marginTop: 8 }}>{this.state.errorInfo?.componentStack}</pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children; 
  }
}
