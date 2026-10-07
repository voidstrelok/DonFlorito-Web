# DonFlorito-Web

Sitio web del **Complejo Deportivo Don Florito** (Quebrada Peñuelas, La Serena): presentación de los servicios
(canchas de fútbol y tenis, piscinas y quinchos), reserva y pago en línea con Webpay, consulta de reservas y
administración del sitio. Es el frontend; consume la API [DonFlorito-API](https://github.com/voidstrelok/DonFlorito-API) (.NET).

- **Idiomas:** español (es-CL) e inglés (en-US).
- **Pensado primero para móvil**, accesible (revisado automáticamente con axe, WCAG 2.1 AA) y sin datos del negocio escritos en el código.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · React Router · Radix UI (componentes accesibles sin estilos) ·
i18next · Zod · Vitest · Playwright · ESLint

## Requisitos

- Node.js **22** o superior (`.nvmrc` y `engines` lo indican; la integración continua usa 22).
- npm.

## Inicio rápido

```bash
npm ci
npm run dev        # http://localhost:4200
```

El puerto **4200 es fijo**: la API solo acepta ese origen en desarrollo (CORS). Por defecto usa un **backend simulado**
(`apiUrl: "mock"`), así que funciona sin la API ni credenciales. Para usar la API real, ver [Configuración](#configuración).


## Configuración

Nada del negocio está en el código. Se lee **en tiempo de ejecución** desde `public/config/app-config.json`
(se valida con Zod en `src/config/schema.ts`), así cada ambiente cambia datos y claves **sin recompilar**.
`public/config/app-config.example.json` es la plantilla.

| Bloque | Controla |
|---|---|
| `apiUrl` | Base de la API. `"mock"` usa el backend simulado |
| `brand`, `contact`, `social`, `hours` | Nombre, teléfono/WhatsApp/correo/dirección, Instagram y horario por idioma |
| `maps` | `apiKey`, `mapId`, centro, marcador y zoom de Google Maps |
| `analytics` | `ga4Id` (vacío = sin analítica) y `consentRequired` (banner de cookies) |
| `payments.showTestBanner` | Aviso de "ambiente de pruebas" en la reserva |
| `features` | `admin` (habilita `/admin`) y `english` |
| `booking` | Días reservables, días cerrados, reservar hoy, máximos de entradas y quinchos |

**Desarrollo con valores propios:** crea `app-config.local.json` en la raíz (está ignorado por git) con solo lo que
quieras cambiar. Solo aplica con `npm run dev`; queda fuera de la build y de los e2e.


Desarrollado por [ThePit It Development](https://thepit.cl).
