import { z } from 'zod';

export const TaskDifficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);
export type TaskDifficulty = z.infer<typeof TaskDifficultySchema>;

export const ViewportSpecSchema = z.object({
  id: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});
export type ViewportSpec = z.infer<typeof ViewportSpecSchema>;

export const TaskSubmissionSpecSchema = z.object({
  startPath: z.string().startsWith('/'),
  requiredRoutes: z.array(z.string().startsWith('/')),
});
export type TaskSubmissionSpec = z.infer<typeof TaskSubmissionSpecSchema>;

export const VisualEvalSpecSchema = z.object({
  enabled: z.boolean().default(true),
  maxDiffPixelRatio: z.number().min(0).max(1).default(0.02),
  threshold: z.number().min(0).max(1).default(0.2),
});

export const FunctionalEvalSpecSchema = z.object({
  enabled: z.boolean().default(true),
});

export const AccessibilityEvalSpecSchema = z.object({
  enabled: z.boolean().default(true),
  maxViolations: z.number().int().nonnegative().default(0),
});

export const EvaluationSpecSchema = z.object({
  timeoutMs: z.number().int().positive().default(120000),
  visual: VisualEvalSpecSchema.default({}),
  functional: FunctionalEvalSpecSchema.default({}),
  accessibility: AccessibilityEvalSpecSchema.default({}),
});

export const ScoringRubricSchema = z.object({
  visualWeight: z.number().min(0).max(100).default(50),
  functionalWeight: z.number().min(0).max(100).default(40),
  accessibilityWeight: z.number().min(0).max(100).default(10),
});

export const TaskManifestSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  title: z.string().min(1),
  difficulty: TaskDifficultySchema,
  category: z.string().min(1),
  summary: z.string().optional(),
  description: z.string().optional(),
  submission: TaskSubmissionSpecSchema,
  viewports: z.array(ViewportSpecSchema).min(1),
  evaluation: EvaluationSpecSchema.default({}),
  scoring: ScoringRubricSchema.default({}),
});

export type TaskManifest = z.infer<typeof TaskManifestSchema>;
