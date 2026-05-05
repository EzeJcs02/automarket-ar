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
  const [resetMode, setResetMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  async function handleReset(e) {
    e.preventDefault()
    setResetLoading(true)
    await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo: 'https://fioramarket.store/mi-cuenta' })
    setResetLoading(false)
    setResetSent(true)
  }

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
      if (user?.email === 'rlautomotores24@gmail.com') {
        navigate('/admin')
      } else {
        const { data: conc } = await supabase.from('concesionarias').select('id').eq('user_id', user.id).maybeSingle()
        if (conc) {
          navigate('/panel')
        } else {
          const { data: prof } = await supabase.from('profesionales').select('id').eq('user_id', user.id).maybeSingle()
          navigate(prof ? '/panel-profesional' : '/mi-cuenta')
        }
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
            TU PRÓXIMO<br />VEHÍCULO<br /><span style={{ color: 'var(--accent)' }}>TE ESPERA</span>
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
            FIORA<span style={{ color: 'var(--accent)' }}> MARKET</span>
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
          <p style={{ fontSize: '13px', color: 'var(--gray4)', textAlign: 'center', marginBottom: '8px' }}>
            ¿No tenés cuenta?{' '}
            <Link to="/registro" style={{ color: 'var(--accent)' }}>Registrate</Link>
          </p>
          <p style={{ fontSize: '13px', color: 'var(--gray4)', textAlign: 'center' }}>
            <button onClick={() => setResetMode(true)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '13px', padding: 0 }}>
              ¿Olvidaste tu contraseña?
            </button>
          </p>

          {resetMode && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
              onClick={e => e.target === e.currentTarget && setResetMode(false)}>
              <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', width: '100%', maxWidth: '400px' }}>
                {resetSent ? (
                  <>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '1rem' }}>REVISÁ TU EMAIL</div>
                    <p style={{ color: 'var(--gray4)', fontSize: '14px', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                      Si existe una cuenta con ese email, te enviamos un enlace para restablecer tu contraseña.
                    </p>
                    <button className="btn-secondary" style={{ width: '100%' }} onClick={() => { setResetMode(false); setResetSent(false) }}>Cerrar</button>
                  </>
                ) : (
                  <>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '0.5rem' }}>RECUPERAR CONTRASEÑA</div>
                    <p style={{ color: 'var(--gray4)', fontSize: '13px', marginBottom: '1.5rem' }}>Te enviamos un enlace a tu email.</p>
                    <form onSubmit={handleReset}>
                      <div className="form-field">
                        <label>Email</label>
                        <input type="email" placeholder="tu@email.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required />
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                        <button type="submit" className="btn-primary" disabled={resetLoading} style={{ flex: 1 }}>
                          {resetLoading ? 'Enviando...' : 'Enviar enlace'}
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => setResetMode(false)}>Cancelar</button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}
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
const CATEGORIAS_PROF = [
  { id: 'gestores', label: 'Gestores automotores' },
  { id: 'escribanos', label: 'Escribanos' },
  { id: 'mecanicos', label: 'Mecánicos' },
  { id: 'repuesteros', label: 'Repuesteros' },
  { id: 'seguros', label: 'Seguros' },
  { id: 'estetica', label: 'Estética vehicular' },
  { id: 'verificacion', label: 'Verificación / inspección' },
  { id: 'transporte', label: 'Transporte / flete' },
]

export function Registro() {
  const { signUp, signUpUsuario, signUpProfesional } = useAuth()
  const [tipo, setTipo] = useState('') // '' | 'concesionaria' | 'particular' | 'profesional'
  const [paso, setPaso] = useState(1)
  const [form, setForm] = useState({ nombre: '', responsable: '', telefono: '', ciudad: '', email: '', pass: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)
  const [aceptaTerminos, setAceptaTerminos] = useState(false)

  function setF(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleRegisterConcesionaria() {
    if (!aceptaTerminos) { setError('Debés aceptar los Términos y Condiciones.'); return }
    setLoading(true)
    setError('')
    const { error } = await signUp(form.email, form.pass, form)
    if (error) { setError(error.message); setLoading(false) }
    else setOk(true)
  }

  async function handleRegisterProfesional(e) {
    e.preventDefault()
    if (!form.nombre || !form.categoria || !form.email || !form.pass) { setError('Completá todos los campos obligatorios.'); return }
    if (!aceptaTerminos) { setError('Debés aceptar los Términos y Condiciones.'); return }
    setLoading(true)
    setError('')
    const { error } = await signUpProfesional(form.email, form.pass, form)
    if (error) { setError(error.message); setLoading(false) }
    else setOk(true)
  }

  async function handleRegisterParticular(e) {
    e.preventDefault()
    if (!form.nombre || !form.email || !form.pass) { setError('Completá todos los campos.'); return }
    if (!aceptaTerminos) { setError('Debés aceptar los Términos y Condiciones.'); return }
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
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(74,222,128,0.1)', border: '2px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
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

  /* — REGISTRO PROFESIONAL — */
  if (tipo === 'profesional') return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {ladoIzquierdo}
      <div style={{ width: '100%', maxWidth: '520px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', background: 'var(--black)' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: '22px', letterSpacing: '3px', display: 'block', marginBottom: '2.5rem' }}>
            FIORA<span style={{ color: 'var(--accent)' }}> MARKET</span>
          </Link>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', lineHeight: 1, marginBottom: '.5rem' }}>TU PERFIL</div>
          <div style={{ fontSize: '14px', color: 'var(--gray4)', marginBottom: '2.5rem' }}>Registrate como profesional del ecosistema automotor</div>
          <form onSubmit={handleRegisterProfesional}>
            <div className="form-field">
              <label>Nombre / Empresa *</label>
              <input type="text" placeholder="Ej: Gestoría López" value={form.nombre} onChange={e => setF('nombre', e.target.value)} required />
            </div>
            <div className="form-field">
              <label>Categoría *</label>
              <select value={form.categoria || ''} onChange={e => setF('categoria', e.target.value)} required
                style={{ width: '100%', padding: '10px 14px', background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius)', color: form.categoria ? 'var(--white)' : 'var(--gray4)', fontSize: '14px', outline: 'none' }}>
                <option value="" disabled>Seleccioná tu categoría</option>
                {CATEGORIAS_PROF.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Ciudad / Zona *</label>
              <input type="text" placeholder="Salta Capital" value={form.ciudad} onChange={e => setF('ciudad', e.target.value)} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-field">
                <label>WhatsApp</label>
                <input type="text" placeholder="+54 9 387..." value={form.whatsapp || ''} onChange={e => setF('whatsapp', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Teléfono</label>
                <input type="text" placeholder="(387) 421..." value={form.telefono} onChange={e => setF('telefono', e.target.value)} />
              </div>
            </div>
            <div className="form-field">
              <label>Email *</label>
              <input type="email" placeholder="tu@email.com" value={form.email} onChange={e => setF('email', e.target.value)} required />
            </div>
            <div className="form-field">
              <label>Contraseña *</label>
              <input type="password" placeholder="Mínimo 6 caracteres" value={form.pass} onChange={e => setF('pass', e.target.value)} minLength={6} required />
            </div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginTop: '0.5rem' }}>
              <input type="checkbox" checked={aceptaTerminos} onChange={e => setAceptaTerminos(e.target.checked)} style={{ marginTop: '3px', accentColor: 'var(--accent)', width: '15px', height: '15px', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'var(--gray4)', lineHeight: 1.6 }}>
                Acepto los{' '}
                <Link to="/legales" target="_blank" style={{ color: 'var(--accent)' }}>Términos y Condiciones</Link>
                {' '}y la{' '}
                <Link to="/legales" target="_blank" style={{ color: 'var(--accent)' }}>Política de Privacidad</Link>
              </span>
            </label>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Enviando solicitud...' : 'Enviar solicitud'}
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
          FIORA<span style={{ color: 'var(--accent)' }}> MARKET</span>
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
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--white)', marginBottom: '6px' }}>Soy comprador / vendedor particular</div>
            <div style={{ fontSize: '13px', color: 'var(--gray4)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span><span style={{ color: 'var(--white)', fontWeight: 600 }}>Comprá:</span> Explorá el catálogo, guardá favoritos y contactá agencias directamente.</span>
                <span><span style={{ color: 'var(--white)', fontWeight: 600 }}>Vendé:</span> Publicá tu vehículo particular con plan gratuito.</span>
              </div>
          </button>
          <button onClick={() => setTipo('profesional')} style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '1.5rem 2rem', textAlign: 'left', cursor: 'pointer', transition: 'border .2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--gray2)'}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--white)', marginBottom: '6px' }}>Soy gestor/a, mecánico/a, escribano/a...</div>
            <div style={{ fontSize: '13px', color: 'var(--gray4)' }}>
              Publicá tu perfil profesional y conectá con compradores y vendedores de toda Argentina.
            </div>
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
            FIORA<span style={{ color: 'var(--accent)' }}> MARKET</span>
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
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginTop: '0.5rem' }}>
              <input type="checkbox" checked={aceptaTerminos} onChange={e => setAceptaTerminos(e.target.checked)} style={{ marginTop: '3px', accentColor: 'var(--accent)', width: '15px', height: '15px', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'var(--gray4)', lineHeight: 1.6 }}>
                Acepto los{' '}
                <Link to="/legales" target="_blank" style={{ color: 'var(--accent)' }}>Términos y Condiciones</Link>
                {' '}y la{' '}
                <Link to="/legales" target="_blank" style={{ color: 'var(--accent)' }}>Política de Privacidad</Link>
              </span>
            </label>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
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
            FIORA<span style={{ color: 'var(--accent)' }}> MARKET</span>
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

          {paso === 3 && (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginTop: '1rem' }}>
              <input type="checkbox" checked={aceptaTerminos} onChange={e => setAceptaTerminos(e.target.checked)} style={{ marginTop: '3px', accentColor: 'var(--accent)', width: '15px', height: '15px', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'var(--gray4)', lineHeight: 1.6 }}>
                Acepto los{' '}
                <Link to="/legales" target="_blank" style={{ color: 'var(--accent)' }}>Términos y Condiciones</Link>
                {' '}y la{' '}
                <Link to="/legales" target="_blank" style={{ color: 'var(--accent)' }}>Política de Privacidad</Link>
              </span>
            </label>
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