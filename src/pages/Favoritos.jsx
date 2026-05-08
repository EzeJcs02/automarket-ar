import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import CarCard from '../components/CarCard'

export default function Favoritos() {
  const { user, concesionaria, isAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [autos, setAutos] = useState([])
  const [favoritoIds, setFavoritoIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

  async function fetchFavoritos() {
    const { data } = await supabase
      .from('favoritos')
      .select('auto_id, autos(*, concesionarias(nombre, ciudad, plan))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    const lista = data?.map(f => f.autos).filter(Boolean) || []
    setAutos(lista)
    setFavoritoIds(new Set(lista.map(a => a.id)))
    setLoading(false)
  }

  useEffect(() => {
    if (authLoading) return
    if (!user || concesionaria || isAdmin) { navigate('/'); return }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFavoritos()
  }, [user, concesionaria, isAdmin, authLoading])

  async function toggleFavorito(autoId) {
    await supabase.from('favoritos').delete().eq('user_id', user.id).eq('auto_id', autoId)
    setAutos(prev => prev.filter(a => a.id !== autoId))
    setFavoritoIds(prev => { const s = new Set(prev); s.delete(autoId); return s })
  }

  if (loading) return <div className="page-wrapper"><div className="spinner" /></div>

  return (
    <div className="page-wrapper">
      <div className="responsive-section" style={{ padding: '3rem 4rem 2rem', borderBottom: '1px solid var(--gray2)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '52px', marginBottom: '.5rem' }}>MIS FAVORITOS</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--gray4)' }}>
          {autos.length === 0 ? 'No guardaste ningún vehículo todavía.' : `${autos.length} vehículo${autos.length !== 1 ? 's' : ''} guardado${autos.length !== 1 ? 's' : ''}`}
        </div>
      </div>

      <div className="responsive-section" style={{ padding: '2rem 4rem' }}>
        {autos.length === 0 ? (
          <div style={{ padding: '5rem', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--gray1)', border: '1px solid var(--gray2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gray4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '1rem' }}>NINGÚN FAVORITO AÚN</div>
            <p style={{ color: 'var(--gray4)', fontSize: '15px', marginBottom: '2rem' }}>Explorá el catálogo y guardá los vehículos que te interesen.</p>
            <button className="btn-primary" onClick={() => navigate('/catalogo')}>Ver catálogo →</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px,100%), 1fr))', gap: '1.5px', background: 'var(--gray2)' }}>
            {autos.map(a => (
              <CarCard key={a.id} auto={a} isFavorito={favoritoIds.has(a.id)} onToggleFavorito={toggleFavorito} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
