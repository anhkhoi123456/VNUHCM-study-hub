require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), quiet: true });

const bool = (value, fallback) => (value === undefined || value === '' ? fallback : value === 'true');

const list = value => (value || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  ? require('path').resolve(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
  : '';

module.exports = {
  firebase: { serviceAccountPath },
  allowedEmailDomains: list(process.env.ALLOWED_EMAIL_DOMAINS),
  port: Number(process.env.PORT) || 3000,
  env: process.env.NODE_ENV || 'development',
  corsOrigins: (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean),
  db: {
    server: process.env.DB_SERVER || 'localhost',
    port: Number(process.env.DB_PORT) || 1433,
    database: process.env.DB_NAME || 'VNUHCM',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    options: {
      encrypt: bool(process.env.DB_ENCRYPT, false),
      trustServerCertificate: bool(process.env.DB_TRUST_SERVER_CERT, true)
    }
  }
};
