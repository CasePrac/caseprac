import 'dotenv/config';
import { createDb } from './index';
import { users, categories, tags, challenges, challengeVersions, challengeTags } from './schema';
import type { TaskManifest } from '@caseprac/shared';

async function seed() {
  const db = createDb();
  console.log('🌱 Seeding database...');

  // Seed Admin User
  const [adminUser] = await db.insert(users).values({
    username: 'admin',
    name: 'CasePrac Admin',
    email: 'admin@caseprac.dev',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1001?v=4',
    role: 'admin',
  }).onConflictDoNothing().returning();

  // Seed Demo User
  const [demoUser] = await db.insert(users).values({
    username: 'demodev',
    name: 'Demo Developer',
    email: 'dev@example.com',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1002?v=4',
    role: 'user',
  }).onConflictDoNothing().returning();

  // Seed Categories
  const [fintechCategory] = await db.insert(categories).values({
    slug: 'fintech',
    name: 'Fintech & Banking',
    description: 'Financial products, money transfers, account overview and transactions history.',
  }).onConflictDoNothing().returning();

  const [ecommerceCategory] = await db.insert(categories).values({
    slug: 'ecommerce',
    name: 'E-Commerce & Retail',
    description: 'Product catalogs, checkout funnels, shopping carts and order tracking.',
  }).onConflictDoNothing().returning();

  // Seed Tags
  const [tagReact] = await db.insert(tags).values({ slug: 'react', name: 'React' }).onConflictDoNothing().returning();
  const [tagForms] = await db.insert(tags).values({ slug: 'forms', name: 'Form Validation' }).onConflictDoNothing().returning();
  const [tagApi] = await db.insert(tags).values({ slug: 'api-integration', name: 'API Integration' }).onConflictDoNothing().returning();

  if (!fintechCategory) {
    console.log('Category already exists, skipping seeded challenge creation.');
    process.exit(0);
  }

  // Task Manifest for Fintech Transfer Challenge
  const transferManifest: TaskManifest = {
    id: 'fintech-transfer-flow',
    version: '1.0.0',
    title: 'Bank Transfer Flow',
    difficulty: 'intermediate',
    category: 'fintech',
    summary: 'Build a multi-step bank transfer interface with account selection, recipient validation, and review step.',
    description: 'Implement a complete bank transfer experience according to design specs and API contracts.',
    submission: {
      startPath: '/transfer',
      requiredRoutes: ['/transfer', '/transfer/review', '/transfer/success'],
    },
    viewports: [
      { id: 'desktop', width: 1440, height: 900 },
      { id: 'mobile', width: 390, height: 844 },
    ],
    evaluation: {
      timeoutMs: 120000,
      visual: { enabled: true, maxDiffPixelRatio: 0.02, threshold: 0.2 },
      functional: { enabled: true },
      accessibility: { enabled: true, maxViolations: 0 },
    },
    scoring: {
      visualWeight: 50,
      functionalWeight: 40,
      accessibilityWeight: 10,
    },
  };

  const briefMarkdown = `# Bank Transfer Challenge

## Requirements

1. **Route \`/transfer\`**:
   - Render sender account selector (showing balance formatted in USD).
   - Render recipient field (account number / IBAN).
   - Render amount input with input validation (must be positive number, <= sender balance).
   - Render "Continue to Review" button disabled until form is valid.

2. **Route \`/transfer/review\`**:
   - Display summary of transaction details (From Account, Recipient, Amount, Transfer Fee $0.00).
   - Render "Confirm & Send" button.

3. **Route \`/transfer/success\`**:
   - Display transaction confirmation status with Reference ID and date timestamp.

## Acceptance Criteria
- Full keyboard accessibility.
- Mobile responsive layout.
- Proper error state when amount exceeds balance.
`;

  const apiSpecYaml = `openapi: 3.0.3
info:
  title: Bank Transfer Fixture API
  version: 1.0.0
paths:
  /api/accounts:
    get:
      summary: Get user accounts
      responses:
        '200':
          description: OK
  /api/transfers:
    post:
      summary: Execute transfer
      responses:
        '201':
          description: Created
`;

  // Create Challenge
  const [challenge] = await db.insert(challenges).values({
    slug: 'fintech-transfer-flow',
    title: 'Bank Transfer Flow',
    summary: 'Build a multi-step bank transfer interface with account selection, recipient validation, and review step.',
    description: 'Implement a complete bank transfer experience according to design specs, accessibility criteria, and API contracts.',
    categoryId: fintechCategory.id,
    difficulty: 'intermediate',
    isPublished: true,
  }).returning();

  // Create Challenge Version
  const [version] = await db.insert(challengeVersions).values({
    challengeId: challenge.id,
    version: '1.0.0',
    taskManifest: transferManifest,
    briefMarkdown,
    apiSpecYaml,
    isPublished: true,
  }).returning();

  // Update challenge activeVersionId
  await db.update(challenges).set({ activeVersionId: version.id }).where({ id: challenge.id });

  if (tagReact && tagForms && tagApi) {
    await db.insert(challengeTags).values([
      { challengeId: challenge.id, tagId: tagReact.id },
      { challengeId: challenge.id, tagId: tagForms.id },
      { challengeId: challenge.id, tagId: tagApi.id },
    ]);
  }

  console.log('✅ Seeding completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
