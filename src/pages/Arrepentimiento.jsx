import { useEffect, useState } from 'react'

export default function Arrepentimiento() {
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    // Acá en el futuro lo conectamos a Supabase para guardar el reclamo
    setEnviado(true)
  }

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', padding: '8rem 4rem 4rem', color: 'var(--white)' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '1rem' }}>BOTÓN DE ARREPENTIMIENTO</h1>
        <p style={{ color: 'var(--gray4)', lineHeight: '1.7', marginBottom: '3rem' }}>
          De acuerdo a la Resolución 424/2020, tenés derecho a revocar la aceptación de tu compra o reserva dentro de los 10 días computados a partir de la celebración del contrato. Completá el formulario y nos contactaremos a la brevedad.
        </p>

        {enviado ? (
          <div style={{ background: 'rgba(26, 122, 74, 0.1)', border: '1px solid #1a7a4a', padding: '2rem', borderRadius: 'var(--radius)', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '1rem' }}>✅</div>
            <h3 style={{ fontSize: '20px', marginBottom: '0.5rem' }}>Solicitud recibida</h3>
            <p style={{ color: 'var(--gray4)' }}>Hemos registrado tu pedido de arrepentimiento. Te enviamos un comprobante a tu email y nos pondremos en contacto en las próximas 24 horas hábiles.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--gray1)', padding: '3rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray2)' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: 'var(--gray4)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Nombre completo</label>
              <input type="text" required style={{ background: 'var(--black)', border: '1px solid var(--gray2)', padding: '12px 16px', borderRadius: 'var(--radius)', color: 'var(--white)', outline: 'none' }} placeholder="Ej: Juan Pérez" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: 'var(--gray4)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Email de contacto</label>
              <input type="email" required style={{ background: 'var(--black)', border: '1px solid var(--gray2)', padding: '12px 16px', borderRadius: 'var(--radius)', color: 'var(--white)', outline: 'none' }} placeholder="tu@email.com" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: 'var(--gray4)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Número de Reserva / Operación</label>
              <input type="text" required style={{ background: 'var(--black)', border: '1px solid var(--gray2)', padding: '12px 16px', borderRadius: 'var(--radius)', color: 'var(--white)', outline: 'none' }} placeholder="Ej: RES-987654" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: 'var(--gray4)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Motivo (Opcional)</label>
              <textarea rows="3" style={{ background: 'var(--black)', border: '1px solid var(--gray2)', padding: '12px 16px', borderRadius: 'var(--radius)', color: 'var(--white)', outline: 'none', resize: 'vertical' }} placeholder="Contanos brevemente por qué deseás cancelar..."></textarea>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '1rem', padding: '16px', fontSize: '16px', width: '100%' }}>
              Solicitar cancelación
            </button>
          </form>
        )}
      </div>
    </div>
  )
}