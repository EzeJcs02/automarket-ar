import { Link } from 'react-router-dom'
import { colorDe } from '../lib/marca'
import Badge from './ui/Badge'
import Icon from './ui/Icon'
import './DealerCard.css'

// Tarjeta de concesionaria (Home y listado). Significado de los sellos:
// destacada → champagne (posición paga) · plan premium → Verificada · plan pro → Pro
export default function DealerCard({ c, headingLevel = 'h3' }) {
  const H = headingLevel
  const autoCount = c.autos?.[0]?.count
  const color = colorDe(c)
  return (
    <article className={`dcard ${c.destacada ? 'dcard--destacada' : ''}`} style={{ '--dcolor': color }}>
      <div className="dcard__cover" style={c.portada_url ? { backgroundImage: `url("${c.portada_url}")` } : undefined} />
      <div className="dcard__body">
        <div className="dcard__head">
          <span className="avatar dcard__logo" style={{ '--avatar': '52px', background: c.logo_url ? undefined : color }}>
            {c.logo_url ? <img src={c.logo_url} alt="" loading="lazy" /> : c.nombre?.[0]?.toUpperCase()}
          </span>
          <div className="dcard__badges">
            {c.destacada && <Badge tone="champagne-soft">Destacada</Badge>}
            {c.plan === 'premium' && <Badge tone="ok"><Icon name="shield" size={12} strokeWidth={2} />Verificada</Badge>}
            {c.plan === 'pro' && <Badge tone="neutral">Pro</Badge>}
          </div>
        </div>
        <H className="dcard__name">
          <Link to={`/concesionaria/${c.id}`} className="dcard__link">{c.nombre}</Link>
        </H>
        {c.ciudad && <div className="dcard__city"><Icon name="pin" size={14} />{c.ciudad}</div>}
        {c.descripcion && <p className="dcard__desc">{c.descripcion}</p>}
      </div>
      <div className="dcard__foot">
        <span className="dcard__count tabular">
          {autoCount != null ? <><strong>{autoCount}</strong> vehículo{autoCount !== 1 ? 's' : ''}</> : 'Ver catálogo'}
        </span>
        {c.whatsapp && <span className="dcard__wa"><Icon name="whatsapp" size={13} />WhatsApp</span>}
        <span className="dcard__go" aria-hidden="true"><Icon name="arrowRight" size={16} /></span>
      </div>
    </article>
  )
}
