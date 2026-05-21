import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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
          await fetchConcesionaria(session.user.id)
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
          fetchConcesionaria(session.user.id)
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

  async function fetchConcesionaria(userId) {
    try {
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
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signUp(email, password, datos) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error }
    if (data.user) {
      await supabase.from('concesionarias').insert({
        user_id: data.user.id,
        nombre: datos.nombre,
        responsable: datos.responsable,
        email,
        telefono: datos.telefono,
        ciudad: datos.ciudad,
        aprobada: false,
      })
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'admin', nombre: datos.nombre, email, telefono: datos.telefono, ciudad: datos.ciudad }),
      }).catch(err => console.error('[AuthContext] notify endpoint failed:', err))
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'welcome', nombre: datos.nombre, email, tipo: 'concesionaria', user_id: data.user.id }),
      }).catch(err => console.error('[AuthContext] notify endpoint failed:', err))
    }
    return { error: null }
  }

  async function signUpProfesional(email, password, datos) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error }
    if (data.user) {
      await supabase.from('profesionales').insert({
        user_id: data.user.id,
        nombre: datos.nombre,
        categoria: datos.categoria,
        ciudad: datos.ciudad || null,
        telefono: datos.telefono || null,
        whatsapp: datos.whatsapp || null,
        email,
        aprobado: false,
        activo: false,
      })
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'admin', nombre: datos.nombre, email, telefono: datos.telefono, ciudad: datos.ciudad, tipo: 'profesional' }),
      }).catch(err => console.error('[AuthContext] notify endpoint failed:', err))
    }
    return { error: null }
  }

  async function signUpUsuario(email, password, nombre) {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { nombre } } })
    if (error) return { error }
    if (data.user) {
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'welcome', nombre, email, tipo: 'particular', user_id: data.user.id }),
      }).catch(err => console.error('[AuthContext] notify endpoint failed:', err))
    }
    return { error: null }
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

  const isAdmin = !!(user?.email && user.email === import.meta.env.VITE_ADMIN_EMAIL)

  return (
    <AuthContext.Provider value={{ user, concesionaria, profesional, loading, signIn, signUp, signUpUsuario, signUpProfesional, signOut, signInWithOAuth, isAdmin, fetchConcesionaria }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)