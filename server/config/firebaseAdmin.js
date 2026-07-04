import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

const serviceAccountPath = join(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT);
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
