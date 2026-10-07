import { z } from 'zod'

const localized = z.record(z.string(), z.string())
const latLng = z.object({ lat: z.number(), lng: z.number() })

/** Forma del archivo public/config/app-config.json. Se valida al arrancar. */
export const appConfigSchema = z.object({
  apiUrl: z.string().default(''),
  brand: z.object({
    name: z.string(),
    foundedYear: z.number(),
  }),
  contact: z.object({
    phone: z.string(),
    phoneDisplay: z.string(),
    whatsapp: z.string(),
    email: z.string(),
    address: z.string(),
  }),
  social: z
    .object({
      instagram: z.string().default(''),
      facebook: z.string().default(''),
    })
    .default({ instagram: '', facebook: '' }),
  hours: z.object({ text: localized }),
  maps: z.object({
    apiKey: z.string().default(''),
    mapId: z.string().default(''),
    center: latLng,
    marker: latLng,
    zoom: z.number().default(17),
  }),
  analytics: z.object({
    ga4Id: z.string().default(''),
    consentRequired: z.boolean().default(true),
  }),
  booking: z
    .object({
      /** Cuántos días hacia adelante se puede reservar. */
      daysAhead: z.number().int().positive().default(30),
      /** Días cerrados, 0 = domingo ... 6 = sábado (1 = lunes). */
      closedWeekdays: z.array(z.number().int().min(0).max(6)).default([1]),
      allowSameDay: z.boolean().default(false),
      maxPoolTickets: z.number().int().positive().default(10),
      maxQuinchos: z.number().int().positive().default(10),
    })
    .default({ daysAhead: 30, closedWeekdays: [1], allowSameDay: false, maxPoolTickets: 10, maxQuinchos: 10 }),
  payments: z.object({ showTestBanner: z.boolean().default(false) }),
  features: z.object({
    admin: z.boolean().default(false),
    english: z.boolean().default(true),
  }),
})

export type AppConfig = z.infer<typeof appConfigSchema>
