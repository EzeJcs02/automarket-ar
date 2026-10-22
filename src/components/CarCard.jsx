import { Link } from 'react-router-dom'
import { useComparador } from '../context/ComparadorContext'
import Badge from './ui/Badge'
import Icon from './ui/Icon'
import { formatKm, formatPrecio } from '../lib/formato'
import './CarCard.css'

// Tarjeta de vehículo. El título es un <Link> real que se estira sobre toda
// la tarjeta (se puede abrir en otra pestaña); favorito y comparar son
// botones independientes por encima de ese link.
export default function CarCard({ auto, isFavorito = false, onToggleFavorito, headingLevel = 'h3' }) {
  const H = headingLevel
  const { agregar, quitar, estaEnLista, lista } = useComparador()
  const enComparador = estaEnLista(auto.id)
  const comparadorLleno = !enComparador && lista.length >= 3
  const foto = auto.fotos?.[0]
  const conc = auto.concesionarias
  const verificada = conc?.plan === 'premium'
  const nombre = `${auto.marca} ${auto.modelo}`

  return (
    <article className={`vcard ${auto.urgente ? 'vcard--urgente' : auto.destacado ? 'vcard--destacado' : ''}`}>
      <div className="vcard__media">
        {foto
          ? <img src={foto} alt="" loading="lazy" decoding="async" />
          : <div className="vcard__placeholder"><Icon name="car" size={44} strokeWidth={1.25} /></div>}

        <div className="vcard__badges">
          {auto.urgente ? <Badge tone="brand"><Icon name="bolt" size={12} strokeWidth={2} />Urgente</Badge>
            : auto.destacado ? <Badge tone="champagne">Destacado</Badge> : null}
          <Badge tone={auto.tipo === 'nuevo' ? 'light' : 'neutral'}>{auto.tipo === 'nuevo' ? 'Nuevo' : 'Usado'}</Badge>
        </div>

        {onToggleFavorito && (
          <button type="button" className={`vcard__fav ${isFavorito ? 'is-on' : ''}`}
            onClick={() => onToggleFavorito(auto.id)}
            aria-pressed={isFavorito} aria-label={`Guardar ${nombre} en favoritos`}>
            <Icon name="heart" size={18} filled={isFavorito} />
          </button>
        )}

        <button type="button" className={`vcard__compare ${enComparador ? 'is-on' : ''}`}
          onClick={() => enComparador ? quitar(auto.id) : agregar(auto)}
          disabled={comparadorLleno}
          aria-pressed={enComparador}
          aria-label={comparadorLleno ? 'Comparador lleno (máximo 3)' : `Comparar ${nombre}`}
          title={comparadorLleno ? 'Comparador lleno (máx. 3)' : undefined}>
          <Icon name={enComparador ? 'check' : 'compare'} size={14} strokeWidth={2} />
          {enComparador ? 'En comparador' : 'Comparar'}
        </button>
      </div>

      <div className="vcard__body">
        <div className="vcard__brand">{auto.marca}</div>
        <H className="vcard__title">
          <Link to={`/auto/${auto.id}`} className="vcard__link">{auto.modelo}<span className="sr-only">, {auto.anio}</span></Link>
        </H>
        <ul className="vcard__specs tabular">
          <li>{auto.anio}</li>
          <li>{formatKm(auto.kilometraje)}</li>
          {auto.combustible && <li>{auto.combustible}</li>}
        </ul>

        <div className="vcard__foot">
          <div className="vcard__price tabular">
            {formatPrecio(auto.precio_ars)}
            {Number(auto.precio_usd) > 0 && <span>USD {Number(auto.precio_usd).toLocaleString('es-AR')}</span>}
          </div>
          {conc?.nombre && (
            <div className="vcard__dealer">
              {verificada
                ? <Icon name="shield" size={14} className="vcard__verified" aria-label="Concesionaria verificada" />
                : <Icon name="pin" size={14} />}
              <span>{conc.nombre}{conc.ciudad ? ` · ${conc.ciudad}` : ''}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
