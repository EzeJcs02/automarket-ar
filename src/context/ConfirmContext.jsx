import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { useModalA11y } from '../lib/useModalA11y'

const ConfirmContext = createContext(null)

// Reemplazo de window.confirm con el estilo del sitio: `await confirmar({ titulo, texto })`.
export function ConfirmProvider({ children }) {
  const [opciones, setOpciones] = useState(null)
  const resolverRef = useRef(null)
  const dialogRef = useRef(null)

  const confirmar = useCallback((opts) => new Promise(resolve => {
    resolverRef.current = resolve
    setOpciones(typeof opts === 'string' ? { texto: opts } : opts)
  }), [])

  const cerrar = useCallback((respuesta) => {
    resolverRef.current?.(respuesta)
    resolverRef.current = null
    setOpciones(null)
  }, [])

  useModalA11y(dialogRef, () => cerrar(false), !!opciones)

  return (
    <ConfirmContext.Provider value={confirmar}>
      {children}
      {opciones && (
        <div onClick={e => e.target === e.currentTarget && cerrar(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby="confirm-titulo" aria-describedby="confirm-texto"
            style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}>
            <div id="confirm-titulo" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--white)', marginBottom: '.75rem' }}>
              {opciones.titulo || '¿Confirmás?'}
            </div>
            {opciones.texto && (
              <p id="confirm-texto" style={{ fontSize: '14px', color: 'var(--gray4)', lineHeight: 1.6, margin: '0 0 1.5rem', whiteSpace: 'pre-line' }}>{opciones.texto}</p>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={() => cerrar(false)}>{opciones.cancelar || 'Cancelar'}</button>
              <button className="btn-primary" onClick={() => cerrar(true)}
                style={opciones.peligro ? { background: '#b91c1c', borderColor: '#b91c1c' } : undefined}>
                {opciones.confirmar || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() {
  return useContext(ConfirmContext)
}
