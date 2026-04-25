import { useEffect, useState } from 'react'
import { setPageMeta } from '../lib/seo'

export default function Arrepentimiento() {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', nro_operacion: '', motivo: '' })
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
    setPageMeta({ title: 'Botón de arrepentimiento', description: 'Solicitá la revocación de tu compra o reserva según la Resolución 424/2020.', path: '/arrepentimiento' })
  }, [])

  function setF(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setEnviando(true)
    setError('')
    try {
      const res = await fetch('/api/arrepentimiento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Error al procesar la solicitud')
      setEnviado(true)
    } catch (err) {
      setError('No se pudo enviar la solicitud. Intentá nuevamente o escribinos a contacto@fioramarket.store')
    }
    setEnviando(false)
  }

  const inputStyle = { width: '100%', background: 'var(--black)', border: '1px solid var(--gray2)', padding: '12px 16px', borderRadius: 'var(--radius)', color: 'var(--white)', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }
  const labelStyle = { fontSize: '13px', color: 'var(--gray4)', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: '8px' }

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', padding: '8rem 4rem 4rem', color: 'var(--white)' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.2em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Legal</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '1rem' }}>BOTÓN DE ARREPENTIMIENTO</h1>
        <p style={{ color: 'var(--gray4)', lineHeight: '1.7', marginBottom: '3rem' }}>
          De acuerdo a la Resolución 424/2020, tenés derecho a revocar la aceptación de tu compra o reserva dentro de los 10 días computados a partir de la celebración del contrato. Completá el formulario y nos contactaremos a la brevedad.
        </p>

        {enviado ? (
          <div style={{ background: 'rgba(26,122,74,0.1)', border: '1px solid #1a7a4a', padding: '2.5rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '1rem' }}>✅</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '.75rem' }}>Solicitud registrada</h3>
            <p style={{ color: 'var(--gray4)', lineHeight: 1.7 }}>
              Hemos registrado tu pedido de arrepentimiento y te enviamos un comprobante a <strong style={{ color: 'var(--white)' }}>{form.email}</strong>. Nos pondremos en contacto en las próximas 24 horas hábiles.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--gray1)', padding: '3rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray2)' }}>

            <div>
              <label style={labelStyle}>Nombre completo *</label>
              <input type="text" required style={inputStyle} placeholder="Ej: Juan Pérez"
                value={form.nombre} onChange={e => setF('nombre', e.target.value)} />
            </div>

            <div>
              <label style={labelStyle}>Email de contacto *</label>
              <input type="email" required style={inputStyle} placeholder="tu@email.com"
                value={form.email} onChange={e => setF('email', e.target.value)} />
            </div>

            <div>
              <label style={labelStyle}>Teléfono (opcional)</label>
              <input type="tel" style={inputStyle} placeholder="Ej: +54 387 000-0000"
                value={form.telefono} onChange={e => setF('telefono', e.target.value)} />
            </div>

            <div>
              <label style={labelStyle}>Número de Reserva / Operación *</label>
              <input type="text" required style={inputStyle} placeholder="Ej: RES-987654"
                value={form.nro_operacion} onChange={e => setF('nro_operacion', e.target.value)} />
            </div>

            <div>
              <label style={labelStyle}>Motivo (opcional)</label>
              <textarea rows="3" style={{ ...inputStyle, resize: 'vertical' }} placeholder="Contanos brevemente por qué deseás cancelar..."
                value={form.motivo} onChange={e => setF('motivo', e.target.value)} />
            </div>

            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(230,51,41,.1)', border: '1px solid rgba(230,51,41,.3)', borderRadius: 'var(--radius)', fontSize: '13px', color: '#ff8a80' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={enviando}
              style={{ marginTop: '0.5rem', padding: '16px', fontSize: '16px', width: '100%' }}>
              {enviando ? 'Enviando...' : 'Solicitar cancelación'}
            </button>

            <p style={{ fontSize: '11px', color: 'var(--gray3)', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
              Al enviar este formulario, tu solicitud queda registrada con fecha y hora conforme a la Res. 424/2020 de la Secretaría de Comercio Interior.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
