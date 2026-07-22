import 'dotenv/config';
import * as path from 'path';
import * as fs from 'fs';
import { createDb } from './index';
import { users, categories, tags } from './schema';
import { importTaskKit } from './importer';

async function seed() {
  const db = createDb();
  console.log('🌱 Seeding database...');

  // Seed Admin User
  await db.insert(users).values({
    username: 'admin',
    name: 'CasePrac Admin',
    email: 'admin@caseprac.dev',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1001?v=4',
    role: 'admin',
  }).onConflictDoNothing();

  // Seed Demo User
  await db.insert(users).values({
    username: 'demodev',
    name: 'Demo Developer',
    email: 'dev@example.com',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1002?v=4',
    role: 'user',
  }).onConflictDoNothing();

  // Seed Default Categories
  await db.insert(categories).values([
    {
      slug: 'general',
      name: 'General & Core',
      description: 'General purpose frontend product challenges and standard component specifications.',
    },
    {
      slug: 'fintech',
      name: 'Fintech & Banking',
      description: 'Financial products, money transfers, account overview and transactions history.',
    },
  ]).onConflictDoNothing();

  // Seed Default Tags
  await db.insert(tags).values([
    { slug: 'react', name: 'React' },
    { slug: 'forms', name: 'Form Validation' },
    { slug: 'api-integration', name: 'API Integration' },
  ]).onConflictDoNothing();

  // Import generic task kit from task-kit workspace if available
  const taskKitPath = path.resolve(process.cwd(), '../caseprac-task-kit/tasks/generic-example-task');
  if (fs.existsSync(taskKitPath)) {
    console.log(`📦 Seeding task kit from: ${taskKitPath}...`);
    const result = await importTaskKit(db, { taskKitPath });
    console.log(`✅ Seeded task kit: ${result.challenge.title} (v${result.version.version})`);
  } else {
    console.log('ℹ️ Task kit directory not found at relative path, skipping auto-import.');
  }

  console.log('✅ Seeding completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
