const express = require('express');
const { PrismaClient } = require('@prisma/client'); 

const prisma = new PrismaClient();
const app = express();
const auth = require('../routes/auth');
const users = require('../routes/users');
const organisations = require('../routes/organisations');

app.use(express.json());
app.use('/auth', auth);
app.use('/api/users', users);
app.use('/api/organisations', organisations);


const server = app.listen(3000, () => console.log('Server listening on port 3000'));
module.exports = { app, server, prisma };