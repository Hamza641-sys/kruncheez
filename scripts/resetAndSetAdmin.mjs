// Reset password via oobCode then set admin role
const PROJECT_ID = 'kruncheez-pos';
const API_KEY = 'AIzaSyC0dgHGMjbWeurlKAGNBakp3R-Eg8EIx7Y';
const ADMIN_EMAIL = 'admin@kruncheez.com';
const NEW_PASSWORD = 'KrunchEez@2024!Admin';

// Send password reset email
async function sendResetEmail() {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email: ADMIN_EMAIL,
      }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

(async () => {
  console.log('📧 Sending password reset email to:', ADMIN_EMAIL);
  try {
    await sendResetEmail();
    console.log('\n✅ Reset email sent!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 NEXT STEPS:');
    console.log('1. Check email: admin@kruncheez.com');
    console.log('2. Click reset link in email');
    console.log('3. Set new password: KrunchEez@2024!Admin');
    console.log('4. Then run: node scripts/finalizeAdmin.mjs');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (err) {
    console.error('❌', err.message);
  }
})();
