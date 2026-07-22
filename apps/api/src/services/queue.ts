import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export const redisConnection = new Redis(redisUrl, { maxRetriesPerRequest: null });

export interface EvaluationJobData {
  submissionId: string;
  evaluationRunId: string;
  deploymentUrl: string;
  challengeVersionId: string;
}

export const EVALUATION_QUEUE_NAME = 'evaluation-jobs';

export const evaluationQueue = new Queue<EvaluationJobData>(EVALUATION_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});
