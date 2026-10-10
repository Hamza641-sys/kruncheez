const API_KEY = 'AIzaSyC0dgHGMjbWeurlKAGNBakp3R-Eg8EIx7Y';
const PROJECT_ID = 'kruncheez-pos';

// Check what accounts exist
async function checkAccount(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  return res.json();
}

async function createAccount(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  return res.json();
}

async function writeAdmin(uid, idToken, email) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      fields: {
        uid:           { stringValue: uid },
        name:          { stringValue: 'KrunchEez Admin' },
        email:         { stringValue: email },
        phone:         { stringValue: '0317-7787648' },
        role:          { stringValue: 'admin' },
        loyaltyPoints: { integerValue: '0' },
        totalOrders:   { integerValue: '0' },
        totalSpent:    { integerValue: '0' },
        addresses:     { arrayValue: { values: [] } },
      }
    }),
  });
  return res.json();
}

// Try multiple password combinations
const EMAIL = 'kruncheez.admin@gmail.com';
const PASSWORDS_TO_TRY = [
  'KrunchEez@2024!',
  'KrunchEez@Admin2024',
  'KrunchEez@2024',
  'Admin@123',
];

const NEW_EMAIL    = 'admin.kruncheez@gmail.com';
const NEW_PASSWORD = 'Admin@Kruncheez123';

(async () => {
  console.log('🔍 Trying existing passwords...\n');

  for (const pass of PASSWORDS_TO_TRY) {
    const result = await checkAccount(EMAIL, pass);
    if (!result.error) {
      console.log(`✅ Found working password: ${pass}`);
      console.log('📝 Setting admin role...');
      await writeAdmin(result.localId, result.idToken, EMAIL);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 ADMIN LOGIN READY!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:   ', EMAIL);
      console.log('🔑 Password:', pass);
      console.log('🌐 URL:      https://kruncheez-pos.web.app/login');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      process.exit(0);
    }
    console.log(`❌ ${pass} — ${result.error?.message}`);
  }

  // All failed — create brand new account
  console.log('\n⚠️  All passwords failed. Creating fresh admin account...');
  const signup = await createAccount(NEW_EMAIL, NEW_PASSWORD);

  if (signup.error?.message === 'EMAIL_EXISTS') {
    console.log('Account exists, trying login...');
    const login = await checkAccount(NEW_EMAIL, NEW_PASSWORD);
    if (!login.error) {
      await writeAdmin(login.localId, login.idToken, NEW_EMAIL);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 ADMIN LOGIN READY!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:   ', NEW_EMAIL);
      console.log('🔑 Password:', NEW_PASSWORD);
      console.log('🌐 URL:      https://kruncheez-pos.web.app/login');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
  } else if (!signup.error) {
    await writeAdmin(signup.localId, signup.idToken, NEW_EMAIL);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 NEW ADMIN ACCOUNT READY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:   ', NEW_EMAIL);
    console.log('🔑 Password:', NEW_PASSWORD);
    console.log('🌐 URL:      https://kruncheez-pos.web.app/login');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } else {
    console.error('❌ Failed:', signup.error.message);
  }
})();
