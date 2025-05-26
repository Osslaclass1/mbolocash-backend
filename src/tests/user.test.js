const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const twilio = require('twilio');

jest.setTimeout(30000);

jest.mock('twilio', () => {
  return jest.fn().mockReturnValue({
    messages: {
      create: jest.fn().mockResolvedValue({ sid: 'mock-sid' })
    }
  });
});

beforeAll(async () => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

afterAll(async () => {
  await mongoose.disconnect();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    const uniqueId = Date.now();
    const payload = {
      username: `testuser${uniqueId}`,
      phoneNumber: `+123456789${uniqueId % 10}`,
      name: 'Test User',
      email: `test${uniqueId}@example.com`,
      password: 'password123',
      bankAccount: '1234567890',
      verified: false
    };
    console.log('Sending payload:', payload);
    const res = await request(app)
      .post('/api/auth/register')
      .send(payload);
    console.log('Response status:', res.statusCode);
    console.log('Response body:', res.body);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'User registered, OTP sent');
    expect(twilio().messages.create).toHaveBeenCalled();
  });

  it('should return 400 if user already exists', async () => {
    const uniqueId = Date.now();
    await User.create({
      username: `testuser${uniqueId}`,
      phoneNumber: `+123456789${uniqueId % 10}`,
      name: 'Test User',
      email: `test${uniqueId}@example.com`,
      password: 'hashedpassword',
      bankAccount: '1234567890',
      verified: false
    });

    const payload = {
      username: `testuser${uniqueId}`,
      phoneNumber: `+123456789${uniqueId % 10}`,
      name: 'Test User',
      email: `test${uniqueId}@example.com`,
      password: 'password123',
      bankAccount: '1234567890',
      verified: false
    };
    console.log('Sending payload for duplicate:', payload);
    const res = await request(app)
      .post('/api/auth/register')
      .send(payload);
    console.log('Response status:', res.statusCode);
    console.log('Response body:', res.body);
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'User already exists');
  });

  it('should return 400 if username is missing', async () => {
    const payload = {
      phoneNumber: '+1234567890',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      bankAccount: '1234567890',
      verified: false
    };
    console.log('Sending payload without username:', payload);
    const res = await request(app)
      .post('/api/auth/register')
      .send(payload);
    console.log('Response status:', res.statusCode);
    console.log('Response body:', res.body);
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'username is required');
  });
});