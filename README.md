# DonFlorito-Web (Next.js migration)

Migración del frontend de Angular 19 a **Next.js App Router + React + TypeScript** para consumir la misma API REST de `DonFlorito-API` sin cambios de backend.

## Stack principal

- Next.js 16 (App Router)
- React 19 + TypeScript estricto
- TanStack Query para data-fetching y caching
- next-intl con locales `es-CL` y `en-US`
- react-bootstrap + bootstrap-icons
- FullCalendar para disponibilidad de horarios
- @react-google-maps/api para ubicación
- react-hook-form + zod para formularios
- Jest + React Testing Library

## Variables de entorno

Copia `.env.local.example` a `.env.local` y ajusta los valores:

```bash
cp .env.local.example .env.local
```

Variables requeridas:

- `NEXT_PUBLIC_API_URL` → base URL de `DonFlorito-API` terminada en `/api/`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` → API key para Google Maps

## Scripts

```bash
npm install
npm run dev
npm run lint
npm test -- --runInBand
npm run build
npm run start
```

## Estructura

```text
src/
  app/                    # rutas App Router
  components/
    admin/                # panel administrativo
    layout/               # navbar, footer, loading overlay
    pages/                # páginas públicas reutilizables
    reservation/          # flujo reservar / mi-reserva
    providers/            # Query, locale, loading
    shared/               # mapa y carruseles
  lib/
    api/                  # cliente HTTP y mapeo 1:1 de endpoints
    hooks/                # hooks TanStack Query por dominio
    i18n/                 # mensajes es-CL / en-US
    types/                # DTOs y enums porteados
    utils/                # formato, storage y constantes
public/
  assets/                 # recursos migrados desde Angular
```

## Mapeo Angular → Next.js

| Angular | Next.js |
|---|---|
| `/` | `src/app/page.tsx` |
| `/servicios` | `src/app/servicios/page.tsx` |
| `/contacto` | `src/app/contacto/page.tsx` |
| `/reservar` | `src/app/reservar/page.tsx` |
| `/mi-reserva` | `src/app/mi-reserva/page.tsx` |
| `/mi-reserva/:id` | `src/app/mi-reserva/[id]/page.tsx` |
| `/admin` | `src/app/admin/page.tsx` |
| `/403` | `src/app/403/page.tsx` |
| `/500` | `src/app/500/page.tsx` |
| `**` | `src/app/not-found.tsx` |
| retorno Webpay | `src/app/webpay/return/page.tsx` |

## API y autenticación

- El cliente HTTP vive en `src/lib/api/client.ts`.
- Replica el interceptor Angular: si existe `sessionStorage['session']`, agrega el header `Authorization` con el token Bearer.
- Soporta JSON, `FormData` y respuestas binarias (QR PNG).
- Los hooks por dominio están en `src/lib/hooks/`:
  - `useSession*`
  - `usePersonas*`
  - `useServicios*`
  - `useReservas*`
  - `useTransacciones*`

## Estado global

- `LoadingProvider` muestra un overlay global combinando loading manual + actividad de TanStack Query.
- El idioma se mantiene en `localStorage['lang']` (`es-CL` por defecto), alineado con la app Angular original.
- La reserva en curso se mantiene en `sessionStorage['reserva']` para retomar el flujo de pago.

## Cobertura migrada

- Layout global con navbar, footer y overlay de loading.
- Páginas públicas (`/`, `/servicios`, `/contacto`).
- Flujo base de reserva con catálogo, selección de horarios, datos de cliente, resumen y creación de reserva.
- Consulta de reserva por ID o por reserva pendiente en sesión.
- Ruta de retorno Webpay.
- Panel administrativo con login y pestañas para config, pagos, personas, reservas, reservas especiales y servicios.
- Integración de Google Maps y FullCalendar.
- Tests de smoke/layout y hooks principales.

## Notas de migración

- Los assets Angular fueron movidos a `public/assets/`.
- Se eliminaron configuraciones Angular (`angular.json`, `tsconfig.app.json`, `tsconfig.spec.json`, `setup-jest.ts`, `eslint.config.js`).
- El README documenta el árbol nuevo para facilitar el reemplazo gradual de la rama `nextjs-migration`.
