(async () => {
  try {
    const base = 'http://localhost:3000';
    const r = await fetch(base + '/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@bfcl.com', password: 'Admin@123' }),
    });
    console.log('login status', r.status);
    const j = await r.json().catch((e) => {
      console.error('login json err', e);
      return null;
    });
    console.log('login keys', j ? Object.keys(j) : null);
    if (!j) process.exit(1);
    const t = j.accessToken;
    const d = await fetch(base + '/api/v1/reports/dashboard', {
      headers: { Authorization: 'Bearer ' + t },
    });
    console.log('dash status', d.status);
    const dj = await d.json().catch((e) => {
      console.error('dash json err', e);
      return null;
    });
    console.log('dash keys', dj ? Object.keys(dj) : null);
    console.log(JSON.stringify(dj, null, 2));
  } catch (e) {
    console.error('script error', e);
    process.exit(1);
  }
})();
