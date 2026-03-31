export default () => ({
  port: Number(process.env.PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? "development",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/kairox_shop?schema=public",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379"
});
