import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [concesionaria, setConcesionaria] = useState(null)
  const [profesional, setProfesional] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        if (session?.user) {
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
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchConcesionaria(session.user.id)
        } else {
          setConcesionaria(null)
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
        aprobada: true,
      })
      fetch('/api/notify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: datos.nombre, email, telefono: datos.telefono, ciudad: datos.ciudad }),
      }).catch(() => {})
      fetch('/api/welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: datos.nombre, email, tipo: 'concesionaria' }),
      }).catch(() => {})
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
      fetch('/api/notify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: datos.nombre, email, telefono: datos.telefono, ciudad: datos.ciudad, tipo: 'profesional' }),
      }).catch(() => {})
    }
    return { error: null }
  }

  async function signUpUsuario(email, password, nombre) {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { nombre } } })
    if (error) return { error }
    fetch('/api/welcome-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, tipo: 'particular' }),
    }).catch(() => {})
    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const isAdmin = user?.email === 'fioramarket99@gmail.com'

  return (
    <AuthContext.Provider value={{ user, concesionaria, profesional, loading, signIn, signUp, signUpUsuario, signUpProfesional, signOut, isAdmin, fetchConcesionaria }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)