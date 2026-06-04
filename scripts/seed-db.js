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

const db = admin.firestore();

const mockData = [
  {
    uid: "mock-user-1",
    firstName: "สมชาย",
    lastName: "ใจดี",
    studentId: "65000001",
    faculty: "วิศวกรรมศาสตร์",
    sport: "ฟุตบอล",
    position: "กองหน้า",
    experience: "เคยแข่งขันกีฬาเยาวชนแห่งชาติ",
    achievement: "เหรียญทอง",
    note: "พร้อมคัดตัวทุกวันเสาร์-อาทิตย์",
    files: [],
    status: "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    uid: "mock-user-2",
    firstName: "สมหญิง",
    lastName: "รักเรียน",
    studentId: "65000002",
    faculty: "วิทยาศาสตร์",
    sport: "บาสเกตบอล",
    position: "Point Guard",
    experience: "ทีมโรงเรียน 3 ปี",
    achievement: "รองชนะเลิศระดับจังหวัด",
    note: "",
    files: [],
    status: "approved",
    submittedToStaff: true,
    staffStatus: "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    uid: "mock-user-3",
    firstName: "ปิติ",
    lastName: "ว่ายน้ำเก่ง",
    studentId: "65000003",
    faculty: "บริหารธุรกิจ",
    sport: "ว่ายน้ำ",
    position: "ฟรีสไตล์ 100 เมตร",
    experience: "ชมรมว่ายน้ำมหาวิทยาลัย",
    achievement: "สถิติ 58 วินาที",
    note: "ขอทดสอบเวลาช่วงเย็น",
    files: [],
    status: "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    uid: "mock-user-4",
    firstName: "มานะ",
    lastName: "อดทน",
    studentId: "65000004",
    faculty: "นิติศาสตร์",
    sport: "ฟุตบอล",
    position: "ผู้รักษาประตู",
    experience: "ทีมตัวแทนจังหวัด",
    achievement: "นักกีฬายอดเยี่ยม",
    note: "",
    files: [],
    status: "rejected",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    uid: "mock-user-5",
    firstName: "วีระ",
    lastName: "เกมเมอร์",
    studentId: "65000005",
    faculty: "เทคโนโลยีสารสนเทศ",
    sport: "อีสปอร์ต",
    position: "RoV - Jungle",
    experience: "แรงค์ Glorious Ruler",
    achievement: "แชมป์รายการระดับมหาลัย",
    note: "ไอดีเกม: xxxx",
    files: [],
    status: "approved",
    submittedToStaff: true,
    staffStatus: "approved",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }
];

async function seed() {
  try {
    console.log("🌱 Starting Database Seeding...");
    const batch = db.batch();

    mockData.forEach((data, index) => {
      const docRef = db.collection("registrations").doc(`mock-reg-${index + 1}`);
      batch.set(docRef, data);
    });

    await batch.commit();
    console.log(`✅ Successfully seeded ${mockData.length} records into 'registrations' collection.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
