const express = require('express');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const auth = require('../routes/auth');
const users = require('../routes/users');
const organisations = require('../routes/organisations');

dotenv.config();

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use('/auth', auth);
app.use('/api/users', users);
app.use('/api/organisations', organisations);

// 404 Middleware
app.use((req, res, next) => {
    console.log({
        message: 'Route not found',
        statusCode: 404,
        "404 Not Found": req.method + req.originalUrl
    });
    return res.status(404).json({ message: 'Route not found' });
  });
// Export the app for Vercel
module.exports = app;

// Conditionally start the server if the file is executed directly (not via an import)
if (require.main === module) {
    const server = app.listen(3000, () => console.log('Server listening on port 3000'));
    module.exports.server = server;
}
