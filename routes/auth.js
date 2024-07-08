const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { PrismaClient } = require('@prisma/client'); 
const auth = require('../middlewares/auth');

const prisma = new PrismaClient();

router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password, phone } = req.body;
    
    // Basic validation
    const errors = [];
    if (!email) {
      errors.push({ field: 'email', message: 'Email is required' });
    }
    if (!password) {
      errors.push({ field: 'password', message: 'Password is required' });
    }
    if (!firstName) {
      errors.push({ field: 'firstName', message: 'FirstName is required' });
    }
    if (!lastName) {
      errors.push({ field: 'lastName', message: 'LastName is required' });
    }
  
    if (errors.length > 0) {
      return res.status(422).json({ errors });
    }
  
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userWithEmail = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if(userWithEmail){
            console.log(userWithEmail);
            return res.status(422).json({ 
                errors: { field: 'email', message: 'User with Email Exists' }
            });
        }
        const newUser = await prisma.user.create({
            data: { firstName, lastName, email, password: hashedPassword, phone },
            select: { firstName: true, lastName: true, email: true, phone: true, userId: true }
        });
        const newOrg = await prisma.organisation.create({
            data: { name: `${firstName.charAt(0).toUpperCase() + firstName.slice(1)}'s Organisation`, userId: newUser.userId }
        });
        const newOrgUser = await prisma.organisationUser.create({
            data: { orgId: newOrg.orgId, userId: newUser.userId }
        });

        const token = jwt.sign({ userId: newUser.userId }, process.env.jwtPrivateKey, { expiresIn: '7d' });
        return res.header("x-auth-token", token).status(201).json({
            "status": "success",
            "message": "Registration successful",
            "data": {
                "accessToken": token,
                "user": newUser
            }
        });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(400).json({ 
            "status": "Bad request",
            "message": "Registration unsuccessful",
            "statusCode": 400 
        });
    }
  });

  router.post('/login', async(req, res) => {
    const { email, password } = req.body;
    
    // Basic validation
    const errors = [];
    if (!email) {
      errors.push({ field: 'email', message: 'Email is required' });
    }
    if (!password) {
      errors.push({ field: 'password', message: 'Password is required' });
    }
  
    if (errors.length > 0) {
      return res.status(422).json({ errors });
    }

    const user = await prisma.user.findUnique({
        where: {
            email: email
        }
    });

    if(!user){
        return res.status(401).json({ 
            "status": "Bad request",
            "message": "Authentication failed",
            "statusCode": 401
        });
    }
    let comparePassword = await bcrypt.compare(req.body.password, user.password);
    if(!comparePassword) {
        console.log('not the same');
        return res.status(401).json({ 
            "status": "Bad request",
            "message": "Authentication failed",
            "statusCode": 401
        });
    }
    // Remove the password field before sending the response
    const { password: userPassword, ...userWithoutPassword } = user;

    const token = jwt.sign({ userId: user.userId }, process.env.jwtPrivateKey, { expiresIn: '7d' });
    return header("x-auth-token", token).status(200).json({
            "status": "success",
            "message": "Login successful",
            "data": {
                "accessToken": token,
                "user": userWithoutPassword 
            }
    });
  });

  module.exports = router;