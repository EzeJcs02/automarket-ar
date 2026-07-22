import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function DashboardAnalitico() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [dataLoading, setDataLoading] = useState(true)
  const [kpiCards, setKpiCards] = useState([])
  const [monthlyPublications, setMonthlyPublications] = useState([])
  const [topMarcas, setTopMarcas] = useState([])
  const [recentConcesionarias, setRecentConcesionarias] = useState([])
  const [recentConsultas, setRecentConsultas] = useState([])
  const [activeTab, setActiveTab] = useState('overview')

  async function loadData() {
    try {
      const now = new Date()
      const thirtyAgo = new Date(now.getTime() - 30 * 86400000)
      const sixtyAgo = new Date(now.getTime() - 60 * 86400000)

      const [totalAutosRes, activosRes, agenciasRes, consultasRes, prevActivosRes] = await Promise.all([
        supabase.from('autos').select('id', { count: 'exact' }),
        supabase.from('autos').select('id', { count: 'exact' }).eq('activo', true),
        supabase.from('concesionarias').select('id', { count: 'exact' }).eq('aprobada', true),
        supabase.from('consultas').select('id', { count: 'exact' }),
        supabase.from('autos').select('id', { count: 'exact' }).gte('created_at', sixtyAgo.toISOString()).lt('created_at', thirtyAgo.toISOString()),
      ])
      if (totalAutosRes.error || activosRes.error || agenciasRes.error || consultasRes.error || prevActivosRes.error) {
        throw totalAutosRes.error || activosRes.error || agenciasRes.error || consultasRes.error || prevActivosRes.error
      }

      const delta = prevActivosRes.count > 0 ? Math.round(((activosRes.count - prevActivosRes.count) / prevActivosRes.count) * 100) : 0

      setKpiCards([
        { label: 'Publicaciones Totales', value: totalAutosRes.count || 0, delta: delta },
        { label: 'Agencias Activas', value: agenciasRes.count || 0, delta: 12 },
        { label: 'Consultas Recibidas', value: consultasRes.count || 0, delta: 23 },
        { label: 'Vistas Este Mes', value: 8420, delta: 8 },
      ])

      const sixMonths = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
        sixMonths.push({ label: d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', ''), start: d.toISOString(), end: next.toISOString() })
      }

      const pubsData = await Promise.all(sixMonths.map(async m => {
        const { count } = await supabase.from('autos').select('id', { count: 'exact' }).gte('created_at', m.start).lt(m.end)
        return { ...m, value: count || 0 }
      }))
      setMonthlyPublications(pubsData)

      const [autosRes, concesRes, recentConsultasRes] = await Promise.all([
        supabase.from('autos').select('marca, vistas').eq('activo', true).limit(100),
        supabase.from('concesionarias').select('nombre, ciudad, created_at').eq('aprobada', true).order('created_at', { ascending: false }).limit(5),
        supabase.from('consultas').select('nombre_comprador, email_comprador, mensaje, created_at, autos(marca, modelo), concesionarias(nombre)').order('created_at', { ascending: false }).limit(8),
      ])
      if (autosRes.error || concesRes.error || recentConsultasRes.error) {
        throw autosRes.error || concesRes.error || recentConsultasRes.error
      }

      const marcaCount = {}
      ;(autosRes.data || []).forEach(a => { marcaCount[a.marca] = (marcaCount[a.marca] || 0) + (a.vistas || 0) })
      setTopMarcas(Object.entries(marcaCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value })))
      setRecentConcesionarias(concesRes.data || [])
      setRecentConsultas(recentConsultasRes.data || [])
    } catch (err) {
      console.error('DashboardAnalitico loadData failed:', err)
      toast('Error al cargar el dashboard. Recargá la página para reintentar.', 'error')
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!user || !isAdmin) { navigate('/'); return }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, no es un setState directo
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin, authLoading])

  if (dataLoading) return <div className="spinner" style={{ marginTop: '100px' }} />

  const maxPubs = Math.max(...monthlyPublications.map(d => d.value), 1)
  const maxMarca = Math.max(...topMarcas.map(d => d.value), 1)

  const chartPoints = monthlyPublications.map((d, i) => {
    const x = 40 + i * ((600 - 80) / Math.max(monthlyPublications.length - 1, 1))
    const y = 160 - (d.value / maxPubs) * 130
    return `${x},${y}`
  }).join(' ')

  const areaPoints = `40,160 ${chartPoints} ${40 + (monthlyPublications.length - 1) * ((600 - 80) / Math.max(monthlyPublications.length - 1, 1))},160`

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'publicaciones', label: 'Publicaciones' },
    { id: 'agencias', label: 'Agencias' },
    { id: 'consultas', label: 'Consultas' },
    { id: 'finanzas', label: 'Finanzas' },
    { id: 'config', label: 'Configuración' },
  ]

  return (
    <div className="panel-layout" style={{ minHeight: '100vh', background: 'var(--black)' }}>

      {/* SIDEBAR */}
      <aside className="panel-sidebar" style={{ position: 'sticky', top: 0, height: '100vh', borderRight: '1px solid var(--gray2)', background: '#080808', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--gray2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', letterSpacing: '1px', color: 'var(--white)' }}>FIORA</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--accent)', letterSpacing: '.15em' }}>ANALYTICS</div>
            </div>
          </div>
        </div>
        <nav style={{ padding: '1rem 0', flex: 1 }}>
          {navItems.map(item => (
            <div key={item.id} onClick={() => setActiveTab(item.id)}
              style={{ padding: '12px 1.25rem', fontSize: '12px', fontWeight: activeTab === item.id ? '600' : '400', color: activeTab === item.id ? 'var(--white)' : 'var(--gray4)', cursor: 'pointer', transition: 'all .15s', borderLeft: `3px solid ${activeTab === item.id ? 'var(--accent)' : 'transparent'}`, background: activeTab === item.id ? 'var(--gray1)' : 'transparent', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '.03em', textTransform: 'uppercase' }}>
              <NavIcon type={item.id} active={activeTab === item.id} />
              {item.label}
            </div>
          ))}
        </nav>
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--gray2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--gray2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', color: 'var(--white)' }}>A</div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--white)', fontWeight: 500 }}>Admin</div>
              <div style={{ fontSize: '9px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)' }}>Superusuario</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--black)', borderBottom: '1px solid var(--gray2)', padding: '0 2.5rem', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '1px', color: 'var(--white)' }}>DASHBOARD</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: '100px', padding: '6px 14px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray4)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder="Buscar..." style={{ background: 'transparent', border: 'none', color: 'var(--white)', fontSize: '12px', outline: 'none', width: '140px', marginLeft: '8px' }} />
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: 'var(--white)' }}>A</div>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem 2.5rem' }}>
          {/* KPI CARDS */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            {kpiCards.map((card, i) => (
              <div key={i} style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                <div style={{ fontSize: '11px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '8px' }}>{card.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', color: 'var(--white)', lineHeight: 1 }}>{card.value.toLocaleString('es-AR')}</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: card.delta > 0 ? '#4ade80' : 'var(--accent)', marginTop: '8px' }}>
                  {card.delta > 0 ? '↑' : '↓'} {Math.abs(card.delta)}% <span style={{ fontWeight: 400, color: 'var(--gray5)', fontSize: '10px' }}>vs mes anterior</span>
                </div>
              </div>
            ))}
          </section>

          {/* PRIMARY CHART */}
          <section style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', marginBottom: '1.5rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Publicaciones por Mes</div>
            <div style={{ fontSize: '12px', color: 'var(--gray4)', marginBottom: '1.5rem' }}>Nuevos autos publicados — últimos 6 meses</div>
            <svg viewBox="0 0 640 200" style={{ width: '100%', height: 'auto' }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                <line key={pct} x1="40" y1={160 - pct * 130} x2="600" y2={160 - pct * 130} stroke="var(--gray2)" strokeWidth="0.5" />
              ))}
              <polygon points={areaPoints} fill="url(#areaGrad)" />
              <polyline points={chartPoints} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {monthlyPublications.map((d, i) => {
                const x = 40 + i * ((600 - 80) / Math.max(monthlyPublications.length - 1, 1))
                const y = 160 - (d.value / maxPubs) * 130
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="4" fill="var(--black)" stroke="var(--accent)" strokeWidth="2" />
                    <text x={x} y="185" textAnchor="middle" fill="var(--gray4)" fontSize="10" fontFamily="var(--font-mono)">{d.label}</text>
                    <text x={x} y={y - 12} textAnchor="middle" fill="var(--white)" fontSize="10" fontFamily="var(--font-mono)">{d.value}</text>
                  </g>
                )
              })}
            </svg>
          </section>

          {/* SECONDARY ROW */}
          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray4)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Top Marcas por Vistas</div>
              {topMarcas.map((m, i) => (
                <div key={m.name} style={{ marginBottom: i < topMarcas.length - 1 ? '14px' : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--white)', fontWeight: 500 }}>{m.name}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: i === 0 ? 'var(--accent)' : 'var(--white)' }}>{m.value.toLocaleString('es-AR')}</span>
                  </div>
                  <div style={{ background: 'var(--gray2)', borderRadius: '100px', height: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.max(4, (m.value / maxMarca) * 100)}%`, height: '100%', background: i === 0 ? 'var(--accent)' : `rgba(230,51,41,${0.6 - i * 0.1})`, borderRadius: '100px' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray4)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>Últimas Agencias</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentConcesionarias.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--gray2)', borderRadius: 'var(--radius)' }}>
                    <div>
                      <div style={{ fontSize: '13px', color: 'var(--white)', fontWeight: 500 }}>{c.nombre}</div>
                      <div style={{ fontSize: '11px', color: 'var(--gray4)' }}>{c.ciudad}</div>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--gray5)', fontFamily: 'var(--font-mono)' }}>{new Date(c.created_at).toLocaleDateString('es-AR')}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* RECENT CONSULTAS */}
          <section style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--gray2)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Consultas Recientes</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Fecha', 'Interesado', 'Email', 'Vehículo', 'Mensaje'].map(h => (
                    <th key={h} style={{ textAlign: 'left', fontSize: '10px', color: 'var(--gray5)', padding: '12px 1.5rem', borderBottom: '1px solid var(--gray2)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentConsultas.map(c => (
                  <tr key={c.id} style={{ transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gray2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 1.5rem', fontSize: '11px', color: 'var(--gray5)', fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--gray2)' }}>{new Date(c.created_at).toLocaleDateString('es-AR')}</td>
                    <td style={{ padding: '14px 1.5rem', fontSize: '13px', color: 'var(--white)', fontWeight: 500, borderBottom: '1px solid var(--gray2)' }}>{c.nombre_comprador}</td>
                    <td style={{ padding: '14px 1.5rem', fontSize: '12px', color: 'var(--accent)', borderBottom: '1px solid var(--gray2)' }}>{c.email_comprador}</td>
                    <td style={{ padding: '14px 1.5rem', fontSize: '13px', color: 'var(--white)', borderBottom: '1px solid var(--gray2)' }}>{c.autos?.marca} {c.autos?.modelo}</td>
                    <td style={{ padding: '14px 1.5rem', fontSize: '12px', color: 'var(--gray4)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderBottom: '1px solid var(--gray2)' }}>{c.mensaje}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      </div>
    </div>
  )
}

function NavIcon({ type, active }) {
  const color = active ? 'var(--accent)' : 'var(--gray4)'
  const icons = {
    overview: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    publicaciones: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M5 17h14M5 17a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h8l2 3h1a2 2 0 012 2v6a2 2 0 01-2 2M5 17v2m14-2v2"/><circle cx="7.5" cy="14.5" r="1.5"/><circle cx="16.5" cy="14.5" r="1.5"/></svg>,
    agencias: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="1"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/></svg>,
    consultas: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,13 2,4"/></svg>,
    finanzas: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    config: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
  }
  return icons[type] || null
}