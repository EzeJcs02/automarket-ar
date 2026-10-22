import { Link } from 'react-router-dom'
import Icon from './ui/Icon'
import './Footer.css'

const COLUMNAS = [
  ['Explorar', [
    ['/catalogo', 'Catálogo de vehículos'],
    ['/concesionarias', 'Red de concesionarias'],
    ['/profesionales', 'Profesionales'],
    ['/planes', 'Planes y precios'],
  ]],
  ['Publicar', [
    ['/registro', 'Registrarse gratis'],
    ['/login', 'Iniciar sesión'],
    ['/publicitate', 'Publicitá en FIORA'],
  ]],
  ['Legal', [
    ['/legales', 'Términos y condiciones'],
    ['/legales#privacidad', 'Política de privacidad'],
    ['/arrepentimiento', 'Botón de arrepentimiento'],
  ]],
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <Link to="/" className="footer__logo" aria-label="FIORA MARKET, inicio">
              <img src="/fiora_logo.png" alt="" />
              <span>FIORA<span> MARKET</span></span>
            </Link>
            <p>Autos, motos y náutica de concesionarias verificadas y particulares. Contacto directo, sin comisiones.</p>
            <a href="mailto:contacto@fioramarket.store" className="footer__mail">
              <Icon name="mail" size={16} />contacto@fioramarket.store
            </a>
          </div>

          {COLUMNAS.map(([titulo, links]) => (
            <nav key={titulo} className="footer__col" aria-label={titulo}>
              <h2 className="footer__title">{titulo}</h2>
              <ul>
                {links.map(([to, label]) => <li key={to}><Link to={to}>{label}</Link></li>)}
              </ul>
            </nav>
          ))}
        </div>

        <div className="footer__bottom">
          <p>© {new Date().getFullYear()} FIORA MARKET · Salta, Argentina</p>
          <div className="footer__bottom-links">
            <a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor" target="_blank" rel="noopener noreferrer">Defensa del Consumidor</a>
            <a href="https://www.instagram.com/fiora.market/" target="_blank" rel="noopener noreferrer" className="footer__social" aria-label="Instagram de FIORA MARKET">
              <Icon name="instagram" size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
