import { test, expect } from '@playwright/test';

const baseUrl = process.env.APP_BASE_URL || 'https://example.local';

test('abre pagina inicial', async ({ page }) => {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(new RegExp('^https?://'));
});
