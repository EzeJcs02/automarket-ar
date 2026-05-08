import { createContext, useContext, useState } from 'react'

const ComparadorContext = createContext({})

export function ComparadorProvider({ children }) {
  const [lista, setLista] = useState([])

  function agregar(auto) {
    setLista(prev => {
      if (prev.find(a => a.id === auto.id)) return prev
      if (prev.length >= 3) return prev
      return [...prev, auto]
    })
  }

  function quitar(id) {
    setLista(prev => prev.filter(a => a.id !== id))
  }

  function limpiar() { setLista([]) }

  function estaEnLista(id) { return lista.some(a => a.id === id) }

  return (
    <ComparadorContext.Provider value={{ lista, agregar, quitar, limpiar, estaEnLista }}>
      {children}
    </ComparadorContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useComparador = () => useContext(ComparadorContext)
