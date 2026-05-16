// Simple logic test for passcode comparison
function testPasscode(rawEnv, received) {
  const rawPasscode = rawEnv || "0000";
  const APP_PASSCODE = rawPasscode.toString().trim().replace(/^["']|["']$/g, '');
  const processedReceived = received.toString().trim();
  const match = processedReceived === APP_PASSCODE;
  console.log(`Env: [${rawEnv}] -> Fallback/Processed: [${APP_PASSCODE}] | Received: [${received}] | Match: ${match}`);
  return match;
}

console.log("--- Testing Logic ---");
testPasscode("0000", "0000");        // Expected true
testPasscode(" 0000 ", "0000");      // Expected true (whitespace)
testPasscode("\"0000\"", "0000");    // Expected true (double quotes)
testPasscode("'0000'", "0000");      // Expected true (single quotes)
testPasscode("1234", "0000");        // Expected false
testPasscode("", "0000");            // Expected true (fallback to 0000)
