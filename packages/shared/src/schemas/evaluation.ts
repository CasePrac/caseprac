import { z } from 'zod';
import { SubmissionStatusSchema } from './submission';

export const TestCategorySchema = z.enum(['functional', 'visual', 'accessibility']);
export type TestCategory = z.infer<typeof TestCategorySchema>;

export const EvaluationTestResultSchema = z.object({
  id: z.string().uuid(),
  evaluationRunId: z.string().uuid(),
  category: TestCategorySchema,
  testName: z.string(),
  passed: z.boolean(),
  score: z.number().min(0).max(100),
  message: z.string().nullable(),
  detailsJson: z.record(z.any()).nullable(),
  durationMs: z.number().int().nonnegative(),
  createdAt: z.date(),
});
export type EvaluationTestResult = z.infer<typeof EvaluationTestResultSchema>;

export const ArtifactTypeSchema = z.enum(['screenshot_actual', 'screenshot_diff', 'screenshot_reference', 'trace', 'log']);
export type ArtifactType = z.infer<typeof ArtifactTypeSchema>;

export const EvaluationArtifactSchema = z.object({
  id: z.string().uuid(),
  evaluationRunId: z.string().uuid(),
  artifactType: ArtifactTypeSchema,
  viewport: z.string().nullable(),
  storageKey: z.string(),
  mimeType: z.string(),
  fileSizeBytes: z.number().int().nonnegative(),
  createdAt: z.date(),
});
export type EvaluationArtifact = z.infer<typeof EvaluationArtifactSchema>;

export const EvaluationRunSchema = z.object({
  id: z.string().uuid(),
  submissionId: z.string().uuid(),
  status: SubmissionStatusSchema,
  runnerVersion: z.string(),
  functionalScore: z.number().min(0).max(100).nullable(),
  visualScore: z.number().min(0).max(100).nullable(),
  accessibilityScore: z.number().min(0).max(100).nullable(),
  totalScore: z.number().min(0).max(100).nullable(),
  passed: z.boolean().nullable(),
  errorMessage: z.string().nullable(),
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  testResults: z.array(EvaluationTestResultSchema).optional(),
  artifacts: z.array(EvaluationArtifactSchema).optional(),
});
export type EvaluationRun = z.infer<typeof EvaluationRunSchema>;
