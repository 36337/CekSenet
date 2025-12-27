// Load environment variables based on NODE_ENV
const path = require('path');
const fs = require('fs');

// Determine which .env file to load
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env';

const envPath = path.resolve(__dirname, '../../', envFile);

// Load .env file if exists
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  // Fallback to default .env
  require('dotenv').config();
}

// Load default config
const defaultConfigPath = path.resolve(__dirname, '../../config/default.json');
const defaultConfig = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));

// Merge with environment variables
const config = {
  server: {
    port: parseInt(process.env.PORT) || defaultConfig.server.port,
    productionPort: defaultConfig.server.productionPort
  },
  database: {
    path: process.env.DB_PATH || defaultConfig.database.path
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: defaultConfig.jwt.expiresIn
  },
  logging: {
    level: process.env.LOG_LEVEL || defaultConfig.logging.level,
    maxFiles: defaultConfig.logging.maxFiles
  },
  bcrypt: {
    saltRounds: defaultConfig.bcrypt.saltRounds
  },
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production'
};

module.exports = config;
