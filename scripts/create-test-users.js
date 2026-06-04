const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Load .env.local manually
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

const testUsers = [
  {
    email: 'athlete@up.ac.th',
    password: 'password123',
    displayName: 'Test Athlete',
    role: 'athlete'
  },
  {
    email: 'club@up.ac.th',
    password: 'password123',
    displayName: 'Test Club',
    role: 'club'
  },
  {
    email: 'staff@up.ac.th',
    password: 'password123',
    displayName: 'Test Staff',
    role: 'staff'
  }
];

async function createOrUpdateUser(userData) {
  try {
    let userRecord;
    try {
      // Check if user already exists
      userRecord = await admin.auth().getUserByEmail(userData.email);
      // Update password just in case
      await admin.auth().updateUser(userRecord.uid, { password: userData.password });
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        // Create new user
        userRecord = await admin.auth().createUser({
          email: userData.email,
          password: userData.password,
          displayName: userData.displayName,
        });
      } else {
        throw err;
      }
    }

    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: userData.role });
    console.log(`✅ Created/Updated user: ${userData.email} | Role: ${userData.role} | Password: ${userData.password}`);
  } catch (error) {
    console.error(`❌ Error with user ${userData.email}:`, error.message);
  }
}

async function main() {
  console.log("👤 Creating Test Accounts...");
  for (const user of testUsers) {
    await createOrUpdateUser(user);
  }
  console.log("🎉 All test accounts are ready!");
  process.exit(0);
}

main();
