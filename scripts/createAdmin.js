// Script to create admin user in Firebase
// Run: node scripts/createAdmin.js

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Admin credentials to create
const ADMIN_EMAIL = 'admin@kruncheez.com';
const ADMIN_PASSWORD = 'KrunchEez@Admin2024';
const ADMIN_NAME = 'KrunchEez Admin';

async function createAdmin() {
  try {
    const auth = getAuth();
    const db = getFirestore();

    console.log('Creating admin user...');

    // Create user in Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        displayName: ADMIN_NAME,
        emailVerified: true,
      });
      console.log('✅ Auth user created:', userRecord.uid);
    } catch (err) {
      if (err.code === 'auth/email-already-exists') {
        userRecord = await auth.getUserByEmail(ADMIN_EMAIL);
        console.log('ℹ️  User already exists:', userRecord.uid);
      } else throw err;
    }

    // Create/update Firestore document
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      phone: '0317-7787648',
      role: 'admin',
      loyaltyPoints: 0,
      addresses: [],
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date(),
    }, { merge: true });

    console.log('✅ Firestore document created with role: admin');
    console.log('\n🎉 ADMIN ACCOUNT READY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    ', ADMIN_EMAIL);
    console.log('🔑 Password: ', ADMIN_PASSWORD);
    console.log('🌐 Admin URL: https://kruncheez-pos.web.app/admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createAdmin();
