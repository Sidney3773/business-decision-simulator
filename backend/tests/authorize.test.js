/**
 * PRUEBA UNITARIA 3 — Middleware de autorización por roles (auth.middleware.js)
 * Archivo: src/middlewares/auth.middleware.js
 *
 * Qué se prueba:
 *   - Que un usuario con el rol correcto puede continuar (llama a next()).
 *   - Que un usuario con rol insuficiente recibe un 403 Forbidden.
 *   - Que authorize funciona con múltiples roles permitidos.
 *
 * Nota: Solo probamos `authorize` (lógica pura de roles).
 *       `protect` requiere base de datos, por eso se prueba por separado
 *       con pruebas de integración.
 */

const { authorize } = require('../src/middlewares/auth.middleware');

// ─── Helpers para simular req / res / next de Express ────────────────────────

/**
 * Crea un objeto req falso con el usuario indicado ya adjunto.
 * (Simula lo que haría `protect` si el usuario ya se autenticó.)
 */
function crearReq(rol) {
  return { user: { id: 1, email: 'test@test.com', role: rol } };
}

/**
 * Crea un objeto res falso que captura el código de estado y el JSON enviado.
 */
function crearRes() {
  const res = {};
  res.statusCode = null;
  res.body = null;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json   = (data)  => { res.body = data; return res; };
  return res;
}

// ─── Suite de pruebas ─────────────────────────────────────────────────────────

describe('Prueba 3 — Middleware authorize (control de roles)', () => {

  // ── Test 3.1 ─────────────────────────────────────────────────────────────
  test('permite el acceso cuando el usuario tiene el rol requerido', () => {
    /*
     * La ruta requiere rol TEACHER.
     * El usuario tiene rol TEACHER → debe llamar a next() sin error.
     */
    const middleware = authorize('TEACHER');
    const req  = crearReq('TEACHER');
    const res  = crearRes();
    const next = jest.fn(); // función espía para saber si fue llamada

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);   // sí pasó
    expect(res.statusCode).toBeNull();        // no hubo respuesta de error
  });

  // ── Test 3.2 ─────────────────────────────────────────────────────────────
  test('bloquea el acceso con 403 cuando el rol del usuario no está permitido', () => {
    /*
     * La ruta solo acepta ADMIN.
     * El usuario es STUDENT → debe recibir 403.
     */
    const middleware = authorize('ADMIN');
    const req  = crearReq('STUDENT');
    const res  = crearRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();       // no pasó
    expect(res.statusCode).toBe(403);          // acceso denegado
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('STUDENT'); // mensaje incluye el rol
  });

  // ── Test 3.3 ─────────────────────────────────────────────────────────────
  test('permite el acceso cuando el rol es uno de varios roles aceptados', () => {
    /*
     * La ruta acepta ADMIN o TEACHER (dos roles).
     * El usuario es TEACHER → debe llamar a next().
     */
    const middleware = authorize('ADMIN', 'TEACHER');
    const req  = crearReq('TEACHER');
    const res  = crearRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBeNull();
  });

});
