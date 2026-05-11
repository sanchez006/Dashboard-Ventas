import dotenv from 'dotenv';

dotenv.config();

export const env = {
  // Database
  DB_HOST: process.env.DB_HOST,
  DB_PORT: parseInt(process.env.DB_PORT || '5432'),
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,

  // Server
  PORT: parseInt(process.env.PORT || '3000'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:4200',

  // Google Sheets
  GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID || '',
  GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL || '',
  GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY || '',
};

// Validar variables requeridas
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD'];
requiredEnvVars.forEach(varName => {
  if (!env[varName as keyof typeof env]) {
    console.error(`Variable de entorno requerida: ${varName}`);
  }
});
