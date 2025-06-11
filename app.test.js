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
const fs = require('fs');
const path = require('path');
const { refreshTokenService } = require('./services/refreshTokenService');
const projectModel = require('./model/projectModel.js');
const taskModel = require('./model/taskModel.js');

jest.setTimeout(100000);

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

jest.mock('./middleware/authenticateToken', () => {
  return (req, res, next) => {
    req.user = { id: 'admin123', roles: ['admin'] };
    next();
  };
});
jest.mock('./middleware/authorizeRoles', () => {
  return () => (req, res, next) => next();
});
describe('PUT /api/users/update/:id', () => {
  let user;
  beforeEach(async () => {
    user = await userModel.create({
      name: 'asim',
      email: 'asim@gmail.com',
      password: '123',
      roles: 'user',
    });
  });
  it('should display error if id not found', async () => {
    const id = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/users/update/${id}`)
      .send({
        name: 'asim',
        email: 'asim146@gmail.com',
        password: '12356',
        roles: ['admin'],
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'User Not Found');
  });

  it('should update the user if everything provided correct', async () => {
    const res = await request(app).put(`/api/users/update/${user._id}`).send({
      name: 'asim',
      email: 'asim@gmail.com',
      password: '12345',
      roles: 'admin',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'User Updated');
  });
});

describe('DELETE /api/users/delete/:id', () => {
  let user;
  beforeEach(async () => {
    user = await userModel.create({
      name: 'asim',
      email: 'asim@gmail.com',
      password: '123',
      roles: 'user',
    });
  });
  it('should display error if user not found', async () => {
    const id = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/api/users/delete/${id}`);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'User Not Found');
  });

  it('should delete the the user if correect id provided', async () => {
    const res = await request(app).delete(`/api/users/delete/${user._id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'User Deleted');
  });
});

describe('GET /api/admin/dashboard', () => {
  it('should display admin dashboard ', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Admin DashBoard');
    expect(res.body).toHaveProperty('UsersData');
    expect(res.body).toHaveProperty('taskData');
  });
});

// project apis testing

describe('POST /api/projects/create', () => {
  let user;
  let manager;
  beforeEach(async () => {
    user = await userModel.create({
      name: 'asim',
      email: 'asim@gmail.com',
      password: '123',
      roles: 'user',
    });
  });
  beforeEach(async () => {
    manager = await userModel.create({
      name: 'asim',
      email: 'asim146@gmail.com',
      password: '123',
      roles: 'manager',
    });
  });
  it('should create project', async () => {
    const res = await request(app).post('/api/projects/create').send({
      title: 'weather app',
      description: 'complete weather app',
      createdby: manager._id,
      assignedUsers: user._id,
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Project Created');
    expect(res.body).toHaveProperty('details');
  });
});

describe('DELETE /api/projects/delete/:id', () => {
  let project;
  let user;
  let manager;
  beforeEach(async () => {
    user = await userModel.create({
      name: 'asim',
      email: 'asim@gmail.com',
      password: '123',
      roles: 'user',
    });
  });
  beforeEach(async () => {
    manager = await userModel.create({
      name: 'asim',
      email: 'asim146@gmail.com',
      password: '123',
      roles: 'manager',
    });
  });
  beforeEach(async () => {
    project = await projectModel.create({
      title: 'weather app',
      description: 'complete weather app',
      createdby: manager._id,
      assignedUsers: user._id,
    });
  });
  it('should display error if project is not found', async () => {
    const id = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/api/projects/delete/${id}`);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Project Not Found');
  });
  it('should delete project if correct id provided', async () => {
    const res = await request(app).delete(
      `/api/projects/delete/${project._id}`
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Project Deleted');
  });
});

describe('UPDATE /api/projects/update/:id', () => {
  let project;
  let user;
  let manager;
  beforeEach(async () => {
    user = await userModel.create({
      name: 'asim',
      email: 'asim@gmail.com',
      password: '123',
      roles: 'user',
    });
  });
  beforeEach(async () => {
    manager = await userModel.create({
      name: 'asim',
      email: 'asim146@gmail.com',
      password: '123',
      roles: 'manager',
    });
  });
  beforeEach(async () => {
    project = await projectModel.create({
      title: 'weather app',
      description: 'complete weather app',
      createdby: manager._id,
      assignedUsers: user._id,
    });
  });
  it('should display error if project is not found', async () => {
    const id = new mongoose.Types.ObjectId();
    const res = await request(app).put(`/api/projects/update/${id}`).send({
      title: 'weather app frontend',
      description: 'complete weather app',
      createdby: manager._id,
      assignedUsers: user._id,
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Project Not Found');
  });
  it('should update project if correct id provided', async () => {
    const res = await request(app)
      .put(`/api/projects/update/${project._id}`)
      .send({
        title: 'weather app frontend',
        description: 'complete weather app',
        createdby: manager._id,
        assignedUsers: user._id,
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Project Updated');
  });
});

describe('GET /api/projects/list', () => {
  it('should display list of projects', async () => {
    const res = await request(app).get('/api/projects/list');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ProjectDetails');
  });
});

// task apis testing

describe('POST /api/tasks/create', () => {
  let manager;
  let user;
  let project;
  beforeEach(async () => {
    user = await userModel.create({
      name: 'asim',
      email: 'asim@gmail.com',
      password: '123',
      roles: 'user',
    });
  });
  beforeEach(async () => {
    manager = await userModel.create({
      name: 'asim',
      email: 'asim146@gmail.com',
      password: '123',
      roles: 'manager',
    });
  });
  beforeEach(async () => {
    project = await projectModel.create({
      title: 'weather app',
      description: 'complete weather app',
      createdby: manager._id,
      assignedUsers: user._id,
    });
  });
  it('should display task created and assigned', async () => {
    const filePath = path.join(__dirname, 'test1-avatar.png');
    fs.writeFileSync(filePath, 'image content');
    const res = await request(app)
      .post('/api/tasks/create')
      .field('title', 'frontend')
      .field('description', 'complete frontend')
      .field('status', 'todo')
      .field('project', project._id.toString())
      .field('assignedTo', user._id.toString())
      .attach('attachments', filePath);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Task Created and Assigned');
    fs.unlinkSync(filePath);
  });
});

describe('UPDATE /api/tasks/update/:id', () => {
  let user;
  let task;
  let project;
  let manager;
  beforeEach(async () => {
    user = await userModel.create({
      name: 'asim',
      email: 'asim@gmail.com',
      password: '1234',
      roles: 'user',
    });
  });
  beforeEach(async () => {
    manager = await userModel.create({
      name: 'asim',
      email: 'asim146@gmail.com',
      password: '123',
      roles: 'manager',
    });
  });
  beforeEach(async () => {
    project = await projectModel.create({
      title: 'weather app',
      description: 'complete weather app',
      createdby: manager._id,
      assignedUsers: user._id,
    });
  });
  beforeEach(async () => {
    task = await taskModel.create({
      title: 'frontend',
      description: 'complete frontend',
      status: 'todo',
      project: project._id,
      assignedTo: user._id,
    });
  });
  it('should display error if task not exits', async () => {
    const id = new mongoose.Types.ObjectId();
    const res = await request(app).patch(`/api/tasks/update/${id}`).send({
      status: 'done',
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Task not Exists');
  });
  it('should display error if user try to modify two or more fields', async () => {
    const res = await request(app).patch(`/api/tasks/update/${task._id}`).send({
      title: 'backend',
      status: 'done',
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty(
      'error',
      'Only status field can be updated'
    );
  });
  it('should display update the task if everything provided correct', async () => {
    const res = await request(app).patch(`/api/tasks/update/${task._id}`).send({
      status: 'done',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Task Updated');
  });
});

describe('DELETE /api/tasks/delete/:id', () => {
  let user;
  let task;
  let task1;
  let project;
  let manager;
  beforeEach(async () => {
    user = await userModel.create({
      name: 'asim',
      email: 'asim@gmail.com',
      password: '1234',
      roles: 'user',
    });
  });
  beforeEach(async () => {
    manager = await userModel.create({
      name: 'asim',
      email: 'asim146@gmail.com',
      password: '123',
      roles: 'manager',
    });
  });
  beforeEach(async () => {
    project = await projectModel.create({
      title: 'weather app',
      description: 'complete weather app',
      createdby: manager._id,
      assignedUsers: user._id,
    });
  });
  beforeEach(async () => {
    task = await taskModel.create({
      title: 'frontend',
      description: 'complete frontend',
      status: 'todo',
      project: project._id,
      assignedTo: user._id,
    });
  });
  beforeEach(async () => {
    task1 = await taskModel.create({
      title: 'backend',
      description: 'complete backend',
      status: 'done',
      project: project._id,
      assignedTo: user._id,
    });
  });
  it('should display error if task not exits', async () => {
    const id = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/api/tasks/delete/${id}`);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Task not Exists');
  });
  it('should display error if task is not completed yet', async () => {
    const res = await request(app).delete(`/api/tasks/delete/${task._id}`);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty(
      'error',
      'Task is Not Completed Yet Please Finish the Task'
    );
  });
  it('should delete the project if project completed and task id is correct', async () => {
    const res = await request(app).delete(`/api/tasks/delete/${task1._id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Task Deleted');
  });
});

describe('UPLOADS /api/uploads/attachments/:id', () => {
  let user;
  let task;
  let project;
  let manager;
  beforeEach(async () => {
    user = await userModel.create({
      name: 'asim',
      email: 'asim@gmail.com',
      password: '1234',
      roles: 'user',
    });
  });
  beforeEach(async () => {
    manager = await userModel.create({
      name: 'asim',
      email: 'asim146@gmail.com',
      password: '123',
      roles: 'manager',
    });
  });
  beforeEach(async () => {
    project = await projectModel.create({
      title: 'weather app',
      description: 'complete weather app',
      createdby: manager._id,
      assignedUsers: user._id,
    });
  });
  beforeEach(async () => {
    task = await taskModel.create({
      title: 'frontend',
      description: 'complete frontend',
      status: 'todo',
      project: project._id,
      assignedTo: user._id,
    });
  });
  it('should display error if task not exits', async () => {
    const id = new mongoose.Types.ObjectId();
    const res = await request(app).patch(`/api/uploads/attachments/${id}`);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Task not Exists');
  });
  it('should uploads attachments if everything correct', async () => {
    const filePath = path.join(__dirname, 'test-avatar.png');
    fs.writeFileSync(filePath, 'image content');
    const res = await request(app)
      .patch(`/api/uploads/attachments/${task._id}`)
      .attach('attachments', filePath);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty(
      'message',
      'Attachments uploaded successfully'
    );
  });
});
