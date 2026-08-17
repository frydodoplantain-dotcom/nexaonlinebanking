import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h2 style={{ color: 'var(--navy)', marginBottom: 12 }}>Something went wrong</h2>
          <p>Please refresh the page.</p>
          <button className="btn" onClick={() => window.location.reload()} style={{ marginTop: 20 }}>Refresh page</button>
        </div>
      );
    }
    return this.props.children;
  }
}
