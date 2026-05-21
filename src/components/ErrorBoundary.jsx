import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--black, #0a0a0a)', color: 'var(--white, #f5f3ee)' }}>
        <div style={{ maxWidth: '480px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', marginBottom: '1rem', color: 'var(--accent, #e63329)' }}>
            UPS
          </div>
          <p style={{ fontSize: '16px', lineHeight: 1.6, marginBottom: '2rem', color: 'var(--gray4, #888)' }}>
            Algo salió mal en la aplicación. Nuestro equipo fue notificado.
            Podés volver al inicio para seguir navegando.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{ background: 'var(--gray1, #1a1a1a)', padding: '1rem', borderRadius: '8px', fontSize: '12px', textAlign: 'left', overflow: 'auto', marginBottom: '2rem', color: '#f87171' }}>
              {String(this.state.error?.stack || this.state.error)}
            </pre>
          )}
          <button onClick={this.handleReset} className="btn-primary" style={{ padding: '12px 28px' }}>
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }
}
