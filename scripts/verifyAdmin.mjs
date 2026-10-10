const PROJECT_ID = 'kruncheez-pos';
const API_KEY = 'AIzaSyC0dgHGMjbWeurlKAGNBakp3R-Eg8EIx7Y';

async function signIn(email, pass) {
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

async function getFirestoreDoc(uid, idToken) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${idToken}` }
  });
  return res.json();
}

(async () => {
  console.log('🔍 Verifying admin account...\n');

  const signin = await signIn('kruncheez.admin@gmail.com', 'KrunchEez@2024!');
  if (signin.error) {
    console.error('❌ Login failed:', signin.error.message);
    return;
  }

  console.log('✅ Login successful!');
  console.log('   UID:', signin.localId);

  const doc = await getFirestoreDoc(signin.localId, signin.idToken);
  if (doc.error) {
    console.error('❌ Firestore read failed:', doc.error.message);
    return;
  }

  const fields = doc.fields;
  const role = fields?.role?.stringValue;
  const name = fields?.name?.stringValue;
  const email = fields?.email?.stringValue;

  console.log('✅ Firestore document found!');
  console.log('   Name:', name);
  console.log('   Email:', email);
  console.log('   Role:', role);

  if (role === 'admin') {
    console.log('\n🎉 EVERYTHING IS PERFECT!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    kruncheez.admin@gmail.com');
    console.log('🔑 Password: KrunchEez@2024!');
    console.log('⚙️  Admin:    https://kruncheez-pos.web.app/admin');
    console.log('🌐 Website:  https://kruncheez-pos.web.app');
    console.log('📦 GitHub:   https://github.com/Hamza641-sys/kruncheez');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } else {
    console.log('⚠️  Role is not admin:', role);
  }
})();
