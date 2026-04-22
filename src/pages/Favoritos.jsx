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

  useEffect(() => {
    if (authLoading) return
    if (!user || concesionaria || isAdmin) { navigate('/'); return }
    fetchFavoritos()
  }, [user, concesionaria, isAdmin, authLoading])

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

  async function toggleFavorito(autoId) {
    await supabase.from('favoritos').delete().eq('user_id', user.id).eq('auto_id', autoId)
    setAutos(prev => prev.filter(a => a.id !== autoId))
    setFavoritoIds(prev => { const s = new Set(prev); s.delete(autoId); return s })
  }

  if (loading) return <div className="page-wrapper"><div className="spinner" /></div>

  return (
    <div className="page-wrapper">
      <div style={{ padding: '3rem 4rem 2rem', borderBottom: '1px solid var(--gray2)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '52px', marginBottom: '.5rem' }}>MIS FAVORITOS</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--gray4)' }}>
          {autos.length === 0 ? 'No guardaste ningún vehículo todavía.' : `${autos.length} vehículo${autos.length !== 1 ? 's' : ''} guardado${autos.length !== 1 ? 's' : ''}`}
        </div>
      </div>

      <div style={{ padding: '2rem 4rem' }}>
        {autos.length === 0 ? (
          <div style={{ padding: '5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '1.5rem' }}>♡</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '1rem' }}>NINGÚN FAVORITO AÚN</div>
            <p style={{ color: 'var(--gray4)', fontSize: '15px', marginBottom: '2rem' }}>Explorá el catálogo y guardá los vehículos que te interesen.</p>
            <button className="btn-primary" onClick={() => navigate('/catalogo')}>Ver catálogo →</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5px', background: 'var(--gray2)' }}>
            {autos.map(a => (
              <CarCard key={a.id} auto={a} isFavorito={favoritoIds.has(a.id)} onToggleFavorito={toggleFavorito} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
