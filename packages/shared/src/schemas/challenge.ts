import { z } from 'zod';
import { TaskDifficultySchema, TaskManifestSchema } from './manifest';

export const CategorySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
});
export type Category = z.infer<typeof CategorySchema>;

export const TagSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
});
export type Tag = z.infer<typeof TagSchema>;

export const ChallengeSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  description: z.string(),
  categoryId: z.string().uuid(),
  category: CategorySchema.optional(),
  tags: z.array(TagSchema).optional(),
  difficulty: TaskDifficultySchema,
  isPublished: z.boolean(),
  activeVersionId: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Challenge = z.infer<typeof ChallengeSchema>;

export const ChallengeVersionSchema = z.object({
  id: z.string().uuid(),
  challengeId: z.string().uuid(),
  version: z.string(),
  taskManifest: TaskManifestSchema,
  briefMarkdown: z.string(),
  apiSpecYaml: z.string().nullable(),
  isPublished: z.boolean(),
  createdAt: z.date(),
});
export type ChallengeVersion = z.infer<typeof ChallengeVersionSchema>;

export const CreateChallengeInputSchema = z.object({
  slug: z.string().min(2).max(100),
  title: z.string().min(2).max(200),
  summary: z.string().min(10),
  description: z.string().min(10),
  categoryId: z.string().uuid(),
  difficulty: TaskDifficultySchema,
  tags: z.array(z.string()).optional(),
  taskManifest: TaskManifestSchema,
  briefMarkdown: z.string(),
  apiSpecYaml: z.string().optional(),
});
export type CreateChallengeInput = z.infer<typeof CreateChallengeInputSchema>;
