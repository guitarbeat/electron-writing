import { createApp } from '../server';

async function smokeTest() {
  const app = createApp();
  console.log("Starting smoke test...");

  try {
    const { default: supertest } = await import('supertest');
    const res = await supertest(app)
      .post('/api/session')
      .send({ passcode: '0000' });
    
    console.log('Status:', res.status);
    console.log('Body:', res.body);
    
    if (res.status === 200 && res.body.status === 'ok') {
      console.log('✅ Smoke test PASSED: 0000 works!');
      process.exit(0);
    } else {
      console.log('❌ Smoke test FAILED!');
      process.exit(1);
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

smokeTest();
