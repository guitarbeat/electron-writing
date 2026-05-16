import { db } from '../src/db/index';
import { settings } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function debugSettings() {
  try {
    const results = await db.select().from(settings).where(eq(settings.id, "global")).limit(1);
    if (results.length > 0) {
      console.log('Current DB Passcode:', results[0].passcode ? `[${results[0].passcode}]` : '(empty)');
      console.log('Is Setup Complete:', results[0].isSetupComplete);
    } else {
      console.log('No global settings found in DB.');
    }
  } catch (err) {
    console.error('Error fetching settings:', err);
  }
  process.exit(0);
}

debugSettings();
