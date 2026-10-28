const bcrypt = require('bcrypt');
const env = require('../src/config/env');
const db = require('../src/config/db');

async function resetAdminPassword() {
  const [email, password, ...extraArguments] = process.argv.slice(2);
  let succeeded = false;

  try {
    if (
      env.NODE_ENV !== 'production' &&
      email &&
      password &&
      password.length >= 12 &&
      extraArguments.length === 0
    ) {
      const passwordHash = await bcrypt.hash(password, 12);
      const result = await db.pool.query(
        'UPDATE admin_users SET password_hash = $1 WHERE LOWER(email) = LOWER($2)',
        [passwordHash, email]
      );
      succeeded = result.rowCount === 1;
    }
  } catch {
    succeeded = false;
  }

  try {
    await db.pool.end();
  } catch {
    succeeded = false;
  }

  console.log(succeeded ? 'Admin password reset successful.' : 'Admin password reset failed.');
  if (!succeeded) process.exitCode = 1;
}

resetAdminPassword();
