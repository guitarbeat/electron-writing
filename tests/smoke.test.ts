import { createApp } from '../server/index';
import request from 'supertest'; // I'll check if I can use this or just fetch

async function smokeTest() {
  const app = createApp();
  // Since I don't have supertest, I'll use a simpler approach if needed
  // But let's try to see if we can just mock a request
  console.log("Starting smoke test...");

  // We'll use a dynamic import for supertest if it's there, otherwise we'll use a fallback
  try {
    const { default: supertest } = await import('supertest');
    const res = await supertest(app)
      .post('/api/session')
      .send({ passcode: '0000' });
    
    console.log('Status:', res.status);
    console.log('Body:', res.body);
    
    if (res.status === 200 && res.body.status === 'ok') {
      console.log('✅ Smoke test PASSED: 0000 works!');
    } else {
      console.log('❌ Smoke test FAILED!');
    }
  } catch (e) {
    console.log("Supertest not found, trying manual server start...");
    const server = app.listen(0, async () => {
      const port = (server.address() as any).port;
      try {
        const response = await fetch(`http://localhost:${port}/api/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode: '0000' })
        });
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Data:', data);
        if (response.status === 200 && data.status === 'ok') {
          console.log('✅ Smoke test PASSED: 0000 works!');
        } else {
          console.log('❌ Smoke test FAILED!');
        }
      } catch (err) {
        console.error('Manual test failed:', err);
      } finally {
        server.close();
      }
    });
  }
}

smokeTest();
