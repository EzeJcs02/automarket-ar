import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

const ICONS = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' }
const COLORS = {
  success: { bg: '#0d2318', border: 'rgba(74,222,128,.3)', text: '#4ade80' },
  error:   { bg: '#2a0d0d', border: 'rgba(230,51,41,.4)',  text: '#f87171' },
  info:    { bg: 'var(--gray1)', border: 'var(--gray2)',   text: 'var(--white)' },
  warning: { bg: '#241a05', border: 'rgba(201,168,76,.4)', text: '#c9a84c' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const dismiss = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div role="status" aria-live="polite" style={{ position: 'fixed', bottom: '90px', right: '1.25rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '360px', width: 'calc(100% - 2.5rem)' }}>
        {toasts.map(t => {
          const c = COLORS[t.type] || COLORS.info
          return (
            <div key={t.id} style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text, padding: '12px 14px', borderRadius: 'var(--radius-lg)', fontSize: '14px', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'flex-start', gap: '10px', boxShadow: '0 4px 20px rgba(0,0,0,.6)', animation: 'toast-in .22s ease' }}>
              <span style={{ fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>{ICONS[t.type]}</span>
              <span style={{ flex: 1, lineHeight: 1.5 }}>{t.message}</span>
              <button onClick={() => dismiss(t.id)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.5, fontSize: '16px', padding: 0, lineHeight: 1, flexShrink: 0 }}>✕</button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext)
}
