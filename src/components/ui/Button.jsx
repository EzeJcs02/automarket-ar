import { Link } from 'react-router-dom'

// Un solo componente para todas las acciones. Renderiza:
// - <Link> si recibe `to` (navegación interna)
// - <a> si recibe `href` (externo, mailto, wa.me)
// - <button> en cualquier otro caso
// Así se evita el <Link><button> anidado (HTML inválido, doble tabulación).
export default function Button({ variant = 'primary', size = 'md', block = false, to, href, className = '', children, ...rest }) {
  const cls = ['btn', `btn--${variant}`, size !== 'md' && `btn--${size}`, block && 'btn--block', className].filter(Boolean).join(' ')
  if (to) return <Link to={to} className={cls} {...rest}>{children}</Link>
  if (href) {
    const externo = /^https?:/.test(href)
    return <a href={href} className={cls} {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>{children}</a>
  }
  return <button type="button" className={cls} {...rest}>{children}</button>
}
