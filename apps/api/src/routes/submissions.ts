import type { FastifyInstance } from 'fastify';
import { createDb, eq, desc, submissions, evaluationRuns, evaluationTestResults, evaluationArtifacts, challenges, challengeVersions, users } from '@caseprac/db';
import { CreateSubmissionInputSchema, NotFoundError, ValidationError } from '@caseprac/shared';
import { validateSubmissionUrl } from '@caseprac/evaluator';
import { evaluationQueue } from '../services/queue.js';
import { getArtifactPresignedUrl } from '../services/storage.js';

export async function submissionRoutes(fastify: FastifyInstance) {
  const db = createDb();

  // Create submission
  fastify.post('/challenges/:challengeId/submissions', async (request, reply) => {
    const { challengeId } = request.params as { challengeId: string };
    const parseResult = CreateSubmissionInputSchema.safeParse(request.body);

    if (!parseResult.success) {
      throw new ValidationError('Invalid submission payload', parseResult.error.flatten().fieldErrors);
    }

    const { deploymentUrl } = parseResult.data;

    // Validate SSRF
    await validateSubmissionUrl(deploymentUrl);

    // Fetch challenge & active version
    const challenge = await db.query.challenges.findFirst({
      where: eq(challenges.id, challengeId),
    });

    if (!challenge || !challenge.activeVersionId) {
      throw new NotFoundError('Challenge or active version not found', challengeId);
    }

    // Default mock demo user if no auth header
    let userId: string;
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded: any = fastify.jwt.verify(authHeader.substring(7));
      userId = decoded.userId;
    } else {
      // Find or create default demo user
      const demoUser = await db.query.users.findFirst({ where: eq(users.username, 'demodev') });
      if (demoUser) {
        userId = demoUser.id;
      } else {
        const [newUser] = await db.insert(users).values({
          githubId: '1002',
          username: 'demodev',
          name: 'Demo Developer',
          email: 'dev@example.com',
          role: 'user',
        }).returning();
        userId = newUser.id;
      }
    }

    // Create Submission record
    const [sub] = await db.insert(submissions).values({
      userId,
      challengeId: challenge.id,
      challengeVersionId: challenge.activeVersionId,
      deploymentUrl,
      status: 'queued',
    }).returning();

    // Create Evaluation Run record
    const [evalRun] = await db.insert(evaluationRuns).values({
      submissionId: sub.id,
      status: 'queued',
      runnerVersion: '1.0.0',
    }).returning();

    // Enqueue BullMQ job
    await evaluationQueue.add('evaluate', {
      submissionId: sub.id,
      evaluationRunId: evalRun.id,
      deploymentUrl,
      challengeVersionId: challenge.activeVersionId,
    });

    return reply.status(201).send({
      submission: sub,
      evaluationRun: evalRun,
    });
  });

  // Get submission
  fastify.get('/submissions/:submissionId', async (request) => {
    const { submissionId } = request.params as { submissionId: string };

    const sub = await db.query.submissions.findFirst({
      where: eq(submissions.id, submissionId),
    });

    if (!sub) {
      throw new NotFoundError('Submission', submissionId);
    }

    const latestRun = await db.query.evaluationRuns.findFirst({
      where: eq(evaluationRuns.submissionId, sub.id),
      orderBy: [desc(evaluationRuns.createdAt)],
    });

    return {
      submission: sub,
      evaluationRun: latestRun,
    };
  });

  // Get submission report
  fastify.get('/submissions/:submissionId/report', async (request) => {
    const { submissionId } = request.params as { submissionId: string };

    const sub = await db.query.submissions.findFirst({
      where: eq(submissions.id, submissionId),
    });

    if (!sub) {
      throw new NotFoundError('Submission', submissionId);
    }

    const challenge = await db.query.challenges.findFirst({
      where: eq(challenges.id, sub.challengeId),
    });

    const evalRun = await db.query.evaluationRuns.findFirst({
      where: eq(evaluationRuns.submissionId, sub.id),
      orderBy: [desc(evaluationRuns.createdAt)],
    });

    if (!evalRun) {
      throw new NotFoundError('Evaluation run for submission', submissionId);
    }

    const results = await db.query.evaluationTestResults.findMany({
      where: eq(evaluationTestResults.evaluationRunId, evalRun.id),
    });

    const rawArtifacts = await db.query.evaluationArtifacts.findMany({
      where: eq(evaluationArtifacts.evaluationRunId, evalRun.id),
    });

    // Generate presigned URLs for artifacts
    const artifactsWithUrls = await Promise.all(
      rawArtifacts.map(async (art) => {
        let presignedUrl = art.storageKey;
        try {
          presignedUrl = await getArtifactPresignedUrl(art.storageKey);
        } catch {
          // fallback
        }
        return {
          ...art,
          url: presignedUrl,
        };
      })
    );

    return {
      submission: sub,
      challenge,
      evaluationRun: evalRun,
      testResults: results,
      artifacts: artifactsWithUrls,
    };
  });

  // Get user submissions
  fastify.get('/me/submissions', async () => {
    const list = await db.query.submissions.findMany({
      orderBy: [desc(submissions.createdAt)],
      limit: 20,
    });
    return { submissions: list };
  });
}
