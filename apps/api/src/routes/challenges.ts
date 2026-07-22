import type { FastifyInstance } from 'fastify';
import { createDb, eq, challenges, categories, tags, challengeVersions, importTaskKit } from '@caseprac/db';
import { NotFoundError } from '@caseprac/shared';

export async function challengeRoutes(fastify: FastifyInstance) {
  const db = createDb();

  fastify.get('/challenges', async (request) => {
    const list = await db.query.challenges.findMany({
      where: eq(challenges.isPublished, true),
      with: {
        category: true,
      },
    });
    return { challenges: list };
  });

  fastify.get('/challenges/:slug', async (request) => {
    const { slug } = request.params as { slug: string };
    
    const item = await db.query.challenges.findFirst({
      where: eq(challenges.slug, slug),
      with: {
        category: true,
      },
    });

    if (!item) {
      throw new NotFoundError('Challenge', slug);
    }

    let activeVersion = null;
    if (item.activeVersionId) {
      activeVersion = await db.query.challengeVersions.findFirst({
        where: eq(challengeVersions.id, item.activeVersionId),
      });
    }

    return {
      challenge: item,
      activeVersion,
    };
  });

  fastify.get('/categories', async () => {
    const list = await db.select().from(categories);
    return { categories: list };
  });

  fastify.get('/tags', async () => {
    const list = await db.select().from(tags);
    return { tags: list };
  });

  fastify.post('/challenges/import', async (request, reply) => {
    const { localPath, repositoryUrl, taskSlug } = (request.body || {}) as {
      localPath?: string;
      repositoryUrl?: string;
      taskSlug?: string;
    };

    if (!localPath && !repositoryUrl) {
      return reply.status(400).send({ error: 'Either localPath or repositoryUrl must be provided' });
    }

    if (localPath) {
      const result = await importTaskKit(db, { taskKitPath: localPath });
      return {
        success: true,
        source: 'local',
        challenge: result.challenge,
        version: result.version,
      };
    }

    return reply.status(501).send({
      error: 'Remote tasks repository import is scheduled for future release',
      repositoryUrl,
      taskSlug,
    });
  });
}
