import { z } from 'zod';

export const SubmissionStatusSchema = z.enum([
  'queued',
  'preparing',
  'running',
  'processing',
  'completed',
  'failed',
  'timed_out',
  'infrastructure_error',
]);
export type SubmissionStatus = z.infer<typeof SubmissionStatusSchema>;

export const CreateSubmissionInputSchema = z.object({
  deploymentUrl: z.string().url('Must be a valid HTTP or HTTPS URL'),
});
export type CreateSubmissionInput = z.infer<typeof CreateSubmissionInputSchema>;

export const SubmissionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  challengeId: z.string().uuid(),
  challengeVersionId: z.string().uuid(),
  deploymentUrl: z.string().url(),
  status: SubmissionStatusSchema,
  score: z.number().min(0).max(100).nullable(),
  passed: z.boolean().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Submission = z.infer<typeof SubmissionSchema>;
