jest.mock('../src/models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn()
  }
}));

const request = require('supertest');
const app = require('../src/index');
const db = require('../src/models');

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
    // El token viene en data.token o data contiene user — verificamos ambos
    expect(res.body.data).toBeDefined();
    expect(res.body.data.user).toHaveProperty('email', 'test@example.com');
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