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
        username: 'demodev',
        name: 'Demo Developer',
        email: 'dev@example.com',
        role: 'user',
      }).returning();
      return { user: newUser };
    }

    return { user: demoUser };
  });
}
