/**
 * Environment Configuration
 * Centralizes all environment variable access with defaults.
 */
export default () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/pdf-chatbot',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-jwt-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-me',
    expiresIn: '1h',
    refreshExpiresIn: '7d',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@admin.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
  },
});
