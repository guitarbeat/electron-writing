import { fetch } from 'undici';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PASSCODE = process.env.PASSCODE || '0000';

async function check(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
  } catch (error: any) {
    console.error(`❌ [FAIL] ${name}`);

    // Cleanse error messages from secrets
    let errorMessage = error.message || String(error);
    if (PASSCODE) {
      errorMessage = errorMessage.split(PASSCODE).join('[REDACTED_PASSCODE]');
    }
    if (process.env.DATABASE_URL) {
      errorMessage = errorMessage.split(process.env.DATABASE_URL).join('[REDACTED_DATABASE_URL]');
    }
    if (process.env.POSTGRES_URL) {
      errorMessage = errorMessage.split(process.env.POSTGRES_URL).join('[REDACTED_POSTGRES_URL]');
    }
    
    console.error(`   Reason: ${errorMessage}`);
    process.exitCode = 1;
  }
}

async function runSmokeTests() {
  console.log(`Starting smoke tests against ${BASE_URL}\n`);

  await check('Static app loads (GET /)', async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const text = await res.text();
    if (!text.includes('<html') && !text.includes('<!DOCTYPE html>')) {
      throw new Error('Response does not look like HTML');
    }
  });

  await check('/api/health returns 200 JSON', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Expected JSON content-type, got ${contentType}`);
    }

    const data = await res.json() as { status?: string };
    if (data.status !== 'ok') {
      throw new Error(`Expected status 'ok', got ${JSON.stringify(data)}`);
    }
  });

  await check('POST /api/session accepts configured PASSCODE', async () => {
    const res = await fetch(`${BASE_URL}/api/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: PASSCODE }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText} - Passcode validation failed`);

    const data = await res.json() as { status?: string };
    if (data.status !== 'ok') {
      throw new Error(`Expected status 'ok', got ${JSON.stringify(data)}`);
    }

    const setCookie = res.headers.get('set-cookie');
    if (!setCookie || !setCookie.includes('clean_writer_session')) {
      throw new Error('Missing clean_writer_session cookie in response');
    }
  });

  await check('Manifest and PWA assets return 200', async () => {
    const assets = ['/manifest.webmanifest', '/smeemo.png'];
    for (const asset of assets) {
      const res = await fetch(`${BASE_URL}${asset}`);
      if (!res.ok) {
        throw new Error(`Failed to load ${asset} - HTTP ${res.status}: ${res.statusText}`);
      }
    }
  });

  if (process.exitCode === 1) {
    console.error('\nSmoke tests failed. Review logs above for actionable diagnostics.');
  } else {
    console.log('\n🎉 All smoke tests passed successfully!');
  }
}

runSmokeTests().catch((err) => {
  console.error('Fatal error during smoke tests:', err);
  process.exitCode = 1;
});
