import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import type { TaskManifest } from '@caseprac/shared';

// Users
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: text('username').notNull().unique(),
  name: text('name'),
  email: text('email'),
  avatarUrl: text('avatar_url'),
  role: text('role', { enum: ['user', 'admin'] }).default('user').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Sessions
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Categories
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Tags
export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Challenges
export const challenges = pgTable('challenges', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  description: text('description').notNull(),
  categoryId: uuid('category_id').notNull().references(() => categories.id),
  difficulty: text('difficulty', { enum: ['beginner', 'intermediate', 'advanced'] }).notNull(),
  isPublished: boolean('is_published').default(false).notNull(),
  activeVersionId: uuid('active_version_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Challenge Versions
export const challengeVersions = pgTable('challenge_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  version: text('version').notNull(),
  taskManifest: jsonb('task_manifest').$type<TaskManifest>().notNull(),
  briefMarkdown: text('brief_markdown').notNull(),
  apiSpecYaml: text('api_spec_yaml'),
  baselineAssets: jsonb('baseline_assets'),
  isPublished: boolean('is_published').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_challenge_versions_challenge').on(table.challengeId),
]);

// Challenge Tags join table
export const challengeTags = pgTable('challenge_tags', {
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.challengeId, table.tagId] }),
]);

// Submissions
export const submissions = pgTable('submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id),
  challengeVersionId: uuid('challenge_version_id').notNull().references(() => challengeVersions.id),
  deploymentUrl: text('deployment_url').notNull(),
  status: text('status', {
    enum: ['queued', 'preparing', 'running', 'processing', 'completed', 'failed', 'timed_out', 'infrastructure_error'],
  }).default('queued').notNull(),
  score: integer('score'),
  passed: boolean('passed'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_submissions_user').on(table.userId),
  index('idx_submissions_challenge').on(table.challengeId),
]);

// Evaluation Runs
export const evaluationRuns = pgTable('evaluation_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  submissionId: uuid('submission_id').notNull().references(() => submissions.id, { onDelete: 'cascade' }),
  status: text('status', {
    enum: ['queued', 'preparing', 'running', 'processing', 'completed', 'failed', 'timed_out', 'infrastructure_error'],
  }).default('queued').notNull(),
  runnerVersion: text('runner_version').default('1.0.0').notNull(),
  functionalScore: integer('functional_score'),
  visualScore: integer('visual_score'),
  accessibilityScore: integer('accessibility_score'),
  totalScore: integer('total_score'),
  passed: boolean('passed'),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_eval_runs_submission').on(table.submissionId),
]);

// Evaluation Test Results
export const evaluationTestResults = pgTable('evaluation_test_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  evaluationRunId: uuid('evaluation_run_id').notNull().references(() => evaluationRuns.id, { onDelete: 'cascade' }),
  category: text('category', { enum: ['functional', 'visual', 'accessibility'] }).notNull(),
  testName: text('test_name').notNull(),
  passed: boolean('passed').notNull(),
  score: integer('score').notNull(),
  message: text('message'),
  detailsJson: jsonb('details_json'),
  durationMs: integer('duration_ms').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_test_results_run').on(table.evaluationRunId),
]);

// Evaluation Artifacts
export const evaluationArtifacts = pgTable('evaluation_artifacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  evaluationRunId: uuid('evaluation_run_id').notNull().references(() => evaluationRuns.id, { onDelete: 'cascade' }),
  artifactType: text('artifact_type', {
    enum: ['screenshot_actual', 'screenshot_diff', 'screenshot_reference', 'trace', 'log'],
  }).notNull(),
  viewport: text('viewport'),
  storageKey: text('storage_key').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSizeBytes: integer('file_size_bytes').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_artifacts_run').on(table.evaluationRunId),
]);

// Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  payload: jsonb('payload'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
