import { createContext, useContext, type ReactNode } from 'react'
import { appConfigSchema, type AppConfig } from './schema'

/**
 * Lee /config/app-config.json en tiempo de ejecución, así cada ambiente
 * (dev, staging, prod) cambia claves y datos sin recompilar.
 */
export async function loadConfig(): Promise<AppConfig> {
  const url = `${import.meta.env.BASE_URL}config/app-config.json`
  const res = await fetch(url, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`No se pudo cargar ${url} (${res.status})`)
  const parsed = appConfigSchema.safeParse(await res.json())
  if (!parsed.success) {
    const detalle = parsed.error.issues.map((i) => `- ${i.path.join('.')}: ${i.message}`).join('\n')
    throw new Error(`app-config.json inválido:\n${detalle}`)
  }
  return parsed.data
}

const ConfigContext = createContext<AppConfig | null>(null)

export function ConfigProvider({ config, children }: { config: AppConfig; children: ReactNode }) {
  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
}

export function useConfig(): AppConfig {
  const config = useContext(ConfigContext)
  if (!config) throw new Error('useConfig fuera de ConfigProvider')
  return config
}
