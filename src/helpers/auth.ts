import { Page } from '@playwright/test';

export async function fillFirstVisible(page: Page, selectors: string[], value: string): Promise<boolean> {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    const visible = await locator.isVisible().catch(() => false);
    if (!visible) continue;
    await locator.fill(value).catch(() => undefined);
    return true;
  }
  return false;
}

export async function tryLogin(page: Page, user: string, pass: string): Promise<boolean> {
  const userOk = await fillFirstVisible(page, ['input[type="email"]', 'input[name*="user" i]', 'input'], user);
  const passOk = await fillFirstVisible(page, ['input[type="password"]', 'input[name*="pass" i]'], pass);

  if (!userOk || !passOk) return false;

  const loginButton = page.getByRole('button', { name: /login|entrar|sign in/i }).first();
  const visible = await loginButton.isVisible().catch(() => false);
  if (visible) await loginButton.click().catch(() => undefined);
  else await page.keyboard.press('Enter').catch(() => undefined);

  await page.waitForTimeout(1500).catch(() => undefined);
  return !/\/login(?:\?|$)/i.test(page.url());
}
