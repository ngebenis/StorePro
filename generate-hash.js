import crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scrypt(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

(async () => {
  const hashedPassword = await hashPassword('admin123');
  console.log(hashedPassword);
})();