process.env.PRIVATE = 'test123';
const redisClient = require('./config/redisServer.js');
const app = require('./app.js');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const userModel = require('./model/userModel.js');
const { refreshToken } = require('./controller/refreshTokenController.js');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

jest.setTimeout(15000);

let mongo;
beforeAll(() => {
  process.env.ACCESS_SECRET = 'testsecret';
});
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(mongo.getUri(), { dbName: 'testing' });
});

afterEach(async () => {
  await userModel.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongo.stop();
});

jest.mock('./services/refreshTokenService', () => ({
  refreshTokenService: jest.fn(),
}));

const { refreshTokenService } = require('./services/refreshTokenService');
const authorizeRoles = require('./middleware/authorizeRoles.js');
const authenticateToken = require('./middleware/authenticateToken.js');

// auth api test

describe('GET /api/health', () => {
  it('should return server and database health status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('server');
    expect(res.body.server).toHaveProperty('uptime');
    expect(res.body.server).toHaveProperty('memoryUsage');
    expect(res.body.server).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('database');
    expect(res.body.database).toHaveProperty('status');
    expect(['connected', 'disconnected']).toContain(res.body.database.status);
    expect(res.body.database).toHaveProperty('host');
    expect(res.body.database).toHaveProperty('name');
  });
});

describe('POST /api/auth/register', () => {
  it('should display error email already in used if email used twice', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'asim',
      email: 'asim146@gmail.com',
      password: '12345678',
      roles: 'manager',
    });
    const res = await request(app).post('/api/auth/register').send({
      name: 'asim',
      email: 'asim146@gmail.com',
      password: '1234567',
      roles: 'manager',
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Email Already in Use');
  });
  it('should register user if every thing provided correct', async () => {
    let user = {
      name: 'asim',
      email: 'asim@gmail.com',
      password: '123',
      roles: 'manager',
    };
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'User Registered');
    expect(res.body).toHaveProperty('user');
  });
});

describe('POST /api/auth/login', () => {
  it('should print error if provided email or password is not correct', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'asim',
      email: 'asim@gmail.com',
      password: '1234',
      roles: 'admin',
    });
    const res = await request(app).post('/api/auth/login').send({
      email: 'asim@gmail.com',
      password: '12345',
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Wrong Email or Password');
  });
  it('should print verify otp at /auth/verify-otp route if admin try to login', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'asim',
      email: 'asim@gmail.com',
      password: '1234',
      roles: 'admin',
    });
    const res = await request(app).post('/api/auth/login').send({
      email: 'asim@gmail.com',
      password: '1234',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty(
      'message',
      'OTP sent to email. Use /api/auth/verify-otp'
    );
  });
  it('should print user registered when user or manager try to login if everything provided correct', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'asim',
      email: 'asim@gmail.com',
      password: '1234',
      roles: 'manager',
    });
    const res = await request(app).post('/api/auth/login').send({
      email: 'asim@gmail.com',
      password: '1234',
    });
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.body).toHaveProperty('message', 'Login successful');
    expect(res.body).toHaveProperty('accessToken');
  });
});

describe('POST /api/auth/verify-otp', () => {
  it('if admin try to login then it should verify otp at /api/auth/verify-otp', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'asim',
      email: 'asim@gmail.com',
      password: '1234',
      roles: 'admin',
    });
    await request(app).post('/api/auth/login').send({
      email: 'asim@gmail.com',
      password: '1234',
    });
    const otp = await redisClient.get('otp:asim@gmail.com');
    const res = await request(app).post('/api/auth/verify-otp').send({
      email: 'asim@gmail.com',
      otp: otp,
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });
  it('should display error if wrong otp provided', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'asim',
      email: 'asim@gmail.com',
      password: '1234',
      roles: 'admin',
    });
    await request(app).post('/api/auth/login').send({
      email: 'asim@gmail.com',
      password: '1234',
    });
    const otp = await redisClient.get('otp:asim@gmail.com');
    const res = await request(app).post('/api/auth/verify-otp').send({
      email: 'asim@gmail.com',
      otp: '13232',
    });
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error', 'Invalid OTP');
  });
});

describe('POST /api/auth/refresh-token', () => {
  it('should display error if no refresh token provided', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'asim',
      email: 'asim@gmail.com',
      password: '123',
      roles: 'manager',
    });
    let loginUser = await request(app).post('/api/auth/login').send({
      email: 'asim@gmail.com',
      password: '123',
    });
    refreshTokenService.mockRejectedValue(new Error('No token provided'));
    const res = await request(app).post('/api/auth/refresh-token');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'No token provided');
  });
  it('should display error if wrong refresh token provided', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'asim',
      email: 'asim@gmail.com',
      password: '123',
      roles: 'manager',
    });
    let loginUser = await request(app).post('/api/auth/login').send({
      email: 'asim@gmail.com',
      password: '123',
    });
    refreshTokenService.mockRejectedValue(new Error('Invalid token'));
    const res = await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', ['refreshToken=invalidToken']);
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error', 'Invalid token');
  });
  let app1;

  beforeEach(() => {
    app1 = express();
    app1.use(cookieParser());
    app1.post('/refresh-token', refreshToken);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should refresh the token if everything provided correct', async () => {
    const mockResult = {
      newAccessToken: 'newAccessToken123',
      newRefreshToken: 'newRefreshToken123',
    };

    refreshTokenService.mockResolvedValue(mockResult);

    const res = await request(app1)
      .post('/refresh-token')
      .set('Cookie', ['refreshToken=validRefreshToken123']);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      accessToken: 'newAccessToken123',
    });
    const cookies = res.headers['set-cookie'].join(';');
    expect(cookies).toContain('token=newAccessToken123');
    expect(cookies).toContain('refreshToken=newRefreshToken123');
    expect(refreshTokenService).toHaveBeenCalledWith({
      refreshToken: 'validRefreshToken123',
    });
  });
});

// users api test

describe('PUT /api/users/update/:id', () => {
  it('should display error if id not found', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'asim',
      email: 'asim@gmail.com',
      password: '1234',
      roles: 'admin',
    });
    await request(app).post('/api/auth/login').send({
      email: 'asim@gmail.com',
      password: '1234',
    });
    const otp = await redisClient.get('otp:asim@gmail.com');
    const loginres = await request(app).post('/api/auth/verify-otp').send({
      email: 'asim@gmail.com',
      otp: otp,
    });

    const token = loginres.body.accessToken;
    console.log(token);
    const res = await request(app)
      .put(
        '/api/users/update/2324324',
        authenticateToken,
        authorizeRoles('admin')
      )
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'User Not Found');
  });
});
