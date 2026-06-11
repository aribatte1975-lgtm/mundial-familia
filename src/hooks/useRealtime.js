import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// Hook genérico para escuchar cambios en cualquier tabla
export const useRealtime = (table, callback) => {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          console.log(`🔄 Cambio en ${table}:`, payload)
          callbackRef.current(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table])
}

// Hook específico para escuchar múltiples tablas
export const useRealtimeMultiple = (tables, callback) => {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const channels = tables.map(table =>
      supabase
        .channel(`realtime-${table}-${Date.now()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload) => {
            console.log(`🔄 Cambio en ${table}:`, payload)
            callbackRef.current(table, payload)
          }
        )
        .subscribe()
    )

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel))
    }
  }, [])
}