const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { performance } = require('perf_hooks');
require('dotenv').config();

function nowIso() {
  return new Date().toISOString();
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function slug(value) {
  return String(value || 'route')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function toAbsoluteUrl(baseUrl, route) {
  try {
    return new URL(route, baseUrl).href;
  } catch {
    return route;
  }
}

function sanitizeCell(value) {
  return String(value ?? '-')
    .replace(/\|/g, '/')
    .replace(/\r?\n/g, ' ')
    .trim();
}

function humanize(segment) {
  return String(segment || 'geral')
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function routeToMenuInfo(route, menuPrefix) {
  const cleanRoute = String(route || '').split('?')[0];
  const prefixParts = String(menuPrefix || '/app/')
    .split('/')
    .filter(Boolean);
  const routeParts = cleanRoute.split('/').filter(Boolean);

  let scoped = routeParts;
  if (prefixParts.length > 0) {
    const idx = routeParts.findIndex((part, i) => prefixParts.every((p, k) => routeParts[i + k] === p));
    if (idx >= 0) scoped = routeParts.slice(idx + prefixParts.length);
  }

  const moduleLabel = humanize(scoped[0] || 'geral');
  const menuLabel = scoped.slice(1).length ? scoped.slice(1).map(humanize).join(' / ') : 'Principal';
  const isDetail = /\/(edit|view|detail)\//i.test(cleanRoute) || /\/\d+(?:\/|$)/.test(cleanRoute);

  return { moduleLabel, menuLabel, isDetail };
}

async function waitStable(page, timeoutMs = 30000) {
  if (page.isClosed()) return;
  await page.waitForLoadState('domcontentloaded', { timeout: timeoutMs }).catch(() => undefined);
  await page.waitForLoadState('networkidle', { timeout: timeoutMs }).catch(() => undefined);
  await page.waitForTimeout(500).catch(() => undefined);
}

async function firstVisible(locator) {
  return locator.first().isVisible().catch(() => false);
}

async function fillFirstVisible(page, selectors, value) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    const visible = await locator.isVisible().catch(() => false);
    if (!visible) continue;
    await locator.fill(value).catch(() => undefined);
    return true;
  }
  return false;
}

async function clickSessionConflictConfirmation(page) {
  const labels = [/^\s*sim\s*$/i, /continue/i, /confirm/i, /encerrar sess[aã]o/i, /finalizar sess[aã]o/i];
  for (const label of labels) {
    const btn = page.getByRole('button', { name: label }).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click().catch(() => undefined);
      return true;
    }
  }
  return false;
}

async function attemptLogin(page, user, pass, progress) {
  if (!user || !pass) return false;

  const userFilled = await fillFirstVisible(
    page,
    [
      'input[type="email"]',
      'input[name*="user" i]',
      'input[name*="mail" i]',
      'input[id*="user" i]',
      'input[id*="mail" i]',
      'input:nth-of-type(1)',
      'input',
    ],
    user
  );

  const passFilled = await fillFirstVisible(
    page,
    [
      'input[type="password"]',
      'input[name*="pass" i]',
      'input[name*="senha" i]',
      'input[id*="pass" i]',
      'input[id*="senha" i]',
      'input:nth-of-type(2)',
    ],
    pass
  );

  if (!userFilled || !passFilled) {
    progress('auth: campos de login nao encontrados com seletores padrao');
    return false;
  }

  const accessButton = page.getByRole('button', { name: /login|entrar|acessar|sign in/i }).first();
  if (await firstVisible(accessButton)) {
    await accessButton.click().catch(() => undefined);
  } else {
    await page.keyboard.press('Enter').catch(() => undefined);
  }

  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const confirmed = await clickSessionConflictConfirmation(page);
    if (confirmed) {
      progress('auth: conflito de sessao confirmado automaticamente');
      await page.waitForTimeout(800).catch(() => undefined);
    }
    if (!/\/login(?:\?|$)/i.test(page.url())) return true;
    await page.waitForTimeout(500).catch(() => undefined);
  }

  return !/\/login(?:\?|$)/i.test(page.url());
}

async function discoverRoutes(page, menuPrefix) {
  if (page.isClosed()) return [];
  return page
    .evaluate((prefix) => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      const routes = links
        .map((a) => (a.getAttribute('href') || '').trim())
        .filter((href) => href.startsWith(prefix) || href.includes(prefix))
        .map((href) => (href.startsWith(prefix) ? href : href.slice(href.indexOf(prefix))))
        .filter((href) => !/\/(logout|sair)(?:\?|$)/i.test(href));
      return Array.from(new Set(routes));
    }, menuPrefix)
    .catch(() => []);
}

(async () => {
  const baseUrl = process.env.APP_BASE_URL || 'https://example.local';
  const user = process.env.APP_USER;
  const pass = process.env.APP_PASS;
  const menuPrefix = process.env.APP_MENU_PREFIX || '/app/';
  const maxRoutes = Number(process.env.CRAWL_MAX_ROUTES || 250);
  const storageStatePath = process.env.APP_STORAGE_STATE || path.join(__dirname, '..', 'artifacts', 'storageState.app.json');

  const outRoot = path.join(__dirname, '..', 'artifacts', 'system-crawl');
  const runId = `crawl-${Date.now()}`;
  const outDir = path.join(outRoot, runId);
  fs.mkdirSync(outDir, { recursive: true });
  const progressLogPath = path.join(outDir, 'progress.log');

  function progress(message) {
    const line = `[${nowIso()}] ${message}`;
    fs.appendFileSync(progressLogPath, `${line}\n`, 'utf-8');
    console.log(line);
  }

  const telemetry = { httpErrors: [], consoleErrors: [], consoleWarnings: [] };
  let runStarted = performance.now();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: fs.existsSync(storageStatePath) ? storageStatePath : undefined,
  });

  context.on('response', (response) => {
    if (response.status() >= 400) {
      telemetry.httpErrors.push({
        at: nowIso(),
        status: response.status(),
        method: response.request().method(),
        url: response.url(),
      });
    }
  });

  const page = await context.newPage();
  page.on('console', (msg) => {
    const payload = { at: nowIso(), type: msg.type(), text: msg.text() };
    if (msg.type() === 'error') telemetry.consoleErrors.push(payload);
    if (msg.type() === 'warning') telemetry.consoleWarnings.push(payload);
  });

  const report = {
    runId,
    generatedAt: nowIso(),
    baseUrl,
    auth: { loginSuccess: false, loginFinalUrl: '', loginMessage: '' },
    crawl: {
      maxRoutes,
      discoveredCount: 0,
      visitedCount: 0,
      interrupted: false,
      initialDiscoveredRoutes: [],
      menuPrefix,
    },
    pages: [],
    telemetry,
  };

  try {
    progress('init: navegando para URL base');
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitStable(page);

    if (/\/login(?:\?|$)/i.test(page.url())) {
      progress('auth: login requerido, tentando autenticacao automatica');
      const ok = await attemptLogin(page, user, pass, progress);
      report.auth.loginSuccess = ok;
      report.auth.loginMessage = ok ? 'autenticacao concluida' : 'falha na autenticacao automatica';
    } else {
      report.auth.loginSuccess = true;
      report.auth.loginMessage = 'sessao valida ja existente';
    }

    report.auth.loginFinalUrl = page.url();

    if (!report.auth.loginSuccess) {
      const diagPath = path.join(outDir, 'auth.diagnostics.json');
      fs.writeFileSync(
        diagPath,
        JSON.stringify({ url: page.url(), message: report.auth.loginMessage, at: nowIso() }, null, 2),
        'utf-8'
      );
    }

    const initialShot = path.join(outDir, '00_after_login.png');
    await page.screenshot({ path: initialShot, fullPage: true }).catch(() => undefined);

    const discovered = await discoverRoutes(page, menuPrefix);
    report.crawl.initialDiscoveredRoutes = [...discovered];

    const seen = new Set(discovered);
    const queue = [...discovered];

    report.crawl.discoveredCount = seen.size;
    progress(`crawl: iniciando com ${queue.length} rotas descobertas`);

    while (queue.length && report.pages.length < maxRoutes) {
      const route = queue.shift();
      if (!route) break;

      const index = report.pages.length + 1;
      const start = performance.now();
      const evHttp = telemetry.httpErrors.length;
      const evErr = telemetry.consoleErrors.length;
      const evWarn = telemetry.consoleWarnings.length;
      const record = {
        index,
        route,
        startedAt: nowIso(),
        finalUrl: '',
        status: 'ok',
        message: '',
        durationMs: 0,
        evidence: { screenshot: '', sha256: '', bytes: 0 },
        errors: { http: [], consoleErrors: [], consoleWarnings: [] },
      };

      progress(`crawl: visitando ${index}/${maxRoutes} ${route}`);

      try {
        await page.goto(toAbsoluteUrl(baseUrl, route), { waitUntil: 'domcontentloaded', timeout: 50000 });
        await waitStable(page);

        if (/\/login(?:\?|$)/i.test(page.url())) {
          progress('crawl: /login detectado no meio do crawl, tentando re-login');
          const reloginOk = await attemptLogin(page, user, pass, progress);
          if (reloginOk) {
            await page.goto(toAbsoluteUrl(baseUrl, route), { waitUntil: 'domcontentloaded', timeout: 50000 });
            await waitStable(page);
          } else {
            record.status = 'redirect-login';
            record.message = 'nao foi possivel reautenticar';
          }
        }

        record.finalUrl = page.url();

        const shotName = `${String(index).padStart(3, '0')}_${slug(route)}.png`;
        const shotPath = path.join(outDir, shotName);
        await page.screenshot({ path: shotPath, fullPage: true }).catch(() => undefined);
        if (fs.existsSync(shotPath)) {
          const bytes = fs.readFileSync(shotPath);
          record.evidence = { screenshot: shotName, sha256: sha256(bytes), bytes: bytes.length };
        }

        const newlyFound = await discoverRoutes(page, menuPrefix);
        for (const nextRoute of newlyFound) {
          if (!seen.has(nextRoute)) {
            seen.add(nextRoute);
            queue.push(nextRoute);
          }
        }
      } catch (err) {
        record.status = 'error';
        record.message = String(err).slice(0, 250);
        record.finalUrl = page.isClosed() ? 'page-closed' : page.url();
      }

      record.durationMs = Math.round(performance.now() - start);
      record.errors.http = telemetry.httpErrors.slice(evHttp);
      record.errors.consoleErrors = telemetry.consoleErrors.slice(evErr);
      record.errors.consoleWarnings = telemetry.consoleWarnings.slice(evWarn);
      report.pages.push(record);

      if (report.pages.length % 10 === 0) {
        fs.writeFileSync(path.join(outDir, 'crawl.snapshot.json'), JSON.stringify(report, null, 2), 'utf-8');
        progress(`snapshot: ${report.pages.length} paginas salvas`);
      }

      if (page.isClosed()) {
        report.crawl.interrupted = true;
        break;
      }
    }

    report.crawl.visitedCount = report.pages.length;
    report.crawl.discoveredCount = seen.size;

    const totals = {
      ok: report.pages.filter((p) => p.status === 'ok').length,
      redirectLogin: report.pages.filter((p) => p.status === 'redirect-login').length,
      error: report.pages.filter((p) => p.status === 'error').length,
      avgMs: report.pages.length ? Math.round(report.pages.reduce((acc, p) => acc + p.durationMs, 0) / report.pages.length) : 0,
      totalMs: Math.round(performance.now() - runStarted),
    };

    const summaryMd = [
      '# System Crawl Report',
      '',
      `- Run ID: ${runId}`,
      `- Base URL: ${baseUrl}`,
      `- Auth success: ${report.auth.loginSuccess}`,
      `- Visited pages: ${report.pages.length}`,
      `- Status (ok/redirect-login/error): ${totals.ok}/${totals.redirectLogin}/${totals.error}`,
      `- Avg time per page (ms): ${totals.avgMs}`,
      `- Total crawl time (ms): ${totals.totalMs}`,
      '',
      '## Pages',
      '| # | Route | Status | Time (ms) |',
      '|---|---|---|---:|',
    ];
    for (const p of report.pages) {
      summaryMd.push(`| ${p.index} | ${p.route} | ${p.status} | ${p.durationMs} |`);
    }

    const initialMenuSet = new Set(report.crawl.initialDiscoveredRoutes || []);
    const menuPages = report.pages
      .filter((p) => initialMenuSet.has(p.route))
      .filter((p) => !routeToMenuInfo(p.route, menuPrefix).isDetail);

    const moduleStats = new Map();
    for (const p of menuPages) {
      const { moduleLabel } = routeToMenuInfo(p.route, menuPrefix);
      if (!moduleStats.has(moduleLabel)) {
        moduleStats.set(moduleLabel, { moduleLabel, menus: 0, ok: 0, error: 0, totalMs: 0 });
      }
      const current = moduleStats.get(moduleLabel);
      current.menus += 1;
      current.totalMs += p.durationMs;
      if (p.status === 'ok') current.ok += 1;
      else current.error += 1;
    }

    const redmine = [
      '*System Crawl - Resumo*',
      `*Run ID:* ${runId}`,
      `*Auth success:* ${report.auth.loginSuccess}`,
      `*Paginas visitadas:* ${report.pages.length}`,
      `*Menus (alto nivel):* ${menuPages.length}`,
      `*OK/RedirectLogin/Error:* ${totals.ok}/${totals.redirectLogin}/${totals.error}`,
      '',
      '*Visao por modulo*',
      '|_. Modulo |_. Menus |_. OK |_. Erro |_. Tempo total (ms) |',
    ];

    const sortedModules = Array.from(moduleStats.values()).sort((a, b) => a.moduleLabel.localeCompare(b.moduleLabel));
    for (const item of sortedModules) {
      redmine.push(`| ${sanitizeCell(item.moduleLabel)} | ${item.menus} | ${item.ok} | ${item.error} | ${item.totalMs} |`);
    }

    redmine.push('', '*Menus percorridos*', '|_. Modulo |_. Menu |_. Data/Hora |_. Status |_. Tempo (ms) |_. Obs |');

    const sortedMenus = [...menuPages].sort((a, b) => {
      const aInfo = routeToMenuInfo(a.route, menuPrefix);
      const bInfo = routeToMenuInfo(b.route, menuPrefix);
      return aInfo.moduleLabel.localeCompare(bInfo.moduleLabel) || aInfo.menuLabel.localeCompare(bInfo.menuLabel);
    });

    for (const p of sortedMenus) {
      const menuInfo = routeToMenuInfo(p.route, menuPrefix);
      const statusLabel = p.status === 'ok' ? '✓ [v] OK' : `✗ [x] ${p.status}`;
      redmine.push(
        `| ${sanitizeCell(menuInfo.moduleLabel)} | ${sanitizeCell(menuInfo.menuLabel)} | ${sanitizeCell(
          p.startedAt
        )} | ${sanitizeCell(statusLabel)} | ${p.durationMs} | ${sanitizeCell(p.message || 'navegacao concluida')} |`
      );
    }

    redmine.push('', '*Paginas com erro*');
    const failed = report.pages.filter((p) => p.status !== 'ok');
    if (!failed.length) redmine.push('* Nenhuma');
    for (const p of failed) {
      redmine.push(`* [${p.status}] ${p.route} -> ${p.finalUrl || '-'} | ${p.durationMs} ms | ${p.message || '-'} `);
    }

    const csv = ['index,route,finalUrl,status,durationMs,httpErrors,consoleErrors,consoleWarnings,message'];
    for (const p of report.pages) {
      csv.push(
        [
          p.index,
          JSON.stringify(p.route),
          JSON.stringify(p.finalUrl || ''),
          p.status,
          p.durationMs,
          p.errors.http.length,
          p.errors.consoleErrors.length,
          p.errors.consoleWarnings.length,
          JSON.stringify(p.message || ''),
        ].join(',')
      );
    }

    fs.writeFileSync(path.join(outDir, 'crawl.summary.md'), summaryMd.join('\n'), 'utf-8');
    fs.writeFileSync(path.join(outDir, 'crawl.report.json'), JSON.stringify(report, null, 2), 'utf-8');
    fs.writeFileSync(path.join(outDir, 'crawl.redmine.txt'), redmine.join('\n'), 'utf-8');
    fs.writeFileSync(path.join(outDir, 'crawl.pages.csv'), csv.join('\n'), 'utf-8');
    fs.writeFileSync(path.join(outRoot, 'LATEST_RUN.txt'), `${runId}\n${outDir}\n`, 'utf-8');

    progress('finish: relatorios escritos com sucesso');
    console.log('CRAWL_OK');
    console.log(`RUN_ID=${runId}`);
    console.log(`OUT_DIR=${outDir}`);
  } catch (err) {
    const errorPath = path.join(outDir, 'crawl.error.txt');
    fs.writeFileSync(errorPath, String(err?.stack || err), 'utf-8');
    progress(`finish: erro registrado em ${errorPath}`);
    console.error('CRAWL_ERROR');
    console.error(errorPath);
    process.exitCode = 1;
  } finally {
    await context.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }
})();
