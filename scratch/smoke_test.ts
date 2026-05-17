import { createApp } from '../server';

async function smokeTest() {
  const app = createApp();
  console.log("Starting smoke test...");

  try {
    const { default: supertest } = await import('supertest');
    const res = await supertest(app)
      .post('/api/session')
      .send({ passcode: process.env.PASSCODE || '0000' });
    
    console.log('Status:', res.status);
    console.log('Body:', res.body);
    
    if (res.status === 200 && res.body.status === 'ok') {
      console.log('✅ Smoke test PASSED!');
      process.exit(0);
    } else {
      console.log('❌ Smoke test FAILED!');
      process.exit(1);
    }
  } catch (e) {
    console.log("Supertest not found, trying manual server start...");
    const server = app.listen(0, async () => {
      const port = (server.address() as any).port;
      try {
        const response = await fetch(`http://localhost:${port}/api/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode: process.env.PASSCODE || '0000' })
        });
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Data:', data);
        if (response.status === 200 && data.status === 'ok') {
          console.log('✅ Smoke test PASSED!');
          process.exit(0);
        } else {
          console.log('❌ Smoke test FAILED!');
          process.exit(1);
        }
      } catch (err) {
        console.error('Manual test failed:', err);
        process.exit(1);
      } finally {
        server.close();
      }
    });
  }
}

smokeTest();
