import { useEffect } from 'react'

export default function Legales() {
  // Para que cuando entre a la página siempre empiece desde arriba de todo
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', padding: '8rem 4rem 4rem', color: 'var(--white)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', marginBottom: '3rem' }}>INFORMACIÓN LEGAL</h1>
        
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ color: 'var(--accent)', fontSize: '20px', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>01. TÉRMINOS Y CONDICIONES</h2>
          <p style={{ color: 'var(--gray4)', lineHeight: '1.8' }}>
            Bienvenido a AutoMarket AR. Al utilizar nuestro sitio, usted acepta nuestros términos de uso. 
            Nuestra plataforma funciona como un nexo entre concesionarias y compradores. No participamos 
            de forma directa en las transacciones de compraventa... [Aquí va tu texto legal detallado].
          </p>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ color: 'var(--accent)', fontSize: '20px', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>02. POLÍTICA DE PRIVACIDAD</h2>
          <p style={{ color: 'var(--gray4)', lineHeight: '1.8' }}>
            En cumplimiento con las leyes de protección de datos de Argentina, informamos que los datos 
            proporcionados por las concesionarias son utilizados exclusivamente para la gestión de su 
            stock y contacto con clientes... [Aquí detallas el uso de datos].
          </p>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ color: 'var(--accent)', fontSize: '20px', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>03. DEFENSA DEL CONSUMIDOR</h2>
          <p style={{ color: 'var(--gray4)', lineHeight: '1.8' }}>
            Para consultas y/o denuncias ingrese en el portal oficial de Defensa del Consumidor. 
            AutoMarket AR tiene su sede administrativa en Salta, Argentina.
          </p>
        </section>
      </div>
    </div>
  )
}