const getEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

export const env = {
  port: Number(process.env.PORT) || 3000,
  temporalAddress: getEnv('TEMPORAL_ADDRESS', '127.0.0.1:7233'),
  temporalNamespace: getEnv('TEMPORAL_NAMESPACE', 'default'),
  redisUrl: getEnv('REDIS_URL', 'redis://127.0.0.1:6379'),
  taskQueue: getEnv('TASK_QUEUE', 'hotel-offers'),
  supplierBaseUrl: getEnv('SUPPLIER_BASE_URL', 'http://127.0.0.1:3000'),
};
