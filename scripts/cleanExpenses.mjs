// Remove all "Supplier Payment" entries from expenses collection
const API_KEY    = 'AIzaSyC0dgHGMjbWeurlKAGNBakp3R-Eg8EIx7Y';
const PROJECT_ID = 'kruncheez-pos';
const EMAIL      = 'kruncheez.admin@gmail.com';
const PASSWORD   = 'KrunchEez@2024!';

async function signIn() {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true }) }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.idToken;
}

async function getExpenses(token) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/expenses`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  return data.documents || [];
}

async function deleteDoc(token, name) {
  const url = `https://firestore.googleapis.com/v1/${name}`;
  await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
}

(async () => {
  console.log('🔐 Signing in...');
  const token = await signIn();
  console.log('✅ Signed in!\n');

  console.log('📋 Getting expenses...');
  const docs = await getExpenses(token);
  console.log(`Found ${docs.length} expense entries\n`);

  let deleted = 0;
  for (const doc of docs) {
    const cat = doc.fields?.category?.stringValue || '';
    if (cat === 'Supplier Payment') {
      const desc = doc.fields?.description?.stringValue || '';
      const amt  = doc.fields?.amount?.integerValue || doc.fields?.amount?.doubleValue || '?';
      console.log(`🗑️  Deleting: ${desc} — Rs.${amt}`);
      await deleteDoc(token, doc.name);
      deleted++;
    }
  }

  console.log(`\n✅ Deleted ${deleted} wrong supplier payment entries from expenses`);
  console.log('Now expenses only has manual daily expenses!');
})();
