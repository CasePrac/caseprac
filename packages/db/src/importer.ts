import * as fs from 'fs';
import * as path from 'path';
import { eq } from 'drizzle-orm';
import { categories, challenges, challengeVersions } from './schema';
import type { TaskManifest } from '@caseprac/shared';

export interface ImportTaskKitOptions {
  taskKitPath: string;
  isPublished?: boolean;
}

export async function importTaskKit(db: any, options: ImportTaskKitOptions) {
  const { taskKitPath, isPublished = true } = options;
  const resolvedPath = path.resolve(taskKitPath);

  const manifestPath = path.join(resolvedPath, 'task.json');
  const briefPath = path.join(resolvedPath, 'brief.md');
  const openapiPath = path.join(resolvedPath, 'openapi.yaml');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Task manifest missing at: ${manifestPath}`);
  }
  if (!fs.existsSync(briefPath)) {
    throw new Error(`Brief markdown missing at: ${briefPath}`);
  }

  const manifest: TaskManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const briefMarkdown = fs.readFileSync(briefPath, 'utf-8');
  const apiSpecYaml = fs.existsSync(openapiPath) ? fs.readFileSync(openapiPath, 'utf-8') : undefined;

  // Load baselines if present
  let baselineAssets: Record<string, any> | undefined = undefined;
  const baselinesDir = path.join(resolvedPath, 'baselines');
  if (fs.existsSync(baselinesDir)) {
    baselineAssets = {};
    const files = fs.readdirSync(baselinesDir);
    for (const file of files) {
      const filePath = path.join(baselinesDir, file);
      if (file.endsWith('.json')) {
        try {
          baselineAssets[file] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch {
          baselineAssets[file] = fs.readFileSync(filePath, 'utf-8');
        }
      } else {
        baselineAssets[file] = {
          fileName: file,
          sizeBytes: fs.statSync(filePath).size,
        };
      }
    }
  }

  // Ensure Category exists
  const categorySlug = manifest.category || 'general';
  let [category] = await db.select().from(categories).where(eq(categories.slug, categorySlug));
  if (!category) {
    [category] = await db.insert(categories).values({
      slug: categorySlug,
      name: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1),
      description: `Category for ${categorySlug} challenges`,
    }).returning();
  }

  // Find existing challenge or create
  let [challenge] = await db.select().from(challenges).where(eq(challenges.slug, manifest.id));

  if (!challenge) {
    [challenge] = await db.insert(challenges).values({
      slug: manifest.id,
      title: manifest.title,
      summary: manifest.summary || `Challenge ${manifest.title}`,
      description: manifest.description || briefMarkdown.slice(0, 200),
      categoryId: category.id,
      difficulty: manifest.difficulty || 'intermediate',
      isPublished,
    }).returning();
  } else {
    [challenge] = await db.update(challenges).set({
      title: manifest.title,
      summary: manifest.summary || challenge.summary,
      description: manifest.description || challenge.description,
      difficulty: manifest.difficulty || challenge.difficulty,
      isPublished,
      updatedAt: new Date(),
    }).where(eq(challenges.id, challenge.id)).returning();
  }

  // Create Challenge Version
  const [version] = await db.insert(challengeVersions).values({
    challengeId: challenge.id,
    version: manifest.version || '1.0.0',
    taskManifest: manifest,
    briefMarkdown,
    apiSpecYaml,
    baselineAssets,
    isPublished,
  }).returning();

  // Update active version
  await db.update(challenges).set({ activeVersionId: version.id }).where(eq(challenges.id, challenge.id));

  return {
    challenge,
    version,
    category,
  };
}
