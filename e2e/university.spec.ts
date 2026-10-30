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

test('cohort dropdowns use styled menus and support mouse, keyboard and reset', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Aravalli Institute · Approved' }).click();
  const yearFilter = page.getByRole('combobox', { name: 'Filter by year' });
  await yearFilter.click();
  await expect(page.getByRole('listbox', { name: 'Filter by year' })).toBeVisible();
  await page.getByRole('option', { name: 'Year 2' }).click();
  await expect(page).toHaveURL(/year=2/);
  await expect(yearFilter).toContainText('Year 2');
  const programFilter = page.getByRole('combobox', { name: 'Filter by program' });
  await programFilter.focus();
  await programFilter.press('ArrowDown');
  await expect(programFilter).toHaveAttribute('aria-expanded', 'true');
  await programFilter.press('ArrowDown');
  await programFilter.press('Enter');
  await expect(page).toHaveURL(/program=/);
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page).not.toHaveURL(/year=|program=/);
});

test('header menus are mutually exclusive and dismiss cleanly', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Aravalli Institute · Approved' }).click();
  await page.getByRole('button', { name: /Notifications,/ }).click();
  await expect(page.getByRole('dialog', { name: 'Recent notifications' })).toBeVisible();
  await page.locator('.account-button').click();
  await expect(page.getByRole('dialog', { name: 'University account menu' })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Recent notifications' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'University account menu' })).toHaveCount(0);
});

test('roster edit dialog uses styled accessible dropdowns', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Aravalli Institute · Approved' }).click();
  await expect(page.getByRole('heading', { name: 'Aravalli Institute of Technology' })).toBeVisible();
  await page.goto('/roster');
  await page.getByRole('button', { name: 'Edit' }).first().click();
  const dialog = page.getByRole('dialog', { name: /Edit / });
  await expect(dialog).toBeVisible();
  const programLevel = dialog.getByRole('combobox', { name: 'Program level' });
  await programLevel.click();
  await expect(dialog.getByRole('listbox', { name: 'Program level' })).toBeVisible();
  expect(await programLevel.evaluate((trigger) => getComputedStyle(trigger.parentElement!).zIndex)).toBe('130');
  await programLevel.press('Escape');
  await expect(dialog).toBeVisible();
  const status = dialog.getByRole('combobox', { name: 'Lifecycle status' });
  await status.click();
  const listbox = dialog.getByRole('listbox', { name: 'Lifecycle status' });
  await expect(listbox).toBeVisible();
  await status.press('Escape');
  await expect(listbox).toHaveCount(0);
  await expect(dialog).toBeVisible();
  await status.click();
  await expect(listbox).toBeVisible();
  await expect(listbox.getByRole('option', { name: 'Alumni' })).toBeVisible();
  const box = await listbox.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(720);
  await listbox.getByRole('option', { name: 'Alumni' }).click();
  await expect(dialog.getByText('This changes how the student appears on AptoHire.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
});

test('placement outcomes update unclaimed roster rows and keep claimed outcomes student-managed', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Aravalli Institute · Approved' }).click();
  await page.goto('/placements');
  const roster = page.getByRole('region', { name: 'Placement outcomes roster' });
  const unclaimedRow = roster.getByRole('row', { name: /Aman Verma/ });
  await unclaimedRow.getByRole('button', { name: 'Update' }).click();
  const dialog = page.getByRole('dialog', { name: 'Update placement' });
  await dialog.getByRole('radio', { name: 'Placed' }).check();
  await dialog.getByLabel('Organization name').fill('Sample employer');
  await dialog.getByLabel('Role').fill('Graduate engineer');
  await dialog.getByRole('button', { name: 'Save placement' }).click();
  await expect(page.getByRole('status')).toContainText('Placement updated.');
  await expect(unclaimedRow).toContainText('Sample employer');
  const claimedRow = roster.getByRole('row', { name: /Aarav Sharma/ });
  await expect(claimedRow).toContainText('Student-managed outcome');
  await expect(claimedRow.getByRole('button', { name: 'Update' })).toHaveCount(0);
});

test('mobile roster cards include a visible edit action', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/login');
  await page.getByRole('button', { name: 'Aravalli Institute · Approved' }).click();
  await expect(page.getByRole('heading', { name: 'Aravalli Institute of Technology' })).toBeVisible();
  await page.goto('/roster');
  const editButton = page.getByRole('button', { name: 'Edit student' }).first();
  await expect(editButton).toBeVisible();
  await editButton.click();
  await expect(page.getByRole('dialog', { name: /Edit / })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('laptop layout keeps profile actions aligned and shows only the custom sidebar tooltip', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 840 });
  await page.goto('/login');
  await page.getByRole('button', { name: 'Aravalli Institute · Approved' }).click();
  await expect(page.getByRole('heading', { name: 'Aravalli Institute of Technology' })).toBeVisible();
  const trendMargin = await page.locator('.trends-panel').evaluate((node) => parseFloat(getComputedStyle(node).marginTop));
  expect(trendMargin).toBeGreaterThanOrEqual(24);
  await page.locator('.account-button').click();
  const accountDialog = page.getByRole('dialog', { name: 'University account menu' });
  const accountAction = accountDialog.getByRole('link', { name: 'Account & security' });
  await expect(accountAction).toBeVisible();
  expect(await accountAction.evaluate((node) => getComputedStyle(node).justifyContent)).toBe('flex-start');
  await page.keyboard.press('Escape');
  const overviewLink = page.getByRole('link', { name: 'Overview' });
  await expect(overviewLink).toBeVisible();
  await expect(overviewLink).not.toHaveAttribute('title');
  await overviewLink.hover();
  expect(await overviewLink.evaluate((node) => getComputedStyle(node, '::after').content)).toBe('"Overview"');
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
    if (width === 768) { await page.getByRole('button', { name: 'Open navigation' }).click(); const drawer = page.getByRole('complementary', { name: 'Main navigation' }); await expect(drawer).toBeVisible(); const close = drawer.getByRole('button', { name: 'Close navigation' }); await expect(close).toBeVisible(); const layers = await page.evaluate(() => ({ drawer: Number(getComputedStyle(document.querySelector('.side-rail.drawer-open')!).zIndex), header: Number(getComputedStyle(document.querySelector('.topbar')!).zIndex) })); expect(layers.drawer).toBeGreaterThan(layers.header); await close.click(); }
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

test('desktop auth forms stay open and portal pages share consistent side gutters', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const route of ['/login', '/signup']) {
    await page.goto(route);
    const form = page.locator('.auth-form');
    await expect(form).toBeVisible();
    const appearance = await form.evaluate((node) => {
      const style = getComputedStyle(node);
      return { borderWidth: style.borderTopWidth, shadow: style.boxShadow, background: style.backgroundColor };
    });
    expect(appearance.borderWidth).toBe('0px');
    expect(appearance.shadow).toBe('none');
    expect(appearance.background).toBe('rgba(0, 0, 0, 0)');
  }

  await page.goto('/login');
  await page.getByRole('button', { name: 'Aravalli Institute · Approved' }).click();
  await expect(page.getByRole('heading', { name: 'Aravalli Institute of Technology' })).toBeVisible();
  const pageEdges: number[] = [];
  for (const route of ['/', '/students', '/roster', '/placements', '/skills', '/directory', '/notifications', '/account', '/help']) {
    await page.goto(route);
    const content = page.locator('main .page').first();
    await expect(content).toBeVisible();
    pageEdges.push(await content.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return Math.round(rect.left + parseFloat(getComputedStyle(node).paddingLeft));
    }));
  }
  expect(new Set(pageEdges).size).toBe(1);

  for (const width of [960, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    if (width <= 767) expect(await page.evaluate(() => parseFloat(getComputedStyle(document.body).paddingBottom))).toBe(0);
  }
});
