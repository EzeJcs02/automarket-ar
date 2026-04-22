import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [concesionaria, setConcesionaria] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchConcesionaria(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchConcesionaria(session.user.id)
      else { setConcesionaria(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchConcesionaria(userId) {
    const { data } = await supabase
      .from('concesionarias')
      .select('*')
      .eq('user_id', userId)
      .single()
    setConcesionaria(data)
    setLoading(false)
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
    }
    return { error: null }
  }

  async function signUpUsuario(email, password, nombre) {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { nombre } } })
    if (error) return { error }
    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const isAdmin = user?.email === 'admin@automarket.ar'

  return (
    <AuthContext.Provider value={{ user, concesionaria, loading, signIn, signUp, signUpUsuario, signOut, isAdmin, fetchConcesionaria }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)