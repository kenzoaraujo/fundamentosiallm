const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

(async () => {
  const baseUrl = process.env.APP_BASE_URL;
  const storageStatePath = process.env.APP_STORAGE_STATE || path.join(__dirname, '..', 'artifacts', 'storageState.app.json');

  if (!baseUrl) {
    console.error('APP_BASE_URL nao configurado. Preencha o arquivo .env.');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Abrindo aplicacao para login manual...');
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  console.log('Realize login manualmente no navegador. Pressione ENTER aqui quando finalizar.');

  process.stdin.setEncoding('utf8');
  await new Promise((resolve) => process.stdin.once('data', resolve));

  fs.mkdirSync(path.dirname(storageStatePath), { recursive: true });
  await context.storageState({ path: storageStatePath });
  console.log(`Storage state salvo em: ${storageStatePath}`);

  await context.close();
  await browser.close();
})();
