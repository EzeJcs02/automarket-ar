// Encabezado de sección: título + bajada opcional + acción alineada a la derecha.
export default function SectionHeader({ eyebrow, title, desc, action, as = 'h2', id }) {
  const Tag = as
  return (
    <div className="section-head" data-reveal="up">
      <div>
        {eyebrow && <div className="section-head__eyebrow">{eyebrow}</div>}
        <Tag className="section-head__title" id={id}>{title}</Tag>
        {desc && <p className="section-head__desc">{desc}</p>}
      </div>
      {action}
    </div>
  )
}
