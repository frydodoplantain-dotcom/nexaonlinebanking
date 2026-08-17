import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('NEXA Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
          <h2 style={{ color: 'var(--navy)', marginBottom: 12 }}>Something went wrong</h2>
          <p>We encountered an unexpected error. Please refresh the page.</p>
          <button className="btn" onClick={() => window.location.reload()} style={{ marginTop: 20 }}>
            Refresh page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
