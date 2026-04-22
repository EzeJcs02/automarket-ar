import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signIn(email, pass)
    if (error) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email === 'austerlitzezequiel02@gmail.com') {
        navigate('/admin')
      } else {
        navigate('/panel')
      }
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* LADO IZQUIERDO — imagen */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'none' }} className="login-left">
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a0000 0%, #2e0a0a 40%, #0a0a0a 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: .05, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 60px,var(--white) 60px,var(--white) 61px),repeating-linear-gradient(90deg,transparent,transparent 60px,var(--white) 60px,var(--white) 61px)' }} />
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,51,41,.25) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '4rem' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '64px', lineHeight: .95, marginBottom: '1.5rem' }}>
            TU PRÓXIMO<br />AUTO<br /><span style={{ color: 'var(--accent)' }}>TE ESPERA</span>
          </div>
          <p style={{ fontSize: '15px', color: 'var(--gray4)', maxWidth: '340px', lineHeight: 1.7 }}>
            La plataforma de concesionarias más avanzada de Argentina.
          </p>
        </div>
      </div>

      {/* LADO DERECHO — formulario */}
      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', background: 'var(--black)' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '3px', display: 'block', marginBottom: '3rem' }}>
            AUTO<span style={{ color: 'var(--accent)' }}>MARKET</span> AR
          </Link>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '44px', lineHeight: 1, marginBottom: '.5rem' }}>BIENVENIDO</div>
          <div style={{ fontSize: '14px', color: 'var(--gray4)', marginBottom: '2.5rem' }}>Ingresá a tu panel de concesionaria</div>
          <form onSubmit={handleLogin}>
            <div className="form-field">
              <label>Email</label>
              <input type="email" placeholder="concesionaria@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-field">
              <label>Contraseña</label>
              <input type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} required />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', marginBottom: '1rem' }} disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar al panel'}
            </button>
          </form>
          <p style={{ fontSize: '13px', color: 'var(--gray4)', textAlign: 'center' }}>
            ¿No tenés cuenta?{' '}
            <Link to="/registro" style={{ color: 'var(--accent)' }}>Registrá tu concesionaria</Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .login-left { display: block !important; }
        }
      `}</style>
    </div>
  )
}

export function Registro() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', responsable: '', telefono: '', ciudad: '', email: '', pass: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)

  function setF(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signUp(form.email, form.pass, form)
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setOk(true)
    }
  }

  if (ok) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: '480px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '1.5rem' }}>✅</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '1rem' }}>SOLICITUD ENVIADA</div>
        <p style={{ fontSize: '15px', color: 'var(--gray4)', lineHeight: 1.7, marginBottom: '2rem' }}>
          Tu solicitud fue enviada correctamente. Nuestro equipo la va a revisar y te notificamos por email cuando esté aprobada.
        </p>
        <Link to="/"><button className="btn-secondary">Volver al inicio</button></Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '480px' }}>
        <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: '28px', letterSpacing: '3px', display: 'block', marginBottom: '3rem' }}>
          AUTO<span style={{ color: 'var(--accent)' }}>MARKET</span> AR
        </Link>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '44px', lineHeight: 1, marginBottom: '.5rem' }}>REGISTRÁ TU<br />CONCESIONARIA</div>
        <div style={{ fontSize: '14px', color: 'var(--gray4)', marginBottom: '2.5rem' }}>Completá el formulario. Revisamos tu solicitud y te aprobamos en 24hs.</div>
        <form onSubmit={handleRegister}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-field">
              <label>Nombre de la concesionaria *</label>
              <input type="text" placeholder="Ej: Toyota del Norte" value={form.nombre} onChange={e => setF('nombre', e.target.value)} required />
            </div>
            <div className="form-field">
              <label>Responsable *</label>
              <input type="text" placeholder="Nombre y apellido" value={form.responsable} onChange={e => setF('responsable', e.target.value)} required />
            </div>
            <div className="form-field">
              <label>Teléfono</label>
              <input type="text" placeholder="(387) 421-0000" value={form.telefono} onChange={e => setF('telefono', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Ciudad / Provincia *</label>
              <input type="text" placeholder="Salta Capital, Salta" value={form.ciudad} onChange={e => setF('ciudad', e.target.value)} required />
            </div>
          </div>
          <div className="form-field">
            <label>Email *</label>
            <input type="email" placeholder="ventas@tuconcesionaria.com.ar" value={form.email} onChange={e => setF('email', e.target.value)} required />
          </div>
          <div className="form-field">
            <label>Contraseña *</label>
            <input type="password" placeholder="Mínimo 6 caracteres" value={form.pass} onChange={e => setF('pass', e.target.value)} required minLength={6} />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', marginBottom: '1rem' }} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar solicitud de registro'}
          </button>
          <p style={{ fontSize: '12px', color: 'var(--gray4)', textAlign: 'center', lineHeight: 1.6 }}>
            Ya tenés cuenta? <Link to="/login" style={{ color: 'var(--accent)' }}>Iniciá sesión</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

