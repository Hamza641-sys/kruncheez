// Write admin document directly - rules are open temporarily
const PROJECT_ID = 'kruncheez-pos';
const API_KEY = 'AIzaSyC0dgHGMjbWeurlKAGNBakp3R-Eg8EIx7Y';
const ADMIN_EMAIL = 'admin@kruncheez.com';
const ADMIN_PASSWORD = 'KrunchEez@2024!';

// Step 1: Create new Firebase user (different email)
async function createFreshAdmin() {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'kruncheez.admin@gmail.com',
        password: ADMIN_PASSWORD,
        returnSecureToken: true,
      }),
    }
  );
  const data = await res.json();
  return data;
}

// Step 2: Sign in existing or new
async function getToken(email, pass) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass, returnSecureToken: true }),
    }
  );
  return res.json();
}

// Step 3: Write to Firestore (open rules)
async function writeDoc(uid, idToken, email) {
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

(async () => {
  try {
    let uid, idToken, email;

    // Try with kruncheez.admin@gmail.com first
    console.log('🔐 Creating fresh admin account...');
    const signup = await createFreshAdmin();

    if (signup.error?.message === 'EMAIL_EXISTS') {
      console.log('ℹ️  Account exists, signing in...');
      email = 'kruncheez.admin@gmail.com';
      const signin = await getToken(email, ADMIN_PASSWORD);
      if (signin.error) throw new Error(signin.error.message);
      uid = signin.localId;
      idToken = signin.idToken;
    } else if (signup.error) {
      throw new Error(signup.error.message);
    } else {
      uid = signup.localId;
      idToken = signup.idToken;
      email = 'kruncheez.admin@gmail.com';
      console.log('✅ New account created!');
    }

    console.log('📝 Writing admin role to Firestore...');
    const result = await writeDoc(uid, idToken, email);

    if (result.error) throw new Error(JSON.stringify(result.error));

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ADMIN ACCOUNT 100% READY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    kruncheez.admin@gmail.com');
    console.log('🔑 Password: KrunchEez@2024!');
    console.log('🌐 Login:    https://kruncheez-pos.web.app/login');
    console.log('⚙️  Admin:    https://kruncheez-pos.web.app/admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
