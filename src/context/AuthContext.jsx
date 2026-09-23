import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { completarRegistro } from '../lib/registroPendiente'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [concesionaria, setConcesionaria] = useState(null)
  const [profesional, setProfesional] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let lastFetchedUserId = null

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        if (session?.user) {
          lastFetchedUserId = session.user.id
          await fetchConcesionaria(session.user.id, session.user)
        } else {
          setLoading(false)
        }
      } catch (err) {
        console.error("Auth initialization failed:", err)
        setLoading(false)
      }
    }

    initAuth()

    let subscription = null
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        const newUserId = session?.user?.id ?? null
        setUser(session?.user ?? null)
        if (session?.user) {
          if (lastFetchedUserId === newUserId) return // evita double-fetch en boot
          lastFetchedUserId = newUserId
          setLoading(true)
          fetchConcesionaria(session.user.id, session.user)
        } else {
          lastFetchedUserId = null
          setConcesionaria(null)
          setProfesional(null)
          setLoading(false)
        }
      })
      subscription = data.subscription
    } catch (err) {
      console.error("Auth state change listener failed:", err)
    }

    return () => {
      if (subscription) subscription.unsubscribe()
    }
  }, [])

  async function fetchConcesionaria(userId, authUser) {
    try {
      // Registro diferido: si venía pendiente (confirmación de email), crear el perfil primero.
      if (authUser) await completarRegistro(authUser)
      const [{ data: concData }, { data: profData }] = await Promise.all([
        supabase.from('concesionarias').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('profesionales').select('*').eq('user_id', userId).maybeSingle(),
      ])
      setConcesionaria(concData ?? null)
      setProfesional(profData ?? null)
    } catch {
      setConcesionaria(null)
      setProfesional(null)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error && data?.user) await completarRegistro(data.user)
    return { error }
  }

  // Los datos del perfil viajan en user_metadata.registro_pendiente y se crean en
  // el primer login (ver src/lib/registroPendiente.js). Si Supabase devuelve
  // sesión (confirmación de email desactivada) se completa en el acto.
  async function registrar(email, password, pendiente, extraMeta = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { ...extraMeta, registro_pendiente: pendiente } },
    })
    if (error) return { error }
    if (data.session && data.user) await completarRegistro(data.user)
    return { error: null, needsConfirmation: !data.session }
  }

  function signUp(email, password, datos) {
    return registrar(email, password, {
      tipo: 'concesionaria',
      nombre: datos.nombre,
      responsable: datos.responsable,
      telefono: datos.telefono,
      ciudad: datos.ciudad,
    })
  }

  function signUpProfesional(email, password, datos) {
    return registrar(email, password, {
      tipo: 'profesional',
      nombre: datos.nombre,
      categoria: datos.categoria,
      ciudad: datos.ciudad || null,
      telefono: datos.telefono || null,
      whatsapp: datos.whatsapp || null,
    })
  }

  function signUpUsuario(email, password, nombre) {
    return registrar(email, password, { tipo: 'particular', nombre }, { nombre })
  }

  async function signInWithOAuth(provider, redirectTo = 'https://fioramarket.store/mi-cuenta') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    })
    return { error }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('signOut failed:', error)
      // Fallback: limpiar estado local aunque el server falle
      setUser(null)
      setConcesionaria(null)
      setProfesional(null)
    }
    return { error }
  }

  // Sólo para mostrar/ocultar UI: el rol vive en app_metadata (no editable por el usuario).
  // El control de acceso real es server-side (api/admin-*.js compara con ADMIN_EMAIL).
  const isAdmin = user?.app_metadata?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, concesionaria, profesional, loading, signIn, signUp, signUpUsuario, signUpProfesional, signOut, signInWithOAuth, isAdmin, fetchConcesionaria }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)