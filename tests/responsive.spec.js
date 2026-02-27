import { test, expect } from '@playwright/test';

test.describe('No horizontal overflow on any page', () => {

  test('overview page has no horizontal overflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Dismiss onboarding if shown
    const getStarted = page.locator('button', { hasText: 'Get started' });
    if (await getStarted.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.locator('input[placeholder="e.g. Pat"]').fill('Test');
      await getStarted.click();
      await page.waitForTimeout(500);
    }

    // Check no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('profile page has no horizontal overflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Dismiss onboarding if shown
    const getStarted = page.locator('button', { hasText: 'Get started' });
    if (await getStarted.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.locator('input[placeholder="e.g. Pat"]').fill('Test');
      await getStarted.click();
      await page.waitForTimeout(500);
    }

    // Navigate to Profile tab
    await page.locator('button', { hasText: 'Profile' }).click();
    await page.waitForTimeout(300);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('clinic appointments view has no horizontal overflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Dismiss onboarding if shown
    const getStarted = page.locator('button', { hasText: 'Get started' });
    if (await getStarted.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.locator('input[placeholder="e.g. Pat"]').fill('Test');
      await getStarted.click();
      await page.waitForTimeout(500);
    }

    // Navigate to Profile > Clinic appointments
    await page.locator('button', { hasText: 'Profile' }).click();
    await page.waitForTimeout(300);
    await page.locator('text=Clinic appointments').first().click();
    await page.waitForTimeout(300);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    // Add an appointment and check the detail view
    await page.locator('button', { hasText: '+ Add' }).click();
    await page.waitForTimeout(300);

    const scrollWidth2 = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth2 = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth2).toBeLessThanOrEqual(clientWidth2);

    // Check that "Delete" button is fully visible (not clipped)
    const deleteBtn = page.locator('button', { hasText: 'Delete' });
    await expect(deleteBtn).toBeVisible();
    const box = await deleteBtn.boundingBox();
    const viewport = page.viewportSize();
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  });

  test('food safety view has no horizontal overflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Dismiss onboarding if shown
    const getStarted = page.locator('button', { hasText: 'Get started' });
    if (await getStarted.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.locator('input[placeholder="e.g. Pat"]').fill('Test');
      await getStarted.click();
      await page.waitForTimeout(500);
    }

    // Navigate to Profile > Food safety
    await page.locator('button', { hasText: 'Profile' }).click();
    await page.waitForTimeout(300);
    await page.locator('text=Food safety').first().click();
    await page.waitForTimeout(300);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('trends page has no horizontal overflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Dismiss onboarding if shown
    const getStarted = page.locator('button', { hasText: 'Get started' });
    if (await getStarted.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.locator('input[placeholder="e.g. Pat"]').fill('Test');
      await getStarted.click();
      await page.waitForTimeout(500);
    }

    // Navigate to Trends tab
    await page.locator('button', { hasText: 'Trends' }).click();
    await page.waitForTimeout(300);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('medication tab has no horizontal overflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Dismiss onboarding if shown
    const getStarted = page.locator('button', { hasText: 'Get started' });
    if (await getStarted.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.locator('input[placeholder="e.g. Pat"]').fill('Test');
      await getStarted.click();
      await page.waitForTimeout(500);
    }

    // Switch to Medication tab
    await page.locator('button', { hasText: 'Medication' }).click();
    await page.waitForTimeout(300);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('settings view has no horizontal overflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Dismiss onboarding if shown
    const getStarted = page.locator('button', { hasText: 'Get started' });
    if (await getStarted.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.locator('input[placeholder="e.g. Pat"]').fill('Test');
      await getStarted.click();
      await page.waitForTimeout(500);
    }

    // Navigate to Profile > Settings (cog icon)
    await page.locator('button', { hasText: 'Profile' }).click();
    await page.waitForTimeout(300);
    await page.locator('button[aria-label="Settings"]').click();
    await page.waitForTimeout(300);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('all content stays within viewport bounds', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Dismiss onboarding if shown
    const getStarted = page.locator('button', { hasText: 'Get started' });
    if (await getStarted.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.locator('input[placeholder="e.g. Pat"]').fill('Test');
      await getStarted.click();
      await page.waitForTimeout(500);
    }

    const viewport = page.viewportSize();

    // Check all visible elements are within viewport width
    const overflowingElements = await page.evaluate((vpWidth) => {
      const allElements = document.querySelectorAll('*');
      const overflowing = [];
      for (const el of allElements) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.right > vpWidth + 1) {
          overflowing.push({
            tag: el.tagName,
            class: el.className?.toString().slice(0, 50),
            right: Math.round(rect.right),
            vpWidth,
          });
        }
      }
      return overflowing;
    }, viewport.width);

    expect(overflowingElements).toHaveLength(0);
  });
});
