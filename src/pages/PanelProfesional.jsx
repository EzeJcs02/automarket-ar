import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const CATEGORIAS = [
  { id: 'gestores',     label: 'Gestores automotores' },
  { id: 'escribanos',   label: 'Escribanos' },
  { id: 'mecanicos',    label: 'Mecánicos' },
  { id: 'repuesteros',  label: 'Repuesteros' },
  { id: 'seguros',      label: 'Seguros' },
  { id: 'estetica',     label: 'Estética vehicular' },
  { id: 'verificacion', label: 'Verificación / inspección' },
  { id: 'transporte',   label: 'Transporte / flete' },
]

async function pagarConMP(tipo, { profesional_id, user_id, user_email } = {}, onError) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/mp-create-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ tipo, profesional_id, user_id, user_email, origen: 'panel-profesional' }),
    })
    const data = await res.json()
    if (data.init_point) window.location.href = data.init_point
    else onError('Error al iniciar el pago. Intentá nuevamente.')
  } catch {
    onError('Error de conexión. Intentá nuevamente.')
  }
}

export default function PanelProfesional() {
  const { user, profesional: profCtx, loading: authLoading, fetchConcesionaria } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({})

  const mpStatus = searchParams.get('mp')

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login'); return }
    cargarPerfil()
  }, [user, authLoading])

  useEffect(() => {
    if (mpStatus === 'ok') toast('¡Pago confirmado! Tu plan fue actualizado.', 'success')
    if (mpStatus === 'fail') toast('El pago no pudo procesarse. Intentá nuevamente.', 'error')
  }, [mpStatus])

  async function cargarPerfil() {
    const { data } = await supabase.from('profesionales').select('*').eq('user_id', user.id).maybeSingle()
    if (!data) { navigate('/registro'); return }
    setPerfil(data)
    setForm({
      descripcion: data.descripcion || '',
      ciudad: data.ciudad || '',
      telefono: data.telefono || '',
      whatsapp: data.whatsapp || '',
      precio_aproximado: data.precio_aproximado || '',
      horarios: data.horarios || '',
    })
    setLoading(false)
  }

  async function guardar() {
    setGuardando(true)
    const { error } = await supabase.from('profesionales').update(form).eq('id', perfil.id)
    if (error) {
      toast('Error al guardar. Intentá nuevamente.', 'error')
    } else {
      toast('Perfil actualizado.', 'success')
      setPerfil(p => ({ ...p, ...form }))
      setEditando(false)
      fetchConcesionaria(user.id)
    }
    setGuardando(false)
  }

  function setF(k, v) { setForm(p => ({ ...p, [k]: v })) }

  const pay = (tipo) => pagarConMP(tipo, {
    profesional_id: perfil?.id,
    user_id: user?.id,
    user_email: user?.email,
  }, msg => toast(msg, 'error'))

  if (authLoading || loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 58px)' }}>
      <div className="spinner" />
    </div>
  )

  const categoria = CATEGORIAS.find(c => c.id === perfil?.categoria)
  const pendiente = !perfil?.aprobado
  const planActivo = perfil?.plan || 'base'
  const planVence = perfil?.plan_vence_at ? new Date(perfil.plan_vence_at) : null

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem 5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem', paddingBottom: '2.5rem', borderBottom: '1px solid var(--gray2)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '.75rem' }}>
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', lineHeight: 1, marginBottom: '1rem' }}>
          {perfil?.nombre?.toUpperCase()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {categoria && (
            <span style={{ fontSize: '13px', color: 'var(--gray4)' }}>{categoria.label}</span>
          )}
          {categoria && <span style={{ color: 'var(--gray2)' }}>·</span>}
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, letterSpacing: '.08em',
            padding: '3px 10px', borderRadius: '100px',
            background: planActivo === 'destacado' ? 'rgba(201,168,76,.15)' : 'rgba(255,255,255,.05)',
            color: planActivo === 'destacado' ? '#c9a84c' : 'var(--gray4)',
            border: `1px solid ${planActivo === 'destacado' ? 'rgba(201,168,76,.35)' : 'var(--gray2)'}`,
          }}>
            {planActivo === 'destacado' ? '★ DESTACADO' : 'PLAN BASE'}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, letterSpacing: '.08em',
            padding: '3px 10px', borderRadius: '100px',
            background: perfil?.aprobado ? 'rgba(74,222,128,.1)' : 'rgba(201,168,76,.1)',
            color: perfil?.aprobado ? '#4ade80' : '#c9a84c',
            border: `1px solid ${perfil?.aprobado ? 'rgba(74,222,128,.25)' : 'rgba(201,168,76,.25)'}`,
          }}>
            {perfil?.aprobado ? '✓ APROBADO' : 'EN REVISIÓN'}
          </span>
        </div>
      </div>

      {/* Estado pendiente */}
      {pendiente && (
        <div style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 'var(--radius-lg)', padding: '2rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid rgba(201,168,76,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c9a84c' }} />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#c9a84c', marginBottom: '.5rem' }}>Solicitud en revisión</div>
            <p style={{ fontSize: '14px', color: 'var(--gray4)', lineHeight: 1.6, margin: 0 }}>
              Tu perfil está siendo revisado por nuestro equipo. Te notificaremos por email cuando esté aprobado y visible en el directorio.
            </p>
          </div>
        </div>
      )}

      <div className="panel-profesional-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Panel izquierdo: perfil */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Datos de contacto (solo lectura) */}
          <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '1.75rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray4)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
              Datos de contacto
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--gray4)', marginBottom: '4px' }}>Email</div>
                <div style={{ fontSize: '14px' }}>{perfil?.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--gray4)', marginBottom: '4px' }}>Ciudad</div>
                <div style={{ fontSize: '14px' }}>{perfil?.ciudad || '—'}</div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray4)', marginTop: '1rem' }}>
              Para cambiar email o ciudad, contactanos en contacto@fioramarket.store
            </div>
          </div>

          {/* Perfil editable */}
          <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray4)', letterSpacing: '.12em', textTransform: 'uppercase' }}>
                Información del perfil
              </div>
              {!editando && (
                <button onClick={() => setEditando(true)}
                  style={{ background: 'none', border: '1px solid var(--gray3)', color: 'var(--gray4)', padding: '5px 14px', borderRadius: 'var(--radius)', fontSize: '12px', cursor: 'pointer' }}>
                  Editar
                </button>
              )}
            </div>

            {editando ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-field" style={{ margin: 0 }}>
                  <label>Descripción</label>
                  <textarea value={form.descripcion} onChange={e => setF('descripcion', e.target.value)}
                    rows={3} placeholder="Qué hacés, especialidad, diferencial..."
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--gray2)', border: '1px solid var(--gray3)', borderRadius: 'var(--radius)', color: 'var(--white)', fontSize: '14px', resize: 'vertical', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-field" style={{ margin: 0 }}>
                    <label>WhatsApp</label>
                    <input value={form.whatsapp} onChange={e => setF('whatsapp', e.target.value)} placeholder="+54 9 387..." />
                  </div>
                  <div className="form-field" style={{ margin: 0 }}>
                    <label>Teléfono</label>
                    <input value={form.telefono} onChange={e => setF('telefono', e.target.value)} placeholder="(387) 421..." />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-field" style={{ margin: 0 }}>
                    <label>Precio aproximado</label>
                    <input value={form.precio_aproximado} onChange={e => setF('precio_aproximado', e.target.value)} placeholder="Ej: $15.000" />
                  </div>
                  <div className="form-field" style={{ margin: 0 }}>
                    <label>Horarios</label>
                    <input value={form.horarios} onChange={e => setF('horarios', e.target.value)} placeholder="Lun-Vie 9-18hs" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-primary" onClick={guardar} disabled={guardando} style={{ padding: '9px 20px', fontSize: '13px' }}>
                    {guardando ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <button onClick={() => setEditando(false)} style={{ background: 'none', border: '1px solid var(--gray3)', color: 'var(--gray4)', padding: '9px 16px', borderRadius: 'var(--radius)', fontSize: '13px', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--gray4)', marginBottom: '4px' }}>Descripción</div>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, margin: 0, color: perfil?.descripcion ? 'var(--white)' : 'var(--gray4)' }}>
                    {perfil?.descripcion || 'Sin descripción. Hacé click en Editar para completarla.'}
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--gray4)', marginBottom: '4px' }}>WhatsApp</div>
                    <div style={{ fontSize: '14px' }}>{perfil?.whatsapp || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--gray4)', marginBottom: '4px' }}>Teléfono</div>
                    <div style={{ fontSize: '14px' }}>{perfil?.telefono || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--gray4)', marginBottom: '4px' }}>Precio aproximado</div>
                    <div style={{ fontSize: '14px' }}>{perfil?.precio_aproximado || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--gray4)', marginBottom: '4px' }}>Horarios</div>
                    <div style={{ fontSize: '14px' }}>{perfil?.horarios || '—'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho: plan y estado */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Estado */}
          <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray4)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '1rem' }}>Estado</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--gray4)' }}>Perfil</span>
                <span style={{
                  padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700,
                  background: perfil?.aprobado ? 'rgba(74,222,128,.15)' : 'rgba(201,168,76,.15)',
                  color: perfil?.aprobado ? '#4ade80' : '#c9a84c'
                }}>
                  {perfil?.aprobado ? 'APROBADO' : 'EN REVISIÓN'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--gray4)' }}>Verificado</span>
                <span style={{
                  padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700,
                  background: perfil?.verificado ? 'rgba(74,222,128,.15)' : 'rgba(255,255,255,.08)',
                  color: perfil?.verificado ? '#4ade80' : 'var(--gray4)'
                }}>
                  {perfil?.verificado ? 'SÍ ✔' : 'NO'}
                </span>
              </div>
            </div>
          </div>

          {/* Plan actual */}
          <div style={{
            background: 'var(--gray1)',
            border: `1px solid ${planActivo === 'destacado' ? 'rgba(201,168,76,.4)' : 'var(--gray2)'}`,
            borderRadius: 'var(--radius-lg)', padding: '1.25rem'
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray4)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '1rem' }}>Plan actual</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '.75rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: planActivo === 'destacado' ? '#c9a84c' : 'var(--white)' }}>
                {planActivo === 'destacado' ? 'DESTACADO' : 'BASE'}
              </div>
              {planActivo === 'destacado' && (
                <span style={{ background: 'rgba(201,168,76,.2)', color: '#c9a84c', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '100px' }}>
                  RECOMENDADO
                </span>
              )}
            </div>
            {planActivo === 'destacado' && planVence && (
              <div style={{ fontSize: '12px', color: 'var(--gray4)', marginBottom: '.75rem' }}>
                Vence: {planVence.toLocaleDateString('es-AR')}
              </div>
            )}
            <div style={{ fontSize: '12px', color: 'var(--gray4)', lineHeight: 1.6 }}>
              {planActivo === 'base'
                ? 'Aparecés en el directorio. Posición estándar, sin badge.'
                : 'Aparecés primero. Badge "Recomendado". Borde dorado en tu perfil.'}
            </div>
          </div>

          {/* Upgrade */}
          {planActivo === 'base' && (
            <div style={{ background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: '#c9a84c', marginBottom: '.5rem' }}>
                DESTACATE
              </div>
              <ul style={{ fontSize: '12px', color: 'var(--gray4)', lineHeight: 1.8, margin: '0 0 1rem', paddingLeft: '1.25rem' }}>
                <li>Aparecés primero en tu categoría</li>
                <li>Badge "Recomendado" en tu perfil</li>
                <li>Borde dorado destacado</li>
                <li>30 días de vigencia</li>
              </ul>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', marginBottom: '1rem' }}>
                $30.000<span style={{ fontSize: '14px', color: 'var(--gray4)', fontFamily: 'var(--font-body)', fontWeight: 400 }}>/mes</span>
              </div>
              <button className="btn-primary" onClick={() => pay('plan_profesional_destacado')}
                style={{ width: '100%', padding: '10px', fontSize: '13px', background: 'linear-gradient(135deg, #b8860b, #c9a84c)' }}>
                Pagar con MercadoPago →
              </button>
            </div>
          )}

          {planActivo === 'destacado' && (
            <button className="btn-secondary" onClick={() => pay('plan_profesional_destacado')}
              style={{ width: '100%', padding: '10px', fontSize: '13px' }}>
              Renovar plan Destacado
            </button>
          )}

          {planActivo === 'base' && (
            <button onClick={() => pay('plan_profesional_base')}
              style={{ width: '100%', padding: '10px', fontSize: '12px', background: 'none', border: '1px solid var(--gray3)', color: 'var(--gray4)', borderRadius: 'var(--radius)', cursor: 'pointer' }}>
              Activar Plan Base · $10.000/mes
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
