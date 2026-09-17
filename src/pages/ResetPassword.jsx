import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'

export default function ResetPassword() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [checking, setChecking] = useState(true)
  const [validLink, setValidLink] = useState(false)
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let active = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && active) {
        setValidLink(true)
        setChecking(false)
      }
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      if (session) setValidLink(true)
      setChecking(false)
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (pass.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (pass !== pass2) { setError('Las contraseñas no coinciden.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pass })
    setLoading(false)
    if (error) { setError('No pudimos actualizar tu contraseña. Probá pedir un nuevo enlace.'); return }
    setDone(true)
    toast('Contraseña actualizada correctamente.', 'success')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--black)' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '3px', display: 'block', marginBottom: '2.5rem', textAlign: 'center' }}>
          FIORA<span style={{ color: 'var(--accent)' }}> MARKET</span>
        </Link>

        {checking ? (
          <div className="spinner" style={{ margin: '0 auto' }} />
        ) : done ? (
          <>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', lineHeight: 1, marginBottom: '1rem', textAlign: 'center' }}>LISTO</div>
            <p style={{ color: 'var(--gray4)', fontSize: '14px', lineHeight: 1.7, marginBottom: '1.5rem', textAlign: 'center' }}>
              Tu contraseña fue actualizada. Ya podés seguir usando tu cuenta.
            </p>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => navigate('/')}>Ir al inicio</button>
          </>
        ) : !validLink ? (
          <>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', lineHeight: 1, marginBottom: '1rem', textAlign: 'center' }}>ENLACE INVÁLIDO</div>
            <p style={{ color: 'var(--gray4)', fontSize: '14px', lineHeight: 1.7, marginBottom: '1.5rem', textAlign: 'center' }}>
              Este enlace de recuperación no es válido o ya venció. Pedí uno nuevo desde la pantalla de ingreso.
            </p>
            <Link to="/login"><button className="btn-primary" style={{ width: '100%' }}>Volver a ingresar</button></Link>
          </>
        ) : (
          <>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', lineHeight: 1, marginBottom: '.5rem', textAlign: 'center' }}>NUEVA CONTRASEÑA</div>
            <div style={{ fontSize: '14px', color: 'var(--gray4)', marginBottom: '2rem', textAlign: 'center' }}>Elegí una nueva contraseña para tu cuenta</div>
            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>Contraseña nueva</label>
                <input type="password" placeholder="Mínimo 6 caracteres" value={pass} onChange={e => setPass(e.target.value)} minLength={6} required />
              </div>
              <div className="form-field">
                <label>Repetir contraseña</label>
                <input type="password" placeholder="••••••••" value={pass2} onChange={e => setPass2(e.target.value)} minLength={6} required />
              </div>
              {error && <p className="error-msg">{error}</p>}
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar contraseña'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
