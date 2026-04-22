export default () => {
  const port = Number(process.env.PORT ?? 3101);

  return {
    port,
    nodeEnv: process.env.NODE_ENV ?? "development",
    frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3100",
    databaseUrl:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/kairox_shop?schema=public",
    redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
    assetBaseUrl: process.env.SITE_ASSET_BASE_URL ?? `http://localhost:${port}`
  };
};
