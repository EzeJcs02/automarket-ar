import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(80px,15vw,160px)', color: 'var(--accent)', lineHeight: 1, marginBottom: '1rem', opacity: .3 }}>404</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,4vw,40px)', marginBottom: '1rem' }}>PÁGINA NO ENCONTRADA</div>
      <p style={{ color: 'var(--gray4)', fontSize: '15px', maxWidth: '400px', lineHeight: 1.7, marginBottom: '2.5rem' }}>
        La página que buscás no existe o fue movida.
      </p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn-primary" onClick={() => navigate('/')}>Ir al inicio →</button>
        <button className="btn-secondary" onClick={() => navigate('/catalogo')}>Ver catálogo</button>
      </div>
    </div>
  )
}
