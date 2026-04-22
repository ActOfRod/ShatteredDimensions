import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  onError?: (error: Error, info: { componentStack?: string | null }) => void
}
interface State {
  error: Error | null
  info: string
}

// Catches render-time errors inside the game tree and shows them on-screen,
// so black-screen bugs surface instead of silently dying.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: '' }

  static getDerivedStateFromError(error: Error): State {
    return { error, info: '' }
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    this.setState({ error, info: info.componentStack ?? '' })
    console.error('Game error:', error, info)
    this.props.onError?.(error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: '#120408',
            color: '#ffdede',
            padding: 20,
            fontFamily: 'monospace',
            fontSize: 13,
            overflow: 'auto',
          }}
        >
          <h2 style={{ color: '#ff6666' }}>Something broke</h2>
          <div style={{ whiteSpace: 'pre-wrap', marginBottom: 14 }}>
            <b>{this.state.error.name}:</b> {this.state.error.message}
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', opacity: 0.75 }}>
            {this.state.error.stack}
          </pre>
          {this.state.info && (
            <pre style={{ whiteSpace: 'pre-wrap', opacity: 0.55, marginTop: 12 }}>
              {this.state.info}
            </pre>
          )}
          <button
            onClick={() => location.reload()}
            style={{
              marginTop: 18,
              padding: '10px 18px',
              fontSize: 14,
              background: '#3a6bff',
              color: 'white',
              border: 'none',
              borderRadius: 8,
            }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
