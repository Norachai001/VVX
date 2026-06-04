const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Load .env.local manually so we don't need dotenv
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/(^"|"$)/g, '');
      process.env[key] = value;
    }
  });
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error("❌ Missing Firebase Admin credentials in .env.local");
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Usage: node scripts/set-role.js <uid> <role>");
  console.log("Roles: athlete, club, staff");
  process.exit(1);
}

const uid = args[0];
const role = args[1];

const validRoles = ["athlete", "club", "staff"];
if (!validRoles.includes(role)) {
  console.error(`❌ Invalid role. Must be one of: ${validRoles.join(', ')}`);
  process.exit(1);
}

async function main() {
  try {
    // Set Custom Claims
    await admin.auth().setCustomUserClaims(uid, { role });
    console.log(`✅ Successfully set role '${role}' for user ${uid}`);
    
    // Verify changes
    const user = await admin.auth().getUser(uid);
    console.log("Current custom claims:", user.customClaims);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error setting custom claims:", error);
    process.exit(1);
  }
}

main();
