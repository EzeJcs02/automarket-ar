import { supabase } from './supabase'

const MAX_LADO = 1600
const CALIDAD = 0.82
const SUBIDAS_EN_PARALELO = 3

// Achica la foto en el navegador antes de subirla: una foto de celular (3-12 MB)
// queda en ~300 KB. Se decodifica con <img> para respetar la orientación de la cámara.
export async function comprimirImagen(file) {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const escala = Math.min(1, MAX_LADO / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * escala)
    canvas.height = Math.round(img.naturalHeight * escala)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', CALIDAD))
    if (!blob) throw new Error('no se pudo convertir')
    // Si ya venía chica y comprimida, no la empeoramos.
    if (file.type === 'image/jpeg' && file.size <= blob.size) return file
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
  } finally {
    URL.revokeObjectURL(url)
  }
}

const EXTENSIONES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

// items: [{ id, url }] (ya subidas) o [{ id, file }] (nuevas). Devuelve las URLs en el mismo orden.
export async function subirFotos(items, carpeta, onProgreso) {
  const pendientes = items.filter(f => f.file)
  const urls = new Map()
  let hechas = 0
  onProgreso?.(0, pendientes.length)

  const cola = [...pendientes]
  async function trabajador() {
    while (cola.length) {
      const item = cola.shift()
      const ext = EXTENSIONES[item.file.type] || 'jpg'
      const path = `${carpeta}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('fotos-autos').upload(path, item.file, { contentType: item.file.type })
      if (error) throw new Error(`No se pudo subir "${item.nombre || item.file.name}". Probá de nuevo.`)
      urls.set(item.id, supabase.storage.from('fotos-autos').getPublicUrl(path).data.publicUrl)
      onProgreso?.(++hechas, pendientes.length)
    }
  }
  await Promise.all(Array.from({ length: Math.min(SUBIDAS_EN_PARALELO, pendientes.length) }, trabajador))
  return items.map(f => f.url || urls.get(f.id))
}

export function fotosDesdeUrls(urls = []) {
  return urls.map(url => ({ id: url, url }))
}
