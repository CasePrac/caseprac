import 'dotenv/config';
import { Worker, type Job } from 'bullmq';
import { Redis } from 'ioredis';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createDb, eq, evaluationRuns, evaluationTestResults, evaluationArtifacts, submissions, challengeVersions } from '@caseprac/db';
import { evaluateSubmission } from '@caseprac/evaluator';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisConnection = new Redis(redisUrl, { maxRetriesPerRequest: null });

const s3Endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
const s3Region = process.env.S3_REGION || 'us-east-1';
const bucketName = process.env.S3_BUCKET || 'caseprac-artifacts';

const s3Client = new S3Client({
  endpoint: s3Endpoint,
  region: s3Region,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: true,
});

const db = createDb();

async function processJob(job: Job) {
  const { submissionId, evaluationRunId, deploymentUrl, challengeVersionId } = job.data;
  console.log(`⚡ [Runner] Starting evaluation job for submission ${submissionId} (Run: ${evaluationRunId})`);

  const startTime = new Date();

  // Update status -> running
  await db.update(evaluationRuns).set({
    status: 'running',
    startedAt: startTime,
  }).where(eq(evaluationRuns.id, evaluationRunId));

  await db.update(submissions).set({
    status: 'running',
  }).where(eq(submissions.id, submissionId));

  try {
    // 1. Fetch challenge version & task manifest
    const version = await db.query.challengeVersions.findFirst({
      where: eq(challengeVersions.id, challengeVersionId),
    });

    if (!version) {
      throw new Error(`Challenge version '${challengeVersionId}' not found`);
    }

    const manifest = version.taskManifest;

    // 2. Execute evaluation runner
    const result = await evaluateSubmission(deploymentUrl, manifest);

    // 3. Upload artifacts to MinIO / S3
    for (const art of result.artifacts) {
      const storageKey = `evaluations/${evaluationRunId}/${art.viewport || 'default'}-${art.artifactType}-${Date.now()}.png`;

      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: storageKey,
        Body: art.buffer,
        ContentType: art.mimeType,
      }));

      await db.insert(evaluationArtifacts).values({
        evaluationRunId,
        artifactType: art.artifactType,
        viewport: art.viewport,
        storageKey,
        mimeType: art.mimeType,
        fileSizeBytes: art.buffer.length,
      });
    }

    // 4. Save test results to database
    for (const tr of result.testResults) {
      await db.insert(evaluationTestResults).values({
        evaluationRunId,
        category: tr.category,
        testName: tr.testName,
        passed: tr.passed,
        score: tr.score,
        message: tr.message || null,
        detailsJson: tr.detailsJson || null,
        durationMs: tr.durationMs,
      });
    }

    const completedTime = new Date();

    // 5. Update Evaluation Run status
    await db.update(evaluationRuns).set({
      status: result.status,
      functionalScore: result.functionalScore,
      visualScore: result.visualScore,
      accessibilityScore: result.accessibilityScore,
      totalScore: result.totalScore,
      passed: result.passed,
      errorMessage: result.errorMessage || null,
      completedAt: completedTime,
      updatedAt: completedTime,
    }).where(eq(evaluationRuns.id, evaluationRunId));

    // 6. Update Submission status
    await db.update(submissions).set({
      status: result.status,
      score: result.totalScore,
      passed: result.passed,
      updatedAt: completedTime,
    }).where(eq(submissions.id, submissionId));

    console.log(`✅ [Runner] Completed evaluation job for submission ${submissionId} (Score: ${result.totalScore}, Passed: ${result.passed})`);
  } catch (err: any) {
    console.error(`❌ [Runner] Failed evaluation job ${evaluationRunId}:`, err);
    const failTime = new Date();

    await db.update(evaluationRuns).set({
      status: 'infrastructure_error',
      errorMessage: err.message || 'Worker processing error',
      completedAt: failTime,
      updatedAt: failTime,
    }).where(eq(evaluationRuns.id, evaluationRunId));

    await db.update(submissions).set({
      status: 'infrastructure_error',
      updatedAt: failTime,
    }).where(eq(submissions.id, submissionId));

    throw err;
  }
}

const concurrency = Number(process.env.RUNNER_CONCURRENCY || 2);

const worker = new Worker('evaluation-jobs', processJob, {
  connection: redisConnection,
  concurrency,
});

worker.on('ready', () => {
  console.log(`🚀 [Runner] Worker listening on queue 'evaluation-jobs' (concurrency: ${concurrency})`);
});

worker.on('failed', (job, err) => {
  console.error(`💥 [Runner] Job ${job?.id} failed with error:`, err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  process.exit(0);
});
