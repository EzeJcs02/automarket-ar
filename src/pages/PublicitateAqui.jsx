import { useEffect } from 'react'
import { Link } from 'react-router-dom'

const PLANES_PUB = [
  {
    id: 'lateral',
    nombre: 'Banner Lateral',
    precio: '$15.000',
    duracion: '30 días',
    descripcion: 'Tu imagen en la columna derecha del home, visible a todos los visitantes. Rotación automática entre anunciantes.',
    specs: ['Tamaño: 300×600px', 'Formato: JPG / PNG', 'Rotación cada 10 segundos', 'Link a tu sitio web'],
    color: '#4ade80',
  },
  {
    id: 'inferior',
    nombre: 'Banner Inferior',
    precio: '$30.000',
    duracion: '30 días',
    descripcion: 'Gran banner al pie del home, máxima visibilidad. Formato panorámico ideal para promociones.',
    specs: ['Tamaño: 1200×200px', 'Formato: JPG / PNG', 'Posición fija en home', 'Link a tu sitio web'],
    color: '#e0a020',
    destacado: true,
  },
  {
    id: 'banner_home',
    nombre: 'Banner Premium',
    precio: '$80.000',
    duracion: '30 días',
    descripcion: 'Banner exclusivo encima del hero, lo primero que ve el usuario. Sin rotación, posición garantizada.',
    specs: ['Tamaño: 1200×300px', 'Formato: JPG / PNG / GIF', 'Posición exclusiva', 'Link a tu sitio + tracking UTM'],
    color: 'var(--accent)',
  },
]

export default function PublicitateAqui() {
  useEffect(() => { document.title = 'Publicitá aquí — FIORA.MARKET' }, [])

  return (
    <div className="page-wrapper">
      {/* HERO */}
      <div style={{ padding: '5rem 4rem 4rem', borderBottom: '1px solid var(--gray2)', maxWidth: '900px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.2em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
          PUBLICIDAD · FIORA.MARKET
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '64px', lineHeight: 1, marginBottom: '1.5rem' }}>
          LLEGÁ A MILES<br />DE COMPRADORES
        </div>
        <p style={{ fontSize: '18px', color: 'var(--gray4)', lineHeight: 1.7, maxWidth: '600px', marginBottom: '2.5rem' }}>
          FIORA.MARKET es el marketplace de vehículos líder en el NOA. Anunciá tu negocio — taller, lubricentro, seguro, concesionaria — frente a compradores activos.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {[['10.000+', 'Visitas mensuales'], ['500+', 'Vehículos publicados'], ['300+', 'Consultas por mes']].map(([num, label]) => (
            <div key={label} style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '1.5rem 2rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '40px', color: 'var(--accent)', lineHeight: 1 }}>{num}</div>
              <div style={{ fontSize: '13px', color: 'var(--gray4)', marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PLANES */}
      <div style={{ padding: '4rem' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '.75rem' }}>
          OPCIONES DE PUBLICIDAD
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '3rem' }}>ELEGÍ TU ESPACIO</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
          {PLANES_PUB.map(p => (
            <div key={p.id} style={{
              background: 'var(--gray1)', border: `1px solid ${p.destacado ? p.color : 'var(--gray2)'}`,
              borderRadius: 'var(--radius-lg)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem',
              position: 'relative'
            }}>
              {p.destacado && (
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: p.color, color: '#000', fontSize: '10px', fontWeight: 700, padding: '3px 14px', borderRadius: '100px', letterSpacing: '.1em' }}>
                  MÁS POPULAR
                </div>
              )}
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: p.color }}>{p.nombre}</div>
              <div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '36px', color: 'var(--white)' }}>{p.precio}</span>
                <span style={{ fontSize: '13px', color: 'var(--gray4)', marginLeft: '6px' }}>/ {p.duracion}</span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--gray4)', lineHeight: 1.6, flex: 1 }}>{p.descripcion}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {p.specs.map(s => (
                  <li key={s} style={{ fontSize: '13px', color: 'var(--gray5)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: p.color, fontSize: '10px' }}>✓</span>{s}
                  </li>
                ))}
              </ul>
              <a href={`mailto:publicidad@fiora.market?subject=Consulta publicidad ${p.nombre}&body=Hola, me interesa el espacio "${p.nombre}" por ${p.precio}/mes.`}
                style={{ textDecoration: 'none' }}>
                <button className="btn-primary" style={{ width: '100%', background: p.color, borderColor: p.color, color: p.id === 'lateral' ? '#000' : '#fff' }}>
                  Contratar →
                </button>
              </a>
            </div>
          ))}
        </div>

        {/* CTA CONTACTO */}
        <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', marginBottom: '.5rem' }}>¿TENÉS DUDAS?</div>
            <p style={{ fontSize: '15px', color: 'var(--gray4)', margin: 0 }}>Escribinos y te asesoramos sin compromiso.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a href="mailto:publicidad@fiora.market" style={{ textDecoration: 'none' }}>
              <button className="btn-secondary" style={{ padding: '12px 24px', fontSize: '14px' }}>
                publicidad@fiora.market
              </button>
            </a>
            <Link to="/planes">
              <button className="btn-primary" style={{ padding: '12px 24px', fontSize: '14px' }}>
                Ver planes para concesionarias →
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
