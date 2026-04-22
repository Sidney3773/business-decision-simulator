/**
 * SEGUNDA PRUEBA UNITARIA — Utilidades JWT (jwt.js)
 * Archivo: src/utils/jwt.js
 *
 * Que probamos?:
 *   - Que generateToken devuelve un string con formato JWT válido.
 *   - Que verifyToken decodifica correctamente el payload original.
 *   - Que verifyToken lanza un error con un token falso o alterado.
 */

const { generateToken, verifyToken } = require('../src/utils/jwt');

// ─── Suite de pruebas ─────────────────────────────────────────────────────────

describe('Prueba 2 — Utilidades JWT', () => {

  // Payload de ejemplo que representa un usuario autenticado
  const payloadEjemplo = {
    id: 42,
    email: 'alumno@ejemplo.com',
    role: 'STUDENT'
  };

  // ── Test 2.1 ─────────────────────────────────────────────────────────────
  test('generateToken devuelve un string con estructura JWT válida (3 partes)', () => {
    /*
     * Un JWT siempre tiene el formato: header.payload.signature
     * Al dividir por "." debe tener exactamente 3 partes.
     */
    const token = generateToken(payloadEjemplo);

    expect(typeof token).toBe('string');

    const partes = token.split('.');
    expect(partes).toHaveLength(3); // header . payload . firma
  });

  // ── Test 2.2 ─────────────────────────────────────────────────────────────
  test('verifyToken decodifica el mismo payload que fue firmado', () => {
    /*
     * Generamos un token y luego lo verificamos.
     * Los campos id, email y role deben coincidir exactamente.
     */
    const token = generateToken(payloadEjemplo);
    const decoded = verifyToken(token);

    expect(decoded.id).toBe(payloadEjemplo.id);
    expect(decoded.email).toBe(payloadEjemplo.email);
    expect(decoded.role).toBe(payloadEjemplo.role);
  });

  // ── Test 2.3 ─────────────────────────────────────────────────────────────
  test('verifyToken lanza un error cuando el token es inválido o adulterado', () => {
    /*
     * Usamos un token completamente falso.
     * La función debe lanzar un Error (no retornar silenciosamente).
     */
    const tokenFalso = 'esto.no.es.un.jwt.valido';

    expect(() => {
      verifyToken(tokenFalso);
    }).toThrow('Token inválido o expirado');
  });

});
