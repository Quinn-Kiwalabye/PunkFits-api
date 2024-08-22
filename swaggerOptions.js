const swaggerJsdoc = require('swagger-jsdoc');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'PunkFits API',
    version: '1.0.0',
    description: 'API documentation for PunkFits',
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Development server',
    },
  ],
};

// Options for the swagger-jsdoc
const options = {
  swaggerDefinition,
  apis: ['./app.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
