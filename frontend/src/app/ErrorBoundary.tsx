import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui';
type State = { failed: boolean };
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };
  static getDerivedStateFromError(): State { return { failed: true }; }
  componentDidCatch() { /* Errors stay out of visible copy and are not logged with personal data. */ }
  render() {
    if (this.state.failed) return <main className="system-screen"><h1>We couldn’t load this page.</h1><p>Reload the page to try again.</p><Button onClick={() => window.location.reload()}>Reload page</Button></main>;
    return this.props.children;
  }
}
