import 'dotenv/config';
import * as path from 'path';
import { createDb } from '../index';
import { importTaskKit } from '../importer';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: pnpm db:import-task <path-to-task-kit-folder>');
    process.exit(1);
  }

  const taskKitPath = path.resolve(process.cwd(), args[0]);
  console.log(`📦 Importing task kit from: ${taskKitPath}...`);

  const db = createDb();

  try {
    const result = await importTaskKit(db, { taskKitPath });
    console.log(`✅ Successfully imported task kit:`);
    console.log(`   Slug: ${result.challenge.slug}`);
    console.log(`   Title: ${result.challenge.title}`);
    console.log(`   Category: ${result.category.name}`);
    console.log(`   Version: ${result.version.version}`);
    process.exit(0);
  } catch (err: any) {
    console.error(`❌ Failed to import task kit:`, err.message || err);
    process.exit(1);
  }
}

main();
