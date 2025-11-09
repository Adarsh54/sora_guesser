/**
 * Google Cloud Authentication Helper
 */

import { GoogleAuth } from 'google-auth-library';
import path from 'path';

export function getGoogleAuth() {
  const credentialsPath = path.resolve(
    process.cwd(),
    process.env.GOOGLE_APPLICATION_CREDENTIALS || '../.google-credentials/service-account.json'
  );

  const projectId = process.env.GOOGLE_PROJECT_ID || 'dgenerate';
  const location = process.env.GOOGLE_LOCATION || 'us-central1';

  if (!projectId) {
    throw new Error('GOOGLE_PROJECT_ID environment variable is required');
  }

  const auth = new GoogleAuth({
    keyFilename: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  return {
    auth,
    projectId,
    location,
    credentialsPath,
  };
}

export async function getAuthToken() {
  const { auth } = getGoogleAuth();
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  
  if (!token.token) {
    throw new Error('Failed to get access token');
  }
  
  return token.token;
}


