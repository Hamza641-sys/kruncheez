// Direct Firestore REST API — set admin role using password reset + new password
const PROJECT_ID = 'kruncheez-pos';
const API_KEY = 'AIzaSyC0dgHGMjbWeurlKAGNBakp3R-Eg8EIx7Y';

const ADMIN_EMAIL = 'admin@kruncheez.com';
const NEW_PASSWORD = 'KrunchEez@Admin2024!';
const ADMIN_UID = 'fC8iXy0rN1TCss3YBNkfikA0Uqs2';

// Step 1: Update password via Firebase Admin REST
async function updatePassword() {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        localId: ADMIN_UID,
        password: NEW_PASSWORD,
        returnSecureToken: true,
      }),
    }
  );
  const data = await res.json();
  if (data.error) {
    // Try signup if update fails
    return null;
  }
  return data.idToken;
}

// Step 2: Sign up fresh if needed
async function signUp() {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: NEW_PASSWORD,
        returnSecureToken: true,
      }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error('SignUp: ' + data.error.message);
  return { idToken: data.idToken, uid: data.localId };
}

// Step 3: Sign in
async function signIn() {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: NEW_PASSWORD,
        returnSecureToken: true,
      }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error('SignIn: ' + data.error.message);
  return { idToken: data.idToken, uid: data.localId };
}

// Step 4: Write Firestore document
async function setFirestoreAdmin(uid, idToken) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
  const body = {
    fields: {
      uid:           { stringValue: uid },
      name:          { stringValue: 'KrunchEez Admin' },
      email:         { stringValue: ADMIN_EMAIL },
      phone:         { stringValue: '0317-7787648' },
      role:          { stringValue: 'admin' },
      loyaltyPoints: { integerValue: '0' },
      totalOrders:   { integerValue: '0' },
      totalSpent:    { integerValue: '0' },
      addresses:     { arrayValue: { values: [] } },
    }
  };
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error('Firestore: ' + JSON.stringify(data.error));
  return data;
}

// MAIN
(async () => {
  try {
    let idToken, uid;

    // Try signing in first
    console.log('🔐 Attempting sign in...');
    try {
      const result = await signIn();
      idToken = result.idToken;
      uid = result.uid;
      console.log('✅ Signed in! UID:', uid);
    } catch {
      // Sign up as new user
      console.log('⚠️  Sign in failed, creating new account...');
      const result = await signUp();
      idToken = result.idToken;
      uid = result.uid;
      console.log('✅ Account created! UID:', uid);
    }

    console.log('📝 Writing admin role to Firestore...');
    await setFirestoreAdmin(uid, idToken);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ADMIN ACCOUNT COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    ', ADMIN_EMAIL);
    console.log('🔑 Password: ', NEW_PASSWORD);
    console.log('🌐 Login:     https://kruncheez-pos.web.app/login');
    console.log('⚙️  Admin:     https://kruncheez-pos.web.app/admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
