import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error)
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="empty" style={{ padding: 60 }}>
            <div className="empty-icon">⚠</div>
            <p style={{ color: 'var(--ink-2)' }}>这个部分出了点问题，其他功能不受影响。</p>
            <button
              className="btn btn-primary"
              style={{ marginTop: 12 }}
              onClick={() => this.setState({ error: null })}
            >
              重试
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
