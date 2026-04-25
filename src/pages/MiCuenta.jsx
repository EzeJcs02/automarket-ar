import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import CarCard from '../components/CarCard'

async function pagarConMP(tipo, user_id, user_email) {
  try {
    const res = await fetch('/api/mp-create-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, user_id, user_email, origen: 'mi-cuenta' }),
    })
    const data = await res.json()
    if (data.init_point) window.location.href = data.init_point
    else alert('Error al iniciar el pago. Intente nuevamente.')
  } catch {
    alert('Error de conexión. Intente nuevamente.')
  }
}

export default function MiCuenta() {
  const { user, concesionaria, isAdmin, loading: authLoading, signOut } = useAuth()
  const navigate = useNavigate()
  const [favoritos, setFavoritos] = useState([])
  const [favoritoIds, setFavoritoIds] = useState(new Set())
  const [consultas, setConsultas] = useState([])
  const [tab, setTab] = useState('favoritos')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const mp = params.get('mp')
    if (mp === 'ok') {
      alert('¡Pago exitoso! Tu boost se activará en breve.')
      window.history.replaceState({}, '', '/mi-cuenta')
    } else if (mp === 'fail') {
      alert('El pago no se completó. Podés intentarlo nuevamente.')
      window.history.replaceState({}, '', '/mi-cuenta')
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user || concesionaria || isAdmin) { navigate('/'); return }
    fetchData()
  }, [user, concesionaria, isAdmin, authLoading])

  async function fetchData() {
    setLoading(true)
    const [{ data: favData }, { data: consData }] = await Promise.all([
      supabase.from('favoritos').select('auto_id, autos(*, concesionarias(nombre, ciudad, plan))').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('consultas').select('*, autos(marca, modelo)').eq('email_comprador', user.email).order('created_at', { ascending: false })
    ])
    const lista = favData?.map(f => f.autos).filter(Boolean) || []
    setFavoritos(lista)
    setFavoritoIds(new Set(lista.map(a => a.id)))
    setConsultas(consData || [])
    setLoading(false)
  }

  async function toggleFavorito(autoId) {
    await supabase.from('favoritos').delete().eq('user_id', user.id).eq('auto_id', autoId)
    setFavoritos(prev => prev.filter(a => a.id !== autoId))
    setFavoritoIds(prev => { const s = new Set(prev); s.delete(autoId); return s })
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const nombre = user?.user_metadata?.nombre || user?.email?.split('@')[0] || 'Usuario'

  const tabStyle = active => ({
    padding: '10px 20px', borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, letterSpacing: '.05em', transition: 'all .2s',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? 'var(--white)' : 'var(--gray4)',
  })

  if (loading) return <div className="page-wrapper"><div className="spinner" /></div>

  return (
    <div className="page-wrapper">
      <div style={{ padding: '3rem 4rem', borderBottom: '1px solid var(--gray2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '.5rem' }}>Mi cuenta</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', lineHeight: 1 }}>{nombre.toUpperCase()}</div>
          <div style={{ fontSize: '13px', color: 'var(--gray4)', marginTop: '6px' }}>{user?.email}</div>
        </div>
        <button className="btn-secondary" onClick={handleSignOut}>Cerrar sesión</button>
      </div>

      <div style={{ padding: '1.5rem 4rem', borderBottom: '1px solid var(--gray2)', display: 'flex', gap: '8px' }}>
        <button style={tabStyle(tab === 'favoritos')} onClick={() => setTab('favoritos')}>Favoritos ({favoritos.length})</button>
        <button style={tabStyle(tab === 'consultas')} onClick={() => setTab('consultas')}>Consultas enviadas ({consultas.length})</button>
        <button style={tabStyle(tab === 'planes')} onClick={() => setTab('planes')}>Mi Plan</button>
      </div>

      {tab === 'favoritos' && (
        <div style={{ padding: '2rem 4rem' }}>
          {favoritos.length === 0 ? (
            <div style={{ padding: '5rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '1rem' }}>NINGÚN FAVORITO AÚN</div>
              <p style={{ color: 'var(--gray4)', fontSize: '15px', marginBottom: '2rem' }}>Explorá el catálogo y guardá los vehículos que te interesen.</p>
              <button className="btn-primary" onClick={() => navigate('/catalogo')}>Ver catálogo →</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5px', background: 'var(--gray2)' }}>
              {favoritos.map(a => (
                <CarCard key={a.id} auto={a} isFavorito={favoritoIds.has(a.id)} onToggleFavorito={toggleFavorito} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'consultas' && (
        <div style={{ padding: '2rem 4rem' }}>
          {consultas.length === 0 ? (
            <div style={{ padding: '5rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '1rem' }}>SIN CONSULTAS AÚN</div>
              <p style={{ color: 'var(--gray4)', fontSize: '15px', marginBottom: '2rem' }}>Cuando contactes a una concesionaria, tus consultas aparecerán aquí.</p>
              <button className="btn-primary" onClick={() => navigate('/catalogo')}>Ver catálogo →</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '700px' }}>
              {consultas.map(c => (
                <Link to={`/auto/${c.auto_id}`} key={c.id} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', transition: 'border-color .2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--gray2)'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: '15px' }}>{c.autos ? `${c.autos.marca} ${c.autos.modelo}` : 'Vehículo'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--gray4)' }}>{new Date(c.created_at).toLocaleDateString('es-AR')}</div>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--gray4)', lineHeight: 1.5 }}>{c.mensaje}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'planes' && (
        <div style={{ padding: '2rem 4rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: '900px' }}>
            <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '2.5rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.15em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '1rem' }}>Base</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '56px', color: '#4ade80', lineHeight: 1, marginBottom: '2rem' }}>GRATIS</div>
              {['1 publicación activa por 30 días', 'Sin prioridad en resultados', 'Acceso al catálogo completo', 'Consultas directas a agencias', 'Guardado de favoritos'].map(b => (
                <div key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{ fontSize: '14px', color: 'var(--gray4)' }}>{b}</span>
                </div>
              ))}
            </div>
            <ExtrasConMP user={user} />
          </div>
        </div>
      )}
    </div>
  )
}

function ExtrasConMP({ user }) {
  const [paying, setPaying] = useState(null)

  async function pagar(tipo) {
    setPaying(tipo)
    await pagarConMP(tipo, user.id, user.email)
    setPaying(null)
  }

  const extras = [
    { id: 'subir_tope', nombre: 'Subir al tope', precio: '$10.000', desc: 'Tu publicación vuelve al primer lugar.' },
    { id: 'destacado_individual', nombre: 'Destacado', precio: '$15.000', desc: 'Fondo diferenciado y badge en el catálogo.' },
    { id: 'urgente_individual', nombre: 'Urgente', precio: '$20.000', desc: 'Badge rojo "URGENTE", máxima visibilidad.' },
    { id: 'renovar', nombre: 'Renovar 30 días', precio: '$10.000', desc: 'Extendé tu publicación y volvé arriba.' },
  ]

  return (
    <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '2.5rem' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.15em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Extras pagos</div>
      {extras.map(e => (
        <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--gray2)' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--white)', marginBottom: '2px' }}>{e.nombre}</div>
            <div style={{ fontSize: '12px', color: 'var(--gray4)' }}>{e.desc}</div>
          </div>
          <button onClick={() => pagar(e.id)} disabled={!!paying}
            style={{ fontSize: '12px', padding: '6px 14px', marginLeft: '1rem', flexShrink: 0, borderRadius: 'var(--radius)', border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontWeight: 700, cursor: paying ? 'wait' : 'pointer', opacity: paying ? .7 : 1 }}>
            {paying === e.id ? '...' : e.precio}
          </button>
        </div>
      ))}
    </div>
  )
}
