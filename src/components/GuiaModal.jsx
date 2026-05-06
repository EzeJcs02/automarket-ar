import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const DEFAULT_GUIAS = {
  compradores: {
    titulo: 'Guía para comprar un vehículo',
    boton_label: 'Guía para compradores',
    contenido: {
      intro: 'Comprar un vehículo implica revisar tanto el estado mecánico como la situación legal y documentación. Antes de concretar una operación, es recomendable verificar toda la información del vehículo y del titular.',
      secciones: [
        {
          titulo: 'Informe de dominio',
          texto: 'El informe de dominio permite conocer la situación legal del vehículo. Sirve para verificar si tiene:',
          lista: ['Prenda', 'Inhibiciones', 'Denuncias de robo', 'Embargos', 'Problemas registrales'],
          subtitulo: '¿Cómo se obtiene?',
          subtexto: 'El informe se puede solicitar online desde la DNRPA / Argentina.gob.ar. Pasos básicos:',
          pasos: ['Ingresar al sitio oficial', 'Buscar "Informe de dominio automotor"', 'Ingresar patente/datos solicitados', 'Pagar el trámite', 'Recibir el informe por mail'],
          recomendacion: 'Solicitarlo antes de señar o comprar cualquier vehículo.',
          boton: { label: 'Ir a DNRPA', url: 'https://www.dnrpa.gov.ar' },
        },
        {
          titulo: 'Verificación mecánica',
          texto: 'Una revisión mecánica ayuda a detectar:',
          lista: ['Problemas de motor', 'Choques mal reparados', 'Pérdidas', 'Desgaste', 'Fallas ocultas'],
          recomendacion: 'Si no conocés bien el vehículo, conviene hacerlo revisar antes de comprar.',
        },
        {
          titulo: 'Transferencia',
          texto: 'La transferencia es el trámite legal que pasa el vehículo al nuevo titular.',
          recomendacion: 'Lo ideal es transferir inmediatamente después de la compra para evitar problemas legales futuros.',
        },
        {
          titulo: 'Seguro',
          texto: 'Todo vehículo debe contar con seguro vigente para circular.',
          recomendacion: 'Consultar distintas coberturas antes de contratar.',
        },
        {
          titulo: 'Verificar documentación',
          texto: 'Antes de comprar, revisar:',
          lista: ['Título', 'Cédula', 'DNI del titular', 'Formulario 08', 'Libre deuda si corresponde'],
        },
      ],
    },
  },
  vendedores: {
    titulo: 'Guía para vender un vehículo',
    boton_label: 'Guía para vendedores',
    contenido: {
      intro: 'Una buena publicación genera más consultas y transmite confianza.',
      secciones: [
        {
          titulo: 'Fotos del vehículo',
          texto: 'Conviene subir:',
          lista: ['Exterior', 'Interior', 'Tablero', 'Kilometraje', 'Motor', 'Cubiertas'],
          recomendacion: 'Evitar fotos oscuras, movidas o con el vehículo sucio.',
        },
        {
          titulo: 'Presentación',
          texto: 'Un vehículo limpio y ordenado mejora mucho la percepción de la publicación.',
          recomendacion: 'Lavar el vehículo y mostrarlo prolijo antes de sacar fotos.',
        },
        {
          titulo: 'Precio de venta',
          texto: 'El precio debe tener relación con:',
          lista: ['Año', 'Kilometraje', 'Versión', 'Estado', 'Mercado actual'],
          recomendacion: 'Comparar publicaciones similares antes de definir el valor.',
        },
        {
          titulo: 'Documentación necesaria',
          texto: 'Conviene tener:',
          lista: ['Título', 'Cédula', 'DNI', 'Formulario 08', 'Verificación policial si corresponde'],
        },
        {
          titulo: 'Transferencia',
          texto: 'Transferir el vehículo evita multas o problemas legales futuros.',
          recomendacion: 'No entregar el vehículo sin acordar claramente la transferencia.',
        },
        {
          titulo: 'Responder consultas',
          texto: 'Responder rápido mejora las posibilidades de venta.',
          recomendacion: 'Mantener WhatsApp y datos actualizados.',
        },
      ],
    },
  },
  agencias: {
    titulo: 'Información para agencias',
    boton_label: 'Información para agencias',
    contenido: {
      intro: 'FIORA MARKET permite a las agencias publicar vehículos y aumentar su visibilidad dentro de la plataforma.',
      secciones: [
        {
          titulo: 'Publicaciones destacadas',
          texto: 'Destacar publicaciones aumenta:',
          lista: ['Visibilidad', 'Consultas', 'Alcance'],
        },
        {
          titulo: 'Agencia verificada',
          texto: 'Las agencias verificadas generan mayor confianza para compradores.',
        },
        {
          titulo: 'Planes y visibilidad',
          texto: 'Los planes permiten:',
          lista: ['Más publicaciones', 'Mejor posicionamiento', 'Prioridad en búsquedas'],
        },
        {
          titulo: 'Consultas / leads',
          texto: 'Las consultas son contactos de usuarios interesados en vehículos publicados.',
          recomendacion: 'Responder rápido aumenta posibilidades de venta.',
        },
        {
          titulo: 'Calidad de publicaciones',
          texto: 'Publicaciones claras y completas generan mejores resultados.',
        },
      ],
    },
  },
  profesionales: {
    titulo: 'Profesionales FIORA',
    boton_label: 'Información sobre profesionales',
    contenido: {
      intro: 'Dentro de FIORA MARKET los usuarios pueden encontrar profesionales relacionados al mundo automotor.',
      secciones: [
        {
          titulo: 'Gestores automotores',
          texto: 'Los gestores ayudan con:',
          lista: ['Transferencias', 'Patentamientos', 'Informes', 'Trámites registrales'],
          recomendacion: 'Ayudan a agilizar operaciones y evitar errores administrativos.',
        },
        {
          titulo: 'Escribanos',
          texto: 'Los escribanos pueden intervenir en:',
          lista: ['Certificaciones', 'Autorizaciones', 'Validación de documentación'],
          recomendacion: 'Útiles cuando la operación necesita respaldo legal adicional.',
        },
        {
          titulo: 'Mecánicos',
          texto: 'Los mecánicos ayudan a revisar:',
          lista: ['Motor', 'Suspensión', 'Transmisión', 'Estado general'],
          recomendacion: 'Muy importante antes de comprar un usado.',
        },
        {
          titulo: 'Repuesteros',
          texto: 'Ayudan a conseguir:',
          lista: ['Repuestos', 'Accesorios', 'Piezas específicas'],
          recomendacion: 'Consultar disponibilidad antes de comprar ciertos modelos.',
        },
        {
          titulo: 'Seguros',
          texto: 'Los asesores ayudan a elegir coberturas según:',
          lista: ['Tipo de vehículo', 'Uso', 'Presupuesto'],
        },
        {
          titulo: 'Detailing / estética vehicular',
          texto: 'Servicios como:',
          lista: ['Limpieza profunda', 'Pulido', 'Tratamiento cerámico', 'Restauración estética'],
          recomendacion: 'Ayuda a mejorar la imagen del vehículo antes de venderlo.',
        },
        {
          titulo: 'Transporte / grúa',
          texto: 'Servicios para traslado de vehículos.',
          recomendacion: 'Consultar disponibilidad y cobertura antes de coordinar.',
        },
      ],
    },
  },
}

function IconInfo() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function SeccionGuia({ s }) {
  return (
    <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--gray2)' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--white)', marginBottom: '0.75rem', letterSpacing: '0.5px' }}>
        {s.titulo}
      </h3>
      {s.texto && (
        <p style={{ fontSize: '14px', color: 'var(--gray4)', lineHeight: 1.7, marginBottom: s.lista ? '0.75rem' : 0 }}>
          {s.texto}
        </p>
      )}
      {s.lista && (
        <ul style={{ margin: '0 0 0.75rem 0', padding: '0 0 0 1.25rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {s.lista.map((item, i) => (
            <li key={i} style={{ fontSize: '14px', color: 'var(--gray4)', lineHeight: 1.6 }}>{item}</li>
          ))}
        </ul>
      )}
      {s.subtitulo && (
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray5)', marginBottom: '0.5rem', marginTop: '1rem' }}>
          {s.subtitulo}
        </p>
      )}
      {s.subtexto && (
        <p style={{ fontSize: '14px', color: 'var(--gray4)', lineHeight: 1.7, marginBottom: '0.5rem' }}>{s.subtexto}</p>
      )}
      {s.pasos && (
        <ol style={{ margin: '0 0 0.75rem 0', padding: '0 0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {s.pasos.map((paso, i) => (
            <li key={i} style={{ fontSize: '14px', color: 'var(--gray4)', lineHeight: 1.6 }}>{paso}</li>
          ))}
        </ol>
      )}
      {s.recomendacion && (
        <div style={{ background: 'rgba(230,51,41,0.08)', border: '1px solid rgba(230,51,41,0.2)', borderRadius: 'var(--radius)', padding: '10px 14px', marginTop: '0.75rem' }}>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '.1em', textTransform: 'uppercase', marginRight: '6px' }}>Recomendación:</span>
          <span style={{ fontSize: '13px', color: 'var(--gray4)', lineHeight: 1.6 }}>{s.recomendacion}</span>
        </div>
      )}
      {s.boton && (
        <a href={s.boton.url} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-block', marginTop: '1rem', padding: '8px 20px', background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius)', fontSize: '13px', fontWeight: 600, textDecoration: 'none', letterSpacing: '.03em' }}>
          {s.boton.label} →
        </a>
      )}
    </div>
  )
}

export function GuiaBoton({ seccion, style = {} }) {
  const [open, setOpen] = useState(false)
  const [guia, setGuia] = useState(null)

  useEffect(() => {
    supabase
      .from('guias')
      .select('titulo, boton_label, contenido')
      .eq('id', seccion)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setGuia(data)
      })
      .catch(() => {})
  }, [seccion])

  const data = guia ?? DEFAULT_GUIAS[seccion]
  const contenido = data?.contenido ?? {}
  const secciones = contenido.secciones ?? []

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={data?.boton_label}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '8px 16px',
          background: 'transparent',
          border: '1px solid var(--gray3)',
          borderRadius: 'var(--radius)',
          color: 'var(--gray4)',
          fontSize: '13px', fontWeight: 500,
          cursor: 'pointer',
          transition: 'all .2s',
          ...style,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--white)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray4)' }}
      >
        <IconInfo />
        {data?.boton_label ?? 'Guía'}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '580px', position: 'relative', marginTop: '20px', marginBottom: '20px' }}
          >
            {/* Header */}
            <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid var(--gray2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Guía FIORA
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', lineHeight: 1, margin: 0 }}>
                  {data?.titulo?.toUpperCase()}
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'transparent', border: '1px solid var(--gray2)', borderRadius: 'var(--radius)', color: 'var(--gray4)', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
              >
                <IconClose />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.75rem' }}>
              {contenido.intro && (
                <p style={{ fontSize: '14px', color: 'var(--gray5)', lineHeight: 1.7, marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--gray2)' }}>
                  {contenido.intro}
                </p>
              )}
              {secciones.map((s, i) => (
                <SeccionGuia key={i} s={s} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
