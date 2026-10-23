import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Uni A sees its overview and identity-safe demand', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('.auth-brand img.brand-wordmark')).toBeVisible();
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/aptohire-mark.png');
  await page.getByRole('button', { name: 'Aravalli Institute · Approved' }).click();
  await expect(page.getByRole('heading', { name: 'Aravalli Institute of Technology' })).toBeVisible();
  await expect(page.locator('.brand-wordmark')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Activation funnel' })).toBeVisible();
  await expect(page.getByText('Data visualization', { exact: false }).first()).toBeVisible();
  await page.getByRole('link', { name: 'Skills demand' }).click();
  await page.getByRole('tab', { name: 'Unmatched demand' }).click();
  await expect(page.getByText('Student identities are never shown here.')).toBeVisible();
  for (const privateName of ['Aarav Sharma', 'Aman Verma', 'Akshit Jain', 'Aarti Soni', 'Avi Rao']) await expect(page.locator('main')).not.toContainText(privateName);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')).toEqual([]);
});

test('pending University C can approve its demo access', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Cedarfield University · Pending' }).click();
  await expect(page.getByText('Your application is under review.')).toBeVisible();
  await expect(page.getByText('Sample data', { exact: false }).first()).toBeVisible();
  await page.getByRole('link', { name: 'Account & security' }).click();
  await page.getByRole('button', { name: 'Simulate admin approval' }).click();
  await expect(page.getByText('Your university is approved.')).toBeVisible();
});

test('roster import checks invalid rows and can finish a clean import', async ({ page }) => {
  const { resolve } = await import('node:path');
  await page.goto('/login');
  await page.getByRole('button', { name: 'Aravalli Institute · Approved' }).click();
  await expect(page.getByRole('heading', { name: 'Aravalli Institute of Technology' })).toBeVisible();
  await page.goto('/roster/import');
  await page.locator('input[type="file"]').setInputFiles(resolve(process.cwd(), 'public/samples/roster-sample.csv'));
  await expect(page.getByRole('heading', { name: 'Map columns' })).toBeVisible();
  await page.getByRole('button', { name: 'Check roster' }).click();
  await expect(page.getByRole('heading', { name: 'Review the check' })).toBeVisible();
  await expect(page.getByText('Rows with issues')).toBeVisible();
  await page.getByRole('button', { name: 'Back to mapping' }).click();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.locator('input[type="file"]').setInputFiles(resolve(process.cwd(), 'public/samples/roster-sample-clean.csv'));
  await page.getByRole('button', { name: 'Check roster' }).click();
  await page.getByRole('button', { name: 'Import valid rows' }).click();
  await expect(page.getByRole('heading', { name: 'Roster imported.' })).toBeVisible();
  await expect(page.getByText('students added')).toBeVisible();
});

test('layout does not overflow at required breakpoints', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Aravalli Institute · Approved' }).click();
  for (const width of [360, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(width);
    if (width === 360) { await page.getByRole('button', { name: 'More' }).click(); await expect(page.getByRole('link', { name: 'Skills demand' })).toBeVisible(); await page.getByRole('button', { name: 'More' }).click(); }
    if (width === 768) { await page.getByRole('button', { name: 'Open navigation' }).click(); await expect(page.getByRole('complementary', { name: 'Main navigation' })).toBeVisible(); await page.getByRole('button', { name: 'Close navigation' }).click(); }
  }
});


test('wrong roles are held outside university data', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Work email').fill('student@demo.aptohire.test');
  await page.getByLabel('Password').fill('sample-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Go to your portal' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Continue to your portal' })).toHaveAttribute('href', /5174\/login$/);
  await expect(page.getByText('Activation funnel')).toHaveCount(0);
});


test('admin role is blocked and unknown login errors stay generic', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Work email').fill('admin@demo.aptohire.test');
  await page.getByLabel('Password').fill('sample-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'This account can’t use the university site.' })).toBeVisible();
  await expect(page.getByText('Activation funnel')).toHaveCount(0);
  await page.getByRole('link', { name: 'Back to sign in' }).click();
  await page.getByLabel('Work email').fill('unknown@sample.test');
  await page.getByLabel('Password').fill('sample-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toContainText('We couldn’t sign you in. Check your details and try again.');
});

test('primary university routes have no serious or critical axe violations', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Aravalli Institute · Approved' }).click();
  await expect(page.getByRole('heading', { name: 'Aravalli Institute of Technology' })).toBeVisible();
  const routes = [
    ['/students', 'Students'], ['/roster', 'Roster'], ['/placements', 'Placements'],
    ['/skills', 'Skills demand'], ['/directory', 'Organizations'],
    ['/notifications', 'Notifications'], ['/account', 'Account & security'], ['/help', 'Help']
  ] as const;
  for (const [path, heading] of routes) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical'), path).toEqual([]);
  }
});
