import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion as Motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { CATEGORIAS, GRUPOS, PRECIOS_MAX } from '../lib/categorias'
import SearchCombobox from './SearchCombobox'
import Icon from './ui/Icon'

const EASE = [0.2, 0.7, 0.2, 1]
const entrada = {
  hidden: { opacity: 0, y: 16 },
  show: i => ({ opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay: 0.08 + i * 0.08 } }),
}
const ACCESOS = ['SUV', 'Pickup', 'Hatchback', 'Sedán', 'Naked', 'Lancha']

export default function HomeHero() {
  const navigate = useNavigate()
  const { user, concesionaria } = useAuth()
  const [q, setQ] = useState('')
  const [categoria, setCategoria] = useState('')
  const [precioMax, setPrecioMax] = useState('')

  function buscar(e) {
    e.preventDefault()
    const p = new URLSearchParams()
    if (q.trim()) p.set('q', q.trim())
    if (categoria) p.set('categoria', categoria)
    if (precioMax) p.set('precioMax', precioMax)
    const qs = p.toString()
    navigate(`/catalogo${qs ? `?${qs}` : ''}`)
  }

  const vender = concesionaria ? '/panel' : user ? '/mi-cuenta' : '/registro'

  return (
    <section className="hero" aria-labelledby="hero-title">
      <Motion.div className="hero__bg" aria-hidden="true"
        initial={{ scale: 1.06, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.6, ease: EASE }} />
      <div className="hero__scrim" aria-hidden="true" />

      <div className="container hero__inner">
        <Motion.p className="hero__kicker" custom={0} variants={entrada} initial="hidden" animate="show">
          Autos · Motos · Náutica
        </Motion.p>
        <Motion.h1 id="hero-title" className="hero__title" custom={1} variants={entrada} initial="hidden" animate="show">
          El ecosistema de vehículos de Argentina
        </Motion.h1>
        <Motion.p className="hero__lead" custom={2} variants={entrada} initial="hidden" animate="show">
          Explorá stock real de concesionarias verificadas y particulares. Compará y hablá directo con quien vende, sin comisiones.
        </Motion.p>

        <Motion.form className="hero-search" onSubmit={buscar} role="search" aria-label="Buscar vehículos"
          custom={3} variants={entrada} initial="hidden" animate="show">
          <div className="hero-search__field hero-search__field--q">
            <Icon name="search" size={18} />
            <SearchCombobox value={q} onChange={setQ} placeholder="Marca o modelo, ej: Hilux" label="Marca o modelo" inputClassName="hero-search__input" />
          </div>
          <label className="hero-search__field">
            <span className="hero-search__label">Tipo</span>
            <select className="hero-search__input" value={categoria} onChange={e => setCategoria(e.target.value)}>
              <option value="">Todos</option>
              {GRUPOS.map(([key, label]) => (
                <optgroup key={key} label={label}>
                  {CATEGORIAS[key].map(({ tipo }) => <option key={tipo} value={tipo}>{tipo}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="hero-search__field">
            <span className="hero-search__label">Precio hasta</span>
            <select className="hero-search__input tabular" value={precioMax} onChange={e => setPrecioMax(e.target.value)}>
              <option value="">Sin límite</option>
              {PRECIOS_MAX.map(p => <option key={p} value={p}>${p.toLocaleString('es-AR')}</option>)}
            </select>
          </label>
          <button type="submit" className="btn btn--primary btn--lg hero-search__submit">
            Buscar<Icon name="arrowRight" size={18} />
          </button>
        </Motion.form>

        <Motion.div className="hero__quick" custom={4} variants={entrada} initial="hidden" animate="show">
          <span className="hero__quick-label">Populares</span>
          <ul>
            {ACCESOS.map(t => (
              <li key={t}><Link className="chip" to={`/catalogo?categoria=${encodeURIComponent(t)}`}>{t}</Link></li>
            ))}
          </ul>
          <Link to={vender} className="hero__sell">¿Querés vender? <strong>Publicá tu vehículo</strong><Icon name="arrowRight" size={16} /></Link>
        </Motion.div>
      </div>
    </section>
  )
}
