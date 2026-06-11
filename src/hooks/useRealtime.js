import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// Hook genérico para escuchar cambios en cualquier tabla
export const useRealtime = (table, callback) => {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    // Nombre único para evitar conflictos si el mismo canal ya existe
    const channelName = `realtime-${table}-${Math.random().toString(36).slice(2, 7)}`

    let channel = null

    const setup = async () => {
      // Si ya existe un canal con ese nombre, lo eliminamos primero
      const existing = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`)
      if (existing) {
        await supabase.removeChannel(existing)
      }

      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload) => {
            console.log(`🔄 Cambio en ${table}:`, payload)
            callbackRef.current(payload)
          }
        )
        .subscribe((status) => {
          console.log(`📡 Canal ${table}: ${status}`)
        })
    }

    setup()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [table])
}

// Hook específico para escuchar múltiples tablas
export const useRealtimeMultiple = (tables, callback) => {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const channels = []

    const setup = async () => {
      for (const table of tables) {
        const channelName = `realtime-${table}-${Math.random().toString(36).slice(2, 7)}`

        // Limpiar canal previo si existe
        const existing = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`)
        if (existing) {
          await supabase.removeChannel(existing)
        }

        const channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table },
            (payload) => {
              console.log(`🔄 Cambio en ${table}:`, payload)
              callbackRef.current(table, payload)
            }
          )
          .subscribe((status) => {
            console.log(`📡 Canal ${table}: ${status}`)
          })

        channels.push(channel)
      }
    }

    setup()

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel))
    }
  }, [])
}