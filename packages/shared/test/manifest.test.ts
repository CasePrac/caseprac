import test from 'node:test';
import assert from 'node:assert/strict';
import { TaskManifestSchema } from '../src/schemas/manifest.ts';

test('Task Manifest Schema - validates valid task manifest', () => {
  const valid = {
    id: 'fintech-transfer-flow',
    version: '1.0.0',
    title: 'Bank Transfer Flow',
    difficulty: 'intermediate',
    category: 'fintech',
    submission: {
      startPath: '/transfer',
      requiredRoutes: ['/transfer', '/transfer/review'],
    },
    viewports: [
      { id: 'desktop', width: 1440, height: 900 },
    ],
  };

  const parsed = TaskManifestSchema.parse(valid);
  assert.equal(parsed.id, 'fintech-transfer-flow');
  assert.equal(parsed.scoring.visualWeight, 50); // default applied
});

test('Task Manifest Schema - throws error on missing required routes', () => {
  const invalid = {
    id: 'invalid-manifest',
    version: '1.0.0',
    title: 'Invalid',
    difficulty: 'beginner',
    category: 'test',
    submission: {
      startPath: 'invalid-path-without-slash',
      requiredRoutes: [],
    },
    viewports: [],
  };

  assert.throws(() => {
    TaskManifestSchema.parse(invalid);
  });
});
