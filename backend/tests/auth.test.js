/**
 * Tests de Auth — sin base de datos real (mocks)
 * Cubre: login exitoso, credenciales inválidas, usuario inactivo
 */

jest.mock('../src/models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock('../src/utils/jwt', () => ({
  generateToken: jest.fn(() => 'mocked.jwt.token'),
  verifyToken: jest.fn()
}));

const request = require('supertest');
const app = require('../src/index');
const db = require('../src/models');

// Usuario de prueba simulado
const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'STUDENT',
  isActive: true,
  comparePassword: jest.fn()
};

afterEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/auth/login', () => {

  it('debe hacer login con credenciales correctas', async () => {
    db.User.findOne.mockResolvedValue(mockUser);
    mockUser.comparePassword.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });

  it('debe rechazar credenciales incorrectas', async () => {
    db.User.findOne.mockResolvedValue(mockUser);
    mockUser.comparePassword.mockResolvedValue(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('debe rechazar usuario inexistente', async () => {
    db.User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@example.com', password: 'password123' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('debe rechazar usuario inactivo', async () => {
    db.User.findOne.mockResolvedValue({ ...mockUser, isActive: false });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
