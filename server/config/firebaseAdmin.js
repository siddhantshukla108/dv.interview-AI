import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

let serviceAccount;

const envJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT;

if (envJson && envJson.trim().startsWith('{')) {
  // Use raw JSON string from Render environment variables
  serviceAccount = JSON.parse(envJson);
} else {
  // Use local file path during development
  const serviceAccountPath = join(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT || 'firebaseServiceAccount.json');
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
