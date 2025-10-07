import { useState, useEffect, useCallback, useRef } from 'react'

interface DisplayModel {
  id: string
  label: string
}

interface CachedModels {
  models: DisplayModel[]
  timestamp: number
}

const MAX_RETRIES = 3
const RETRY_DELAY_MILLIS = 5000
const CACHE_DURATION = 30 * 60 * 1000 // 30 minut
const CACHE_KEY = 'available-models-cache'

// Funkce pro práci s cache přesunuty mimo hook
const getCachedModels = (): DisplayModel[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    
    const { models: cachedModels, timestamp }: CachedModels = JSON.parse(cached)
    
    // Zkontrolujeme, zda cache není starší než CACHE_DURATION
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    
    return cachedModels
  } catch {
    return null
  }
}

const cacheModels = (modelsToCache: DisplayModel[]) => {
  try {
    const cacheData: CachedModels = {
      models: modelsToCache,
      timestamp: Date.now()
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
  } catch {
    // Ignorujeme chyby při ukládání do cache
  }
}

export function useAvailableModels() {
  const [models, setModels] = useState<DisplayModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const hasInitialized = useRef(false)

  const fetchModels = useCallback(
    async (isRetry: boolean = false) => {
      if (!isRetry) {
        setIsLoading(true)
        setError(null)
      }

      try {
        const response = await fetch('/api/models')
        if (!response.ok) {
          throw new Error('Failed to fetch models')
        }
        const data = await response.json()
        const newModels = data.models.map(
          (model: { id: string; name: string }) => ({
            id: model.id,
            label: model.name,
          })
        )
        setModels(newModels)
        cacheModels(newModels) // Uložíme modely do cache
        setError(null)
        setRetryCount(0)
        setIsLoading(false)
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to fetch models')
        )
        if (retryCount < MAX_RETRIES) {
          setRetryCount((prev) => prev + 1)
          setIsLoading(true)
        } else {
          setIsLoading(false)
        }
      } finally {
        setIsLoading(false)
      }
    },
    [retryCount]
  )

  useEffect(() => {
    // Zabráníme opakovanému spouštění
    if (hasInitialized.current) return
    hasInitialized.current = true

    // Nejprve zkusíme načíst modely z cache
    const cachedModels = getCachedModels()
    if (cachedModels) {
      setModels(cachedModels)
      setIsLoading(false)
      return
    }

    // Pokud nemáme cache, načteme modely z API
    fetchModels(false)
  }, [])

  useEffect(() => {
    // Retry logika - oddělena od inicializace
    if (retryCount > 0 && retryCount <= MAX_RETRIES) {
      const timerId = setTimeout(() => {
        fetchModels(true)
      }, RETRY_DELAY_MILLIS)
      return () => clearTimeout(timerId)
    }
  }, [retryCount, fetchModels])

  return { models, isLoading, error }
}
