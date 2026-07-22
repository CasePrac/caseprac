import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { AppError } from '@caseprac/shared';
import { healthRoutes } from './routes/health.js';
import { challengeRoutes } from './routes/challenges.js';
import { submissionRoutes } from './routes/submissions.js';
import { authRoutes } from './routes/auth.js';

const server = Fastify({
  logger: true,
});

const port = Number(process.env.PORT || 3001);

async function start() {
  await server.register(cors, {
    origin: true,
    credentials: true,
  });

  await server.register(cookie);

  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'super-secret-jwt-key-caseprac-dev',
  });

  await server.register(swagger, {
    openapi: {
      info: {
        title: 'CasePrac API',
        description: 'CasePrac Core Platform REST API',
        version: '1.0.0',
      },
    },
  });

  await server.register(swaggerUi, {
    routePrefix: '/docs',
  });

  // Global Error Handler (RFC 9457)
  server.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.status).send(error.toProblemDetails(request.url));
    }

    server.log.error(error);
    const errMessage = (error as any)?.message || 'An unexpected error occurred';
    return reply.status(500).send({
      type: 'https://caseprac.dev/errors/internal',
      title: 'Internal Server Error',
      status: 500,
      detail: errMessage,
      instance: request.url,
    });
  });

  // Register API routes under /api/v1
  await server.register(healthRoutes);
  await server.register(authRoutes, { prefix: '/api/v1' });
  await server.register(challengeRoutes, { prefix: '/api/v1' });
  await server.register(submissionRoutes, { prefix: '/api/v1' });

  try {
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 CasePrac API server running at http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
