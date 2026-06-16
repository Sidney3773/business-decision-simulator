const request = require('supertest');
const app = require('../src/index');
const db = require('../src/models');

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    // Limpiar base de datos de pruebas
    await db.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

      /**
     * Test 1: Registro exitoso de un usuario nuevo.
     * Flujo esperado:
     *   1. Se envía name, email, password y role
     *   2. El servidor crea el usuario en la BD
     *   3. Devuelve código 201 (Created) con un token JWT
     */
  describe('POST /api/auth/register', () => {
    it('debe registrar un nuevo usuario', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'STUDENT'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('email', 'test@example.com');
    });

        /**
     * Test 2: Rechazo de email duplicado.
     * Este test depende del Test 1: usa el mismo email 'test@example.com'
     * que ya fue registrado. El servidor debe detectar el duplicado
     * y rechazarlo con código 400 (Bad Request).
     * Flujo esperado:
     *   1. Se intenta registrar con un email ya existente en la BD
     *   2. El servidor detecta el duplicado
     *   3. Devuelve código 400 con success: false
     */
    it('debe rechazar email duplicado', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User 2',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });


      /**
     * Test 3: Login exitoso con credenciales correctas.
     * Flujo esperado:
     *   1. Se envía email y password correctos
     *   2. El servidor verifica la contraseña con bcrypt
     *   3. Devuelve código 200 con un token JWT nuevo
     */
  describe('POST /api/auth/login', () => {
    it('debe hacer login con credenciales correctas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });



        /**
     * Test 4: Rechazo de contraseña incorrecta.
     * Flujo esperado:
     *   1. Se envía el email correcto pero contraseña incorrecta
     *   2. bcrypt compara y detecta que no coincide
     *   3. Devuelve código 401 (Unauthorized) con success: false
     * Importante: el servidor devuelve el mismo mensaje para email
     * inexistente y contraseña incorrecta ("Credenciales inválidas").
     * Esto es intencional por seguridad — no revelar si el email existe.
     */
    it('debe rechazar credenciales incorrectas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});