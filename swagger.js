const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Project Management Platform API',
      version: '1.0.0',
      description: 'API documentation for Project Management Platform',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
      {
        url: 'https://project-management-platform-production.up.railway.app',
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
function swaggerDocs(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`Swagger Docs available at http://localhost:3000/api-docs`);
  console.log(
    ` Swagger Docs available at https://project-management-platform-production.up.railway.app/api-docs`
  );
}

module.exports = swaggerDocs;
