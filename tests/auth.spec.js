const request = require('supertest');
const bcrypt = require('bcryptjs');
const { app, server } = require('../api/index');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const { v4: uuidv4 } = require('uuid');
describe('Auth Endpoints', () => {
  afterAll(async () => {
    await prisma.$disconnect();
    server.close();
  });

  describe('POST /auth/register', () => {
    it('should register user successfully with default organisation', async () => {
        const uniqueEmail = `john.doe.${uuidv4()}@example.com`; // Generate a unique email

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("password123", salt);
        const response = await request(app)
          .post('/auth/register')
          .send({
            firstName: 'John',
            lastName: 'Doe',
            email: uniqueEmail,
            password: hashedPassword,
            phone: '1234567890',
          });
  
        expect(response.status).toBe(201);
        expect(response.body.status).toBe('success');
        expect(response.body.data.user).toHaveProperty('userId');
        expect(response.body.data.user.firstName).toBe('John');
        expect(response.body.data.user.lastName).toBe('Doe');
        expect(response.body.data).toHaveProperty('accessToken');
        expect(response.body.data.user.email).toBe(uniqueEmail);
        expect(response.body.data.user).not.toHaveProperty('password');
  
        // Verify the default organisation name
        const orgName = `${response.body.data.user.firstName}'s Organisation`;
        const organisations = await prisma.organisation.findMany({
          where: {
            name: orgName,
          },
        });
  
        expect(organisations.length).toBe(1);
        expect(organisations[0].name).toBe(orgName);
    });

    it('should fail if required fields are missing', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          phone: '1234567890'
        });

      expect(response.status).toBe(422);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'firstName' }),
          expect.objectContaining({ field: 'lastName' }),
          expect.objectContaining({ field: 'email' }),
          expect.objectContaining({ field: 'password' })
        ])
      );
    });

    it('should fail if there is a duplicate email or UserId', async () => {
        const uniqueEmail = `duplicate.${uuidv4()}@example.com`; // Generate a unique email

        // Create a user first
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("password123", salt);
        await prisma.user.create({
          data: {
            userId: uuidv4(),
            firstName: 'John',
            lastName: 'Doe',
            email: uniqueEmail,
            password: hashedPassword,
            phone: '1234567890',
          },
        });
  
        const response = await request(app)
          .post('/auth/register')
          .send({
            firstName: 'Jane',
            lastName: 'Doe',
            email: uniqueEmail, // Use the same email to trigger duplicate constraint
            password: hashedPassword,
            phone: '1234567890',
          });
  
        expect(response.status).toBe(422);
        expect(response.body.errors).toEqual(
            expect.objectContaining({
              field: 'email',
              message: 'User with Email Exists',
            })
          );
      });
  });

  describe('POST /auth/login', () => {
    it('should log the user in successfully', async () => {
        const uniqueEmail = `john.doe.${uuidv4()}@example.com`; // Generate a unique email

      // Create a user first
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("password123", salt);
      await prisma.user.create({
        data: {
          userId: uuidv4(),
          firstName: 'John',
          lastName: 'Doe',
          email: uniqueEmail,
          password: hashedPassword,
          phone: '1234567890',
        },
      });
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: uniqueEmail,
          password: 'password123', // Use the original password
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('accessToken'); // Check for access token
      expect(response.body.data.user).toHaveProperty('userId');
      expect(response.body.data.user.firstName).toBe('John');
      expect(response.body.data.user.email).toBe(uniqueEmail);
    });

  });
});
