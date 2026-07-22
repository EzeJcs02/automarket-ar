import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Comportamiento estándar de diálogo accesible: cierra con Escape, atrapa el
// foco adentro del modal mientras está abierto, y devuelve el foco a quien
// lo abrió al cerrarse. `containerRef` debe apuntar al contenido del modal.
export function useModalA11y(containerRef, onClose, active = true) {
  const triggerRef = useRef(null)

  useEffect(() => {
    if (!active) return
    triggerRef.current = document.activeElement
    containerRef.current?.querySelector(FOCUSABLE)?.focus()

    function onKeyDown(e) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      const container = containerRef.current
      if (!container) return
      const focusables = container.querySelectorAll(FOCUSABLE)
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      triggerRef.current?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])
}
