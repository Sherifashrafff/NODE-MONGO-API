const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

const VALID_PAYLOAD = { name: 'Bob', email: 'bob@example.com', password: 'hunter2!' };

describe('POST /api/auth/register', () => {
  it('201 — returns token and user on success', async () => {
    const res = await request(app).post('/api/auth/register').send(VALID_PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({ name: 'Bob', email: 'bob@example.com' });
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('409 — duplicate email returns conflict', async () => {
    await request(app).post('/api/auth/register').send(VALID_PAYLOAD);
    const res = await request(app).post('/api/auth/register').send(VALID_PAYLOAD);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Email already registered');
  });

  it('422 — missing name returns validation error', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'x@example.com', password: 'pass123' });

    expect(res.status).toBe(422);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ msg: 'Name is required' })])
    );
  });

  it('422 — invalid email returns validation error', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'X', email: 'not-an-email', password: 'pass123' });

    expect(res.status).toBe(422);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ msg: 'Valid email is required' })])
    );
  });

  it('422 — short password returns validation error', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'X', email: 'x@example.com', password: '123' });

    expect(res.status).toBe(422);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: 'Password must be at least 6 characters' }),
      ])
    );
  });

  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
