import type { FastifyInstance } from 'fastify';
import { createDb, eq, users } from '@caseprac/db';
import { NotFoundError } from '@caseprac/shared';

export async function authRoutes(fastify: FastifyInstance) {
  const db = createDb();

  fastify.get('/me', async (request) => {
    // Return demo user or authenticated user
    const demoUser = await db.query.users.findFirst({
      where: eq(users.username, 'demodev'),
    });

    if (!demoUser) {
      const [newUser] = await db.insert(users).values({
        githubId: '1002',
        username: 'demodev',
        name: 'Demo Developer',
        email: 'dev@example.com',
        role: 'user',
      }).returning();
      return { user: newUser };
    }

    return { user: demoUser };
  });

  // Mock GitHub Auth endpoint for quick testing / dev
  fastify.get('/auth/github/mock', async (request, reply) => {
    let demoUser = await db.query.users.findFirst({
      where: eq(users.username, 'demodev'),
    });

    if (!demoUser) {
      const [newUser] = await db.insert(users).values({
        githubId: '1002',
        username: 'demodev',
        name: 'Demo Developer',
        email: 'dev@example.com',
        role: 'user',
      }).returning();
      demoUser = newUser;
    }

    const token = fastify.jwt.sign({ userId: demoUser.id, role: demoUser.role });
    return { token, user: demoUser };
  });
}
