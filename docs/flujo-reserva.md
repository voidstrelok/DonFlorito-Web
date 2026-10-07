# Flujo de reserva

## Antes (sitio Angular)

1. Elegir fecha en un calendario emergente (solo el mes en curso, sin lunes; restricción solo del front).
2. Lista de todos los servicios; cada cancha abre un modal con calendario, 3 selectores y botón Guardar.
3. Pantalla de RUT, luego formulario con 4 campos de nombre obligatorios.
4. Pantalla de resumen, luego pantalla "Mi reserva" con cuenta regresiva de 5 min y botón Pagar, luego Webpay.

## Ahora

Tres pasos, con el carro siempre visible (panel lateral en escritorio, barra inferior en móvil):

1. **Elige** (`/reservar`): franja de días (30 por defecto, sin días cerrados) y, debajo, las tarjetas de servicio.
   - Canchas: cancha (si hay varias), partidos seguidos y **horarios como botones**. Un toque agrega la reserva.
   - Piscinas: contadores por tipo de entrada.
   - Quinchos: zona (agrega 1 al elegirla) y contador.
2. **Tus datos** (`/reservar/datos`): RUT, nombre, apellido, correo, teléfono. No se piden segundo nombre ni apellido materno (la API los recibe vacíos).
   Validación en línea. Opción de recordar los datos en el dispositivo.
3. **Pago** (`/reservar/pago`): resumen, aceptar términos y **un solo botón** que crea la reserva, genera la orden y redirige a Webpay.

Retorno de Webpay (`/mi-reserva/?token_ws=...`): confirma el pago y lleva a `/mi-reserva/{id}?ok=1`.
Si el pago falla o se cancela (`TBK_TOKEN`) se ofrece reintentar (la API permite 3 intentos).

## Decisiones

- **Sin búsqueda de RUT.** `POST personas/GetPersonaByRut` entrega nombre, correo y teléfono a cualquiera que conozca un RUT.
  El nuevo front no lo usa. Si la persona ya existe, la API reutiliza el registro al crear la reserva.
- **Sin cuenta regresiva.** El pago parte en el mismo clic que crea la reserva; Webpay aplica su propio tiempo límite.
- **Mi reserva** no muestra RUT ni datos de contacto (solo nombre y apellido), porque `getById` es público y secuencial.
- Un servicio por tipo en el carro (igual que antes). Cambiar de día vacía el carro.
- El borrador vive en `sessionStorage` (`df-booking-draft`); la reserva pendiente en `reserva`, misma clave que el sitio anterior.
- Reglas del negocio configurables en `public/config/app-config.json` → `booking`.

## Contrato con la API (sin cambios)

| Paso | Llamada |
|---|---|
| Parámetros | `GET session/GetParametros` |
| Catálogo del día | `POST servicios/getCatalogo` (`FechaReserva` = `dd-MM-yyyy`) |
| Horarios | `POST servicios/getCalendarioByServicio` (`IdServicio`, `nPartidos`, `FechaReserva`) |
| Crear reserva | `POST reservas` |
| Orden de pago | `POST transacciones/usaEnlace` |
| Confirmar | `POST reservas/ConfirmarReserva/{token_ws}` |
| Ver reserva | `GET reservas/getById/{id}`, `GET reservas/getLinkQR/{id}` |

## Pendiente en la API (fuera del alcance del front)

- `ConfirmarReserva` vuelve a crear la reserva desde el JSON que manda el navegador y deja huérfana la pendiente;
  conviene confirmar por `IdOrdenCompra`/token en el servidor. El endpoint `transacciones/commit` ya existe con ese enfoque.
- `GetPersonaByRut` y `getById` exponen datos personales sin autenticación.
- `returnUrl` de Webpay usa `{FrontendURL}/mi-reserva/`: debe apuntar al dominio del nuevo front.
- Verificar con una persona real que el RUT se guarda como `12345678-5` (mayúscula en la K), igual que el sitio anterior.

## Hallazgos al probar contra la API demo (`demo-api-donflorito.thepit.cl`)

Probado de punta a punta: reserva, pago exitoso, pago rechazado, compra anulada en Webpay, login de admin,
listados, bloqueos especiales, cambio de precio y anulación de reservas.

1. **Persona existente:** la API desplegada responde *"Ya existe la persona que se intenta ingresar"* si el RUT ya existe.
   El front lo resuelve buscando solo el `id` por RUT y reintentando con `idPersona` (`src/features/booking/submit.ts`).
   El código actual del repositorio ya reutiliza a la persona; la demo parece correr una versión anterior.
2. **Reservas pendientes no persisten:** `NuevaReserva` usa un `TransactionScope` sin `Complete()`, así que se revierte.
   La reserva real nace en `ConfirmarReserva`. Por eso el listado del admin solo muestra reservas pagadas.
3. **Anular:** el repositorio define `CancelarReserva` como PATCH; la demo lo expone como GET y rechaza PATCH (405).
   El front prueba PATCH y cae a GET. Conviene que ambas versiones converjan (un GET que escribe no debería existir).
4. **La API se reinicia tras anular una reserva (502 por ~10 s).** Se reproduce con `curl`: `CancelarReserva` responde 200 y las
   siguientes llamadas dan 502 hasta que el servicio vuelve. Revisar el log del servicio (la causa más probable es una excepción
   no controlada al enviar el correo de anulación). El front reintenta las lecturas ante 502/503/504 y cortes de red
   (`src/api/client.ts`); las escrituras nunca se reintentan solas.
5. **Paginación:** `getReservas` ignora `pagina`/`porPagina` en la demo (devuelve siempre lo mismo). El front pagina hasta que no
   aparezcan reservas nuevas, así que funciona con ambas versiones.
6. **CORS:** los errores 502 del proxy no llevan cabeceras CORS; el navegador los reporta como "bloqueado por CORS".
