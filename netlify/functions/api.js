const express = require('express');
const serverless = require('serverless-http');
const app = express();

const userRoutes = require('../../backend/user');
const problemRoutes = require('../../backend/problem');
// ... import routes อื่นๆ

app.use(express.json());
app.use('/api/user', userRoutes);
app.use('/api/problems', problemRoutes);

module.exports.handler = serverless(app);
