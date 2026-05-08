import { useEffect } from 'react'
import { Link } from 'react-router-dom'

const Section = ({ num, title, children }) => (
  <section style={{ marginBottom: '3rem' }}>
    <h2 style={{ color: 'var(--accent)', fontSize: '13px', fontFamily: 'var(--font-mono)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '1rem' }}>
      {num}. {title}
    </h2>
    <div style={{ color: 'var(--gray4)', lineHeight: '1.9', fontSize: '15px' }}>{children}</div>
  </section>
)

export default function Legales() {
  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', padding: '6rem 1.5rem 4rem' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Información legal
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,6vw,64px)', lineHeight: 1, marginBottom: '1rem' }}>
          TÉRMINOS Y<br />CONDICIONES
        </h1>
        <p style={{ color: 'var(--gray4)', fontSize: '13px', marginBottom: '4rem' }}>
          Última actualización: abril 2026 · FIORA MARKET — Salta, Argentina
        </p>

        <Section num="01" title="Aceptación de los términos">
          Al acceder y utilizar el sitio web <strong style={{ color: 'var(--white)' }}>fioramarket.store</strong> (en adelante "FIORA MARKET" o "la Plataforma"), el usuario acepta en su totalidad los presentes Términos y Condiciones. Si no está de acuerdo con alguno de los términos aquí expuestos, deberá abstenerse de utilizar la Plataforma.
        </Section>

        <Section num="02" title="Descripción del servicio">
          FIORA MARKET es una plataforma digital que funciona como intermediario entre vendedores de vehículos (concesionarias y particulares) y compradores potenciales. La Plataforma no interviene directamente en las transacciones de compraventa de vehículos, no garantiza la disponibilidad de los vehículos publicados, y no asume responsabilidad alguna por las operaciones comerciales entre las partes.
        </Section>

        <Section num="03" title="Registro y cuenta de usuario">
          <p style={{ marginBottom: '12px' }}>Para acceder a ciertas funcionalidades (publicar vehículos, guardar favoritos, enviar consultas), el usuario debe registrarse proporcionando información veraz y actualizada.</p>
          <p style={{ marginBottom: '12px' }}>El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso. FIORA MARKET no será responsable por el uso no autorizado de su cuenta.</p>
          <p>Las concesionarias deben ser aprobadas por el equipo de FIORA MARKET antes de publicar vehículos. FIORA MARKET se reserva el derecho de rechazar o suspender cuentas que incumplan estas condiciones.</p>
        </Section>

        <Section num="04" title="Publicación de vehículos">
          <p style={{ marginBottom: '12px' }}>Las publicaciones deben contener información veraz y actualizada sobre el vehículo. Queda prohibido publicar vehículos inexistentes, con datos falsos, o que no estén disponibles para la venta.</p>
          <p style={{ marginBottom: '12px' }}>Los particulares tienen derecho a 1 (una) publicación gratuita por 30 días. Las publicaciones adicionales tienen un costo de $15.000 ARS cada una.</p>
          <p>FIORA MARKET se reserva el derecho de eliminar publicaciones que incumplan estas condiciones sin previo aviso.</p>
        </Section>

        <Section num="05" title="Pagos y facturación">
          <p style={{ marginBottom: '12px' }}>Los pagos se procesan a través de <strong style={{ color: 'var(--white)' }}>MercadoPago</strong>. FIORA MARKET no almacena datos de tarjetas de crédito o débito.</p>
          <p style={{ marginBottom: '12px' }}>Los planes y servicios son de vigencia mensual (30 días). No se realizan reembolsos salvo en los casos previstos por la legislación de Defensa del Consumidor (Ley 24.240).</p>
          <p>Los precios están expresados en Pesos Argentinos (ARS) e incluyen IVA cuando corresponde.</p>
        </Section>

        <Section num="06" title="Derecho de arrepentimiento">
          De acuerdo con el Art. 34 de la Ley 24.240, el consumidor tiene un plazo de 10 (diez) días hábiles desde la contratación del servicio para ejercer el derecho de arrepentimiento, siempre que el servicio no haya sido utilizado. Para ejercer este derecho, contactar a{' '}
          <a href="mailto:contacto@fioramarket.store" style={{ color: 'var(--accent)' }}>contacto@fioramarket.store</a> o ingresar a{' '}
          <Link to="/arrepentimiento" style={{ color: 'var(--accent)' }}>fioramarket.store/arrepentimiento</Link>.
        </Section>

        <Section num="07" title="Propiedad intelectual">
          El contenido de FIORA MARKET (diseño, código, marca, logotipos, textos) es propiedad exclusiva de sus titulares y está protegido por las leyes de propiedad intelectual. Las imágenes de los vehículos son responsabilidad del publicante.
        </Section>

        <Section num="08" title="Limitación de responsabilidad">
          FIORA MARKET no garantiza la exactitud, integridad o actualidad de la información publicada por los vendedores. La Plataforma no es responsable por daños directos o indirectos derivados del uso de la información contenida en las publicaciones.
        </Section>

        <div style={{ borderTop: '1px solid var(--gray2)', paddingTop: '4rem', marginTop: '2rem' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '1rem' }}>
            Información legal
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,5vw,48px)', lineHeight: 1, marginBottom: '3rem' }}>
            POLÍTICA DE<br />PRIVACIDAD
          </h2>
        </div>

        <Section num="01" title="Responsable del tratamiento">
          FIORA MARKET, con sede en Salta, Argentina, es responsable del tratamiento de los datos personales recolectados a través de la Plataforma, en cumplimiento de la Ley 25.326 de Protección de Datos Personales de la República Argentina.
        </Section>

        <Section num="02" title="Datos que recolectamos">
          <p style={{ marginBottom: '8px' }}>• <strong style={{ color: 'var(--white)' }}>Datos de registro:</strong> nombre, email, teléfono, ciudad.</p>
          <p style={{ marginBottom: '8px' }}>• <strong style={{ color: 'var(--white)' }}>Datos de uso:</strong> vehículos visitados, búsquedas, favoritos guardados.</p>
          <p style={{ marginBottom: '8px' }}>• <strong style={{ color: 'var(--white)' }}>Datos de pago:</strong> procesados exclusivamente por MercadoPago. No almacenamos datos financieros.</p>
          <p>• <strong style={{ color: 'var(--white)' }}>Datos de contacto:</strong> mensajes enviados a vendedores a través del formulario de consulta.</p>
        </Section>

        <Section num="03" title="Uso de los datos">
          Los datos personales se utilizan exclusivamente para: (a) gestionar la cuenta del usuario, (b) procesar pagos y enviar confirmaciones, (c) conectar compradores con vendedores, (d) mejorar la experiencia de la Plataforma, y (e) enviar notificaciones relacionadas con el servicio contratado.
          <p style={{ marginTop: '12px' }}>No vendemos, cedemos ni transferimos datos personales a terceros, salvo obligación legal.</p>
        </Section>

        <Section num="04" title="Cookies y tecnologías de seguimiento">
          FIORA MARKET utiliza cookies técnicas necesarias para el funcionamiento del sitio (sesión de usuario, preferencias). No utilizamos cookies de seguimiento publicitario de terceros.
        </Section>

        <Section num="05" title="Derechos del usuario">
          En todo momento el usuario puede: (a) acceder a sus datos personales, (b) rectificar datos incorrectos, (c) solicitar la eliminación de su cuenta y datos. Para ejercer estos derechos, escribir a{' '}
          <a href="mailto:privacidad@fioramarket.store" style={{ color: 'var(--accent)' }}>privacidad@fioramarket.store</a>.
        </Section>

        <Section num="06" title="Seguridad">
          Los datos se almacenan en servidores seguros provistos por <strong style={{ color: 'var(--white)' }}>Supabase</strong> con cifrado en reposo y en tránsito. Implementamos medidas técnicas y organizativas para proteger la información personal contra accesos no autorizados.
        </Section>

        <Section num="07" title="Contacto">
          Para consultas sobre privacidad o términos: <a href="mailto:contacto@fioramarket.store" style={{ color: 'var(--accent)' }}>contacto@fioramarket.store</a>
          <br />Para Defensa del Consumidor: <a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>argentina.gob.ar/defensadelconsumidor</a>
        </Section>
      </div>
    </div>
  )
}
