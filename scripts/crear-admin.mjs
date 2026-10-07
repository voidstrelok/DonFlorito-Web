#!/usr/bin/env node
/**
 * Genera el SQL (SQL Server) para crear o restablecer un usuario administrador de DonFlorito-API.
 *
 * La API guarda la contraseña con PBKDF2-HMAC-SHA256, 100.000 iteraciones, 32 bytes, en base64, usando como
 * sal el valor de configuración "salt" del servidor (Util.Saltear). Ese valor es un secreto: no está en el
 * repositorio. Se entrega por variable de entorno y no se imprime.
 *
 * Uso (PowerShell):
 *   $env:DF_SALT = "<valor de salt del servidor>"
 *   node scripts/crear-admin.mjs --usuario soporte
 *   # opcional: $env:DF_PASSWORD = "mi-clave"   (si no, se genera una y se muestra una sola vez)
 *
 * Luego ejecutar el SQL resultante en la base de datos. Es idempotente: si el usuario existe, le restablece
 * la contraseña y lo habilita.
 */
import { pbkdf2Sync, randomBytes } from 'node:crypto'
import { pathToFileURL } from 'node:url'

export const ITERATIONS = 100000

/** Igual a Utils.Saltear de la API (KeyDerivation.Pbkdf2 con HMACSHA256). */
export function hashPassword(password, salt, iterations = ITERATIONS) {
  return pbkdf2Sync(Buffer.from(password, 'utf8'), Buffer.from(salt, 'utf8'), iterations, 32, 'sha256').toString('base64')
}

const q = (s) => `N'${String(s).replace(/'/g, "''")}'`

export function buildSql({ usuario, hash, nombre = 'Administrador', apellido = 'Sistema', rut = '1-9', email = 'admin@donflorito.cl' }) {
  return `-- Usuario administrador "${usuario}"
SET XACT_ABORT ON;
BEGIN TRAN;

DECLARE @IdPersona bigint = (SELECT TOP 1 Id FROM Persona WHERE Rut = ${q(rut)});
IF @IdPersona IS NULL
BEGIN
  INSERT INTO Persona (Rut, Nombre, SegundoNombre, ApellidoPaterno, ApellidoMaterno, Email, Telefono, IsEnabled)
  VALUES (${q(rut)}, ${q(nombre)}, N'', ${q(apellido)}, N'', ${q(email)}, 0, 1);
  SET @IdPersona = SCOPE_IDENTITY();
END

IF EXISTS (SELECT 1 FROM Usuario WHERE Usuario = ${q(usuario)})
  UPDATE Usuario SET [Contraseña] = ${q(hash)}, IsEnabled = 1 WHERE Usuario = ${q(usuario)};
ELSE
  INSERT INTO Usuario (Usuario, [Contraseña], IdPersona, IsEnabled)
  VALUES (${q(usuario)}, ${q(hash)}, @IdPersona, 1);

COMMIT;

-- Verificar:
-- SELECT Id, Usuario, IdPersona, IsEnabled FROM Usuario;
`
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : undefined
}

function main() {
  const salt = process.env.DF_SALT
  const usuario = arg('usuario')
  if (!salt || !usuario) {
    console.error('Falta DF_SALT (variable de entorno) o --usuario. Ver el encabezado de este archivo.')
    process.exit(1)
  }
  let password = process.env.DF_PASSWORD
  const generated = !password
  if (generated) password = randomBytes(12).toString('base64url')
  process.stdout.write(buildSql({ usuario, hash: hashPassword(password, salt), nombre: arg('nombre'), rut: arg('rut'), email: arg('email') }))
  if (generated) console.error(`\nContraseña generada para "${usuario}" (se muestra una sola vez): ${password}`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main()
