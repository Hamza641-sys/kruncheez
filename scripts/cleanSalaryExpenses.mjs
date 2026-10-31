// Remove salary entries from expenses collection (they're now in salaryRecords)
const API_KEY    = 'AIzaSyC0dgHGMjbWeurlKAGNBakp3R-Eg8EIx7Y';
const PROJECT_ID = 'kruncheez-pos';
const EMAIL      = 'kruncheez.admin@gmail.com';
const PASSWORD   = 'KrunchEez@2024!';

async function signIn() {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email:EMAIL, password:PASSWORD, returnSecureToken:true }) }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.idToken;
}

async function getDocs(token, colName) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${colName}`;
  const res = await fetch(url, { headers: { Authorization:`Bearer ${token}` } });
  const data = await res.json();
  return data.documents || [];
}

async function deleteDoc(token, name) {
  await fetch(`https://firestore.googleapis.com/v1/${name}`,
    { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } });
}

(async () => {
  console.log('🔐 Signing in...');
  const token = await signIn();
  console.log('✅ Signed in!\n');

  const docs = await getDocs(token, 'expenses');
  console.log(`Found ${docs.length} expense entries\n`);

  let deleted = 0;
  for (const doc of docs) {
    const cat = doc.fields?.category?.stringValue || '';
    if (cat === 'salary' || cat === 'Salaries' || cat === 'Staff Salary') {
      const desc = doc.fields?.description?.stringValue || '';
      const amt  = doc.fields?.amount?.integerValue || doc.fields?.amount?.doubleValue || '?';
      console.log(`🗑️  Deleting salary expense: ${desc} — Rs.${amt}`);
      await deleteDoc(token, doc.name);
      deleted++;
    }
  }

  if (deleted === 0) {
    console.log('✅ No salary entries found in expenses — all clean!');
  } else {
    console.log(`\n✅ Deleted ${deleted} salary entries from expenses`);
    console.log('Salary is now tracked only in salaryRecords collection');
  }

  // Show what's left
  const remaining = await getDocs(token, 'expenses');
  console.log(`\nRemaining expenses: ${remaining.length}`);
  remaining.forEach(d => {
    const cat = d.fields?.category?.stringValue || '';
    const desc = d.fields?.description?.stringValue || '';
    const amt = d.fields?.amount?.integerValue || d.fields?.amount?.doubleValue || '?';
    console.log(`  - [${cat}] ${desc}: Rs.${amt}`);
  });
})();
