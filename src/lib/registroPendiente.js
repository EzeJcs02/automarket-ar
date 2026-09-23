// Registro diferido: con "Confirm email" activo en Supabase, signUp no devuelve
// sesión, así que no se puede insertar el perfil (concesionaria/profesional) en
// ese momento — la RLS exige auth.uid() = user_id. Los datos del perfil viajan en
// user_metadata.registro_pendiente y se materializan en el primer login, ya con
// sesión (o al volver del link de confirmación).
//
// Es idempotente: se puede llamar desde signIn y desde el listener de sesión.
import { supabase } from './supabase'

const TIPOS = ['concesionaria', 'profesional', 'particular']

const enCurso = new Map() // userId -> promesa en vuelo
const completados = new Set() // userId ya procesados en esta sesión del navegador

function notificar(payload) {
  fetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(err => console.error('[registroPendiente] notify endpoint failed:', err))
}

async function ejecutar(user, pendiente) {
  const { tipo, ...datos } = pendiente
  const email = user.email

  if (tipo === 'concesionaria') {
    const { data: existente } = await supabase.from('concesionarias').select('id').eq('user_id', user.id).maybeSingle()
    if (!existente) {
      const { error } = await supabase.from('concesionarias').insert({
        user_id: user.id,
        nombre: datos.nombre,
        responsable: datos.responsable,
        email,
        telefono: datos.telefono,
        ciudad: datos.ciudad,
        aprobada: false,
      })
      if (error) {
        console.error('[registroPendiente] no se pudo crear la concesionaria:', error)
        return false
      }
    }
  } else if (tipo === 'profesional') {
    const { data: existente } = await supabase.from('profesionales').select('id').eq('user_id', user.id).maybeSingle()
    if (!existente) {
      const { error } = await supabase.from('profesionales').insert({
        user_id: user.id,
        nombre: datos.nombre,
        categoria: datos.categoria,
        ciudad: datos.ciudad || null,
        telefono: datos.telefono || null,
        whatsapp: datos.whatsapp || null,
        email,
        aprobado: false,
        activo: false,
      })
      if (error) {
        console.error('[registroPendiente] no se pudo crear el profesional:', error)
        return false
      }
    }
  }

  // Limpiar la marca ANTES de notificar: si no se puede limpiar, no se notifica
  // (evita mails duplicados en cada login).
  const { error: clearErr } = await supabase.auth.updateUser({ data: { registro_pendiente: null } })
  if (clearErr) {
    console.error('[registroPendiente] no se pudo limpiar registro_pendiente:', clearErr)
    return false
  }

  if (tipo === 'concesionaria') {
    notificar({ action: 'admin', nombre: datos.nombre, email, telefono: datos.telefono, ciudad: datos.ciudad })
    notificar({ action: 'welcome', nombre: datos.nombre, email, tipo: 'concesionaria', user_id: user.id })
  } else if (tipo === 'profesional') {
    notificar({ action: 'admin', nombre: datos.nombre, email, telefono: datos.telefono, ciudad: datos.ciudad, tipo: 'profesional' })
  } else {
    notificar({ action: 'welcome', nombre: datos.nombre, email, tipo: 'particular', user_id: user.id })
  }
  return true
}

/**
 * Si el usuario tiene un registro pendiente en su metadata, crea el perfil y
 * dispara los avisos. Devuelve true si completó algo.
 */
export function completarRegistro(user) {
  const pendiente = user?.user_metadata?.registro_pendiente
  if (!pendiente || !TIPOS.includes(pendiente.tipo)) return Promise.resolve(false)
  if (completados.has(user.id)) return Promise.resolve(false)

  if (!enCurso.has(user.id)) {
    const p = ejecutar(user, pendiente)
      .then(hecho => { if (hecho) completados.add(user.id); return hecho })
      .finally(() => enCurso.delete(user.id))
    enCurso.set(user.id, p)
  }
  return enCurso.get(user.id)
}
