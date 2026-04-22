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
        const { data: conc } = await supabase.from('concesionarias').select('id').eq('user_id', user.id).single()
        navigate(conc ? '/panel' : '/')
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
          <div style={{ fontSize: '14px', color: 'var(--gray4)', marginBottom: '2.5rem' }}>Ingresá a tu cuenta</div>
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
            <Link to="/registro" style={{ color: 'var(--accent)' }}>Registrate</Link>
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
  const { signUp, signUpUsuario } = useAuth()
  const [tipo, setTipo] = useState('') // '' | 'concesionaria' | 'particular'
  const [paso, setPaso] = useState(1)
  const [form, setForm] = useState({ nombre: '', responsable: '', telefono: '', ciudad: '', email: '', pass: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)

  function setF(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleRegisterConcesionaria() {
    setLoading(true)
    setError('')
    const { error } = await signUp(form.email, form.pass, form)
    if (error) { setError(error.message); setLoading(false) }
    else setOk(true)
  }

  async function handleRegisterParticular(e) {
    e.preventDefault()
    if (!form.nombre || !form.email || !form.pass) { setError('Completá todos los campos.'); return }
    setLoading(true)
    setError('')
    const { error } = await signUpUsuario(form.email, form.pass, form.nombre)
    if (error) { setError(error.message); setLoading(false) }
    else setOk(true)
  }

  function siguientePaso() {
    if (paso === 1 && (!form.nombre || !form.responsable)) { setError('Completá nombre y responsable.'); return }
    if (paso === 2 && (!form.ciudad)) { setError('Completá la ciudad.'); return }
    setError('')
    setPaso(p => p + 1)
  }

  if (ok) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: '480px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '1.5rem' }}>✅</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '1rem' }}>
          {tipo === 'particular' ? 'REGISTRO EXITOSO' : 'SOLICITUD ENVIADA'}
        </div>
        <p style={{ fontSize: '15px', color: 'var(--gray4)', lineHeight: 1.7, marginBottom: '2rem' }}>
          {tipo === 'particular'
            ? 'Tu cuenta fue creada. Ya podés iniciar sesión y explorar el catálogo.'
            : 'Tu solicitud fue enviada. Nuestro equipo la va a revisar y te notificamos por email cuando esté aprobada.'}
        </p>
        <Link to="/login"><button className="btn-primary" style={{ marginRight: '1rem' }}>Iniciar sesión</button></Link>
        <Link to="/"><button className="btn-secondary">Volver al inicio</button></Link>
      </div>
    </div>
  )

  const ladoIzquierdo = (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'none' }} className="login-left">
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a0000 0%, #2e0a0a 40%, #0a0a0a 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, opacity: .05, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 60px,var(--white) 60px,var(--white) 61px),repeating-linear-gradient(90deg,transparent,transparent 60px,var(--white) 60px,var(--white) 61px)' }} />
      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,51,41,.25) 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '4rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '56px', lineHeight: .95, marginBottom: '1.5rem' }}>
          {tipo === 'concesionaria'
            ? <><span>PUBLICÁ TU</span><br /><span>STOCK EN</span><br /><span style={{ color: 'var(--accent)' }}>MINUTOS</span></>
            : <><span>ENCONTRÁ</span><br /><span>TU PRÓXIMO</span><br /><span style={{ color: 'var(--accent)' }}>VEHÍCULO</span></>}
        </div>
        <p style={{ fontSize: '15px', color: 'var(--gray4)', maxWidth: '340px', lineHeight: 1.7 }}>
          {tipo === 'concesionaria'
            ? 'Registrate gratis y empezá a recibir consultas de compradores de todo el país.'
            : 'Miles de vehículos nuevos y usados de las mejores concesionarias de Argentina.'}
        </p>
      </div>
    </div>
  )

  /* — SELECCIÓN DE TIPO — */
  if (!tipo) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--black)' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: '22px', letterSpacing: '3px', display: 'block', marginBottom: '3rem', textAlign: 'center' }}>
          AUTO<span style={{ color: 'var(--accent)' }}>MARKET</span> AR
        </Link>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', lineHeight: 1, marginBottom: '.75rem', textAlign: 'center' }}>CREAR CUENTA</div>
        <div style={{ fontSize: '14px', color: 'var(--gray4)', marginBottom: '3rem', textAlign: 'center' }}>¿Cómo querés registrarte?</div>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <button onClick={() => setTipo('concesionaria')} style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '1.5rem 2rem', textAlign: 'left', cursor: 'pointer', transition: 'border .2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--gray2)'}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--white)', marginBottom: '6px' }}>Soy una concesionaria</div>
            <div style={{ fontSize: '13px', color: 'var(--gray4)' }}>Publicá tu stock, gestioná consultas y crecé tu negocio.</div>
          </button>
          <button onClick={() => setTipo('particular')} style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '1.5rem 2rem', textAlign: 'left', cursor: 'pointer', transition: 'border .2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--gray2)'}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--white)', marginBottom: '6px' }}>Soy comprador / particular</div>
            <div style={{ fontSize: '13px', color: 'var(--gray4)' }}>Explorá el catálogo, guardá favoritos y contactá directamente.</div>
          </button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--gray4)', textAlign: 'center', marginTop: '2rem' }}>
          Ya tenés cuenta? <Link to="/login" style={{ color: 'var(--accent)' }}>Iniciá sesión</Link>
        </p>
      </div>
    </div>
  )

  /* — REGISTRO PARTICULAR — */
  if (tipo === 'particular') return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {ladoIzquierdo}
      <div style={{ width: '100%', maxWidth: '520px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', background: 'var(--black)' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: '22px', letterSpacing: '3px', display: 'block', marginBottom: '2.5rem' }}>
            AUTO<span style={{ color: 'var(--accent)' }}>MARKET</span> AR
          </Link>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', lineHeight: 1, marginBottom: '.5rem' }}>TU CUENTA</div>
          <div style={{ fontSize: '14px', color: 'var(--gray4)', marginBottom: '2.5rem' }}>Creá tu perfil de comprador</div>
          <form onSubmit={handleRegisterParticular}>
            <div className="form-field">
              <label>Nombre y apellido *</label>
              <input type="text" placeholder="Juan Pérez" value={form.nombre} onChange={e => setF('nombre', e.target.value)} required />
            </div>
            <div className="form-field">
              <label>Email *</label>
              <input type="email" placeholder="tu@email.com" value={form.email} onChange={e => setF('email', e.target.value)} required />
            </div>
            <div className="form-field">
              <label>Contraseña *</label>
              <input type="password" placeholder="Mínimo 6 caracteres" value={form.pass} onChange={e => setF('pass', e.target.value)} minLength={6} required />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button onClick={() => setTipo('')} style={{ background: 'none', border: 'none', color: 'var(--gray4)', fontSize: '12px', cursor: 'pointer' }}>← Volver</button>
            <span style={{ color: 'var(--gray3)', fontSize: '12px' }}>·</span>
            <Link to="/login" style={{ color: 'var(--accent)', fontSize: '12px' }}>Ya tenés cuenta</Link>
          </div>
        </div>
      </div>
      <style>{`@media (min-width: 768px) { .login-left { display: block !important; } }`}</style>
    </div>
  )

  /* — REGISTRO CONCESIONARIA (pasos) — */
  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {ladoIzquierdo}

      {/* LADO DERECHO */}
      <div style={{ width: '100%', maxWidth: '520px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', background: 'var(--black)' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: '22px', letterSpacing: '3px', display: 'block', marginBottom: '2.5rem' }}>
            AUTO<span style={{ color: 'var(--accent)' }}>MARKET</span> AR
          </Link>

          {/* INDICADOR DE PASOS */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '2.5rem', alignItems: 'center' }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: paso >= n ? 'var(--accent)' : 'var(--gray2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: paso >= n ? 'var(--white)' : 'var(--gray4)', transition: 'all .3s' }}>{n}</div>
                {n < 3 && <div style={{ width: '32px', height: '2px', background: paso > n ? 'var(--accent)' : 'var(--gray2)', transition: 'all .3s' }} />}
              </div>
            ))}
            <div style={{ marginLeft: '8px', fontSize: '13px', color: 'var(--gray4)' }}>
              {paso === 1 ? 'Datos de la empresa' : paso === 2 ? 'Ubicación y contacto' : 'Acceso a la plataforma'}
            </div>
          </div>

          {/* PASO 1 */}
          {paso === 1 && (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', lineHeight: 1, marginBottom: '2rem' }}>TU CONCESIONARIA</div>
              <div className="form-field">
                <label>Nombre de la concesionaria *</label>
                <input type="text" placeholder="Ej: Toyota del Norte" value={form.nombre} onChange={e => setF('nombre', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Responsable *</label>
                <input type="text" placeholder="Nombre y apellido" value={form.responsable} onChange={e => setF('responsable', e.target.value)} />
              </div>
            </div>
          )}

          {/* PASO 2 */}
          {paso === 2 && (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', lineHeight: 1, marginBottom: '2rem' }}>UBICACIÓN</div>
              <div className="form-field">
                <label>Ciudad / Provincia *</label>
                <input type="text" placeholder="Salta Capital, Salta" value={form.ciudad} onChange={e => setF('ciudad', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Teléfono</label>
                <input type="text" placeholder="(387) 421-0000" value={form.telefono} onChange={e => setF('telefono', e.target.value)} />
              </div>
            </div>
          )}

          {/* PASO 3 */}
          {paso === 3 && (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', lineHeight: 1, marginBottom: '2rem' }}>TU ACCESO</div>
              <div className="form-field">
                <label>Email *</label>
                <input type="email" placeholder="ventas@tuconcesionaria.com.ar" value={form.email} onChange={e => setF('email', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Contraseña *</label>
                <input type="password" placeholder="Mínimo 6 caracteres" value={form.pass} onChange={e => setF('pass', e.target.value)} minLength={6} />
              </div>
            </div>
          )}

          {error && <p className="error-msg">{error}</p>}

          <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
            {paso > 1
              ? <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setPaso(p => p - 1)}>← Atrás</button>
              : <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setTipo('')}>← Volver</button>
            }
            {paso < 3
              ? <button className="btn-primary" style={{ flex: 1 }} onClick={siguientePaso}>Siguiente →</button>
              : <button className="btn-primary" style={{ flex: 1 }} onClick={handleRegisterConcesionaria} disabled={loading}>{loading ? 'Enviando...' : 'Enviar solicitud'}</button>
            }
          </div>

          <p style={{ fontSize: '12px', color: 'var(--gray4)', textAlign: 'center', marginTop: '1.5rem' }}>
            Ya tenés cuenta? <Link to="/login" style={{ color: 'var(--accent)' }}>Iniciá sesión</Link>
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